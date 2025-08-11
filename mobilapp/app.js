// Firebase konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyA3L-Tg0qwOb_rotCf_WH0AaT-jFbg22jc",
  authDomain: "jarnhandelio.firebaseapp.com",
  databaseURL: "https://jarnhandelio-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jarnhandelio",
  storageBucket: "jarnhandelio.appspot.com",
  messagingSenderId: "179988070152",
  appId: "1:179988070152:web:6fb2614625b929f74176bd",
  measurementId: "G-78S8WQVN0N"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function showPage(page) {
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
    });
    const selected = document.getElementById(page);
    selected.classList.remove('hidden');
    selected.classList.add('active');
    if(page === 'lager') loadProducts();
    if(page === 'order') {
        // Fråga om godsmottagare om det finns
        if(currentCustomer) {
            db.ref('kunder/' + currentCustomer.id + '/godsmottagare').once('value', snap => {
                if(snap.exists()) {
                    // Visa dialog för val av godsmottagare
                    const recipients = [];
                    snap.forEach(child => {
                        recipients.push({ key: child.key, namn: child.val().namn });
                    });
                    let html = '<div id="recipientDialog" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;">';
                    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 2px 8px rgba(0,0,0,0.15);">';
                    html += '<h3>Välj godsmottagare för order</h3>';
                    recipients.forEach(rec => {
                        html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForOrder("${rec.key}")'>${rec.namn}</button>`;
                    });
                    html += `<button style='width:100%;margin-top:12px;' onclick='window.cancelRecipientDialog()'>Avbryt</button>`;
                    html += '</div></div>';
                    document.body.insertAdjacentHTML('beforeend', html);
                    window.selectRecipientForOrder = function(recipientKey) {
                        document.getElementById('recipientDialog').remove();
                        window.selectedRecipientForOrder = recipientKey;
                        loadOrder(recipientKey);
                    };
                    window.cancelRecipientDialog = function() {
                        document.getElementById('recipientDialog').remove();
                    };
                    return;
                } else {
                    loadOrder();
                }
            });
        } else {
            loadOrder();
        }
    }
    if(page === 'start') {
        const header = document.getElementById('currentCustomerHeader');
        header.textContent = currentCustomer ? `${currentCustomer.name}` : '';
    }
    if(page === 'customerSelect') {
        loadCustomers();
    }
    if(page === 'orders') {
        loadOrderHistory();
    }
    if(page === 'orderDetails') {
        // laddas via showOrderDetails
    }
}

// Lager: Lägg till produkt
const addProductForm = document.getElementById('addProductForm');
if(addProductForm) {
    addProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const benamning = document.getElementById('benamning').value.trim();
        const produktnummer = document.getElementById('produktnummer').value.trim();
        const lagerAntal = parseInt(document.getElementById('lagerAntal').value);
        if(benamning && produktnummer && !isNaN(lagerAntal)) {
            if(!currentCustomer) return;
            const newRef = db.ref(`kunder/${currentCustomer.id}/produkter`).push();
            newRef.set({ benamning, produktnummer, lagerAntal });
            addProductForm.reset();
            loadProducts();
        }
    });
}

function loadProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    if(!currentCustomer) return;
    let products = [];
    db.ref(`kunder/${currentCustomer.id}/produkter`).once('value', snapshot => {
        snapshot.forEach(child => {
            const prod = child.val();
            products.push({ key: child.key, benamning: prod.benamning, produktnummer: prod.produktnummer, lagerAntal: prod.lagerAntal });
        });
        products.forEach((prod, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<label for='productSelect${idx}'>${prod.benamning} (${prod.lagerAntal})<br><span style='font-size:0.9em;color:#555;'>Produktnummer: ${prod.produktnummer || ''}</span></label> ` +
                `<input type='radio' name='productSelect' id='productSelect${idx}' value='${prod.key}' style='float:right;'>`;
            productList.appendChild(li);
        });
        // Lägg till knappar under listan
        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '16px';
        btnDiv.innerHTML = `<button onclick='editSelectedProduct()'>Redigera vald</button> ` +
            `<button onclick='deleteSelectedProduct()'>Radera vald</button>`;
        productList.appendChild(btnDiv);
    });
}

function getSelectedProductKey() {
    const selected = document.querySelector('input[name="productSelect"]:checked');
    return selected ? selected.value : null;
}

function editSelectedProduct() {
    const key = getSelectedProductKey();
    if(!key || !currentCustomer) return;
    db.ref(`kunder/${currentCustomer.id}/produkter/${key}`).once('value', snapshot => {
        const prod = snapshot.val();
        if(!prod) return;
        const productList = document.getElementById('productList');
        const li = document.createElement('li');
        li.innerHTML = `
            <div style='display:flex; margin-bottom:8px; gap:8px;'>
                <div style='flex:1;'>
                    <label for='editBenamning'>Benämning:</label><br>
                    <input type='text' id='editBenamning' value='${prod.benamning}' style='width:100%;'>
                </div>
                <div style='width:100px;'>
                    <label for='editAntal'>Antal:</label><br>
                    <input type='number' id='editAntal' value='${prod.lagerAntal}' style='width:100%;'>
                </div>
            </div>
            <div style='margin-bottom:8px;'>
                <label for='editProduktnummer'>Produktnummer:</label><br>
                <input type='text' id='editProduktnummer' value='${prod.produktnummer || ''}' style='width:100%;'>
            </div>
        `;
        productList.innerHTML = '';
        productList.appendChild(li);
        // Knappar under raden
        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '16px';
        btnDiv.innerHTML = `<button onclick="saveProductEdit('${key}')">Spara</button> ` +
            `<button onclick="loadProducts()">Avbryt</button>`;
        productList.appendChild(btnDiv);
    });
}

function saveProductEdit(key) {
    const benamning = document.getElementById('editBenamning').value.trim();
    const produktnummer = document.getElementById('editProduktnummer').value.trim();
    const lagerAntal = parseInt(document.getElementById('editAntal').value);
    if(benamning && produktnummer && !isNaN(lagerAntal) && currentCustomer) {
        db.ref(`kunder/${currentCustomer.id}/produkter/${key}`).set({ benamning, produktnummer, lagerAntal }, function() {
            showPage('lager');
        });
    }
}

function deleteSelectedProduct() {
    const key = getSelectedProductKey();
    if(key && currentCustomer) {
        db.ref(`kunder/${currentCustomer.id}/produkter/${key}`).remove().then(loadProducts);
    }
}

function loadOrder(recipientKey) {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';
    if(!currentCustomer) return;
    db.ref(`kunder/${currentCustomer.id}/produkter`).once('value', snapshot => {
        snapshot.forEach(child => {
            const prod = child.val();
            const li = document.createElement('li');
            li.innerHTML = `<span>${prod.benamning} (${prod.lagerAntal})</span>
                <input type='number' min='0' placeholder='Beställ antal' data-key='${child.key}' style='width:80px;'>`;
            orderList.appendChild(li);
        });
    });
    // Spara valt godsmottagare för order
    window.selectedRecipientForOrder = recipientKey || null;
}

const orderForm = document.getElementById('orderForm');
if(orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const inputs = orderForm.querySelectorAll('input[type="number"][data-key]');
        const bestallning = {};
        inputs.forEach(input => {
            const antal = parseInt(input.value);
            if(!isNaN(antal) && antal > 0) {
                bestallning[input.dataset.key] = antal;
            }
        });
        if(Object.keys(bestallning).length > 0) {
            if(!currentCustomer) return;
            // Spara ordern under godsmottagare om en är vald
            if(window.selectedRecipientForOrder) {
                db.ref(`kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForOrder}/bestallningar`).push({
                    tid: new Date().toISOString(),
                    bestallning
                });
            } else {
                db.ref(`kunder/${currentCustomer.id}/bestallningar`).push({
                    tid: new Date().toISOString(),
                    bestallning
                });
            }
            orderForm.reset();
            alert('Beställning sparad!');
            window.selectedRecipientForOrder = null;
        }
    });
}

let currentCustomer = null;

// Hantera kundinmatning och visning
function loadCustomers() {
    const customerList = document.getElementById('customerList');
    customerList.innerHTML = '';
    db.ref('kunder').once('value', snapshot => {
        snapshot.forEach(child => {
            const kund = child.val();
            const btn = document.createElement('button');
            btn.textContent = kund.name;
            btn.onclick = () => {
                currentCustomer = { id: child.key, name: kund.name };
                showPage('start');
            };
            customerList.appendChild(btn);
        });
    });
}

const addCustomerForm = document.getElementById('addCustomerForm');
if(addCustomerForm) {
    addCustomerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('customerName').value.trim();
        if(name) {
            db.ref('kunder').push({ name }).then(() => {
                addCustomerForm.reset();
                loadCustomers();
                loadManageCustomers();
            });
        }
    });
}

// Beställningshistorik
function loadOrderHistory() {
    const orderHistoryList = document.getElementById('orderHistoryList');
    orderHistoryList.innerHTML = '';
    if(!currentCustomer) return;
    db.ref(`kunder/${currentCustomer.id}/bestallningar`).once('value', snapshot => {
        snapshot.forEach(child => {
            const order = child.val();
            const li = document.createElement('li');
            // Visa datum och tid, gör raden klickbar
            const date = new Date(order.tid);
            li.innerHTML = `<button style='width:100%;text-align:left;' onclick="showOrderDetails('${child.key}')">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</button>`;
            orderHistoryList.appendChild(li);
        });
    });
}

function showOrderDetails(orderKey) {
    showPage('orderDetails');
    const orderDetailsList = document.getElementById('orderDetailsList');
    orderDetailsList.innerHTML = '';
    if(!currentCustomer || !orderKey) return;
    db.ref(`kunder/${currentCustomer.id}/bestallningar/${orderKey}`).once('value', snapshot => {
        const order = snapshot.val();
        if(order && order.bestallning) {
            // Hämta produktnamn för varje id
            db.ref(`kunder/${currentCustomer.id}/produkter`).once('value', prodSnap => {
                const prodMap = {};
                prodSnap.forEach(prodChild => {
                    prodMap[prodChild.key] = prodChild.val().benamning;
                });
                for(const key in order.bestallning) {
                    const li = document.createElement('li');
                    const namn = prodMap[key] || key;
                    li.textContent = `${namn}: ${order.bestallning[key]}`;
                    orderDetailsList.appendChild(li);
                }
            });
        }
    });
}

// Starta med kundvalssidan
showPage('customerSelect');

// Hantera kunder-knapp
document.addEventListener('DOMContentLoaded', function() {
    const manageBtn = document.getElementById('manageCustomersBtn');
    if(manageBtn) {
        manageBtn.onclick = function() {
            showPage('manageCustomers');
            loadManageCustomers();
        };
    }
});

// Funktion för att ladda kunder till hantera-kunder-sidan
function loadManageCustomers() {
    const list = document.getElementById('manageCustomerList');
    if(!list) return;
    list.innerHTML = '';
    db.ref('kunder').once('value', snapshot => {
        snapshot.forEach((child, idx) => {
            const kund = child.val();
            const li = document.createElement('li');
            li.innerHTML = `<label for='manageCustomerSelect${idx}'>${kund.name}</label> ` +
                `<input type='radio' name='manageCustomerSelect' id='manageCustomerSelect${idx}' value='${child.key}' style='float:right;'>`;
            list.appendChild(li);
        });
    });
}

// Funktion för att radera kund

function getSelectedManageCustomerKey() {
    const selected = document.querySelector('input[name="manageCustomerSelect"]:checked');
    return selected ? selected.value : null;
}

function deleteSelectedManageCustomer() {
    const key = getSelectedManageCustomerKey();
    if(key) {
        if(confirm('Vill du verkligen radera denna kund?')) {
            db.ref('kunder/' + key).remove().then(loadManageCustomers);
        }
    } else {
        alert('Välj en kund att radera.');
    }
}

// Koppla raderaknappen
document.addEventListener('DOMContentLoaded', function() {
    const deleteBtn = document.getElementById('deleteCustomerBtn');
    if(deleteBtn) {
        deleteBtn.onclick = deleteSelectedManageCustomer;
    }

    const editBtn = document.getElementById('editCustomerBtn');
    if(editBtn) {
        editBtn.onclick = editSelectedManageCustomer;
    }
});
// Redigera vald kund
function editSelectedManageCustomer() {
    const key = getSelectedManageCustomerKey();
    if(!key) {
        alert('Välj en kund att redigera.');
        return;
    }
    db.ref('kunder/' + key).once('value', snapshot => {
        const kund = snapshot.val();
        if(!kund) return;
        const list = document.getElementById('manageCustomerList');
        if(!list) return;
        // Visa redigeringsformulär
        list.innerHTML = '';
        const li = document.createElement('li');
        li.innerHTML = `
            <label for='editCustomerName'>Kund:</label><br>
            <input type='text' id='editCustomerName' value='${kund.name}' style='width:100%;margin-bottom:8px;'>
        `;
        list.appendChild(li);

        // Visa godsmottagare
        const recList = document.createElement('ul');
        recList.id = 'recipientList';
        recList.style.margin = '12px 0';
        if(kund.godsmottagare) {
            Object.entries(kund.godsmottagare).forEach(([recKey, rec]) => {
                const recLi = document.createElement('li');
                recLi.innerHTML = `
                    <input type='text' id='recipientEdit_${recKey}' value='${rec.namn}' style='width:60%;margin-right:8px;'>
                    <button class='saveRecipientBtn' data-customer='${key}' data-recipient='${recKey}'>Spara</button>
                    <button onclick="deleteRecipient('${key}','${recKey}')">Radera</button>
                `;
                recList.appendChild(recLi);
            });
        }
        list.appendChild(recList);
        // Lägg till event listeners för spara-knappar
        setTimeout(() => {
            document.querySelectorAll('.saveRecipientBtn').forEach(btn => {
                btn.onclick = function() {
                    const customerKey = btn.getAttribute('data-customer');
                    const recipientKey = btn.getAttribute('data-recipient');
                    saveRecipientEdit(customerKey, recipientKey);
                };
            });
        }, 0);
// Gör funktionen global
window.saveRecipientEdit = function(customerKey, recipientKey) {
    const input = document.getElementById('recipientEdit_' + recipientKey);
    if(input) {
        const newName = input.value.trim();
        if(newName) {
            db.ref('kunder/' + customerKey + '/godsmottagare/' + recipientKey).update({ namn: newName }).then(() => {
                alert('Namnet är ändrat!');
                editSelectedManageCustomer_bypass(customerKey);
            });
        }
    }
}
        list.appendChild(recList);

        // Lägg till godsmottagare-knapp
        const addRecBtn = document.createElement('button');
        addRecBtn.id = 'addRecipientBtn';
        addRecBtn.textContent = 'Lägg till godsmottagare';
        addRecBtn.style.margin = '8px 0';
        addRecBtn.onclick = function() {
            showAddRecipientDialog(key);
        };
        list.appendChild(addRecBtn);

        // Spara/Avbryt-knappar
        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '12px';
        btnDiv.innerHTML = `<button id='saveEditCustomerBtn'>Spara</button> <button id='cancelEditCustomerBtn'>Avbryt</button>`;
        list.appendChild(btnDiv);
        document.getElementById('saveEditCustomerBtn').onclick = function() {
            const newName = document.getElementById('editCustomerName').value.trim();
            if(newName) {
                db.ref('kunder/' + key).update({ name: newName }, function() {
                    loadManageCustomers();
                });
            }
        };
        document.getElementById('cancelEditCustomerBtn').onclick = function() {
            loadManageCustomers();
        };
    });
}

// Radera godsmottagare
function deleteRecipient(customerKey, recipientKey) {
    if(confirm('Vill du verkligen radera denna godsmottagare?')) {
        db.ref('kunder/' + customerKey + '/godsmottagare/' + recipientKey).remove().then(() => {
            editSelectedManageCustomer_bypass(customerKey);
        });
    }
};



// Dialog/metod för att lägga till godsmottagare
function showAddRecipientDialog(customerKey) {
    const list = document.getElementById('manageCustomerList');
    if(!list) return;
    list.innerHTML = '';
    const li = document.createElement('li');
    li.innerHTML = `
        <label for='recipientName'>Godsmottagare:</label><br>
        <input type='text' id='recipientName' placeholder='Namn på godsmottagare' style='width:100%;margin-bottom:8px;'>
    `;
    list.appendChild(li);
    const btnDiv = document.createElement('div');
    btnDiv.style.marginTop = '12px';
    btnDiv.innerHTML = `<button id='saveRecipientBtn'>Spara</button> <button id='cancelRecipientBtn'>Avbryt</button>`;
    list.appendChild(btnDiv);
    document.getElementById('saveRecipientBtn').onclick = function() {
        const name = document.getElementById('recipientName').value.trim();
        if(name) {
            db.ref('kunder/' + customerKey + '/godsmottagare').push({ namn: name }).then(() => {
                // Återgå till redigeringsdialogen för samma kund, utan att kontrollera om någon är vald
                db.ref('kunder/' + customerKey).once('value', snapshot => {
                    const kund = snapshot.val();
                    if(!kund) return;
                    const list = document.getElementById('manageCustomerList');
                    if(!list) return;
                    // Visa redigeringsformulär igen
                    // ...anropa editSelectedManageCustomer med bypass av valkontroll...
                    // Vi kan anropa editSelectedManageCustomer, men sätt en global bypass-flagga om du har problem
                    editSelectedManageCustomer_bypass(customerKey);
                });
            });
        }
    };
    document.getElementById('cancelRecipientBtn').onclick = function() {
        editSelectedManageCustomer_bypass(customerKey);
    };
}

// Variant av editSelectedManageCustomer som alltid visar dialogen för angiven kund
function editSelectedManageCustomer_bypass(customerKey) {
    db.ref('kunder/' + customerKey).once('value', snapshot => {
        const kund = snapshot.val();
        if(!kund) return;
        const list = document.getElementById('manageCustomerList');
        if(!list) return;
        // Visa redigeringsformulär
        list.innerHTML = '';
        const li = document.createElement('li');
        li.innerHTML = `
            <label for='editCustomerName'>Kund:</label><br>
            <input type='text' id='editCustomerName' value='${kund.name}' style='width:100%;margin-bottom:8px;'>
        `;
        list.appendChild(li);
        // Visa godsmottagare
        const recList = document.createElement('ul');
        recList.id = 'recipientList';
        recList.style.margin = '12px 0';
        if(kund.godsmottagare) {
            Object.entries(kund.godsmottagare).forEach(([recKey, rec]) => {
                const recLi = document.createElement('li');
                recLi.innerHTML = `
                    <input type='text' id='recipientEdit_${recKey}' value='${rec.namn}' style='width:60%;margin-right:8px;'>
                    <button onclick="saveRecipientEdit('${customerKey}','${recKey}')">Spara</button>
                    <button onclick="deleteRecipient('${customerKey}','${recKey}')">Radera</button>
                `;
                recList.appendChild(recLi);
            });
        }
        list.appendChild(recList);
        // Lägg till godsmottagare-knapp
        const addRecBtn = document.createElement('button');
        addRecBtn.id = 'addRecipientBtn';
        addRecBtn.textContent = 'Lägg till godsmottagare';
        addRecBtn.style.margin = '8px 0';
        addRecBtn.onclick = function() {
            showAddRecipientDialog(customerKey);
        };
        list.appendChild(addRecBtn);
        // Spara/Avbryt-knappar
        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '12px';
        btnDiv.innerHTML = `<button id='saveEditCustomerBtn'>Spara</button> <button id='cancelEditCustomerBtn'>Avbryt</button>`;
        list.appendChild(btnDiv);
        document.getElementById('saveEditCustomerBtn').onclick = function() {
            const newName = document.getElementById('editCustomerName').value.trim();
            if(newName) {
                db.ref('kunder/' + customerKey).update({ name: newName }, function() {
                    loadManageCustomers();
                });
            }
        };
        document.getElementById('cancelEditCustomerBtn').onclick = function() {
            loadManageCustomers();
        };
    });
    }


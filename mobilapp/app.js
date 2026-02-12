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
const auth = firebase.auth();
const db = firebase.database();

// Auth check - redirect to login if not authenticated
auth.onAuthStateChanged((user) => {
  if (!user) {
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '../index/login.html';
  }
});

function showPage(page) {
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
    });
    const selected = document.getElementById(page);
    selected.classList.remove('hidden');
    selected.classList.add('active');
    if(page === 'lager') {
        // Visa aktuell kund
        const customerDisplay = document.getElementById('currentCustomerLager');
        if(customerDisplay) {
            customerDisplay.textContent = currentCustomer ? `${currentCustomer.name}` : '';
        }
        // Fråga om godsmottagare om det finns
        if(currentCustomer) {
            db.ref('kunder/' + currentCustomer.id + '/godsmottagare').once('value', snap => {
                if(snap.exists()) {
                    // Visa dialog för val av godsmottagare
                    const recipients = [];
                    snap.forEach(child => {
                        recipients.push({ key: child.key, namn: child.val().namn });
                    });
                    let html = '<div id="recipientDialogLager" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;">';
                    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 2px 8px rgba(0,0,0,0.15);">';
                    html += '<h3>Välj godsmottagare för lager</h3>';
                    recipients.forEach(rec => {
                        html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForLager("${rec.key}")'>${rec.namn}</button>`;
                    });
                    html += `<button style='width:100%;margin-top:12px;' onclick='window.cancelRecipientDialogLager()'>Avbryt</button>`;
                    html += '</div></div>';
                    document.body.insertAdjacentHTML('beforeend', html);
                    window.selectRecipientForLager = function(recipientKey) {
                        document.getElementById('recipientDialogLager').remove();
                        window.selectedRecipientForLager = recipientKey;
                        // Uppdatera visning av vald godsmottagare
                        updateRecipientDisplay('lager', recipientKey);
                        loadProducts(recipientKey);
                    };
                    window.cancelRecipientDialogLager = function() {
                        document.getElementById('recipientDialogLager').remove();
                        showPage('start');
                    };
                    return;
                } else {
                    // Ingen godsmottagare finns, använd huvudkund
                    window.selectedRecipientForLager = null;
                    updateRecipientDisplay('lager', null);
                    loadProducts();
                }
            });
        } else {
            // Ingen godsmottagare finns, använd huvudkund
            window.selectedRecipientForLager = null;
            updateRecipientDisplay('lager', null);
            loadProducts();
        }
    }
    if(page === 'order') {
        // Visa aktuell kund
        const customerDisplay = document.getElementById('currentCustomerOrder');
        if(customerDisplay) {
            customerDisplay.textContent = currentCustomer ? `${currentCustomer.name}` : '';
        }
        // Fråga om godsmottagare om det finns
        if(currentCustomer) {
            db.ref('kunder/' + currentCustomer.id + '/godsmottagare').once('value', snap => {
                if(snap.exists()) {
                    // Visa dialog för val av godsmottagare
                    const recipients = [];
                    snap.forEach(child => {
                        recipients.push({ key: child.key, namn: child.val().namn });
                    });
                    let html = '<div id="recipientDialogOrder" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;">';
                    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 2px 8px rgba(0,0,0,0.15);">';
                    html += '<h3>Välj godsmottagare för order</h3>';
                    recipients.forEach(rec => {
                        html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForOrder("${rec.key}")'>${rec.namn}</button>`;
                    });
                    html += `<button style='width:100%;margin:8px 0;background:#4CAF50;color:white;' onclick='window.showAddNewRecipientForOrder()'>Lägg till Ny</button>`;
                    html += `<button style='width:100%;margin-top:12px;' onclick='window.cancelRecipientDialogOrder()'>Avbryt</button>`;
                    html += '</div></div>';
                    document.body.insertAdjacentHTML('beforeend', html);
                    window.selectRecipientForOrder = function(recipientKey) {
                        document.getElementById('recipientDialogOrder').remove();
                        window.selectedRecipientForOrder = recipientKey;
                        // Uppdatera visning av vald godsmottagare
                        updateRecipientDisplay('order', recipientKey);
                        loadOrder(recipientKey);
                    };
                    window.cancelRecipientDialogOrder = function() {
                        document.getElementById('recipientDialogOrder').remove();
                        showPage('start');
                    };
                    window.showAddNewRecipientForOrder = function() {
                        // Dölj den befintliga dialogen först
                        document.getElementById('recipientDialogOrder').remove();
                        // Visa dialog för att lägga till ny godsmottagare
                        showAddNewRecipientDialog('order');
                    };
                    return;
                } else {
                    // Ingen godsmottagare finns, använd huvudkund
                    window.selectedRecipientForOrder = null;
                    updateRecipientDisplay('order', null);
                    loadOrder();
                }
            });
        } else {
            // Ingen godsmottagare finns, använd huvudkund
            window.selectedRecipientForOrder = null;
            updateRecipientDisplay('order', null);
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
        // Visa aktuell kund
        const customerDisplay = document.getElementById('currentCustomerOrders');
        if(customerDisplay) {
            customerDisplay.textContent = currentCustomer ? `${currentCustomer.name}` : '';
        }
        // Fråga om godsmottagare om det finns, precis som för order-sidan
        if(currentCustomer) {
            db.ref('kunder/' + currentCustomer.id + '/godsmottagare').once('value', snap => {
                if(snap.exists()) {
                    // Visa dialog för val av godsmottagare
                    const recipients = [];
                    snap.forEach(child => {
                        recipients.push({ key: child.key, namn: child.val().namn });
                    });
                    let html = '<div id="recipientDialogOrders" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;">';
                    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 2px 8px rgba(0,0,0,0.15);">';
                    html += '<h3>Välj godsmottagare för orderhistorik</h3>';
                    recipients.forEach(rec => {
                        html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForOrders("${rec.key}")'>${rec.namn}</button>`;
                    });
                    html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForOrders(null)'>Visa huvudkundens beställningar</button>`;
                    html += `<button style='width:100%;margin-top:12px;' onclick='window.cancelRecipientDialogOrders()'>Avbryt</button>`;
                    html += '</div></div>';
                    document.body.insertAdjacentHTML('beforeend', html);
                    window.selectRecipientForOrders = function(recipientKey) {
                        document.getElementById('recipientDialogOrders').remove();
                        window.selectedRecipientForOrder = recipientKey;
                        // Uppdatera visning av vald godsmottagare
                        updateRecipientDisplay('orders', recipientKey);
                        loadOrderHistory();
                    };
                    window.cancelRecipientDialogOrders = function() {
                        document.getElementById('recipientDialogOrders').remove();
                        showPage('start');
                    };
                } else {
                    // Ingen godsmottagare finns, ladda huvudkundens orderhistorik
                    window.selectedRecipientForOrder = null;
                    updateRecipientDisplay('orders', null);
                    loadOrderHistory();
                }
            });
        } else {
            updateRecipientDisplay('orders', null);
            loadOrderHistory();
        }
    }
    if(page === 'orderDetails') {
        // laddas via showOrderDetails
    }
    if(page === 'notes') {
        // Visa aktuell kund
        const customerDisplay = document.getElementById('currentCustomerNotes');
        if(customerDisplay) {
            customerDisplay.textContent = currentCustomer ? `${currentCustomer.name}` : '';
        }
        // Fråga om godsmottagare om det finns
        if(currentCustomer) {
            db.ref('kunder/' + currentCustomer.id + '/godsmottagare').once('value', snap => {
                if(snap.exists()) {
                    // Visa dialog för val av godsmottagare
                    const recipients = [];
                    snap.forEach(child => {
                        recipients.push({ key: child.key, namn: child.val().namn });
                    });
                    let html = '<div id="recipientDialogNotes" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;">';
                    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 2px 8px rgba(0,0,0,0.15);">';
                    html += '<h3>Välj godsmottagare för anteckningar</h3>';
                    recipients.forEach(rec => {
                        html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForNotes("${rec.key}")'>${rec.namn}</button>`;
                    });
                    html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForNotes(null)'>Visa huvudkundens anteckningar</button>`;
                    html += `<button style='width:100%;margin-top:12px;' onclick='window.cancelRecipientDialogNotes()'>Avbryt</button>`;
                    html += '</div></div>';
                    document.body.insertAdjacentHTML('beforeend', html);
                    window.selectRecipientForNotes = function(recipientKey) {
                        document.getElementById('recipientDialogNotes').remove();
                        window.selectedRecipientForNotes = recipientKey;
                        updateRecipientDisplay('notes', recipientKey);
                        loadNotes(recipientKey);
                    };
                    window.cancelRecipientDialogNotes = function() {
                        document.getElementById('recipientDialogNotes').remove();
                        showPage('start');
                    };
                } else {
                    // Ingen godsmottagare finns, använd huvudkund
                    window.selectedRecipientForNotes = null;
                    updateRecipientDisplay('notes', null);
                    loadNotes();
                }
            });
        } else {
            window.selectedRecipientForNotes = null;
            updateRecipientDisplay('notes', null);
            loadNotes();
        }
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
            // Spara produkten under vald godsmottagare om en är vald
            if(window.selectedRecipientForLager) {
                const newRef = db.ref(`kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForLager}/produkter`).push();
                newRef.set({ benamning, produktnummer, lagerAntal });
            } else {
                const newRef = db.ref(`kunder/${currentCustomer.id}/produkter`).push();
                newRef.set({ benamning, produktnummer, lagerAntal });
            }
            addProductForm.reset();
            loadProducts(window.selectedRecipientForLager);
        }
    });
}

function loadProducts(recipientKey) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    if(!currentCustomer) return;
    let products = [];
    // Läs produkter från vald godsmottagare eller från kundens produkter
    const path = recipientKey ? 
        `kunder/${currentCustomer.id}/godsmottagare/${recipientKey}/produkter` : 
        `kunder/${currentCustomer.id}/produkter`;
    db.ref(path).once('value', snapshot => {
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
    // Spara vald godsmottagare för lager
    window.selectedRecipientForLager = recipientKey || null;
}

function getSelectedProductKey() {
    const selected = document.querySelector('input[name="productSelect"]:checked');
    return selected ? selected.value : null;
}

function editSelectedProduct() {
    const key = getSelectedProductKey();
    if(!key || !currentCustomer) return;
    const path = window.selectedRecipientForLager ? 
        `kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForLager}/produkter/${key}` : 
        `kunder/${currentCustomer.id}/produkter/${key}`;
    db.ref(path).once('value', snapshot => {
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
            `<button onclick="loadProducts(window.selectedRecipientForLager)">Avbryt</button>`;
        productList.appendChild(btnDiv);
    });
}

function saveProductEdit(key) {
    const benamning = document.getElementById('editBenamning').value.trim();
    const produktnummer = document.getElementById('editProduktnummer').value.trim();
    const lagerAntal = parseInt(document.getElementById('editAntal').value);
    if(benamning && produktnummer && !isNaN(lagerAntal) && currentCustomer) {
        const path = window.selectedRecipientForLager ? 
            `kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForLager}/produkter/${key}` : 
            `kunder/${currentCustomer.id}/produkter/${key}`;
        db.ref(path).set({ benamning, produktnummer, lagerAntal }, function() {
            showPage('lager');
        });
    }
}

function deleteSelectedProduct() {
    const key = getSelectedProductKey();
    if(key && currentCustomer) {
        const path = window.selectedRecipientForLager ? 
            `kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForLager}/produkter/${key}` : 
            `kunder/${currentCustomer.id}/produkter/${key}`;
        db.ref(path).remove().then(() => loadProducts(window.selectedRecipientForLager));
    }
}

function loadOrder(recipientKey) {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';
    
    // Rensa manuella orderrader när ny order startas
    manualOrderItems = [];
    updateManualOrderList();
    
    if(!currentCustomer) return;
    // Läs produkter från vald godsmottagare eller från kundens produkter
    const path = recipientKey ? 
        `kunder/${currentCustomer.id}/godsmottagare/${recipientKey}/produkter` : 
        `kunder/${currentCustomer.id}/produkter`;
    db.ref(path).once('value', snapshot => {
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
        
        // Kombinera produkter från lager och manuella orderrader
        const orderData = {
            tid: new Date().toISOString(),
            bestallning: bestallning,
            manuellaRader: manualOrderItems
        };
        
        if(Object.keys(bestallning).length > 0 || manualOrderItems.length > 0) {
            if(!currentCustomer) return;
            // Spara ordern under godsmottagare om en är vald
            if(window.selectedRecipientForOrder) {
                db.ref(`kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForOrder}/bestallningar`).push(orderData);
            } else {
                db.ref(`kunder/${currentCustomer.id}/bestallningar`).push(orderData);
            }
            orderForm.reset();
            manualOrderItems = []; // Rensa manuella orderrader
            updateManualOrderList(); // Uppdatera visningen
            alert('Beställning sparad!');
            window.selectedRecipientForOrder = null;
        }
    });
}

let currentCustomer = null;
let manualOrderItems = []; // För manuella orderrader

// Globala variabler för orderredigering
let currentEditingOrder = {
    key: null,
    recipientKey: null,
    orderData: null,
    productMap: null
};

// Hantera manuell orderrad-inmatning
const manualOrderForm = document.getElementById('manualOrderForm');
if(manualOrderForm) {
    manualOrderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const productName = document.getElementById('manualProductName').value.trim();
        const productNumber = document.getElementById('manualProductNumber').value.trim();
        const quantity = parseInt(document.getElementById('manualQuantity').value);
        
        if(productName && !isNaN(quantity) && quantity > 0) {
            // Lägg till i manuella orderrader
            manualOrderItems.push({
                id: 'manual_' + Date.now(),
                name: productName,
                productNumber: productNumber || '',
                quantity: quantity
            });
            
            // Uppdatera visningen
            updateManualOrderList();
            
            // Rensa formuläret
            manualOrderForm.reset();
        }
    });
}

// Funktion för att uppdatera visningen av manuella orderrader
function updateManualOrderList() {
    const manualOrderList = document.getElementById('manualOrderList');
    if(!manualOrderList) return;
    
    manualOrderList.innerHTML = '';
    manualOrderItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name}${item.productNumber ? ' (' + item.productNumber + ')' : ''}: ${item.quantity} st</span>
            <button onclick="removeManualOrderItem(${index})" style="float:right;background:#ff4444;color:white;border:none;padding:4px 8px;border-radius:4px;">Ta bort</button>
        `;
        manualOrderList.appendChild(li);
    });
}

// Funktion för att ta bort manuell orderrad
function removeManualOrderItem(index) {
    manualOrderItems.splice(index, 1);
    updateManualOrderList();
}

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
    
    // Uppdatera visning av vald godsmottagare
    updateRecipientDisplay('orders', window.selectedRecipientForOrder);
    
    // Läs beställningar från vald godsmottagare om en är vald
    if(window.selectedRecipientForOrder) {
        db.ref(`kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForOrder}/bestallningar`).once('value', snapshot => {
            snapshot.forEach(child => {
                const order = child.val();
                const li = document.createElement('li');
                // Visa datum och tid, gör raden klickbar
                const date = new Date(order.tid);
                li.innerHTML = `<button style='width:100%;text-align:left;' onclick="showOrderDetails('${child.key}', '${window.selectedRecipientForOrder}')">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</button>`;
                orderHistoryList.appendChild(li);
            });
        });
    } else {
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
}

function showOrderDetails(orderKey, recipientKey) {
    showPage('orderDetails');
    const orderDetailsList = document.getElementById('orderDetailsList');
    orderDetailsList.innerHTML = '';
    if(!currentCustomer || !orderKey) return;
    
    // Spara orderinformation för eventuell redigering
    currentEditingOrder.key = orderKey;
    currentEditingOrder.recipientKey = recipientKey;
    
    // Läs orderdetaljer från rätt plats (godsmottagare eller huvudkund)
    const orderPath = recipientKey ? 
        `kunder/${currentCustomer.id}/godsmottagare/${recipientKey}/bestallningar/${orderKey}` :
        `kunder/${currentCustomer.id}/bestallningar/${orderKey}`;
        
    db.ref(orderPath).once('value', snapshot => {
        const order = snapshot.val();
        if(order) {
            // Spara orderdata för redigering
            currentEditingOrder.orderData = order;
            
            // Visa produkter från lager
            if(order.bestallning && Object.keys(order.bestallning).length > 0) {
                const headerLi = document.createElement('li');
                headerLi.innerHTML = '<strong>Produkter från lager:</strong>';
                headerLi.style.marginTop = '16px';
                orderDetailsList.appendChild(headerLi);
                
                // Hämta produktnamn från rätt plats (godsmottagare eller huvudkund)
                const productPath = recipientKey ?
                    `kunder/${currentCustomer.id}/godsmottagare/${recipientKey}/produkter` :
                    `kunder/${currentCustomer.id}/produkter`;
                    
                db.ref(productPath).once('value', prodSnap => {
                    const prodMap = {};
                    prodSnap.forEach(prodChild => {
                        prodMap[prodChild.key] = prodChild.val().benamning;
                    });
                    
                    // Spara produktmappning för redigering
                    currentEditingOrder.productMap = prodMap;
                    
                    for(const key in order.bestallning) {
                        const li = document.createElement('li');
                        const namn = prodMap[key] || key;
                        li.textContent = `${namn}: ${order.bestallning[key]} st`;
                        orderDetailsList.appendChild(li);
                    }
                });
            }
            
            // Visa manuella orderrader
            if(order.manuellaRader && order.manuellaRader.length > 0) {
                const headerLi = document.createElement('li');
                headerLi.innerHTML = '<strong>Manuella orderrader:</strong>';
                headerLi.style.marginTop = '16px';
                orderDetailsList.appendChild(headerLi);
                
                order.manuellaRader.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.name}${item.productNumber ? ' (' + item.productNumber + ')' : ''}: ${item.quantity} st`;
                    orderDetailsList.appendChild(li);
                });
            }
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
    
    // Visa radera/redigera-knapparna igen
    const deleteBtn = document.getElementById('deleteCustomerBtn');
    const editBtn = document.getElementById('editCustomerBtn');
    if(deleteBtn) deleteBtn.style.display = '';
    if(editBtn) editBtn.style.display = '';
    
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
    
    // Dölj radera/redigera-knapparna under redigering
    const deleteBtn = document.getElementById('deleteCustomerBtn');
    const editBtn = document.getElementById('editCustomerBtn');
    if(deleteBtn) deleteBtn.style.display = 'none';
    if(editBtn) editBtn.style.display = 'none';
    
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

        // Spara/Tillbaka-knappar
        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '12px';
        btnDiv.innerHTML = `<button id='saveEditCustomerBtn'>Spara</button> <button id='cancelEditCustomerBtn'>Tillbaka</button>`;
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
    btnDiv.innerHTML = `<button id='saveRecipientBtn'>Spara</button> <button id='cancelRecipientBtn'>Tillbaka</button>`;
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
    // Dölj radera/redigera-knapparna under redigering
    const deleteBtn = document.getElementById('deleteCustomerBtn');
    const editBtn = document.getElementById('editCustomerBtn');
    if(deleteBtn) deleteBtn.style.display = 'none';
    if(editBtn) editBtn.style.display = 'none';
    
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
        // Spara/Tillbaka-knappar
        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '12px';
        btnDiv.innerHTML = `<button id='saveEditCustomerBtn'>Spara</button> <button id='cancelEditCustomerBtn'>Tillbaka</button>`;
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

// Funktion för att uppdatera visning av vald godsmottagare
function updateRecipientDisplay(pageType, recipientKey) {
    const displayElement = document.getElementById(`currentRecipient${pageType.charAt(0).toUpperCase() + pageType.slice(1)}`);
    if(!displayElement || !currentCustomer) {
        if(displayElement) displayElement.textContent = '';
        return;
    }
    
    if(!recipientKey) {
        // Ingen godsmottagare vald, visa huvudkund
        displayElement.textContent = 'Godsmottagare: Huvudkund';
        return;
    }
    
    // Hämta godsmottagarens namn från databasen
    db.ref(`kunder/${currentCustomer.id}/godsmottagare/${recipientKey}`).once('value', snapshot => {
        const recipient = snapshot.val();
        if(recipient && recipient.namn) {
            displayElement.textContent = `Godsmottagare: ${recipient.namn}`;
        } else {
            displayElement.textContent = 'Godsmottagare: Huvudkund';
        }
    });
}

// =========================
// STRECKKODSLÄSNING
// =========================

let barcodeScanner = {
    isScanning: false,
    currentTarget: null, // 'lager' eller 'order'
    lastDetectedCode: null,
    lastDetectionTime: 0,
    debounceDelay: 2000 // 2 sekunder mellan samma streckkod
};

// Funktion för att starta streckkodsläsning
function startBarcodeScanning(target, containerId) {
    if (barcodeScanner.isScanning) {
        stopBarcodeScanning();
    }
    
    barcodeScanner.currentTarget = target;
    barcodeScanner.isScanning = true;
    
    const container = document.getElementById(containerId);
    container.style.display = 'block';
    
    // Kontrollera om Quagga är tillgängligt
    if (typeof Quagga === 'undefined') {
        alert('Streckkodsläsaren kunde inte laddas. Kontrollera internetanslutningen.');
        return;
    }
    
    const targetElement = target === 'lager' ? 'interactive' : (target === 'order' ? 'orderInteractive' : 'editInteractive');
    
    // Först försöka med enklare, mer kompatibla inställningar
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: `#${targetElement}`,
            constraints: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "environment"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader"
            ]
        },
        locate: true,
        debug: false
    }, function(err) {
        if (err) {
            console.log("Quagga initialization error:", err);
            alert('Kunde inte starta kameran. Kontrollera att du har gett tillstånd för kameraåtkomst.');
            stopBarcodeScanning();
            return;
        }
        
        console.log("Quagga initialized successfully");
        
        // Kontrollera att video-elementet finns och är aktivt
        const videoElement = document.querySelector(`#${targetElement} video`);
        if (videoElement) {
            console.log("Video element found, dimensions:", videoElement.videoWidth + "x" + videoElement.videoHeight);
            
            // Vänta lite för att säkerställa att videon startar
            setTimeout(() => {
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                    console.log("Video is playing successfully");
                } else {
                    console.log("Video dimensions are still 0, trying to restart...");
                    // Försök starta om video
                    if (videoElement.play) {
                        videoElement.play().catch(e => console.log("Video play failed:", e));
                    }
                }
            }, 1000);
        } else {
            console.log("No video element found in target container");
        }
        
        Quagga.start();
        
        // Lägg till visuell feedback
        addScanningInstructions(containerId);
        
        // Sätt en timeout för att kontrollera om kameran verkligen startar
        setTimeout(() => {
            const videoElement = document.querySelector(`#${targetElement} video`);
            if (!videoElement || videoElement.videoWidth === 0) {
                console.log("Camera failed to start properly, trying simplified fallback...");
                
                // Försök starta om med enklare inställningar
                Quagga.stop();
                setTimeout(() => {
                    startSimpleBarcodeScanning(target, containerId, targetElement);
                }, 500);
            }
        }, 3000);
    });
    
    // Lyssna på framgångsrik läsning
    Quagga.onDetected(function(data) {
        const code = data.codeResult.code;
        const currentTime = Date.now();
        
        // Kontrollera om detta är samma kod som just detekterades
        if (barcodeScanner.lastDetectedCode === code && 
            currentTime - barcodeScanner.lastDetectionTime < barcodeScanner.debounceDelay) {
            console.log("Duplicate barcode detection ignored:", code);
            return; // Ignorera duplicat
        }
        
        console.log("Barcode detected:", code);
        
        // Uppdatera senaste detektering
        barcodeScanner.lastDetectedCode = code;
        barcodeScanner.lastDetectionTime = currentTime;
        
        // Spela ljud för feedback
        playBeepSound();
        
        // Stoppa scanning omedelbart för att förhindra fler detekteringar
        stopBarcodeScanning();
        
        // Hantera den detekterade koden
        handleBarcodeDetected(code, target);
    });
    
    // Debug: Lyssna på processade frames
    Quagga.onProcessed(function(result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
    });
}

// Lägg till instruktioner för användaren
function addScanningInstructions(containerId) {
    const container = document.getElementById(containerId);
    const instructions = document.createElement('div');
    instructions.id = 'scanning-instructions';
    instructions.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        text-align: center;
        z-index: 1000;
    `;
    instructions.innerHTML = `
        📱 Håll mobilen stadigt<br>
    `;
    container.appendChild(instructions);
}

// Spela ljud när streckkod hittas
function playBeepSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log("Could not play beep sound:", e);
    }
}

// Funktion för att stoppa streckkodsläsning
function stopBarcodeScanning() {
    if (barcodeScanner.isScanning) {
        Quagga.stop();
        barcodeScanner.isScanning = false;
        
        // Rensa event listeners
        Quagga.offDetected();
        Quagga.offProcessed();
        
        // Dölj scanner-containrar
        const lagerContainer = document.getElementById('barcodeScannerContainer');
        const orderContainer = document.getElementById('barcodeOrderScannerContainer');
        const editContainer = document.getElementById('barcodeEditScannerContainer');
        if (lagerContainer) lagerContainer.style.display = 'none';
        if (orderContainer) orderContainer.style.display = 'none';
        if (editContainer) editContainer.style.display = 'none';
        
        // Ta bort instruktioner
        const instructions = document.getElementById('scanning-instructions');
        if (instructions) {
            instructions.remove();
        }
        
        // Rensa senaste detektering efter en kort fördröjning
        setTimeout(() => {
            barcodeScanner.lastDetectedCode = null;
            barcodeScanner.lastDetectionTime = 0;
        }, 1000);
    }
}

// Funktion för att hantera detekterad streckkod
function handleBarcodeDetected(code, target) {
    if (target === 'lager') {
        // För lager - fyll i produktnummer-fältet
        const produktnummerField = document.getElementById('produktnummer');
        if (produktnummerField) {
            produktnummerField.value = code;
            produktnummerField.focus();
        }
         //alert(`Streckkod skannad: ${code}\nProduktnummer ifyllt automatiskt.`);
    } else if (target === 'order') {
        // För order - fyll i produktnummer-fältet
        const manualProductNumberField = document.getElementById('manualProductNumber');
        if (manualProductNumberField) {
            manualProductNumberField.value = code;
            // Fokusera på produktnamn-fältet så användaren kan fylla i det
            const productNameField = document.getElementById('manualProductName');
            if (productNameField) productNameField.focus();
        }
         //alert(`Streckkod skannad: ${code}\nProduktnummer ifyllt automatiskt. Fyll i produktnamn.`);
    } else if (target === 'edit') {
        // För orderredigering - fyll i produktnummer-fältet
        const editProductNumberField = document.getElementById('editManualProductNumber');
        if (editProductNumberField) {
            editProductNumberField.value = code;
            // Fokusera på produktnamn-fältet så användaren kan fylla i det
            const editProductNameField = document.getElementById('editManualProductName');
            if (editProductNameField) editProductNameField.focus();
        }
    }
}

// Enkel fallback-funktion för streckkodsläsning
function startSimpleBarcodeScanning(target, containerId, targetElement) {
    console.log("Starting simple barcode scanning...");
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: `#${targetElement}`,
            constraints: {
                video: {
                    facingMode: "environment",
                    width: { min: 320, ideal: 640, max: 1280 },
                    height: { min: 240, ideal: 480, max: 720 }
                }
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: 1,
        frequency: 5,
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader"]
        },
        locate: true,
        debug: false
    }, function(err) {
        if (err) {
            console.log("Simple initialization also failed:", err);
            alert('Kameran kunde inte startas. Kontrollera att:\n1. Du har gett tillstånd för kameraåtkomst\n2. Ingen annan app använder kameran\n3. Du använder HTTPS eller localhost');
            stopBarcodeScanning();
            return;
        }
        
        console.log("Simple Quagga initialized successfully");
        Quagga.start();
        
        // Lägg till streckkodsdetektering för den enkla versionen
        Quagga.onDetected(function(data) {
            const code = data.codeResult.code;
            const currentTime = Date.now();
            
            // Kontrollera duplicat
            if (barcodeScanner.lastDetectedCode === code && 
                currentTime - barcodeScanner.lastDetectionTime < barcodeScanner.debounceDelay) {
                return;
            }
            
            console.log("Simple barcode detected:", code);
            
            // Uppdatera senaste detektering
            barcodeScanner.lastDetectedCode = code;
            barcodeScanner.lastDetectionTime = currentTime;
            
            // Spela ljud för feedback
            playBeepSound();
            
            // Stoppa scanning och hantera kod
            stopBarcodeScanning();
            handleBarcodeDetected(code, target);
        });
        
        // Kontrollera video efter kort delay
        setTimeout(() => {
            const videoElement = document.querySelector(`#${targetElement} video`);
            if (videoElement && videoElement.videoWidth > 0) {
                console.log("Simple video is working, dimensions:", videoElement.videoWidth + "x" + videoElement.videoHeight);
                addScanningInstructions(containerId);
            } else {
                console.log("Simple video also failed");
                alert('Kameran kunde inte aktiveras. Försök ladda om sidan och ge tillstånd för kameraåtkomst.');
                stopBarcodeScanning();
            }
        }, 2000);
    });
}

// Event listeners för streckkodsläsning
document.addEventListener('DOMContentLoaded', function() {
    // Lager streckkodsläsning
    const startLagerScanner = document.getElementById('startBarcodeScanner');
    const stopLagerScanner = document.getElementById('stopBarcodeScanner');
    
    if (startLagerScanner) {
        startLagerScanner.addEventListener('click', function() {
            startBarcodeScanning('lager', 'barcodeScannerContainer');
        });
    }
    
    if (stopLagerScanner) {
        stopLagerScanner.addEventListener('click', function() {
            stopBarcodeScanning();
        });
    }
    
    // Order streckkodsläsning
    const startOrderScanner = document.getElementById('startBarcodeOrderScanner');
    const stopOrderScanner = document.getElementById('stopBarcodeOrderScanner');
    
    if (startOrderScanner) {
        startOrderScanner.addEventListener('click', function() {
            startBarcodeScanning('order', 'barcodeOrderScannerContainer');
        });
    }
    
    if (stopOrderScanner) {
        stopOrderScanner.addEventListener('click', function() {
            stopBarcodeScanning();
        });
    }
    
    // Edit streckkodsläsning
    const startEditScanner = document.getElementById('startBarcodeEditScanner');
    const stopEditScanner = document.getElementById('stopBarcodeEditScanner');
    
    if (startEditScanner) {
        startEditScanner.addEventListener('click', function() {
            startBarcodeScanning('edit', 'barcodeEditScannerContainer');
        });
    }
    
    if (stopEditScanner) {
        stopEditScanner.addEventListener('click', function() {
            stopBarcodeScanning();
        });
    }
});

// Stoppa scanning när användaren lämnar sidan
window.addEventListener('beforeunload', function() {
    stopBarcodeScanning();
});

// Funktion för att bekräfta att användaren vill lämna ordersidan
function confirmLeaveOrder() {
    // Kontrollera om det finns osparade ändringar (produkter valda eller manuella rader)
    const orderInputs = document.querySelectorAll('#orderForm input[type="number"][data-key]');
    const hasOrderItems = Array.from(orderInputs).some(input => {
        const antal = parseInt(input.value);
        return !isNaN(antal) && antal > 0;
    });
    
    const hasManualItems = manualOrderItems.length > 0;
    
    if (hasOrderItems || hasManualItems) {
        // Visa varningsdialog
        showLeaveOrderDialog();
    } else {
        // Inga osparade ändringar, gå direkt tillbaka
        showPage('start');
    }
}

// Funktion för att visa varningsdialogen
function showLeaveOrderDialog() {
    let html = '<div id="leaveOrderDialog" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;">';
    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 4px 12px rgba(0,0,0,0.3);">';
    html += '<h3 style="margin-top:0;color:#333;">Spara order?</h3>';
    html += '<p style="color:#666;margin-bottom:20px;">Vill du spara ordern innan du lämnar sidan?</p>';
    html += '<div style="display:flex;gap:8px;">';
    html += '<button onclick="saveAndLeaveOrder()" style="flex:1;background:#4CAF50;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;">Spara</button>';
    html += '<button onclick="leaveWithoutSaving()" style="flex:1;background:#f44336;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;">Lämna utan att spara</button>';
    html += '</div>';
    html += '<button onclick="cancelLeaveOrder()" style="width:100%;background:#ccc;color:#333;border:none;padding:8px;border-radius:6px;cursor:pointer;margin-top:8px;">Avbryt</button>';
    html += '</div></div>';
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// Spara ordern och gå tillbaka
function saveAndLeaveOrder() {
    // Simulera klick på spara-knappen
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        // Trigga submit-eventet
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        orderForm.dispatchEvent(submitEvent);
    }
    
    // Ta bort dialogen och gå tillbaka
    const dialog = document.getElementById('leaveOrderDialog');
    if (dialog) dialog.remove();
    showPage('start');
}

// Lämna utan att spara
function leaveWithoutSaving() {
    // Rensa alla orderdata
    const orderForm = document.getElementById('orderForm');
    if (orderForm) orderForm.reset();
    manualOrderItems = [];
    updateManualOrderList();
    
    // Ta bort dialogen och gå tillbaka
    const dialog = document.getElementById('leaveOrderDialog');
    if (dialog) dialog.remove();
    showPage('start');
}

// Avbryt och stanna kvar på ordersidan
function cancelLeaveOrder() {
    const dialog = document.getElementById('leaveOrderDialog');
    if (dialog) dialog.remove();
}

// Funktion för att visa dialog för att lägga till ny godsmottagare
function showAddNewRecipientDialog(context) {
    let html = '<div id="addNewRecipientDialog" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;">';
    html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 4px 12px rgba(0,0,0,0.3);">';
    html += '<h3 style="margin-top:0;color:#333;">Lägg till ny godsmottagare</h3>';
    html += '<div style="margin-bottom:16px;">';
    html += '<label for="newRecipientName" style="display:block;margin-bottom:4px;color:#555;">Namn på godsmottagare:</label>';
    html += '<input type="text" id="newRecipientName" placeholder="Ange namn" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:20px;">';
    html += `<button onclick="saveNewRecipient('${context}')" style="flex:1;background:#4CAF50;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;">Spara ny</button>`;
    html += `<button onclick="cancelAddNewRecipient('${context}')" style="flex:1;background:#ccc;color:#333;border:none;padding:12px;border-radius:6px;cursor:pointer;">Avbryt</button>`;
    html += '</div>';
    html += '</div></div>';
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Fokusera på input-fältet
    setTimeout(() => {
        const input = document.getElementById('newRecipientName');
        if (input) input.focus();
    }, 100);
}

// Funktion för att spara ny godsmottagare
function saveNewRecipient(context) {
    const nameInput = document.getElementById('newRecipientName');
    const name = nameInput ? nameInput.value.trim() : '';
    
    if (!name) {
        alert('Ange ett namn för godsmottagaren.');
        if (nameInput) nameInput.focus();
        return;
    }
    
    if (!currentCustomer) {
        alert('Ingen kund vald.');
        return;
    }
    
    // Spara den nya godsmottagaren i databasen
    db.ref(`kunder/${currentCustomer.id}/godsmottagare`).push({ namn: name }).then((newRecipientRef) => {
        // Ta bort dialogen
        const dialog = document.getElementById('addNewRecipientDialog');
        if (dialog) dialog.remove();
        
        // Välj den nya godsmottagaren automatiskt och fortsätt
        const newRecipientKey = newRecipientRef.key;
        
        if (context === 'order') {
            window.selectedRecipientForOrder = newRecipientKey;
            updateRecipientDisplay('order', newRecipientKey);
            loadOrder(newRecipientKey);
        }
        
        // Visa bekräftelse
        alert(`Godsmottagare "${name}" har lagts till och valts.`);
        
    }).catch((error) => {
        console.error('Fel vid sparning av godsmottagare:', error);
        alert('Kunde inte spara godsmottagaren. Försök igen.');
    });
}

// Funktion för att avbryta tillägg av ny godsmottagare
function cancelAddNewRecipient(context) {
    // Ta bort dialogen
    const dialog = document.getElementById('addNewRecipientDialog');
    if (dialog) dialog.remove();
    
    // Visa den ursprungliga dialogen igen
    if (context === 'order') {
        // Återskapa recipient-dialogen för order
        setTimeout(() => {
            if (currentCustomer) {
                db.ref('kunder/' + currentCustomer.id + '/godsmottagare').once('value', snap => {
                    if (snap.exists()) {
                        const recipients = [];
                        snap.forEach(child => {
                            recipients.push({ key: child.key, namn: child.val().namn });
                        });
                        let html = '<div id="recipientDialogOrder" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;">';
                        html += '<div style="background:#fff;padding:24px;border-radius:12px;max-width:320px;width:90vw;box-shadow:0 2px 8px rgba(0,0,0,0.15);">';
                        html += '<h3>Välj godsmottagare för order</h3>';
                        recipients.forEach(rec => {
                            html += `<button style='width:100%;margin:8px 0;' onclick='window.selectRecipientForOrder("${rec.key}")'>${rec.namn}</button>`;
                        });
                        html += `<button style='width:100%;margin:8px 0;background:#4CAF50;color:white;' onclick='window.showAddNewRecipientForOrder()'>Lägg till Ny</button>`;
                        html += `<button style='width:100%;margin-top:12px;' onclick='window.cancelRecipientDialogOrder()'>Avbryt</button>`;
                        html += '</div></div>';
                        document.body.insertAdjacentHTML('beforeend', html);
                    }
                });
            }
        }, 100);
    }
}

// Funktion för att gå tillbaka till beställningshistorik utan att visa dialogen igen
function returnToOrderHistory() {
    // Visa orders-sidan direkt utan att köra dialogen
    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
    });
    const selected = document.getElementById('orders');
    selected.classList.remove('hidden');
    selected.classList.add('active');
    
    // Visa aktuell kund
    const customerDisplay = document.getElementById('currentCustomerOrders');
    if(customerDisplay) {
        customerDisplay.textContent = currentCustomer ? `${currentCustomer.name}` : '';
    }
    
    // Uppdatera visning av vald godsmottagare och ladda historik
    updateRecipientDisplay('orders', window.selectedRecipientForOrder);
    loadOrderHistory();
}

// ===========================
// ANTECKNINGAR FUNKTIONER
// ===========================

// Funktion för att ladda anteckningar
function loadNotes(recipientKey) {
    if(!currentCustomer) return;
    
    // Bestäm sökväg beroende på om godsmottagare är vald
    const path = recipientKey ? 
        `kunder/${currentCustomer.id}/godsmottagare/${recipientKey}/anteckningar` : 
        `kunder/${currentCustomer.id}/anteckningar`;
    
    // Ladda befintliga anteckningar från Firebase
    db.ref(path).once('value', snapshot => {
        const notes = snapshot.val();
        const textarea = document.getElementById('notesTextarea');
        if(textarea) {
            textarea.value = notes || '';
        }
        
        // Uppdatera status
        const statusDiv = document.getElementById('notesSaveStatus');
        if(statusDiv) {
            if(notes) {
                statusDiv.textContent = 'Anteckningar laddade';
                statusDiv.style.color = '#4CAF50';
            } else {
                statusDiv.textContent = 'Inga sparade anteckningar';
                statusDiv.style.color = '#666';
            }
        }
    });
    
    // Spara vald godsmottagare för anteckningar
    window.selectedRecipientForNotes = recipientKey || null;
}

// Funktion för att spara anteckningar
function saveNotes() {
    if(!currentCustomer) {
        alert('Ingen kund vald.');
        return;
    }
    
    const textarea = document.getElementById('notesTextarea');
    const notes = textarea ? textarea.value.trim() : '';
    
    // Bestäm sökväg beroende på om godsmottagare är vald
    const path = window.selectedRecipientForNotes ? 
        `kunder/${currentCustomer.id}/godsmottagare/${window.selectedRecipientForNotes}/anteckningar` : 
        `kunder/${currentCustomer.id}/anteckningar`;
    
    // Spara till Firebase
    db.ref(path).set(notes).then(() => {
        // Uppdatera status
        const statusDiv = document.getElementById('notesSaveStatus');
        if(statusDiv) {
            statusDiv.textContent = 'Anteckningar sparade!';
            statusDiv.style.color = '#4CAF50';
            
            // Rensa status efter 3 sekunder
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        }
    }).catch(error => {
        console.error('Fel vid sparning av anteckningar:', error);
        const statusDiv = document.getElementById('notesSaveStatus');
        if(statusDiv) {
            statusDiv.textContent = 'Fel vid sparning!';
            statusDiv.style.color = '#f44336';
        }
    });
}

// Funktion för att rensa anteckningar
function clearNotes() {
    if(confirm('Vill du verkligen rensa alla anteckningar?')) {
        const textarea = document.getElementById('notesTextarea');
        if(textarea) {
            textarea.value = '';
            textarea.focus();
        }
        
        // Uppdatera status
        const statusDiv = document.getElementById('notesSaveStatus');
        if(statusDiv) {
            statusDiv.textContent = 'Anteckningar rensade (inte sparade ännu)';
            statusDiv.style.color = '#ff9800';
        }
    }
}

// ===========================
// ORDERREDIGERING FUNKTIONER
// ===========================

// Funktion för att starta redigering av aktuell order
function editCurrentOrder() {
    if(!currentEditingOrder.orderData) {
        alert('Ingen order att redigera.');
        return;
    }
    
    showPage('editOrder');
    
    // Visa orderdatum
    const dateDiv = document.getElementById('editOrderDate');
    if(dateDiv) {
        const date = new Date(currentEditingOrder.orderData.tid);
        dateDiv.textContent = `Order från: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    
    // Ladda lager-produkter för redigering
    loadEditLagerProducts();
    
    // Ladda manuella orderrader för redigering
    loadEditManualProducts();
    
    // Sätt upp formulär för nya manuella rader
    setupEditManualOrderForm();
}

// Ladda lager-produkter för redigering
function loadEditLagerProducts() {
    const list = document.getElementById('editLagerProductsList');
    const section = document.getElementById('editLagerProductsSection');
    list.innerHTML = '';
    
    if(!currentEditingOrder.orderData.bestallning || Object.keys(currentEditingOrder.orderData.bestallning).length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    for(const productKey in currentEditingOrder.orderData.bestallning) {
        const quantity = currentEditingOrder.orderData.bestallning[productKey];
        const productName = currentEditingOrder.productMap?.[productKey] || productKey;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin:8px 0;">
                <span style="flex:1;">${productName}</span>
                <input type="number" min="0" value="${quantity}" data-product-key="${productKey}" style="width:80px;" onchange="updateLagerProductQuantity('${productKey}', this.value)">
                <button onclick="removeLagerProduct('${productKey}')" style="background:#f44336;color:white;border:none;padding:4px 8px;border-radius:4px;">Ta bort</button>
            </div>
        `;
        list.appendChild(li);
    }
}

// Ladda manuella orderrader för redigering
function loadEditManualProducts() {
    const list = document.getElementById('editManualProductsList');
    const section = document.getElementById('editManualProductsSection');
    list.innerHTML = '';
    
    if(!currentEditingOrder.orderData.manuellaRader || currentEditingOrder.orderData.manuellaRader.length === 0) {
        // Visa sektionen ändå för att kunna lägga till nya rader
        section.style.display = 'block';
        return;
    }
    
    section.style.display = 'block';
    
    currentEditingOrder.orderData.manuellaRader.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap;">
                <input type="text" value="${item.name}" placeholder="Produktnamn" style="flex:1;min-width:120px;" onchange="updateManualProductName(${index}, this.value)">
                <input type="text" value="${item.productNumber || ''}" placeholder="Produktnummer" style="width:100px;" onchange="updateManualProductNumber(${index}, this.value)">
                <input type="number" min="1" value="${item.quantity}" style="width:60px;" onchange="updateManualProductQuantity(${index}, this.value)">
                <button onclick="removeManualProduct(${index})" style="background:#f44336;color:white;border:none;padding:4px 8px;border-radius:4px;">Ta bort</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Sätt upp formulär för nya manuella orderrader
function setupEditManualOrderForm() {
    const form = document.getElementById('editAddManualOrderForm');
    if(form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('editManualProductName').value.trim();
            const productNumber = document.getElementById('editManualProductNumber').value.trim();
            const quantity = parseInt(document.getElementById('editManualQuantity').value);
            
            if(name && !isNaN(quantity) && quantity > 0) {
                // Lägg till i den redigerade ordern
                if(!currentEditingOrder.orderData.manuellaRader) {
                    currentEditingOrder.orderData.manuellaRader = [];
                }
                
                currentEditingOrder.orderData.manuellaRader.push({
                    id: 'manual_' + Date.now(),
                    name: name,
                    productNumber: productNumber || '',
                    quantity: quantity
                });
                
                // Uppdatera visningen
                loadEditManualProducts();
                
                // Rensa formuläret
                form.reset();
            }
        };
        
        // Sätt upp streckkodsläsning för edit-läge
        const startEditScanner = document.getElementById('startBarcodeEditScanner');
        const stopEditScanner = document.getElementById('stopBarcodeEditScanner');
        
        if (startEditScanner) {
            startEditScanner.onclick = function() {
                startBarcodeScanning('edit', 'barcodeEditScannerContainer');
            };
        }
        
        if (stopEditScanner) {
            stopEditScanner.onclick = function() {
                stopBarcodeScanning();
            };
        }
    }
}

// Uppdatera antal för lager-produkt
function updateLagerProductQuantity(productKey, newQuantity) {
    const quantity = parseInt(newQuantity);
    if(!isNaN(quantity) && quantity >= 0) {
        if(quantity === 0) {
            // Ta bort produkten om antalet är 0
            delete currentEditingOrder.orderData.bestallning[productKey];
        } else {
            currentEditingOrder.orderData.bestallning[productKey] = quantity;
        }
    }
}

// Ta bort lager-produkt
function removeLagerProduct(productKey) {
    if(confirm('Vill du ta bort denna produkt från ordern?')) {
        delete currentEditingOrder.orderData.bestallning[productKey];
        loadEditLagerProducts();
    }
}

// Uppdatera manuell produkts namn
function updateManualProductName(index, newName) {
    if(currentEditingOrder.orderData.manuellaRader && currentEditingOrder.orderData.manuellaRader[index]) {
        currentEditingOrder.orderData.manuellaRader[index].name = newName;
    }
}

// Uppdatera manuell produkts produktnummer
function updateManualProductNumber(index, newProductNumber) {
    if(currentEditingOrder.orderData.manuellaRader && currentEditingOrder.orderData.manuellaRader[index]) {
        currentEditingOrder.orderData.manuellaRader[index].productNumber = newProductNumber;
    }
}

// Uppdatera manuell produkts antal
function updateManualProductQuantity(index, newQuantity) {
    const quantity = parseInt(newQuantity);
    if(!isNaN(quantity) && quantity > 0 && currentEditingOrder.orderData.manuellaRader && currentEditingOrder.orderData.manuellaRader[index]) {
        currentEditingOrder.orderData.manuellaRader[index].quantity = quantity;
    }
}

// Ta bort manuell produkt
function removeManualProduct(index) {
    if(confirm('Vill du ta bort denna orderrad?')) {
        if(currentEditingOrder.orderData.manuellaRader) {
            currentEditingOrder.orderData.manuellaRader.splice(index, 1);
            loadEditManualProducts();
        }
    }
}

// Spara den redigerade ordern
function saveEditedOrder() {
    if(!currentEditingOrder.key || !currentEditingOrder.orderData) {
        alert('Ingen order att spara.');
        return;
    }
    
    // Bestäm sökväg
    const orderPath = currentEditingOrder.recipientKey ? 
        `kunder/${currentCustomer.id}/godsmottagare/${currentEditingOrder.recipientKey}/bestallningar/${currentEditingOrder.key}` :
        `kunder/${currentCustomer.id}/bestallningar/${currentEditingOrder.key}`;
    
    // Spara till Firebase
    db.ref(orderPath).set(currentEditingOrder.orderData).then(() => {
        alert('Order sparad!');
        // Gå tillbaka till orderdetaljer för att visa uppdaterad order
        showOrderDetails(currentEditingOrder.key, currentEditingOrder.recipientKey);
    }).catch(error => {
        console.error('Fel vid sparning av order:', error);
        alert('Kunde inte spara ordern. Försök igen.');
    });
}

// Avbryt orderredigering
function cancelEditOrder() {
    if(confirm('Vill du avbryta redigeringen? Alla ändringar går förlorade.')) {
        // Gå tillbaka till orderdetaljer
        showOrderDetails(currentEditingOrder.key, currentEditingOrder.recipientKey);
    }
}


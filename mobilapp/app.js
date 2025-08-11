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
    if(page === 'order') loadOrder();
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

function loadOrder() {
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
            db.ref(`kunder/${currentCustomer.id}/bestallningar`).push({
                tid: new Date().toISOString(),
                bestallning
            });
            orderForm.reset();
            alert('Beställning sparad!');
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
            db.ref('kunder').push({ name });
            addCustomerForm.reset();
            loadCustomers();
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
        snapshot.forEach(child => {
            const kund = child.val();
            const li = document.createElement('li');
            li.innerHTML = `<span>${kund.name}</span> <button onclick="deleteCustomer('${child.key}')">Radera</button>`;
            list.appendChild(li);
        });
    });
}

// Funktion för att radera kund
function deleteCustomer(key) {
    if(confirm('Vill du verkligen radera denna kund?')) {
        db.ref('kunder/' + key).remove().then(loadManageCustomers);
    }
}

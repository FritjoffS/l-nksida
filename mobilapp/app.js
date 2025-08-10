// Firebase konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyA3L-Tg0qwOb_rotCf_WH0AaT-jFbg22jc",
  authDomain: "jarnhandelio.firebaseapp.com",
  databaseURL: "https://jarnhandelio-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jarnhandelio",
  storageBucket: "jarnhandelio.firebasestorage.app",
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
    if(page === 'inventering') loadInventory();
    if(page === 'start') {
        const header = document.getElementById('currentCustomerHeader');
        header.textContent = currentCustomer ? `Kund: ${currentCustomer.name}` : '';
    }
    if(page === 'customerSelect') {
        loadCustomers();
    }
    if(page === 'orders') {
        loadOrderHistory();
    }
}

// Lager: Lägg till produkt
const addProductForm = document.getElementById('addProductForm');
if(addProductForm) {
    addProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const benamning = document.getElementById('benamning').value.trim();
        const lagerAntal = parseInt(document.getElementById('lagerAntal').value);
        if(benamning && !isNaN(lagerAntal)) {
            if(!currentCustomer) return;
            const newRef = db.ref(`kunder/${currentCustomer.id}/produkter`).push();
            newRef.set({ benamning, lagerAntal });
            addProductForm.reset();
            loadProducts();
        }
    });
}

function loadProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    if(!currentCustomer) return;
    db.ref(`kunder/${currentCustomer.id}/produkter`).once('value', snapshot => {
        snapshot.forEach(child => {
            const prod = child.val();
            const li = document.createElement('li');
            li.innerHTML = `<span>${prod.benamning} (${prod.lagerAntal})</span> ` +
                `<button onclick="editProduct('${child.key}', '${prod.benamning}', ${prod.lagerAntal})">Redigera</button> ` +
                `<button onclick="deleteProduct('${child.key}')">Radera</button>`;
            productList.appendChild(li);
        });
    });
}

function editProduct(key, benamning, lagerAntal) {
    const productList = document.getElementById('productList');
    const li = document.createElement('li');
    li.innerHTML = `<input type='text' id='editBenamning' value='${benamning}'> ` +
        `<input type='number' id='editAntal' value='${lagerAntal}'> ` +
        `<button onclick="saveProductEdit('${key}')">Spara</button> ` +
        `<button onclick="loadProducts()">Avbryt</button>`;
    productList.innerHTML = '';
    productList.appendChild(li);
}

function saveProductEdit(key) {
    const benamning = document.getElementById('editBenamning').value.trim();
    const lagerAntal = parseInt(document.getElementById('editAntal').value);
    if(benamning && !isNaN(lagerAntal) && currentCustomer) {
        db.ref(`kunder/${currentCustomer.id}/produkter/${key}`).set({ benamning, lagerAntal }, loadProducts);
    }
}

function deleteProduct(key) {
    if(currentCustomer) {
        db.ref(`kunder/${currentCustomer.id}/produkter/${key}`).remove().then(loadProducts);
    }
}

// Inventering: Lista produkter och beställning
function loadInventory() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';
    if(!currentCustomer) return;
    db.ref(`kunder/${currentCustomer.id}/produkter`).once('value', snapshot => {
        snapshot.forEach(child => {
            const prod = child.val();
            const li = document.createElement('li');
            li.innerHTML = `<span>${prod.benamning} (${prod.lagerAntal})</span>
                <input type='number' min='0' placeholder='Beställ antal' data-key='${child.key}' style='width:80px;'>`;
            inventoryList.appendChild(li);
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
            let items = '';
            for(const key in order.bestallning) {
                items += `${key}: ${order.bestallning[key]}, `;
            }
            li.textContent = `${order.tid}: ${items.slice(0, -2)}`;
            orderHistoryList.appendChild(li);
        });
    });
}

// Starta med kundvalssidan
showPage('customerSelect');

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOFeJ1GvtXtffzCwQFg2M3CCVtpn875KQ",
    authDomain: "l-nksida.firebaseapp.com",
    databaseURL: "https://l-nksida-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "l-nksida",
    storageBucket: "l-nksida.firebasestorage.app",
    messagingSenderId: "258147870107",
    appId: "1:258147870107:web:ce637517bc30b7578cad3e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM elements
const serialNumberInput = document.getElementById("serialNumber");
const checkCardButton = document.getElementById("checkCard");
const cardInfoDiv = document.getElementById("cardInfo");
const cardValueParagraph = document.getElementById("cardValue");
const redeemAmountInput = document.getElementById("redeemAmount");
const redeemCardButton = document.getElementById("redeemCard");
const activateCardDiv = document.getElementById("activateCard");
const cardValueInput = document.getElementById("cardValueInput");
const sellerNameInput = document.getElementById("sellerName");
const activateCardButton = document.getElementById("activateCardButton");

// Check card
checkCardButton.addEventListener("click", async () => {
    const serialNumber = serialNumberInput.value.trim();
    if (!serialNumber) return alert("Ange ett serienummer!");

    const cardRef = ref(db, `presentkort/${serialNumber}`);
    const snapshot = await get(cardRef);

    if (snapshot.exists()) {
        const cardData = snapshot.val();
        cardValueParagraph.textContent = `Värde: ${cardData.value} kr`;
        cardInfoDiv.style.display = "block";
        activateCardDiv.style.display = "none";
    } else {
        cardInfoDiv.style.display = "none";
        activateCardDiv.style.display = "block";
    }
});

// Redeem card
redeemCardButton.addEventListener("click", async () => {
    const serialNumber = serialNumberInput.value.trim();
    const redeemAmount = parseFloat(redeemAmountInput.value);

    if (!serialNumber || isNaN(redeemAmount)) return alert("Ange giltiga värden!");

    const cardRef = ref(db, `presentkort/${serialNumber}`);
    const snapshot = await get(cardRef);

    if (snapshot.exists()) {
        const cardData = snapshot.val();
        const newValue = cardData.value - redeemAmount;

        if (newValue < 0) return alert("Otillräckligt saldo!");

        await update(cardRef, { value: newValue });
        alert("Beloppet har lösts in!");
        cardValueParagraph.textContent = `Värde: ${newValue} kr`;
    }
});

// Activate card
activateCardButton.addEventListener("click", async () => {
    const serialNumber = serialNumberInput.value.trim();
    const cardValue = parseFloat(cardValueInput.value);
    const sellerName = sellerNameInput.value.trim();

    if (!serialNumber || isNaN(cardValue) || !sellerName) return alert("Ange giltiga värden!");

    const cardRef = ref(db, `presentkort/${serialNumber}`);
    const newCardData = {
        value: cardValue,
        seller: sellerName,
        date: new Date().toISOString()
    };

    await set(cardRef, newCardData);
    alert("Presentkortet har aktiverats!");
    activateCardDiv.style.display = "none";
});

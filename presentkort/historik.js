import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// Function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Get serial number from query parameters
const urlParams = new URLSearchParams(window.location.search);
const serialNumber = urlParams.get("serialNumber");

if (serialNumber) {
    const historyRef = ref(db, `presentkort/${serialNumber}/history`);
    const historyList = document.getElementById("historyList");

    // Fetch activation date from the card data
    const cardRef = ref(db, `presentkort/${serialNumber}`);
    get(cardRef).then(cardSnapshot => {
        if (cardSnapshot.exists()) {
            const cardData = cardSnapshot.val();
            const activationDate = formatTimestamp(cardData.date);
            historyList.innerHTML = `<h2>Historik</h2><div>Aktiveringsdatum: ${activationDate}</div>`;
        } else {
            historyList.innerHTML = "<p>Ingen information om presentkortet hittades.</p>";
        }

        // Fetch and append history entries
        get(historyRef).then(snapshot => {
            if (snapshot.exists()) {
                const historyData = snapshot.val();
                Object.entries(historyData).forEach(([key, entry]) => {
                    const entryDiv = document.createElement("div");
                    const formattedDate = formatTimestamp(entry.timestamp);
                    entryDiv.textContent = `Datum: ${formattedDate}, Belopp: ${entry.redeemedAmount} kr`;
                    historyList.appendChild(entryDiv);
                });
            } else {
                const noHistoryDiv = document.createElement("div");
                noHistoryDiv.textContent = "Ingen försäljning registrerad.";
                historyList.appendChild(noHistoryDiv);
            }
        }).catch(error => {
            console.error("Error fetching history:", error);
            historyList.innerHTML += "<p>Kunde inte hämta historik.</p>";
        });
    }).catch(error => {
        console.error("Error fetching card data:", error);
        historyList.innerHTML = "<p>Kunde inte hämta information om presentkortet.</p>";
    });
} else {
    alert("Inget serienummer angivet!");
    window.location.href = "presentkort.html";
}

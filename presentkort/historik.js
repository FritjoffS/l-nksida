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

// Get serial number from query parameters
const urlParams = new URLSearchParams(window.location.search);
const serialNumber = urlParams.get("serialNumber");

if (serialNumber) {
    const historyRef = ref(db, `presentkort/${serialNumber}/history`);
    const historyList = document.getElementById("historyList");

    get(historyRef).then(snapshot => {
        if (snapshot.exists()) {
            const historyData = snapshot.val();
            historyList.innerHTML = "<h2>Historik</h2>";
            Object.entries(historyData).forEach(([key, entry]) => {
                const entryDiv = document.createElement("div");
                entryDiv.textContent = `Datum: ${entry.timestamp}, Belopp: ${entry.redeemedAmount} kr`;
                historyList.appendChild(entryDiv);
            });
        } else {
            historyList.innerHTML = "<p>Ingen historik hittades.</p>";
        }
    }).catch(error => {
        console.error("Error fetching history:", error);
        historyList.innerHTML = "<p>Kunde inte hämta historik.</p>";
    });
} else {
    alert("Inget serienummer angivet!");
    window.location.href = "presentkort.html";
}

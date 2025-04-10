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

// Fetch and display all presentkort
const fetchAllCards = async () => {
    const cardsRef = ref(db, "presentkort");
    const cardTableBody = document.getElementById("cardTableBody");

    try {
        const snapshot = await get(cardsRef);
        if (snapshot.exists()) {
            const cards = snapshot.val();
            cardTableBody.innerHTML = ""; // Clear placeholder row

            Object.entries(cards).forEach(([serialNumber, cardData]) => {
                const activationDate = new Date(cardData.date).toLocaleDateString();
                const expirationDate = new Date(cardData.expirationDate).toLocaleDateString();

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${serialNumber}</td>
                    <td>${cardData.value}</td>
                    <td>${activationDate}</td>
                    <td>${expirationDate}</td>
                    <td>${cardData.seller}</td>
                `;
                cardTableBody.appendChild(row);
            });
        } else {
            cardTableBody.innerHTML = "<tr><td colspan='5' style='text-align: center;'>Inga presentkort hittades.</td></tr>";
        }
    } catch (error) {
        console.error("Error fetching cards:", error);
        cardTableBody.innerHTML = "<tr><td colspan='5' style='text-align: center;'>Kunde inte hämta presentkort.</td></tr>";
    }
};

fetchAllCards();

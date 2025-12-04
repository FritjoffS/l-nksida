import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const auth = getAuth(app);

// Get query parameters
const urlParams = new URLSearchParams(window.location.search);
const showActive = urlParams.get("showActive") === "true";
const showExpired = urlParams.get("showExpired") === "true";
const activatedFrom = urlParams.get("activatedFrom");
const activatedTo = urlParams.get("activatedTo");

// DOM elements
const cardTableBody = document.getElementById("cardTableBody");

// Fetch and display presentkort based on filters
const fetchFilteredCards = async () => {
    const cardsRef = ref(db, "presentkort");
    try {
        const snapshot = await get(cardsRef);
        if (snapshot.exists()) {
            const cards = snapshot.val();
            cardTableBody.innerHTML = ""; // Clear placeholder row

            Object.entries(cards).forEach(([serialNumber, cardData]) => {
                const activationDate = new Date(cardData.date);
                const expirationDate = new Date(cardData.expirationDate);
                const isActive = expirationDate > new Date();
                const isExpired = expirationDate <= new Date();

                // Adjust activatedFrom and activatedTo to include the entire day
                const activatedFromDate = activatedFrom ? new Date(activatedFrom) : null;
                if (activatedFromDate) activatedFromDate.setHours(0, 0, 0, 0);

                const activatedToDate = activatedTo ? new Date(activatedTo) : null;
                if (activatedToDate) activatedToDate.setHours(23, 59, 59, 999);

                // Check if the card matches the activated date range
                const isWithinDateRange =
                    (!activatedFromDate || activationDate >= activatedFromDate) &&
                    (!activatedToDate || activationDate <= activatedToDate);

                // Apply filters
                if (
                    isWithinDateRange &&
                    ((showActive && isActive) || (showExpired && isExpired) || (showActive && showExpired))
                ) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${serialNumber}</td>
                        <td>${cardData.value}</td>
                        <td>${cardData.addedValue}</td>
                        <td>${activationDate.toLocaleDateString()}</td>
                        <td>${expirationDate.toLocaleDateString()}</td>
                        <td>${cardData.seller}</td>
                    `;
                    cardTableBody.appendChild(row);
                }
            });

            // If no cards match the filters
            if (cardTableBody.children.length === 0) {
                cardTableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Inga presentkort matchar filtren.</td></tr>";
            }
        } else {
            cardTableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Inga presentkort hittades.</td></tr>";
        }
    } catch (error) {
        console.error("Error fetching cards:", error);
        cardTableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Kunde inte hämta presentkort. Kontrollera att du är inloggad.</td></tr>";
    }
};

// Wait for authentication before fetching data
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User authenticated, fetching cards...");
        fetchFilteredCards();
    } else {
        console.log("No user authenticated");
        window.location.href = "../index/login.html";
    }
});

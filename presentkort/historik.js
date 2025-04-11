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

// Get query parameters
const urlParams = new URLSearchParams(window.location.search);
const activatedFrom = urlParams.get("activatedFrom");
const activatedTo = urlParams.get("activatedTo");
const showActive = urlParams.get("showActive") === "true";
const showExpired = urlParams.get("showExpired") === "true";

// DOM elements
const historyList = document.getElementById("historyList");

// Fetch and display presentkort based on filters
const fetchFilteredCards = async () => {
    const cardsRef = ref(db, "presentkort");
    try {
        const snapshot = await get(cardsRef);
        if (snapshot.exists()) {
            const cards = snapshot.val();
            historyList.innerHTML = "<h2>Presentkort Historik</h2>";

            Object.entries(cards).forEach(([serialNumber, cardData]) => {
                const activationDate = new Date(cardData.date);
                const expirationDate = new Date(cardData.expirationDate);

                // Adjust activatedFrom and activatedTo to include the entire day
                const activatedFromDate = activatedFrom ? new Date(activatedFrom) : null;
                if (activatedFromDate) activatedFromDate.setHours(0, 0, 0, 0);

                const activatedToDate = activatedTo ? new Date(activatedTo) : null;
                if (activatedToDate) activatedToDate.setHours(23, 59, 59, 999);

                // Check if the card matches the activated date range
                const isWithinDateRange =
                    (!activatedFromDate || activationDate >= activatedFromDate) &&
                    (!activatedToDate || activationDate <= activatedToDate);

                // Determine if the card is active or expired
                const isActive = expirationDate > new Date();
                const isExpired = expirationDate <= new Date();

                // Apply filters
                if (
                    isWithinDateRange &&
                    ((showActive && isActive) || (showExpired && isExpired) || (showActive && showExpired))
                ) {
                    const cardDiv = document.createElement("div");
                    cardDiv.textContent = `Serienummer: ${serialNumber}, Saldo: ${cardData.value} kr, Aktiveringsdatum: ${activationDate.toLocaleDateString()}, Utgångsdatum: ${expirationDate.toLocaleDateString()}`;
                    historyList.appendChild(cardDiv);
                }
            });

            // If no cards match the filters
            if (historyList.children.length === 1) {
                historyList.innerHTML += "<p>Inga presentkort matchar filtren.</p>";
            }
        } else {
            historyList.innerHTML = "<p>Inga presentkort hittades.</p>";
        }
    } catch (error) {
        console.error("Error fetching cards:", error);
        historyList.innerHTML = "<p>Kunde inte hämta presentkort.</p>";
    }
};

fetchFilteredCards();

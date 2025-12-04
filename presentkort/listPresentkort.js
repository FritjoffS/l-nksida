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
                    // Get original value from history or use current value as fallback
                    let originalValue = cardData.value;
                    if (cardData.history) {
                        const historyArray = Object.values(cardData.history);
                        const activationEntry = historyArray.find(entry => entry.type === 'activation');
                        if (activationEntry && activationEntry.amount) {
                            originalValue = activationEntry.amount;
                        }
                    }
                    
                    const row = document.createElement("tr");
                    row.style.cursor = "pointer";
                    row.innerHTML = `
                        <td>${serialNumber}</td>
                        <td>${cardData.value}</td>
                        <td>${originalValue}</td>
                        <td>${activationDate.toLocaleDateString()}</td>
                        <td>${expirationDate.toLocaleDateString()}</td>
                        <td>${cardData.seller}</td>
                    `;
                    
                    // Add click event to show details
                    row.addEventListener("click", () => showCardDetails(serialNumber, cardData));
                    
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

// Function to show card details in modal
function showCardDetails(serialNumber, cardData) {
    let historyHTML = `<h3>Presentkort: ${serialNumber}</h3>`;
    historyHTML += `<p><strong>Aktuellt saldo:</strong> ${cardData.value} kr</p>`;
    historyHTML += `<p><strong>Aktiverat:</strong> ${new Date(cardData.date).toLocaleString('sv-SE')}</p>`;
    historyHTML += `<p><strong>Utgår:</strong> ${new Date(cardData.expirationDate).toLocaleDateString('sv-SE')}</p>`;
    historyHTML += `<p><strong>Säljare:</strong> ${cardData.seller || 'Okänd'}</p>`;
    historyHTML += `<hr style="margin: 15px 0;">`;
    historyHTML += `<h4>Transaktionshistorik:</h4>`;
    
    if (cardData.history) {
        const historyArray = Object.entries(cardData.history).map(([key, value]) => ({
            ...value,
            key
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        historyHTML += `<div style="max-height: 300px; overflow-y: auto;">`;
        historyArray.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString('sv-SE');
            const type = entry.type === 'activation' ? '🎉 Aktivering' : 
                        entry.type === 'redeem' ? '💵 Inlösen' : 
                        entry.type === 'reload' ? '🔄 Påfyllning' : '📝 Transaktion';
            const amount = entry.amount > 0 ? `+${entry.amount}` : entry.amount;
            const user = entry.seller || entry.user || 'System';
            
            historyHTML += `
                <div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; border-left: 3px solid ${entry.amount > 0 ? '#28a745' : '#dc3545'};">
                    <div><strong>${type}</strong> - ${date}</div>
                    <div>Belopp: <strong>${amount} kr</strong></div>
                    <div>Användare: ${user}</div>
                </div>
            `;
        });
        historyHTML += `</div>`;
    } else {
        historyHTML += `<p>Ingen transaktionshistorik hittades.</p>`;
    }
    
    document.getElementById("cardDetailsContent").innerHTML = historyHTML;
    document.getElementById("cardDetailsModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
}

// Close modal when clicking close button
document.getElementById("closeCardDetails").addEventListener("click", () => {
    document.getElementById("cardDetailsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
});

// Close modal when clicking overlay
document.getElementById("modalOverlay").addEventListener("click", () => {
    document.getElementById("cardDetailsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
});

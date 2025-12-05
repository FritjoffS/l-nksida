import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, remove, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

// Logout function (accessible from navbar)
window.logout = () => {
    auth.signOut().then(() => {
        window.location.href = "../index/login.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
};

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
                // Skip config node
                if (serialNumber === 'config') {
                    return;
                }
                
                // Skip if cardData doesn't have required fields
                if (!cardData.date || !cardData.expirationDate) {
                    return;
                }
                
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
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    
    document.getElementById("cardDetailsModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
    
    // Store current card data for editing
    window.currentEditCard = { serialNumber, cardData };
}

// Edit card functionality
let currentHistoryData = {};
let currentEditingHistoryKey = null;

document.getElementById("editCard").addEventListener("click", () => {
    const { serialNumber, cardData } = window.currentEditCard;
    
    // Hide details modal, show edit modal
    document.getElementById("cardDetailsModal").style.display = "none";
    document.getElementById("editCardModal").style.display = "block";
    
    // Populate edit form
    document.getElementById("editSerialNumber").textContent = serialNumber;
    document.getElementById("editCurrentValue").value = cardData.value;
    document.getElementById("editExpirationDate").value = new Date(cardData.expirationDate).toISOString().split('T')[0];
    document.getElementById("editSeller").value = cardData.seller || '';
    
    // Store history data
    currentHistoryData = cardData.history ? JSON.parse(JSON.stringify(cardData.history)) : {};
    
    // Render history for editing
    renderEditHistory();
});

function renderEditHistory() {
    const historyContainer = document.getElementById("editHistoryContent");
    historyContainer.innerHTML = "";
    
    if (Object.keys(currentHistoryData).length === 0) {
        historyContainer.innerHTML = "<p>Ingen historik</p>";
        // Set value to 0 if no history
        document.getElementById("editCurrentValue").value = 0;
        return;
    }
    
    const historyArray = Object.entries(currentHistoryData).map(([key, value]) => ({
        ...value,
        key
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Calculate current value from history
    let calculatedValue = 0;
    historyArray.forEach(entry => {
        calculatedValue += entry.amount;
    });
    
    // Update the current value field
    document.getElementById("editCurrentValue").value = calculatedValue;
    
    historyArray.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleString('sv-SE');
        const type = entry.type === 'activation' ? 'Aktivering' : 
                    entry.type === 'redeem' ? 'Inlösen' : 
                    entry.type === 'reload' ? 'Påfyllning' : 'Transaktion';
        const amount = entry.amount > 0 ? `+${entry.amount}` : entry.amount;
        const user = entry.seller || entry.user || 'System';
        
        const entryDiv = document.createElement('div');
        entryDiv.style.cssText = `padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; border-left: 3px solid ${entry.amount > 0 ? '#28a745' : '#dc3545'}; cursor: pointer; transition: background 0.2s;`;
        entryDiv.innerHTML = `
            <div>
                <div><strong>${type}</strong> - ${date}</div>
                <div>Belopp: <strong>${amount} kr</strong></div>
                <div>Användare: ${user}</div>
            </div>
        `;
        
        // Add hover effect
        entryDiv.addEventListener('mouseenter', () => {
            entryDiv.style.background = '#e9ecef';
        });
        entryDiv.addEventListener('mouseleave', () => {
            entryDiv.style.background = '#f8f9fa';
        });
        
        // Add click event to edit
        entryDiv.addEventListener('click', () => {
            openEditHistoryModal(entry.key, entry);
        });
        
        historyContainer.appendChild(entryDiv);
    });
}

function openEditHistoryModal(key, entry) {
    currentEditingHistoryKey = key;
    
    document.getElementById("editHistoryTitle").textContent = "Redigera händelse";
    document.getElementById("historyType").value = entry.type;
    document.getElementById("historyAmount").value = entry.amount;
    
    // Convert ISO timestamp to local datetime format
    const date = new Date(entry.timestamp);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("historyTimestamp").value = localDateTime;
    
    document.getElementById("historySeller").value = entry.seller || entry.user || '';
    
    // Show delete button for existing entries
    document.getElementById("deleteHistoryEntry").style.display = "block";
    
    document.getElementById("editHistoryModal").style.display = "block";
}

// Save history entry (both new and edited)
document.getElementById("saveHistoryEntry").addEventListener("click", () => {
    const type = document.getElementById("historyType").value;
    const amount = parseFloat(document.getElementById("historyAmount").value);
    const timestamp = document.getElementById("historyTimestamp").value;
    const seller = document.getElementById("historySeller").value.trim();
    
    if (isNaN(amount) || !timestamp || !seller) {
        return alert("Fyll i alla fält!");
    }
    
    // Convert local datetime to ISO string
    const isoTimestamp = new Date(timestamp).toISOString();
    
    // Update existing or create new
    if (currentEditingHistoryKey) {
        currentHistoryData[currentEditingHistoryKey] = {
            type,
            amount,
            timestamp: isoTimestamp,
            seller
        };
    } else {
        // Generate a unique key for new entry
        const newKey = `manual_${Date.now()}`;
        currentHistoryData[newKey] = {
            type,
            amount,
            timestamp: isoTimestamp,
            seller
        };
    }
    
    document.getElementById("editHistoryModal").style.display = "none";
    currentEditingHistoryKey = null;
    renderEditHistory();
});

// Delete history entry
document.getElementById("deleteHistoryEntry").addEventListener("click", () => {
    if (!currentEditingHistoryKey) return;
    
    if (confirm('Vill du ta bort denna händelse?')) {
        delete currentHistoryData[currentEditingHistoryKey];
        document.getElementById("editHistoryModal").style.display = "none";
        currentEditingHistoryKey = null;
        renderEditHistory();
    }
});

document.getElementById("cancelHistoryEntry").addEventListener("click", () => {
    document.getElementById("editHistoryModal").style.display = "none";
    currentEditingHistoryKey = null;
});

// Save card edits
document.getElementById("saveCardEdits").addEventListener("click", async () => {
    const { serialNumber } = window.currentEditCard;
    const calculatedValue = parseFloat(document.getElementById("editCurrentValue").value);
    const newExpirationDate = document.getElementById("editExpirationDate").value;
    const newSeller = document.getElementById("editSeller").value.trim();
    
    if (isNaN(calculatedValue) || !newExpirationDate || !newSeller) {
        return alert("Fyll i alla fält korrekt!");
    }
    
    try {
        document.getElementById("saveCardEdits").disabled = true;
        document.getElementById("saveCardEdits").textContent = "Sparar...";
        
        const cardRef = ref(db, `presentkort/${serialNumber}`);
        
        // Find activation date from history
        let activationDate = window.currentEditCard.cardData.date; // Default to original
        if (currentHistoryData) {
            const historyArray = Object.values(currentHistoryData);
            const activationEntry = historyArray.find(entry => entry.type === 'activation');
            if (activationEntry && activationEntry.timestamp) {
                activationDate = activationEntry.timestamp;
            }
        }
        
        // Build complete card data with history
        const updatedCard = {
            value: calculatedValue,
            seller: newSeller,
            date: activationDate, // Use activation date from history
            expirationDate: new Date(newExpirationDate).toISOString(),
            history: currentHistoryData
        };
        
        // Set entire card at once - this will overwrite all data
        await set(cardRef, updatedCard);
        
        alert("Presentkort uppdaterat!");
        
        // Close modals and refresh
        document.getElementById("editCardModal").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
        
        // Refresh the list
        location.reload();
        
    } catch (error) {
        console.error("Error saving edits:", error);
        alert("Ett fel uppstod vid sparande: " + error.message);
    } finally {
        document.getElementById("saveCardEdits").disabled = false;
        document.getElementById("saveCardEdits").textContent = "Spara";
    }
});

document.getElementById("cancelCardEdits").addEventListener("click", () => {
    document.getElementById("editCardModal").style.display = "none";
    document.getElementById("cardDetailsModal").style.display = "block";
});

// Close modal when clicking close button
document.getElementById("closeCardDetails").addEventListener("click", () => {
    document.getElementById("cardDetailsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
    document.body.style.overflow = "auto";
});

// Close modal when clicking overlay
document.getElementById("modalOverlay").addEventListener("click", () => {
    document.getElementById("cardDetailsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("editCardModal").style.display = "none";
    document.getElementById("editHistoryModal").style.display = "none";
    document.body.style.overflow = "auto";
    currentEditingHistoryKey = null;
});

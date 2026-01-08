// Denna fil hanterar visning och redigering av presentkort, inklusive filtrering, sortering, visning av detaljer, redigering av historik och export till Excel.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, remove, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { logAction } from "./logger.js";

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
const redeemedFrom = urlParams.get("redeemedFrom");
const redeemedTo = urlParams.get("redeemedTo");

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

            // Create array of cards with their data for sorting
            const cardArray = [];
            
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

                // Get latest redeem date from history for filtering
                let latestRedeemDate = null;
                if (cardData.history) {
                    const historyArray = Object.values(cardData.history);
                    const redeemEntries = historyArray.filter(entry => entry.type === 'redeem');
                    if (redeemEntries.length > 0) {
                        const latestRedeem = redeemEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                        latestRedeemDate = new Date(latestRedeem.timestamp);
                    }
                }

                // Adjust redeemedFrom and redeemedTo to include the entire day
                const redeemedFromDate = redeemedFrom ? new Date(redeemedFrom) : null;
                if (redeemedFromDate) redeemedFromDate.setHours(0, 0, 0, 0);

                const redeemedToDate = redeemedTo ? new Date(redeemedTo) : null;
                if (redeemedToDate) redeemedToDate.setHours(23, 59, 59, 999);

                // Check if the card matches the redeemed date range
                const isWithinRedeemedRange =
                    (!redeemedFromDate || (latestRedeemDate && latestRedeemDate >= redeemedFromDate)) &&
                    (!redeemedToDate || (latestRedeemDate && latestRedeemDate <= redeemedToDate));

                // If redeemedFrom or redeemedTo is specified, only show cards with redemption history
                const matchesRedeemFilter = (!redeemedFromDate && !redeemedToDate) || (latestRedeemDate && isWithinRedeemedRange);

                // Apply filters
                if (
                    isWithinDateRange &&
                    matchesRedeemFilter &&
                    ((showActive && isActive) || (showExpired && isExpired) || (showActive && showExpired))
                ) {
                    cardArray.push({
                        serialNumber,
                        cardData,
                        activationDate,
                        expirationDate
                    });
                }
            });
            
            // Sort by serial number numerically
            cardArray.sort((a, b) => {
                const numA = parseInt(a.serialNumber.replace(/^0+/, '') || '0');
                const numB = parseInt(b.serialNumber.replace(/^0+/, '') || '0');
                return numA - numB;
            });
            
            // Now render the sorted cards
            cardArray.forEach(({ serialNumber, cardData, activationDate, expirationDate }) => {
                    // Get original value from history or use current value as fallback
                    let originalValue = cardData.value;
                    let redeemedDate = '-';
                    if (cardData.history) {
                        const historyArray = Object.values(cardData.history);
                        const activationEntry = historyArray.find(entry => entry.type === 'activation');
                        if (activationEntry && activationEntry.amount) {
                            originalValue = activationEntry.amount;
                        }
                        
                        // Find last redeem date
                        const redeemEntries = historyArray.filter(entry => entry.type === 'redeem');
                        if (redeemEntries.length > 0) {
                            // Sort by timestamp descending and get the latest
                            const latestRedeem = redeemEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                            redeemedDate = new Date(latestRedeem.timestamp).toLocaleDateString('sv-SE');
                        }
                    }
                    
                    // Remove leading zeros from serial number for display
                    const displaySerialNumber = serialNumber.replace(/^0+/, '') || '0';
                    
                    const row = document.createElement("tr");
                    row.style.cursor = "pointer";
                    row.innerHTML = `
                        <td>${displaySerialNumber}</td>
                        <td>${cardData.value}</td>
                        <td>${originalValue}</td>
                        <td>${activationDate.toLocaleDateString('sv-SE')}</td>
                        <td>${cardData.seller}</td>
                        <td>${expirationDate.toLocaleDateString('sv-SE')}</td>
                        <td>${redeemedDate}</td>
                    `;
                    
                    // Add click event to show details
                    row.addEventListener("click", () => showCardDetails(serialNumber, cardData));
                    
                    cardTableBody.appendChild(row);
            });

            // Update summary bar
            updateSummary(cardArray);

            // If no cards match the filters
            if (cardTableBody.children.length === 0) {
                cardTableBody.innerHTML = "<tr><td colspan='7' style='text-align: center;'>Inga presentkort matchar filtren.</td></tr>";
            }
        } else {
            cardTableBody.innerHTML = "<tr><td colspan='7' style='text-align: center;'>Inga presentkort hittades.</td></tr>";
        }
    } catch (error) {
        console.error("Error fetching cards:", error);
        cardTableBody.innerHTML = "<tr><td colspan='7' style='text-align: center;'>Kunde inte hämta presentkort. Kontrollera att du är inloggad.</td></tr>";
    }
};

// Function to update summary bar
function updateSummary(cardArray) {
    const now = new Date();
    const totalCount = cardArray.length;
    let activeCount = 0;
    let activeValue = 0;
    let expiredCount = 0;
    let expiredValue = 0;
    let redeemedCount = 0;
    let redeemedValue = 0;
    
    cardArray.forEach(({ cardData, expirationDate }) => {
        const value = cardData.value || 0;
        
        // Check if card has been redeemed (has redeem entries in history)
        let hasBeenRedeemed = false;
        if (cardData.history) {
            const historyArray = Object.values(cardData.history);
            const redeemEntries = historyArray.filter(entry => entry.type === 'redeem');
            if (redeemEntries.length > 0) {
                hasBeenRedeemed = true;
                // Calculate how much has been redeemed (sum of all redeem amounts - they are negative)
                const totalRedeemed = redeemEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
                redeemedValue += totalRedeemed;
            }
        }
        
        if (hasBeenRedeemed) {
            redeemedCount++;
        }
        
        // Check if active or expired based on expiration date
        const isExpired = expirationDate <= now;
        
        if (isExpired) {
            expiredCount++;
            expiredValue += value;
        } else {
            // Active: not expired (regardless of redemption status)
            activeCount++;
            activeValue += value;
        }
    });
    
    document.getElementById("totalCount").textContent = totalCount;
    document.getElementById("activeCount").textContent = activeCount;
    document.getElementById("activeValue").textContent = activeValue;
    document.getElementById("expiredCount").textContent = expiredCount;
    document.getElementById("expiredValue").textContent = expiredValue;
    document.getElementById("redeemedCount").textContent = redeemedCount;
    document.getElementById("redeemedValue").textContent = redeemedValue;
}

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
    const displaySerialNumber = serialNumber.replace(/^0+/, '') || '0';
    let historyHTML = `<h3>Presentkort: ${displaySerialNumber}</h3>`;
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
    const displaySerialNumber = serialNumber.replace(/^0+/, '') || '0';
    document.getElementById("editSerialNumber").value = displaySerialNumber;
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
    const { serialNumber: oldSerialNumber } = window.currentEditCard;
    const newSerialNumber = document.getElementById("editSerialNumber").value.trim();
    const calculatedValue = parseFloat(document.getElementById("editCurrentValue").value);
    const newExpirationDate = document.getElementById("editExpirationDate").value;
    const newSeller = document.getElementById("editSeller").value.trim();
    
    if (!newSerialNumber || isNaN(calculatedValue) || !newExpirationDate || !newSeller) {
        return alert("Fyll i alla fält korrekt!");
    }
    
    // Remove leading zeros from new serial number
    const cleanedNewSerialNumber = newSerialNumber.replace(/^0+/, '') || '0';
    
    if (cleanedNewSerialNumber === '0') {
        return alert("Ogiltigt serienummer!");
    }
    
    try {
        document.getElementById("saveCardEdits").disabled = true;
        document.getElementById("saveCardEdits").textContent = "Sparar...";
        
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
        
        // Check if serial number has changed
        if (cleanedNewSerialNumber !== oldSerialNumber) {
            // Check if new serial number already exists
            const newCardRef = ref(db, `presentkort/${cleanedNewSerialNumber}`);
            const newCardSnapshot = await get(newCardRef);
            
            if (newCardSnapshot.exists()) {
                const confirmOverwrite = confirm(`Presentkort ${cleanedNewSerialNumber} finns redan! Vill du skriva över det?`);
                if (!confirmOverwrite) {
                    return;
                }
            }
            
            // Create card with new serial number
            await set(newCardRef, updatedCard);
            
            // Delete old card
            const oldCardRef = ref(db, `presentkort/${oldSerialNumber}`);
            await remove(oldCardRef);
            
            // Log the serial number change
            await logAction(db, 'edit', cleanedNewSerialNumber, {
                previousSerialNumber: oldSerialNumber,
                value: calculatedValue,
                seller: newSeller
            }, {
                serialNumber: { old: oldSerialNumber, new: cleanedNewSerialNumber }
            });
            
            alert(`Presentkort uppdaterat! Serienummer ändrat från ${oldSerialNumber} till ${cleanedNewSerialNumber}`);
        } else {
            // Same serial number, just update
            const cardRef = ref(db, `presentkort/${oldSerialNumber}`);
            
            // Track changes
            const changes = {};
            const oldData = window.currentEditCard.cardData;
            if (oldData.value !== calculatedValue) {
                changes.value = { old: oldData.value, new: calculatedValue };
            }
            if (oldData.seller !== newSeller) {
                changes.seller = { old: oldData.seller, new: newSeller };
            }
            if (oldData.expirationDate !== new Date(newExpirationDate).toISOString()) {
                changes.expirationDate = { old: new Date(oldData.expirationDate).toLocaleDateString('sv-SE'), new: newExpirationDate };
            }
            
            await set(cardRef, updatedCard);
            
            // Log the edit if there were changes
            if (Object.keys(changes).length > 0) {
                await logAction(db, 'edit', oldSerialNumber, {
                    value: calculatedValue,
                    seller: newSeller
                }, changes);
            }
            
            alert("Presentkort uppdaterat!");
        }
        
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

// Delete card
document.getElementById("deleteCard").addEventListener("click", async () => {
    const { serialNumber } = window.currentEditCard;
    const displaySerialNumber = serialNumber.replace(/^0+/, '') || '0';
    
    const confirmDelete = confirm(`Är du säker på att du vill ta bort presentkort ${displaySerialNumber}?\n\nDetta går INTE att ångra!`);
    
    if (!confirmDelete) return;
    
    try {
        document.getElementById("deleteCard").disabled = true;
        document.getElementById("deleteCard").textContent = "Tar bort...";
        
        const cardData = window.currentEditCard.cardData;
        const cardRef = ref(db, `presentkort/${serialNumber}`);
        
        // Log the deletion before removing
        await logAction(db, 'delete', serialNumber, {
            value: cardData.value,
            seller: cardData.seller,
            originalValue: cardData.value
        });
        
        await remove(cardRef);
        
        alert(`Presentkort ${displaySerialNumber} har tagits bort!`);
        
        // Close modals and refresh
        document.getElementById("editCardModal").style.display = "none";
        document.getElementById("modalOverlay").style.display = "none";
        document.body.style.overflow = "auto";
        
        // Refresh the list
        location.reload();
        
    } catch (error) {
        console.error("Error deleting card:", error);
        alert("Ett fel uppstod vid borttagning: " + error.message);
        document.getElementById("deleteCard").disabled = false;
        document.getElementById("deleteCard").textContent = "Ta bort presentkort";
    }
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

// Export to Excel functionality
document.getElementById("exportExcel").addEventListener("click", () => {
    // Get all rows from the table
    const rows = document.querySelectorAll("#cardTableBody tr");
    
    if (rows.length === 0 || (rows.length === 1 && rows[0].cells.length === 1)) {
        return alert("Ingen data att exportera!");
    }
    
    // Prepare data array
    const data = [];
    
    // Add header row
    data.push([
        "Serie nummer",
        "Saldo (kr)",
        "Ursprungligt värde",
        "Försäljnings datum",
        "Säljare",
        "Utgångs datum",
        "Inlöst datum"
    ]);
    
    // Add data rows
    rows.forEach(row => {
        if (row.cells.length === 7) { // Only process valid data rows
            const rowData = [];
            for (let i = 0; i < row.cells.length; i++) {
                rowData.push(row.cells[i].textContent.trim());
            }
            data.push(rowData);
        }
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, // Serie nummer
        { wch: 12 }, // Saldo
        { wch: 18 }, // Ursprungligt värde
        { wch: 20 }, // Försäljnings datum
        { wch: 15 }, // Säljare
        { wch: 18 }, // Utgångs datum
        { wch: 18 }  // Inlöst datum
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Presentkort");
    
    // Generate filename with current date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `presentkort_${dateStr}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
});

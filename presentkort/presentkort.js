// Denna fil hanterar all funktionalitet för presentkortshantering, inklusive kontroll, inlösen, aktivering, utskrift och import av presentkort.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, update, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { logAction } from "./logger.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index/login.html";
    } else {
        // Show import button only for fredrik@jarnhandel.com
        const importButton = document.getElementById("importCards");
        if (importButton && user.email === "fredrik@jarnhandel.com") {
            importButton.style.display = "block";
        }
        // Update user display
        const currentUserSpan = document.getElementById("currentUser");
        if (currentUserSpan) {
            currentUserSpan.textContent = user.email;
        }
    }
});

// Logout function (accessible from navbar)
window.logout = () => {
    auth.signOut().then(() => {
        window.location.href = "../index/login.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
};

// ==========================================
// TAB NAVIGATION
// ==========================================

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ==========================================
// MODAL MANAGEMENT
// ==========================================

// Helper function to open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

// Helper function to close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        e.target.style.display = 'none';
    }
});

// ==========================================
// QUICK ACTIONS
// ==========================================

// Quick Sell Card
document.getElementById('quickSellCard')?.addEventListener('click', () => {
    openModal('activateModal');
    document.getElementById('activateSerialNumber')?.focus();
});

// Quick Redeem Card
document.getElementById('quickRedeemCard')?.addEventListener('click', () => {
    openModal('redeemModal');
    document.getElementById('redeemSerialNumber')?.focus();
});

// Quick Stats
document.getElementById('quickStats')?.addEventListener('click', async () => {
    // Switch to list tab and show all cards
    document.querySelector('[data-tab="list"]')?.click();
    setTimeout(() => {
        document.getElementById('listCards')?.click();
    }, 100);
});

// Close modal buttons
document.getElementById('closeActivateModal')?.addEventListener('click', () => closeModal('activateModal'));
document.getElementById('closeRedeemModal')?.addEventListener('click', () => closeModal('redeemModal'));
document.getElementById('closeHistory')?.addEventListener('click', () => closeModal('historyModal'));
document.getElementById('closeFilterModal')?.addEventListener('click', () => closeModal('filterModal'));
document.getElementById('cancelPrint')?.addEventListener('click', () => closeModal('printModal'));
document.getElementById('cancelImport')?.addEventListener('click', () => closeModal('importModal'));
document.getElementById('cancelReauth')?.addEventListener('click', () => closeModal('reauthModal'));

// DOM elements - Updated for new modal structure
const checkCardButton = document.getElementById("checkCard");
const cardInfoDiv = document.getElementById("cardInfo");
const cardValueParagraph = document.getElementById("cardValue");
const redeemAmountInput = document.getElementById("redeemAmount");
const redeemCardButton = document.getElementById("redeemCard");
const cardValueInput = document.getElementById("cardValueInput");
const sellerNameInput = document.getElementById("sellerName");
const activateCardButton = document.getElementById("activateCardButton");
const viewHistoryButton = document.getElementById("viewHistory");
const listCardsButton = document.getElementById("listCards");
const applyFiltersButton = document.getElementById("applyFilters");

// Button mappings for new UI
document.getElementById('searchCard')?.addEventListener('click', () => {
    const serialNumber = document.getElementById('searchSerialNumber')?.value.trim();
    if (serialNumber) {
        document.getElementById('redeemSerialNumber').value = serialNumber;
        openModal('redeemModal');
        checkCardButton.click();
    } else {
        alert('Ange ett serienummer!');
    }
});

document.getElementById('showFilters')?.addEventListener('click', () => {
    openModal('filterModal');
});

document.getElementById('refreshList')?.addEventListener('click', () => {
    if (listCardsButton) listCardsButton.click();
});

// New elements for printing
const printCardsButton = document.getElementById("printCards");
const printQuantityInput = document.getElementById("printQuantity");
const nextPrintNumberSpan = document.getElementById("nextPrintNumber");
const generatePDFButton = document.getElementById("generatePDF");

// New elements for import
const importCardsButton = document.getElementById("importCards");
const excelFileInput = document.getElementById("excelFile");
const startImportButton = document.getElementById("startImport");
const cancelImportButton = document.getElementById("cancelImport");
const importProgressDiv = document.getElementById("importProgress");
const importStatusSpan = document.getElementById("importStatus");
const importProgressBar = document.getElementById("importProgressBar");

// Re-authentication elements for print protection
const reauthPasswordInput = document.getElementById("reauthPassword");
const confirmReauthButton = document.getElementById("confirmReauth");
const reauthErrorP = document.getElementById("reauthError");

// Check card
checkCardButton.addEventListener("click", async () => {
    try {
        const serialNumber = document.getElementById('redeemSerialNumber')?.value.trim();
        if (!serialNumber) return alert("Ange ett serienummer!");

        checkCardButton.disabled = true;
        checkCardButton.textContent = "Hämtar...";

        const cardRef = ref(db, `presentkort/${serialNumber}`);
        const snapshot = await get(cardRef);

        if (snapshot.exists()) {
            const cardData = snapshot.val();
            const expirationDate = new Date(cardData.expirationDate);
            const formattedExpirationDate = `${expirationDate.getFullYear()}-${String(expirationDate.getMonth() + 1).padStart(2, '0')}-${String(expirationDate.getDate()).padStart(2, '0')}`;

            cardValueParagraph.innerHTML = `<strong>Aktuellt Saldo:</strong> ${cardData.value} kr<br><strong>Utgångsdatum:</strong> ${formattedExpirationDate}`;
            cardInfoDiv.style.display = "block";
            redeemCardButton.style.display = "inline-block";
            viewHistoryButton.style.display = "inline-block";
        } else {
            alert("Presentkortet ej aktiverat!");
            cardInfoDiv.style.display = "none";
            redeemCardButton.style.display = "none";
            viewHistoryButton.style.display = "none";
        }
    } catch (error) {
        console.error("Error fetching card:", error);
        alert("Ett fel uppstod vid hämtning av presentkort: " + error.message);
    } finally {
        checkCardButton.disabled = false;
        checkCardButton.textContent = "🔍 Kontrollera saldo";
    }
});

// Redeem card
redeemCardButton.addEventListener("click", async () => {
    try {
        const serialNumber = document.getElementById('redeemSerialNumber')?.value.trim();
        const redeemAmount = parseFloat(redeemAmountInput.value);
        const redeemSeller = document.getElementById("redeemSeller").value.trim();

        if (!serialNumber || isNaN(redeemAmount) || redeemAmount <= 0) {
            return alert("Ange giltiga värden!");
        }

        if (!redeemSeller) {
            return alert("Ange säljare!");
        }

        redeemCardButton.disabled = true;
        redeemCardButton.textContent = "Löser in...";

        const cardRef = ref(db, `presentkort/${serialNumber}`);
        const snapshot = await get(cardRef);

        if (!snapshot.exists()) {
            return alert("Presentkortet ej aktiverat!");
        }

        const cardData = snapshot.val();
        const newValue = cardData.value - redeemAmount;

        if (newValue < 0) {
            return alert("Otillräckligt saldo! Aktuellt saldo: " + cardData.value + " kr");
        }

        await update(cardRef, { value: newValue });

        // Save redeem history with consistent structure
        const historyRef = ref(db, `presentkort/${serialNumber}/history`);
        const newHistoryEntry = {
            type: "redeem",
            amount: -redeemAmount,
            timestamp: new Date().toISOString(),
            seller: redeemSeller
        };
        await push(historyRef, newHistoryEntry);

        // Log the redemption
        await logAction(db, 'redeem', serialNumber, {
            amount: redeemAmount,
            previousValue: cardData.value,
            newValue: newValue,
            userName: redeemSeller
        });

        // Track redemption in Google Analytics
        if (window.logAnalyticsEvent) {
            window.logAnalyticsEvent('gift_card_redeemed', {
                serial_number: serialNumber,
                amount: redeemAmount,
                remaining_balance: newValue,
                seller: redeemSeller
            });
        }

        alert("Beloppet har lösts in!");
        const expirationDate = new Date(cardData.expirationDate);
        const formattedExpirationDate = `${expirationDate.getFullYear()}-${String(expirationDate.getMonth() + 1).padStart(2, '0')}-${String(expirationDate.getDate()).padStart(2, '0')}`;
        cardValueParagraph.innerHTML = `<strong>Aktuellt Saldo:</strong> ${newValue} kr<br><strong>Utgångsdatum:</strong> ${formattedExpirationDate}`;
        redeemAmountInput.value = "";
        document.getElementById("redeemSeller").value = "";
    } catch (error) {
        console.error("Error redeeming card:", error);
        alert("Ett fel uppstod vid inlösen: " + error.message);
    } finally {
        redeemCardButton.disabled = false;
        redeemCardButton.textContent = "✓ Lös in";
    }
});

// Activate card
activateCardButton.addEventListener("click", async () => {
    try {
        const serialNumber = document.getElementById('activateSerialNumber')?.value.trim();
        const cardValue = parseFloat(cardValueInput.value);
        const sellerName = sellerNameInput.value.trim();

        if (!serialNumber || isNaN(cardValue) || cardValue <= 0 || !sellerName) {
            return alert("Ange giltiga värden!");
        }

        // Remove leading zeros from serial number before saving
        const cleanedSerialNumber = serialNumber.replace(/^0+/, '');

        if (!cleanedSerialNumber || cleanedSerialNumber === '0') {
            return alert("Ogiltigt serienummer! Kan inte vara endast nollor.");
        }

        activateCardButton.disabled = true;
        activateCardButton.textContent = "Aktiverar...";

        const cardRef = ref(db, `presentkort/${cleanedSerialNumber}`);

        // Check if card already exists
        const existingCard = await get(cardRef);
        if (existingCard.exists()) {
            const confirmOverwrite = confirm("Presentkort " + cleanedSerialNumber + " finns redan! Vill du skriva över det?");
            if (!confirmOverwrite) {
                return;
            }
        }

        const activationDate = new Date();
        const expirationDate = new Date(activationDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 2);

        const newCardData = {
            value: cardValue,
            seller: sellerName,
            date: activationDate.toISOString(),
            expirationDate: expirationDate.toISOString()
        };

        await set(cardRef, newCardData);

        // Save activation history with consistent structure
        const historyRef = ref(db, `presentkort/${cleanedSerialNumber}/history`);
        const activationHistoryEntry = {
            type: "activation",
            amount: cardValue,
            timestamp: activationDate.toISOString(),
            seller: sellerName
        };
        await push(historyRef, activationHistoryEntry);

        // Log the card creation
        await logAction(db, 'create', cleanedSerialNumber, {
            value: cardValue,
            seller: sellerName,
            expirationDate: expirationDate.toISOString(),
            userName: sellerName
        });

        // Track activation in Google Analytics
        if (window.logAnalyticsEvent) {
            window.logAnalyticsEvent('gift_card_activated', {
                serial_number: cleanedSerialNumber,
                value: cardValue,
                seller: sellerName
            });
        }

        alert(`Presentkort ${cleanedSerialNumber} har skapats med värde ${cardValue} kr!\nUtgångsdatum: ${expirationDate.toLocaleDateString('sv-SE')}`);

        // Clear form fields
        document.getElementById('activateSerialNumber').value = "";
        cardValueInput.value = "";
        sellerNameInput.value = "";
        closeModal('activateModal');
    } catch (error) {
        console.error("Error activating card:", error);
        alert("Ett fel uppstod vid aktivering: " + error.message);
    } finally {
        activateCardButton.disabled = false;
        activateCardButton.textContent = "✓ Aktivera Presentkort";
    }
});

// View history
viewHistoryButton.addEventListener("click", async () => {
    const serialNumber = document.getElementById('redeemSerialNumber')?.value.trim();
    if (!serialNumber) return alert("Ange ett serienummer!");

    try {
        viewHistoryButton.disabled = true;
        viewHistoryButton.textContent = "Hämtar...";

        const cardRef = ref(db, `presentkort/${serialNumber}`);
        const snapshot = await get(cardRef);

        if (!snapshot.exists()) {
            return alert("Presentkortet ej aktiverat!");
        }

        const cardData = snapshot.val();
        const historyRef = ref(db, `presentkort/${serialNumber}/history`);
        const historySnapshot = await get(historyRef);

        let historyHTML = `<h3>Presentkort: ${serialNumber}</h3>`;
        historyHTML += `<p><strong>Aktuellt saldo:</strong> ${cardData.value} kr</p>`;
        historyHTML += `<p><strong>Aktiverat:</strong> ${new Date(cardData.date).toLocaleString('sv-SE')}</p>`;
        historyHTML += `<p><strong>Utgår:</strong> ${new Date(cardData.expirationDate).toLocaleDateString('sv-SE')}</p>`;
        historyHTML += `<p><strong>Säljare:</strong> ${cardData.seller || 'Okänd'}</p>`;
        historyHTML += `<hr style="margin: 15px 0;">`;
        historyHTML += `<h4>Transaktionshistorik:</h4>`;

        if (historySnapshot.exists()) {
            const history = historySnapshot.val();
            const historyArray = Object.entries(history).map(([key, value]) => ({
                ...value,
                key
            })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            historyHTML += `<div style="max-height: 300px; overflow-y: auto;">`;
            historyArray.forEach(entry => {
                const date = new Date(entry.timestamp).toLocaleString('sv-SE');
                const type = entry.type === 'activation' ? 'Aktivering' :
                    entry.type === 'redeem' ? 'Inlösen' :
                        entry.type === 'reload' ? 'Påladdning' : 'Transaktion';
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

        document.getElementById("historyContent").innerHTML = historyHTML;
        openModal('historyModal');

    } catch (error) {
        console.error("Error fetching history:", error);
        alert("Ett fel uppstod vid hämtning av historik: " + error.message);
    } finally {
        viewHistoryButton.disabled = false;
        viewHistoryButton.textContent = "📜 Visa Historik";
    }
});

// Show list of all cards (navigate to list view)
listCardsButton.addEventListener("click", () => {
    // Open the filter modal instead
    openModal('filterModal');
});

// View logs button
document.getElementById("viewLogs").addEventListener("click", () => {
    window.location.href = "logs.html";
});

// Apply filters and redirect to listPresentkort.html with query parameters
applyFiltersButton.addEventListener("click", () => {
    const showActive = document.getElementById("showActiveCards").checked;
    const showExpired = document.getElementById("showExpiredCards").checked;
    const showOnlyWithBalance = document.getElementById("showOnlyWithBalance").checked;
    const activatedFrom = document.getElementById("activatedFrom").value;
    const activatedTo = document.getElementById("activatedTo").value;
    const redeemedFrom = document.getElementById("redeemedFrom").value;
    const redeemedTo = document.getElementById("redeemedTo").value;

    // Save filter state to sessionStorage
    sessionStorage.setItem('filterModalOpen', 'true');
    sessionStorage.setItem('filterShowActive', showActive);
    sessionStorage.setItem('filterShowExpired', showExpired);
    sessionStorage.setItem('filterShowOnlyWithBalance', showOnlyWithBalance);
    sessionStorage.setItem('filterActivatedFrom', activatedFrom);
    sessionStorage.setItem('filterActivatedTo', activatedTo);
    sessionStorage.setItem('filterRedeemedFrom', redeemedFrom);
    sessionStorage.setItem('filterRedeemedTo', redeemedTo);

    // Build query parameters
    const queryParams = new URLSearchParams({
        showActive,
        showExpired,
        showOnlyWithBalance,
        activatedFrom,
        activatedTo,
        redeemedFrom,
        redeemedTo,
    });

    // Redirect to listPresentkort.html with filters applied
    window.location.href = `listPresentkort.html?${queryParams.toString()}`;
});

// ===== PDF PRINTING FUNCTIONALITY =====

// Re-authentication for print protection
async function showReauthDialog() {
    hideAllDialogs();
    reauthPasswordInput.value = "";
    reauthErrorP.style.display = "none";
    reauthDialog.style.display = "block";
    reauthPasswordInput.focus();
}

async function verifyReauth(password) {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Ingen användare inloggad");
    }
    
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return true;
}

// Show re-auth dialog when clicking print button
printCardsButton.addEventListener("click", async () => {
    openModal('reauthModal');
    reauthPasswordInput.focus();
});

// Allow Enter key to submit re-auth
reauthPasswordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        confirmReauthButton.click();
    }
});

// Confirm re-authentication and show print dialog
confirmReauthButton.addEventListener("click", async () => {
    const password = reauthPasswordInput.value;
    
    if (!password) {
        reauthErrorP.textContent = "Vänligen ange ditt lösenord";
        reauthErrorP.style.display = "block";
        return;
    }
    
    try {
        confirmReauthButton.disabled = true;
        confirmReauthButton.textContent = "Verifierar...";
        reauthErrorP.style.display = "none";
        
        await verifyReauth(password);
        
        // Log successful re-authentication for print access
        await logAction(db, "print_reauth_success", "", {
            user: auth.currentUser.email,
            timestamp: new Date().toISOString()
        });
        
        // Hide re-auth modal
        closeModal('reauthModal');
        reauthPasswordInput.value = "";
        
        // Now show the print modal
        printCardsButton.disabled = true;
        printCardsButton.textContent = "Hämtar...";

        const printNumberRef = ref(db, "presentkort/config/nextPrintNumber");
        const snapshot = await get(printNumberRef);

        let nextNumber = 2000; // Start from 2000
        if (snapshot.exists()) {
            nextNumber = snapshot.val();
        } else {
            // Initialize the counter if it doesn't exist
            await set(printNumberRef, nextNumber);
        }

        nextPrintNumberSpan.textContent = nextNumber.toString().padStart(4, "0");
        openModal('printModal');
        
    } catch (error) {
        console.error("Re-authentication failed:", error);
        
        // Log failed re-authentication attempt
        await logAction(db, "print_reauth_failed", "", {
            user: auth.currentUser?.email || "unknown",
            timestamp: new Date().toISOString(),
            error: error.code || error.message
        });
        
        if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            reauthErrorP.textContent = "Fel lösenord. Försök igen.";
        } else if (error.code === "auth/too-many-requests") {
            reauthErrorP.textContent = "För många försök. Vänta en stund och försök igen.";
        } else {
            reauthErrorP.textContent = "Autentisering misslyckades: " + error.message;
        }
        reauthErrorP.style.display = "block";
    } finally {
        confirmReauthButton.disabled = false;
        confirmReauthButton.textContent = "Bekräfta";
        printCardsButton.disabled = false;
        printCardsButton.textContent = "Skriv ut Presentkort";
    }
});

// Cancel print dialog
// Generate PDF with gift cards
generatePDFButton.addEventListener("click", async () => {
    try {
        const quantity = parseInt(printQuantityInput.value);
        if (isNaN(quantity) || quantity < 1 || quantity > 100) {
            return alert("Ange ett giltigt antal (1-100)!");
        }

        generatePDFButton.disabled = true;
        generatePDFButton.textContent = "Genererar PDF...";

        // Get current print number
        const printNumberRef = ref(db, "presentkort/config/nextPrintNumber");
        const snapshot = await get(printNumberRef);
        let startNumber = snapshot.exists() ? snapshot.val() : 2000;

        // Generate PDF
        await generateGiftCardPDF(startNumber, quantity);

        // Update the next print number
        await set(printNumberRef, startNumber + quantity);

        // Track printing in Google Analytics
        if (window.logAnalyticsEvent) {
            window.logAnalyticsEvent('gift_cards_printed', {
                quantity: quantity,
                start_number: startNumber,
                end_number: startNumber + quantity - 1
            });
        }

        alert(`${quantity} presentkort har genererats!`);
        closeModal('printModal');

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Ett fel uppstod vid generering av PDF: " + error.message);
    } finally {
        generatePDFButton.disabled = false;
        generatePDFButton.textContent = "✓ Generera PDF";
    }
});

// Function to generate PDF with gift cards
async function generateGiftCardPDF(startNumber, quantity) {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    try {
        // Load the template PDF
        const templateUrl = 'presentkort.pdf';
        const existingPdfBytes = await fetch(templateUrl).then(res => res.arrayBuffer());

        // Create a new PDF document for output
        const outputPdf = await PDFDocument.create();

        for (let i = 0; i < quantity; i++) {
            const cardNumber = (startNumber + i).toString().padStart(4, "0");

            // Load template for each card
            const templatePdf = await PDFDocument.load(existingPdfBytes);
            const font = await outputPdf.embedFont(StandardFonts.HelveticaBold);

            // Get pages from template (assuming first page is front, second is back)
            const pageCount = templatePdf.getPageCount();

            // Copy front page
            const [frontPage] = await outputPdf.copyPages(templatePdf, [0]);
            outputPdf.addPage(frontPage);

            const { width, height } = frontPage.getSize();
            const fontSize = 14;
            const text = cardNumber;
            const textWidth = font.widthOfTextAtSize(text, fontSize);

            // Add number in top right corner of front page
            // Adjusted: 5mm left = ~14.17pt, 5mm down = ~14.17pt
            // Additional: 3mm left = +8.5pt, 2mm up = +5.66pt, 1mm down = -2.83pt
            frontPage.drawText(text, {
                x: width - textWidth - 20 - 14.17 - 8.5,
                y: height - 30 - 14.17 + 5.66 - 2.83,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
            });

            // Copy back page if it exists
            if (pageCount > 1) {
                const [backPage] = await outputPdf.copyPages(templatePdf, [1]);
                outputPdf.addPage(backPage);

                // Add number in top right corner of back page
                // Adjusted: 5mm left = ~14.17pt, 5mm down = ~14.17pt
                // Additional: 3mm left = +8.5pt, 2mm up = +5.66pt, 1mm down = -2.83pt
                backPage.drawText(text, {
                    x: width - textWidth - 20 - 14.17 - 8.5,
                    y: height - 30 - 14.17 + 5.66 - 2.83,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Serialize the PDF to bytes
        const pdfBytes = await outputPdf.save();

        // Create a blob and download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `presentkort_${startNumber.toString().padStart(5, "0")}-${(startNumber + quantity - 1).toString().padStart(5, "0")}.pdf`;
        link.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error loading template:", error);
        throw new Error("Kunde inte ladda presentkortsmallen. Kontrollera att presentkort.pdf finns i mappen.");
    }
}

// Import cards functionality
importCardsButton.addEventListener("click", () => {
    openModal('importModal');
    excelFileInput.value = "";
    importProgressDiv.style.display = "none";
});

startImportButton.addEventListener("click", async () => {
    const file = excelFileInput.files[0];
    if (!file) {
        return alert("Välj en Excel-fil först!");
    }

    try {
        startImportButton.disabled = true;
        cancelImportButton.disabled = true;
        importProgressDiv.style.display = "block";

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Try to read with headers first
        let jsonData = XLSX.utils.sheet_to_json(worksheet);

        // If no data or first row looks like it might be data (all numbers), read without headers
        if (jsonData.length === 0 || !jsonData[0].hasOwnProperty('Serienummer')) {
            // Read as array without headers
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Skip first row if it looks like headers (contains text)
            const firstRow = jsonData[0];
            if (firstRow && typeof firstRow[0] === 'string' && isNaN(firstRow[0])) {
                jsonData.shift();
            }
        }

        if (jsonData.length === 0) {
            throw new Error("Excel-filen är tom!");
        }

        let successCount = 0;
        let errorCount = 0;
        const total = jsonData.length;

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Update progress
            importStatusSpan.textContent = `${i + 1}/${total}`;
            importProgressBar.style.width = `${((i + 1) / total) * 100}%`;

            try {
                let serialNumber, originalValue, saleDate, seller, redeemedDate;

                // Check if row is an array (no headers) or object (with headers)
                if (Array.isArray(row)) {
                    // Array format: [serienummer, värde, försäljningsdatum, säljare, inlöst datum]
                    serialNumber = (row[0] || '').toString().trim();
                    originalValue = parseFloat(row[1] || 0);
                    saleDate = row[2];
                    seller = (row[3] || 'Importerad').toString().trim();
                    redeemedDate = row[4];
                } else {
                    // Object format with headers
                    serialNumber = (row['Serienummer'] || row['serienummer'] || row['SerieNummer'] || '').toString().trim();
                    originalValue = parseFloat(row['Ursprungligt värde'] || row['ursprungligt värde'] || row['Värde'] || row['värde'] || 0);
                    saleDate = row['Försäljningsdatum'] || row['försäljningsdatum'] || row['Datum'] || row['datum'];
                    seller = (row['Säljare'] || row['säljare'] || row['Saljare'] || row['saljare'] || 'Importerad').toString().trim();
                    redeemedDate = row['Inlöst datum'] || row['inlöst datum'] || row['Inlöst'] || row['inlöst'];
                }

                if (!serialNumber || !originalValue || !saleDate) {
                    console.warn(`Rad ${i + 1}: Saknar nödvändiga värden (SN: ${serialNumber}, Värde: ${originalValue}, Datum: ${saleDate})`);
                    errorCount++;
                    continue;
                }

                // Convert Excel date to JavaScript Date if needed
                let saleDateObj;
                if (typeof saleDate === 'number') {
                    // Excel date (days since 1900-01-01)
                    saleDateObj = new Date((saleDate - 25569) * 86400 * 1000);
                } else {
                    saleDateObj = new Date(saleDate);
                }

                if (isNaN(saleDateObj.getTime())) {
                    console.warn(`Rad ${i + 1}: Ogiltigt försäljningsdatum, hoppar över`);
                    errorCount++;
                    continue;
                }

                // Calculate expiration date (2 years from sale)
                const expirationDate = new Date(saleDateObj);
                expirationDate.setFullYear(expirationDate.getFullYear() + 2);

                // Check if card is redeemed
                const isRedeemed = redeemedDate && redeemedDate !== '' && redeemedDate !== null;
                const currentValue = isRedeemed ? 0 : originalValue;

                // Create card data
                const cardData = {
                    value: currentValue,
                    seller: seller || "Importerad",
                    date: saleDateObj.toISOString(),
                    expirationDate: expirationDate.toISOString()
                };

                const cardRef = ref(db, `presentkort/${serialNumber}`);
                await set(cardRef, cardData);

                // Add activation history
                const historyRef = ref(db, `presentkort/${serialNumber}/history`);
                const activationEntry = {
                    type: "activation",
                    amount: originalValue,
                    timestamp: saleDateObj.toISOString(),
                    seller: seller || "Importerad"
                };
                await push(historyRef, activationEntry);

                // If redeemed, add redemption history
                if (isRedeemed) {
                    let redeemedDateObj;
                    if (typeof redeemedDate === 'number') {
                        redeemedDateObj = new Date((redeemedDate - 25569) * 86400 * 1000);
                    } else {
                        redeemedDateObj = new Date(redeemedDate);
                    }

                    if (!isNaN(redeemedDateObj.getTime())) {
                        const redemptionEntry = {
                            type: "redeem",
                            amount: -originalValue,
                            timestamp: redeemedDateObj.toISOString(),
                            seller: "Importerad"
                        };
                        await push(historyRef, redemptionEntry);
                    }
                }

                successCount++;

            } catch (rowError) {
                console.error(`Fel på rad ${i + 1}:`, rowError);
                errorCount++;
            }

            // Small delay to avoid overwhelming Firebase
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        importProgressDiv.style.display = "none";
        alert(`Import klar!\\n\\nLyckade: ${successCount}\\nFel: ${errorCount}\\nTotalt: ${total}`);
        closeModal('importModal');

    } catch (error) {
        console.error("Import error:", error);
        alert("Ett fel uppstod vid import: " + error.message);
    } finally {
        startImportButton.disabled = false;
        cancelImportButton.disabled = false;
        importProgressDiv.style.display = "none";
    }
});

// Check if we should open filter modal on page load
if (sessionStorage.getItem('filterModalOpen') === 'true') {
    // Restore filter values from sessionStorage
    const showActive = sessionStorage.getItem('filterShowActive');
    const showExpired = sessionStorage.getItem('filterShowExpired');
    const showOnlyWithBalance = sessionStorage.getItem('filterShowOnlyWithBalance');
    const activatedFrom = sessionStorage.getItem('filterActivatedFrom');
    const activatedTo = sessionStorage.getItem('filterActivatedTo');
    const redeemedFrom = sessionStorage.getItem('filterRedeemedFrom');
    const redeemedTo = sessionStorage.getItem('filterRedeemedTo');

    if (showActive) document.getElementById('showActiveCards').checked = showActive === 'true';
    if (showExpired) document.getElementById('showExpiredCards').checked = showExpired === 'true';
    if (showOnlyWithBalance) document.getElementById('showOnlyWithBalance').checked = showOnlyWithBalance === 'true';
    if (activatedFrom) document.getElementById('activatedFrom').value = activatedFrom;
    if (activatedTo) document.getElementById('activatedTo').value = activatedTo;
    if (redeemedFrom) document.getElementById('redeemedFrom').value = redeemedFrom;
    if (redeemedTo) document.getElementById('redeemedTo').value = redeemedTo;

    // Show filter modal
    openModal('filterModal');

    // Clear the flag so it doesn't reopen on next page load
    sessionStorage.removeItem('filterModalOpen');
}
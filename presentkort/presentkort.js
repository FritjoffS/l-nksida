import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, update, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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
const viewHistoryButton = document.getElementById("viewHistory");
const getNextSerialNumberButton = document.getElementById("getNextSerialNumber");
const listCardsButton = document.getElementById("listCards");
const filterDialog = document.getElementById("filterDialog");
const applyFiltersButton = document.getElementById("applyFilters");

// New elements for printing
const printCardsButton = document.getElementById("printCards");
const printDialog = document.getElementById("printDialog");
const printQuantityInput = document.getElementById("printQuantity");
const nextPrintNumberSpan = document.getElementById("nextPrintNumber");
const generatePDFButton = document.getElementById("generatePDF");
const cancelPrintButton = document.getElementById("cancelPrint");

// Check card
checkCardButton.addEventListener("click", async () => {
    try {
        const serialNumber = serialNumberInput.value.trim();
        if (!serialNumber) return alert("Ange ett serienummer!");

        const cardRef = ref(db, `presentkort/${serialNumber}`);
        const snapshot = await get(cardRef);

        if (snapshot.exists()) {
            const cardData = snapshot.val();
            const expirationDate = new Date(cardData.expirationDate);
            const formattedExpirationDate = `${expirationDate.getFullYear()}-${String(expirationDate.getMonth() + 1).padStart(2, '0')}-${String(expirationDate.getDate()).padStart(2, '0')}`;

            cardValueParagraph.innerHTML = `Aktuellt Saldo: ${cardData.value} kr<br>Utgångsdatum: ${formattedExpirationDate}`;
            cardInfoDiv.style.display = "block";
        } else {
            alert("Presentkortet hittades inte!");
            cardInfoDiv.style.display = "none";
        }
    } catch (error) {
        console.error("Error fetching card:", error);
        alert("Ett fel uppstod vid hämtning av presentkort.");
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

        // Save redeem history
        const historyRef = ref(db, `presentkort/${serialNumber}/history`);
        const newHistoryEntry = {
            redeemedAmount: redeemAmount,
            timestamp: new Date().toISOString(),
        };
        await push(historyRef, newHistoryEntry);

        alert("Beloppet har lösts in!");
        cardValueParagraph.textContent = `Aktuellt Saldo: ${newValue} kr`;
    }
});

// Activate card
activateCardButton.addEventListener("click", async () => {
    const serialNumber = serialNumberInput.value.trim();
    const cardValue = parseFloat(cardValueInput.value);
    const sellerName = sellerNameInput.value.trim();

    if (!serialNumber || isNaN(cardValue) || !sellerName) return alert("Ange giltiga värden!");

    const cardRef = ref(db, `presentkort/${serialNumber}`);
    const activationDate = new Date();
    const expirationDate = new Date(activationDate); // Clone activation date
    expirationDate.setFullYear(expirationDate.getFullYear() + 2); // Add 2 years

    const newCardData = {
        value: cardValue,
        addedValue: cardValue,
        seller: sellerName,
        date: activationDate.toISOString(),
        expirationDate: expirationDate.toISOString() // Save expiration date
    };

    await set(cardRef, newCardData);

    // Save activation history
    const historyRef = ref(db, `presentkort/${serialNumber}/history`);
    const activationHistoryEntry = {
        addedValue: cardValue,
        timestamp: activationDate.toISOString(),
    };
    await push(historyRef, activationHistoryEntry);

    alert("Presentkortet har aktiverats!");
    activateCardDiv.style.display = "none";
});

// View history
viewHistoryButton.addEventListener("click", () => {
    const serialNumber = serialNumberInput.value.trim();
    if (!serialNumber) return alert("Ange ett serienummer!");
    window.location.href = `historik.html?serialNumber=${encodeURIComponent(serialNumber)}`;
});

// Get next available serial number
getNextSerialNumberButton.addEventListener("click", async () => {
    const cardsRef = ref(db, "presentkort");
    try {
        const snapshot = await get(cardsRef);
        if (snapshot.exists()) {
            const cards = snapshot.val();
            const serialNumbers = Object.keys(cards).map(Number).sort((a, b) => a - b);
            const nextSerialNumber = serialNumbers.length > 0 ? Math.max(...serialNumbers) + 1 : 1;
            serialNumberInput.value = nextSerialNumber.toString().padStart(6, "0"); // Format as 6-digit number
            alert(`Nästa lediga serienummer är: ${serialNumberInput.value}`);
        } else {
            serialNumberInput.value = "000001"; // Start from 000001 if no cards exist
            alert(`Nästa lediga serienummer är: ${serialNumberInput.value}`);
        }

        // Show activateCard section
        cardInfoDiv.style.display = "none";
        activateCardDiv.style.display = "block";
    } catch (error) {
        console.error("Error fetching serial numbers:", error);
        alert("Kunde inte hämta nästa lediga serienummer.");
    }
});

// Show filter dialog
listCardsButton.addEventListener("click", () => {
    // Toggle the visibility of the filter dialog
    if (filterDialog.style.display === "none" || filterDialog.style.display === "") {
        filterDialog.style.display = "block"; // Show the dialog
    } else {
        filterDialog.style.display = "none"; // Hide the dialog
    }
});

// Apply filters and redirect to listPresentkort.html with query parameters
applyFiltersButton.addEventListener("click", () => {
    const showActive = document.getElementById("showActiveCards").checked;
    const showExpired = document.getElementById("showExpiredCards").checked;
    const activatedFrom = document.getElementById("activatedFrom").value;
    const activatedTo = document.getElementById("activatedTo").value;

    // Build query parameters
    const queryParams = new URLSearchParams({
        showActive,
        showExpired,
        activatedFrom,
        activatedTo,
    });

    // Redirect to listPresentkort.html with filters applied
    window.location.href = `listPresentkort.html?${queryParams.toString()}`;
});

// ===== PDF PRINTING FUNCTIONALITY =====

// Show print dialog and fetch next print number
printCardsButton.addEventListener("click", async () => {
    try {
        const printNumberRef = ref(db, "presentkort_config/nextPrintNumber");
        const snapshot = await get(printNumberRef);
        
        let nextNumber = 1000; // Start from 01000
        if (snapshot.exists()) {
            nextNumber = snapshot.val();
        } else {
            // Initialize the counter if it doesn't exist
            await set(printNumberRef, nextNumber);
        }
        
        nextPrintNumberSpan.textContent = nextNumber.toString().padStart(5, "0");
        printDialog.style.display = "block";
        filterDialog.style.display = "none";
        cardInfoDiv.style.display = "none";
        activateCardDiv.style.display = "none";
    } catch (error) {
        console.error("Error fetching print number:", error);
        alert("Kunde inte hämta nästa löpnummer.");
    }
});

// Cancel print dialog
cancelPrintButton.addEventListener("click", () => {
    printDialog.style.display = "none";
});

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
        const printNumberRef = ref(db, "presentkort_config/nextPrintNumber");
        const snapshot = await get(printNumberRef);
        let startNumber = snapshot.exists() ? snapshot.val() : 1000;
        
        // Generate PDF
        await generateGiftCardPDF(startNumber, quantity);
        
        // Update the next print number
        await set(printNumberRef, startNumber + quantity);
        
        alert(`${quantity} presentkort har genererats!`);
        printDialog.style.display = "none";
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Ett fel uppstod vid generering av PDF: " + error.message);
    } finally {
        generatePDFButton.disabled = false;
        generatePDFButton.textContent = "Generera PDF";
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
            const cardNumber = (startNumber + i).toString().padStart(5, "0");
            
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
            frontPage.drawText(text, {
                x: width - textWidth - 20 - 14.17,
                y: height - 30 - 14.17,
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
                backPage.drawText(text, {
                    x: width - textWidth - 20 - 14.17,
                    y: height - 30 - 14.17,
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

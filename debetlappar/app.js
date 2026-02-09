import { database, ref, get, set } from '../scripts/firebase-config.js';

const lastNumberRef = ref(database, 'debetlappar/lastNumber'); // Firebase reference for lastNumber

let lastNumber = 0;
let pdfDoc = null;
let lastGeneratedPdfUrl = null; // Store the URL of the last generated PDF

// Set the worker source for PDF.js (ensure the version matches the library version)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

// Fetch lastNumber from Firebase
async function fetchLastNumber() {
    try {
        const snapshot = await get(lastNumberRef);
        lastNumber = snapshot.exists() ? snapshot.val() : 0;
        console.log('Fetched lastNumber from Firebase:', lastNumber);
    } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
            console.error('Permission denied when accessing Firebase. Check your database rules.');
            alert('Kunde inte hämta senaste serienumret. Kontrollera behörigheterna i Firebase.');
        } else {
            console.error('Error fetching lastNumber from Firebase:', error);
        }
    }
}

// Update lastNumber in Firebase
async function updateLastNumberInFirebase(num) {
    try {
        await set(lastNumberRef, num);
        lastNumber = num;
        console.log('Updated lastNumber in Firebase:', num);
    } catch (error) {
        console.error('Error updating lastNumber in Firebase:', error);
    }
}

window.addEventListener('load', async () => {
    await fetchLastNumber();
    // Ladda PDF-filen när sidan öppnas
    loadPdf();
});

async function loadPdf() {
    const pdfUrl = 'doc.pdf';
    try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        pdfDoc = await loadingTask.promise;
        console.log('PDF laddad:', pdfDoc);
        document.getElementById('status').textContent = 'PDF mallen laddad och redo';
    } catch (error) {
        console.error('Fel vid laddning av PDF:', error);
        document.getElementById('status').textContent = 'Fel vid laddning av PDF mall';
    }
}

document.getElementById('processButton').addEventListener('click', async () => {
    if (!pdfDoc) {
        alert('PDF mallen är inte laddad ännu. Vänta lite och försök igen.');
        return;
    }

    const copies = parseInt(document.getElementById('copies').value);
    
    if (isNaN(copies) || copies < 1) {
        alert('Vänligen ange ett giltigt antal kopior.');
        return;
    }

    const status = document.getElementById('status');
    status.textContent = 'Bearbetar...';

    try {
        // Fetch the latest lastNumber from Firebase
        await fetchLastNumber();

        const page = await pdfDoc.getPage(1);
        const scale = 2; // Öka skalan för bättre upplösning
        const viewport = page.getViewport({ scale: scale });

        const { jsPDF } = window.jspdf;
        const outputPdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: [viewport.width / scale, viewport.height / scale]
        });

        for (let i = 0; i < copies; i++) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Lägg till numrering
            context.font = '24px Arial';
            context.fillStyle = 'black';
            context.fillText(`B  ${lastNumber + i + 1}`, 480 * scale, 50 * scale);

            const imgData = canvas.toDataURL('image/jpeg', 1.0); // Högsta kvalitet
            outputPdf.addImage(imgData, 'JPEG', 0, 0, viewport.width / scale, viewport.height / scale);

            if (i < copies - 1) {
                outputPdf.addPage();
            }
        }

        const pdfBlob = outputPdf.output('blob');
        lastGeneratedPdfUrl = URL.createObjectURL(pdfBlob); // Save the blob URL
        outputPdf.save('numbered_document.pdf');
        await updateLastNumberInFirebase(lastNumber + copies); // Update Firebase
        status.textContent = 'Klar! PDF har laddats ner.';
        
    } catch (error) {
        console.error('Error:', error);
        status.textContent = 'Ett fel uppstod. Försök igen.';
    }
});

document.getElementById('openLastPdfButton').addEventListener('click', () => {
    if (!lastGeneratedPdfUrl) {
        alert('Ingen PDF har genererats ännu.');
        return;
    }

    window.open(lastGeneratedPdfUrl, '_blank');
});

// Etikettskrivare - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('etikett-form');
    const visaBtn = document.getElementById('visa-btn');
    const skrivUtBtn = document.getElementById('skriv-ut-btn');
    const previewContent = document.getElementById('preview-content');
    const printContent = document.getElementById('print-content');

    // Event listeners
    visaBtn.addEventListener('click', updatePreview);
    skrivUtBtn.addEventListener('click', printEtikett);
    form.addEventListener('change', updatePreview);

    // Hämta sparad data från localStorage
    loadData();

    /**
     * Uppdatera förhandsvisningen
     */
    function updatePreview() {
        const data = getFormData();
        const html = createEtikettHTML(data);
        
        previewContent.innerHTML = html;
        printContent.innerHTML = html;
        
        // Spara data
        saveData(data);
    }

    /**
     * Hämta data från formuläret
     */
    function getFormData() {
        return {
            benamning: document.getElementById('benamning').value.trim(),
            leverantor: document.getElementById('leverantor').value.trim(),
            produktnummer: document.getElementById('produktnummer').value.trim(),
            artikelnummer: document.getElementById('artikelnummer').value.trim(),
            hyllplats: document.getElementById('hyllplats').value.trim(),
            bestellningspunkt: document.getElementById('bestellningspunkt').value.trim()
        };
    }

    /**
     * Skapa HTML för etiketten
     */
    function createEtikettHTML(data) {
        let html = '';

        if (data.benamning) {
            html += `<div class="rad"><span class="label">Benämning:</span><span class="value">${escapeHtml(data.benamning)}</span></div>`;
        }

        if (data.leverantor) {
            html += `<div class="rad"><span class="label">Leverantör:</span><span class="value">${escapeHtml(data.leverantor)}</span></div>`;
        }

        if (data.produktnummer) {
            html += `<div class="rad"><span class="label">Art.nr:</span><span class="value">${escapeHtml(data.produktnummer)}</span></div>`;
        }

        if (data.artikelnummer) {
            html += `<div class="rad"><span class="label">Lev.art.nr:</span><span class="value">${escapeHtml(data.artikelnummer)}</span></div>`;
        }

        if (data.hyllplats) {
            html += `<div class="rad"><span class="label">Hyllplats:</span><span class="value">${escapeHtml(data.hyllplats)}</span></div>`;
        }

        if (data.bestellningspunkt) {
            html += `<div class="rad"><span class="label">Beställ:</span><span class="value">${escapeHtml(data.bestellningspunkt)}</span></div>`;
        }

        if (!html) {
            html = '<div class="preview-placeholder">Fyll i formuläret för att se förhandsvisning</div>';
        }

        return html;
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Skriv ut etiketten
     */
    function printEtikett() {
        const data = getFormData();
        
        // Kontrollera att minst något är ifyllt
        if (!data.benamning && !data.leverantor && !data.produktnummer && 
            !data.artikelnummer && !data.hyllplats && !data.bestellningspunkt) {
            alert('Vänligen fyll i minst ett fält innan du skriver ut.');
            return;
        }

        // Uppdatera print-innehållet
        updatePreview();

        // Vänta lite för att säkerställa att DOM är uppdaterad
        setTimeout(() => {
            window.print();
        }, 100);
    }

    /**
     * Spara data till localStorage
     */
    function saveData(data) {
        try {
            localStorage.setItem('etikettData', JSON.stringify(data));
        } catch (e) {
            console.warn('Kunde inte spara data:', e);
        }
    }

    /**
     * Ladda data från localStorage
     */
    function loadData() {
        try {
            const saved = localStorage.getItem('etikettData');
            if (saved) {
                const data = JSON.parse(saved);
                document.getElementById('benamning').value = data.benamning || '';
                document.getElementById('leverantor').value = data.leverantor || '';
                document.getElementById('produktnummer').value = data.produktnummer || '';
                document.getElementById('artikelnummer').value = data.artikelnummer || '';
                document.getElementById('hyllplats').value = data.hyllplats || '';
                document.getElementById('bestellningspunkt').value = data.bestellningspunkt || '';
                
                // Uppdatera förhandsvisning
                updatePreview();
            }
        } catch (e) {
            console.warn('Kunde inte ladda sparad data:', e);
        }
    }

    // Alternativ: Lägg till stöd för import/export av data
    // Detta kan användas för att spara och ladda produktlistor
});

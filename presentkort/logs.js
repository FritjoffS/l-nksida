// Denna fil hanterar visning och filtrering av loggar relaterade till presentkort i Firebase Realtime Database.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

// Logout function
window.logout = () => {
    auth.signOut().then(() => {
        window.location.href = "../index/login.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
};

// DOM elements
const logTableBody = document.getElementById("logTableBody");
const filterFromDate = document.getElementById("filterFromDate");
const filterToDate = document.getElementById("filterToDate");
const filterAction = document.getElementById("filterAction");
const filterUser = document.getElementById("filterUser");
const applyLogFiltersBtn = document.getElementById("applyLogFilters");
const clearLogFiltersBtn = document.getElementById("clearLogFilters");

let allLogs = [];

// Action type translations
const actionTranslations = {
    'create': 'Skapade',
    'redeem': 'Inlösen',
    'edit': 'Redigering',
    'delete': 'Borttagning',
    'import': 'Import'
};

// Fetch all logs
const fetchLogs = async () => {
    const logsRef = ref(db, "logs");
    try {
        const snapshot = await get(logsRef);
        if (snapshot.exists()) {
            const logs = snapshot.val();
            
            // Convert to array and sort by timestamp (newest first)
            allLogs = Object.entries(logs).map(([key, value]) => ({
                id: key,
                ...value
            })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            renderLogs(allLogs);
        } else {
            logTableBody.innerHTML = "<tr><td colspan='5' style='text-align: center;'>Inga loggar hittades.</td></tr>";
        }
    } catch (error) {
        console.error("Error fetching logs:", error);
        logTableBody.innerHTML = "<tr><td colspan='5' style='text-align: center;'>Kunde inte hämta loggar.</td></tr>";
    }
};

// Render logs to table
function renderLogs(logs) {
    logTableBody.innerHTML = "";
    
    if (logs.length === 0) {
        logTableBody.innerHTML = "<tr><td colspan='5' style='text-align: center;'>Inga loggar matchar filtren.</td></tr>";
        return;
    }
    
    logs.forEach(log => {
        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        
        const timestamp = new Date(log.timestamp).toLocaleString('sv-SE');
        const action = actionTranslations[log.action] || log.action;
        const cardNumber = log.cardNumber || '-';
        const user = log.userName || log.seller || '-';
        
        // Create summary of details
        let detailsSummary = '';
        if (log.action === 'create') {
            detailsSummary = `Värde: ${log.details?.value || 0} kr`;
        } else if (log.action === 'redeem') {
            detailsSummary = `Inlöst: ${log.details?.amount || 0} kr, Nytt saldo: ${log.details?.newValue || 0} kr`;
        } else if (log.action === 'edit') {
            const changes = [];
            if (log.changes?.serialNumber) changes.push(`Nr: ${log.changes.serialNumber.old} → ${log.changes.serialNumber.new}`);
            if (log.changes?.value) changes.push(`Saldo: ${log.changes.value.old} → ${log.changes.value.new} kr`);
            if (log.changes?.seller) changes.push(`Säljare: ${log.changes.seller.old} → ${log.changes.seller.new}`);
            detailsSummary = changes.join(', ') || 'Ändrade historik';
        } else if (log.action === 'delete') {
            detailsSummary = `Raderat kort med saldo: ${log.details?.value || 0} kr`;
        } else if (log.action === 'import') {
            detailsSummary = `Importerade ${log.details?.count || 1} kort`;
        }
        
        row.innerHTML = `
            <td>${timestamp}</td>
            <td>${action}</td>
            <td>${cardNumber}</td>
            <td>${user}</td>
            <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${detailsSummary}</td>
        `;
        
        row.addEventListener("click", () => showLogDetails(log));
        logTableBody.appendChild(row);
    });
}

// Filter logs
function applyFilters() {
    let filtered = [...allLogs];
    
    // Date filter
    if (filterFromDate.value) {
        const fromDate = new Date(filterFromDate.value);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (filterToDate.value) {
        const toDate = new Date(filterToDate.value);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }
    
    // Action filter
    if (filterAction.value) {
        filtered = filtered.filter(log => log.action === filterAction.value);
    }
    
    // User filter
    if (filterUser.value) {
        const userSearch = filterUser.value.toLowerCase();
        filtered = filtered.filter(log => 
            (log.userEmail && log.userEmail.toLowerCase().includes(userSearch)) ||
            (log.userName && log.userName.toLowerCase().includes(userSearch))
        );
    }
    
    renderLogs(filtered);
}

// Clear filters
function clearFilters() {
    filterFromDate.value = '';
    filterToDate.value = '';
    filterAction.value = '';
    filterUser.value = '';
    renderLogs(allLogs);
}

// Show log details in modal
function showLogDetails(log) {
    const timestamp = new Date(log.timestamp).toLocaleString('sv-SE');
    const action = actionTranslations[log.action] || log.action;
    
    let html = `
        <div style="margin-bottom: 15px;">
            <strong>Tidsstämpel:</strong> ${timestamp}<br>
            <strong>Händelse:</strong> ${action}<br>
            <strong>Presentkort:</strong> ${log.cardNumber || '-'}<br>
            <strong>Användare:</strong> ${log.userName || log.seller || '-'}
        </div>
        <hr>
    `;
    
    if (log.details) {
        html += '<h3>Detaljer:</h3><pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto;">';
        html += JSON.stringify(log.details, null, 2);
        html += '</pre>';
    }
    
    if (log.changes) {
        html += '<h3>Ändringar:</h3>';
        html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
        html += '<tr><th style="border: 1px solid #ddd; padding: 8px; background: #f8f9fa;">Fält</th><th style="border: 1px solid #ddd; padding: 8px; background: #f8f9fa;">Tidigare</th><th style="border: 1px solid #ddd; padding: 8px; background: #f8f9fa;">Nytt</th></tr>';
        
        for (const [field, change] of Object.entries(log.changes)) {
            html += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${field}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${change.old || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${change.new || '-'}</td>
            </tr>`;
        }
        html += '</table>';
    }
    
    document.getElementById("logDetailsContent").innerHTML = html;
    document.getElementById("logDetailsModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
    document.body.style.overflow = "hidden";
}

// Export to Excel function
function exportToExcel() {
    if (allLogs.length === 0) {
        console.log("Ingen data att exportera!");
        return false;
    }
    
    const data = [
        ["Tidsstämpel", "Händelse", "Kort nr", "Användare", "Detaljer"]
    ];
    
    const currentLogs = Array.from(logTableBody.querySelectorAll("tr")).filter(row => row.cells.length === 5);
    
    currentLogs.forEach(row => {
        const rowData = [];
        for (let i = 0; i < row.cells.length; i++) {
            rowData.push(row.cells[i].textContent.trim());
        }
        data.push(rowData);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 25 },
        { wch: 50 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "Loggar");
    
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5).replace(':', '');
    XLSX.writeFile(wb, `presentkort_loggar_${date}_${time}.xlsx`);
    return true;
}

// Manual export button
document.getElementById("exportExcel").addEventListener("click", () => {
    if (!exportToExcel()) {
        alert("Ingen data att exportera!");
    }
});

// ============================================
// SCHEMALAGD AUTOMATISK EXPORT MED INTERVALL
// ============================================
const EXPORT_INTERVAL_HOURS = 12;    // Antal timmar mellan varje export
const EXPORT_INTERVAL_MINUTES = 0;  // Antal minuter mellan varje export (läggs till timmarna)

let lastAutoExportTime = null; // Håller koll på senaste automatiska exporten

function checkScheduledExport() {
    const now = new Date();
    
    // Beräkna intervall i millisekunder
    const intervalMs = (EXPORT_INTERVAL_HOURS * 60 + EXPORT_INTERVAL_MINUTES) * 60 * 1000;
    
    // Om vi aldrig har exporterat, eller om tillräckligt lång tid har gått
    if (lastAutoExportTime === null || (now.getTime() - lastAutoExportTime) >= intervalMs) {
        
        console.log(`[${now.toLocaleString('sv-SE')}] Kör schemalagd Excel-export...`);
        
        if (exportToExcel()) {
            lastAutoExportTime = now.getTime();
            console.log("Schemalagd export slutförd!");
            
            // Valfritt: Visa en notifikation för användaren
            if (Notification.permission === "granted") {
                new Notification("Presentkort - Automatisk export", {
                    body: "Loggexport har sparats.",
                    icon: "../icons/icon-192x192.png"
                });
            }
        }
    }
}

// Starta schemalagd kontroll (körs varje minut)
function startScheduledExport() {
    // Beräkna intervall för loggmeddelande
    const totalMinutes = EXPORT_INTERVAL_HOURS * 60 + EXPORT_INTERVAL_MINUTES;
    let intervalText = '';
    if (EXPORT_INTERVAL_HOURS > 0) {
        intervalText += `${EXPORT_INTERVAL_HOURS} timme${EXPORT_INTERVAL_HOURS > 1 ? 'r' : ''}`;
    }
    if (EXPORT_INTERVAL_MINUTES > 0) {
        if (intervalText) intervalText += ' och ';
        intervalText += `${EXPORT_INTERVAL_MINUTES} minut${EXPORT_INTERVAL_MINUTES > 1 ? 'er' : ''}`;
    }
    
    console.log(`Schemalagd export aktiverad: Körs var ${intervalText} (om sidan är öppen)`);
    
    // Kontrollera varje minut (60000 ms)
    setInterval(checkScheduledExport, 60000);
    
    // Be om notifikationstillstånd
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// Starta schemat när sidan laddas
startScheduledExport();

// Event listeners
applyLogFiltersBtn.addEventListener("click", applyFilters);
clearLogFiltersBtn.addEventListener("click", clearFilters);

// Close button - go back to presentkort.html
document.getElementById("closeList")?.addEventListener("click", () => {
    window.location.href = "presentkort.html";
});

document.getElementById("closeLogDetails").addEventListener("click", () => {
    document.getElementById("logDetailsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
    document.body.style.overflow = "auto";
});

document.getElementById("modalOverlay").addEventListener("click", () => {
    document.getElementById("logDetailsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
    document.body.style.overflow = "auto";
});

// Wait for authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchLogs();
    } else {
        window.location.href = "../index/login.html";
    }
});

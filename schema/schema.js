// Schemahantering - Huvudlogik
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

// Global state
let currentUser = null;
let currentUserData = null;
let currentStaffId = null; // ID för inloggad personal
let currentWeekOffset = 0;
let clockedInStatus = null;
let loginMethod = 'pin'; // Standard inloggningsmetod

// Logout function
window.logout = () => {
    // Logga ut från schema
    sessionStorage.removeItem('schemaStaffId');
    // Omdirigera tillbaka till l-nksida
    window.location.href = "../index/index.html";
};

// Switch user function
window.switchUser = () => {
    // Rensa session
    sessionStorage.removeItem('schemaStaffId');
    currentStaffId = null;
    currentUserData = null;
    // Rensa input-fält
    document.getElementById('pinInput').value = '';
    document.getElementById('staffDropdown').selectedIndex = 0;
    document.getElementById('pinError').style.display = 'none';
    // Visa PIN-modal igen
    showPinModal();
};

// ==========================================
// AUTHENTICATION & INITIALIZATION
// ==========================================

// Check authentication on page load
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Redirect to login page if not authenticated
        window.location.href = "../index/login.html";
        return;
    }
    
    // User is authenticated (l-nksida)
    currentUser = user;
    
    // Check if staff is logged in with PIN
    const savedStaffId = sessionStorage.getItem('schemaStaffId');
    if (savedStaffId) {
        // Staff already logged in
        await loadStaffData(savedStaffId);
        hidePinModal();
        initApp();
    } else {
        // Show PIN login modal
        showPinModal();
    }
});

// ==========================================
// PIN LOGIN FUNCTIONS
// ==========================================

async function showPinModal() {
    // Ladda loginMethod från settings
    await loadLoginMethod();
    
    document.getElementById('pinLoginModal').style.display = 'block';
    document.getElementById('schemaContainer').style.filter = 'blur(5px)';
    document.getElementById('schemaContainer').style.pointerEvents = 'none';
    
    // Visa rätt inloggningsmetod
    if (loginMethod === 'dropdown') {
        document.getElementById('pinMethodDiv').style.display = 'none';
        document.getElementById('dropdownMethodDiv').style.display = 'block';
        await loadStaffDropdown();
    } else {
        document.getElementById('pinMethodDiv').style.display = 'block';
        document.getElementById('dropdownMethodDiv').style.display = 'none';
    }
    
    // Event listeners
    document.getElementById('pinLoginBtn').addEventListener('click', handlePinLogin);
    document.getElementById('pinLogoutBtn').addEventListener('click', () => {
        window.location.href = "../index/index.html";
    });
    
    if (loginMethod === 'pin') {
        document.getElementById('pinInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlePinLogin();
        });
    } else {
        // För dropdown: dubbelklick för att logga in
        document.getElementById('staffDropdown').addEventListener('dblclick', handlePinLogin);
    }
}

function hidePinModal() {
    document.getElementById('pinLoginModal').style.display = 'none';
    document.getElementById('schemaContainer').style.filter = 'none';
    document.getElementById('schemaContainer').style.pointerEvents = 'auto';
}

async function loadLoginMethod() {
    try {
        const settingsRef = ref(db, 'schema/settings');
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
            const settings = snapshot.val();
            loginMethod = settings.loginMethod || 'pin';
        }
    } catch (error) {
        console.error('Error loading login method:', error);
        loginMethod = 'pin'; // Fallback till PIN
    }
}

async function loadStaffDropdown() {
    try {
        const usersRef = ref(db, 'schema/users');
        const snapshot = await get(usersRef);
        
        const dropdown = document.getElementById('staffDropdown');
        dropdown.innerHTML = '<option value="">-- Välj personal --</option>';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            const userArray = Object.entries(users).map(([id, data]) => ({
                id,
                name: data.name
            }));
            
            // Sortera efter namn
            userArray.sort((a, b) => a.name.localeCompare(b.name));
            
            userArray.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading staff dropdown:', error);
        document.getElementById('staffDropdown').innerHTML = '<option value="">Fel vid hämtning</option>';
    }
}

async function handlePinLogin() {
    const errorDiv = document.getElementById('pinError');
    let foundStaffId = null;
    
    try {
        if (loginMethod === 'dropdown') {
            // Droplist-metod
            const dropdown = document.getElementById('staffDropdown');
            foundStaffId = dropdown.value;
            
            if (!foundStaffId || foundStaffId === '') {
                errorDiv.textContent = 'Välj en personal från listan';
                errorDiv.style.display = 'block';
                return;
            }
        } else {
            // PIN-metod
            const pin = document.getElementById('pinInput').value;
            
            if (pin.length !== 4) {
                errorDiv.textContent = 'Ange 4 siffror';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Hitta personal med denna PIN
            const usersRef = ref(db, 'schema/users');
            const snapshot = await get(usersRef);
            
            if (!snapshot.exists()) {
                errorDiv.textContent = 'Inga användare hittades';
                errorDiv.style.display = 'block';
                return;
            }
            
            const users = snapshot.val();
            
            for (const [staffId, userData] of Object.entries(users)) {
                // Konvertera båda till strängar för jämförelse
                const userPin = String(userData.pin);
                if (userPin === pin) {
                    foundStaffId = staffId;
                    break;
                }
            }
            
            if (!foundStaffId) {
                errorDiv.textContent = 'Felaktig personalkod';
                errorDiv.style.display = 'block';
                document.getElementById('pinInput').value = '';
                document.getElementById('pinInput').focus();
                return;
            }
        }
        
        // Logga in användaren
        if (foundStaffId) {
            // Spara i session
            sessionStorage.setItem('schemaStaffId', foundStaffId);
            currentStaffId = foundStaffId;
            
            // Ladda personaldata
            await loadStaffData(foundStaffId);
            
            // Göm modal och starta app
            hidePinModal();
            initApp();
        }
    } catch (error) {
        console.error('PIN login error:', error);
        errorDiv.textContent = 'Ett fel uppstod: ' + error.message;
        errorDiv.style.display = 'block';
    }
}

async function loadStaffData(staffId) {
    try {
        const userRef = ref(db, `schema/users/${staffId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            currentStaffId = staffId;
            currentUserData = snapshot.val();
            document.getElementById("currentUser").textContent = currentUserData.name || 'Personal';
            checkAdminStatus();
        } else {
            // Användaren finns inte längre, rensa session och visa PIN-modal igen
            sessionStorage.removeItem('schemaStaffId');
            throw new Error('Personaldata hittades inte');
        }
    } catch (error) {
        console.error("Error loading staff data:", error);
        // Rensa session och visa PIN-modal
        sessionStorage.removeItem('schemaStaffId');
        showPinModal();
        return;
    }
}

function checkAdminStatus() {
    const adminBtn = document.getElementById("adminButton");
    
    if (currentUserData && currentUserData.role === 'admin') {
        if (adminBtn) adminBtn.style.display = "block";
        // Visa admin-länk i navbar också
        showNavbarAdminLink();
    } else {
        if (adminBtn) adminBtn.style.display = "none";
        // Göm admin-länk i navbar
        hideNavbarAdminLink();
    }
}

function showNavbarAdminLink() {
    // Vänta lite för att navbar ska hinna laddas
    setTimeout(() => {
        const navbarLinks = document.querySelectorAll('#navbar a');
        navbarLinks.forEach(link => {
            if (link.href && link.href.includes('/admin.html')) {
                link.parentElement.style.display = 'block';
            }
        });
    }, 100);
}

function hideNavbarAdminLink() {
    // Vänta lite för att navbar ska hinna laddas
    setTimeout(() => {
        const navbarLinks = document.querySelectorAll('#navbar a');
        navbarLinks.forEach(link => {
            if (link.href && link.href.includes('/admin.html')) {
                link.parentElement.style.display = 'none';
            }
        });
    }, 100);
}

function initApp() {
    // Initialize tab navigation
    initializeTabs();
    
    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Load overview data
    loadOverview();
    
    // Check clock status
    checkClockStatus();
    
    // Initialize event listeners
    initializeEventListeners();
}

// ==========================================
// TAB NAVIGATION
// ==========================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Load tab content
            loadTabContent(tabId);
        });
    });
}

function loadTabContent(tabId) {
    switch(tabId) {
        case 'overview':
            loadOverview();
            break;
        case 'timesheet':
            loadTimesheet();
            break;
        case 'schedule':
            loadSchedule();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// ==========================================
// CLOCK FUNCTIONALITY
// ==========================================

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('sv-SE');
    const dateString = now.toLocaleDateString('sv-SE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById("currentTime").textContent = timeString;
    document.getElementById("currentDate").textContent = dateString;
}

async function checkClockStatus() {
    const today = new Date().toISOString().split('T')[0];
    const entriesRef = ref(db, `schema/timeEntries/${currentStaffId}/${today}`);
    
    const snapshot = await get(entriesRef);
    if (snapshot.exists()) {
        const entries = Object.values(snapshot.val());
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry.type === 'in') {
            clockedInStatus = lastEntry;
            updateClockStatusUI(true);
        } else {
            clockedInStatus = null;
            updateClockStatusUI(false);
        }
    } else {
        clockedInStatus = null;
        updateClockStatusUI(false);
    }
}

function updateClockStatusUI(isClockedIn) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    
    if (isClockedIn) {
        statusIndicator.classList.add('active');
        statusText.textContent = 'Inloggad';
        clockInBtn.disabled = true;
        clockOutBtn.disabled = false;
    } else {
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Ej inloggad';
        clockInBtn.disabled = false;
        clockOutBtn.disabled = true;
    }
}

async function clockIn(time, comment = '') {
    const today = new Date().toISOString().split('T')[0];
    const entriesRef = ref(db, `schema/timeEntries/${currentStaffId}/${today}`);
    
    const newEntry = {
        type: 'in',
        timestamp: new Date().toISOString(),
        time: time,
        comment: comment,
        userId: currentStaffId,
        userName: currentUserData.name
    };
    
    await push(entriesRef, newEntry);
    clockedInStatus = newEntry;
    updateClockStatusUI(true);
    showSuccessMessage('Du har stämplat in!');
    loadTimesheet();
    loadOverview();
}

async function clockOut(time, comment = '') {
    const today = new Date().toISOString().split('T')[0];
    const entriesRef = ref(db, `schema/timeEntries/${currentStaffId}/${today}`);
    
    const newEntry = {
        type: 'out',
        timestamp: new Date().toISOString(),
        time: time,
        comment: comment,
        userId: currentStaffId,
        userName: currentUserData.name
    };
    
    await push(entriesRef, newEntry);
    clockedInStatus = null;
    updateClockStatusUI(false);
    showSuccessMessage('Du har stämplat ut!');
    loadTimesheet();
    loadOverview();
}

// ==========================================
// OVERVIEW TAB
// ==========================================

async function loadOverview() {
    await Promise.all([
        loadPresentToday(),
        loadMyHoursThisWeek(),
        loadNextShift(),
        loadActiveStaff()
    ]);
}

async function loadPresentToday() {
    const today = new Date().toISOString().split('T')[0];
    const entriesRef = ref(db, `schema/timeEntries`);
    
    try {
        const snapshot = await get(entriesRef);
        if (snapshot.exists()) {
            let presentCount = 0;
            const allEntries = snapshot.val();
            
            // Check each user's entries for today
            for (const userId in allEntries) {
                if (allEntries[userId][today]) {
                    const userEntries = Object.values(allEntries[userId][today]);
                    const lastEntry = userEntries[userEntries.length - 1];
                    if (lastEntry.type === 'in') {
                        presentCount++;
                    }
                }
            }
            
            document.getElementById("presentToday").textContent = presentCount;
        } else {
            document.getElementById("presentToday").textContent = '0';
        }
    } catch (error) {
        console.error("Error loading present today:", error);
        document.getElementById("presentToday").textContent = '-';
    }
}

async function loadMyHoursThisWeek() {
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const entriesRef = ref(db, `schema/timeEntries/${currentStaffId}`);
    
    try {
        const snapshot = await get(entriesRef);
        if (snapshot.exists()) {
            let totalHours = 0;
            const entries = snapshot.val();
            
            for (const date in entries) {
                const entryDate = new Date(date);
                if (entryDate >= weekStart && entryDate <= weekEnd) {
                    const dayEntries = Object.values(entries[date]);
                    const dayHours = await calculateDayHours(dayEntries, date, currentStaffId);
                    totalHours += dayHours;
                }
            }
            
            document.getElementById("myHoursThisWeek").textContent = totalHours.toFixed(1);
        } else {
            document.getElementById("myHoursThisWeek").textContent = '0.0';
        }
    } catch (error) {
        console.error("Error loading hours:", error);
        document.getElementById("myHoursThisWeek").textContent = '-';
    }
}

async function loadNextShift() {
    const scheduleRef = ref(db, `schema/schedules/${currentStaffId}`);
    
    try {
        const snapshot = await get(scheduleRef);
        if (snapshot.exists()) {
            const schedule = snapshot.val();
            const today = new Date();
            
            // Find next scheduled shift
            let nextShift = null;
            for (const date in schedule) {
                const shiftDate = new Date(date);
                if (shiftDate >= today && schedule[date].type !== 'off') {
                    if (!nextShift || shiftDate < new Date(nextShift.date)) {
                        nextShift = {
                            date: date,
                            ...schedule[date]
                        };
                    }
                }
            }
            
            if (nextShift) {
                const shiftDate = new Date(nextShift.date);
                const dateStr = shiftDate.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
                document.getElementById("nextShift").textContent = `${dateStr} ${nextShift.startTime}-${nextShift.endTime}`;
            } else {
                document.getElementById("nextShift").textContent = 'Inget schemalagt';
            }
        } else {
            document.getElementById("nextShift").textContent = 'Inget schema';
        }
    } catch (error) {
        console.error("Error loading next shift:", error);
        document.getElementById("nextShift").textContent = '-';
    }
}

async function loadActiveStaff() {
    const today = new Date().toISOString().split('T')[0];
    const entriesRef = ref(db, `schema/timeEntries`);
    const usersRef = ref(db, `schema/users`);
    
    try {
        const [entriesSnapshot, usersSnapshot] = await Promise.all([
            get(entriesRef),
            get(usersRef)
        ]);
        
        const staffList = document.getElementById("activeStaffList");
        staffList.innerHTML = '';
        
        if (entriesSnapshot.exists() && usersSnapshot.exists()) {
            const allEntries = entriesSnapshot.val();
            const users = usersSnapshot.val();
            let activeCount = 0;
            
            for (const userId in allEntries) {
                if (allEntries[userId][today]) {
                    const userEntries = Object.values(allEntries[userId][today]);
                    const lastEntry = userEntries[userEntries.length - 1];
                    
                    if (lastEntry.type === 'in') {
                        const userName = users[userId]?.name || 'Okänd användare';
                        const clockInTime = lastEntry.time;
                        
                        const staffItem = document.createElement('div');
                        staffItem.className = 'staff-item';
                        staffItem.innerHTML = `
                            <div class="status-dot"></div>
                            <div>
                                <div class="staff-name">${userName}</div>
                                <div class="staff-time">Sedan ${clockInTime}</div>
                            </div>
                        `;
                        staffList.appendChild(staffItem);
                        activeCount++;
                    }
                }
            }
            
            if (activeCount === 0) {
                staffList.innerHTML = '<p class="info-text">Ingen personal är för närvarande inloggad</p>';
            }
        } else {
            staffList.innerHTML = '<p class="info-text">Ingen personal är för närvarande inloggad</p>';
        }
    } catch (error) {
        console.error("Error loading active staff:", error);
        staffList.innerHTML = '<p class="error-text">Kunde inte läsa in personal</p>';
    }
}

// ==========================================
// TIMESHEET TAB
// ==========================================

async function loadTimesheet() {
    const period = document.getElementById('timesheetPeriod').value;
    const { startDate, endDate } = getDateRange(period);
    
    const entriesRef = ref(db, `schema/timeEntries/${currentStaffId}`);
    
    try {
        const snapshot = await get(entriesRef);
        const entriesList = document.getElementById("timesheetEntries");
        entriesList.innerHTML = '';
        
        if (snapshot.exists()) {
            const entries = snapshot.val();
            let totalHours = 0;
            let hasEntries = false;
            
            for (const date in entries) {
                const entryDate = new Date(date);
                if (entryDate >= startDate && entryDate <= endDate) {
                    const dayEntries = Object.values(entries[date]);
                    hasEntries = true;
                    
                    // Calculate day hours
                    const dayHours = await calculateDayHours(dayEntries, date, currentStaffId);
                    totalHours += dayHours;
                    
                    // Display entries
                    dayEntries.reverse().forEach(entry => {
                        const entryItem = document.createElement('div');
                        entryItem.className = `entry-item clock-${entry.type}`;
                        
                        const entryDate = new Date(entry.timestamp);
                        const dateStr = entryDate.toLocaleDateString('sv-SE');
                        
                        entryItem.innerHTML = `
                            <div class="entry-header">
                                <span class="entry-type">${entry.type === 'in' ? '🟢 Instämpling' : '🔴 Utstämpling'}</span>
                                <span class="entry-time">${entry.time}</span>
                            </div>
                            <div>${dateStr}</div>
                            ${entry.comment ? `<div class="entry-comment">${entry.comment}</div>` : ''}
                        `;
                        
                        entriesList.appendChild(entryItem);
                    });
                }
            }
            
            if (!hasEntries) {
                entriesList.innerHTML = '<p class="info-text">Inga registreringar för vald period</p>';
            }
            
            document.getElementById("totalHours").textContent = totalHours.toFixed(1);
        } else {
            entriesList.innerHTML = '<p class="info-text">Inga registreringar än</p>';
            document.getElementById("totalHours").textContent = '0.0';
        }
    } catch (error) {
        console.error("Error loading timesheet:", error);
        entriesList.innerHTML = '<p class="error-text">Kunde inte läsa in tidrapport</p>';
    }
}

// ==========================================
// SCHEDULE TAB
// ==========================================

async function loadSchedule() {
    const weekStart = getWeekStart(new Date());
    weekStart.setDate(weekStart.getDate() + (currentWeekOffset * 7));
    
    const weekNumber = getWeekNumber(weekStart);
    const year = weekStart.getFullYear();
    document.getElementById("scheduleWeekDisplay").textContent = `Vecka ${weekNumber}, ${year}`;
    
    const scheduleGrid = document.getElementById("scheduleGrid");
    scheduleGrid.innerHTML = '<p class="loading">Läser in schema...</p>';
    
    try {
        // Load all users
        const usersRef = ref(db, `schema/users`);
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) {
            scheduleGrid.innerHTML = '<p class="info-text">Inga användare finns i systemet</p>';
            return;
        }
        
        const users = usersSnapshot.val();
        const scheduleTable = document.createElement('table');
        scheduleTable.className = 'schedule-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Personal</th>';
        
        const weekDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
            headerRow.innerHTML += `<th>${weekDays[i]}<br>${dateStr}</th>`;
        }
        
        thead.appendChild(headerRow);
        scheduleTable.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        for (const userId in users) {
            const user = users[userId];
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${user.name}</strong></td>`;
            
            // Load schedule for each day
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                
                const cell = document.createElement('td');
                
                // Get schedule for this user and date
                const scheduleRef = ref(db, `schema/schedules/${userId}/${dateStr}`);
                const scheduleSnapshot = await get(scheduleRef);
                
                if (scheduleSnapshot.exists()) {
                    const shift = scheduleSnapshot.val();
                    const shiftClass = `shift-cell shift-${shift.type}`;
                    
                    // Visa läsbart namn
                    let displayName = shift.type;
                    if (shift.type === 'off') {
                        displayName = 'Ledig';
                    } else if (shift.type === 'day') {
                        displayName = 'Arbete';
                    } else {
                        displayName = shift.type.charAt(0).toUpperCase() + shift.type.slice(1);
                    }
                    
                    // Beräkna nettoarbetstid (exklusive rast)
                    let timeInfo = '';
                    if (shift.startTime && shift.type !== 'off') {
                        const breakMin = shift.breakMinutes || 0;
                        timeInfo = `<span class="shift-time">${shift.startTime} - ${shift.endTime}`;
                        if (breakMin > 0) {
                            timeInfo += ` (rast ${breakMin} min)`;
                        }
                        timeInfo += `</span>`;
                    }
                    
                    cell.innerHTML = `
                        <div class="${shiftClass}">
                            ${displayName}
                            ${timeInfo}
                        </div>
                    `;
                } else {
                    cell.innerHTML = '-';
                }
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
        
        scheduleTable.appendChild(tbody);
        scheduleGrid.innerHTML = '';
        scheduleGrid.appendChild(scheduleTable);
        
    } catch (error) {
        console.error("Error loading schedule:", error);
        scheduleGrid.innerHTML = '<p class="error-text">Kunde inte läsa in schema</p>';
    }
}

// ==========================================
// REPORTS TAB
// ==========================================

async function loadReports() {
    // Reports are generated on demand, so this just ensures the UI is ready
}

async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportPeriod = document.getElementById('reportPeriod').value;
    const reportContent = document.getElementById('reportContent');
    
    reportContent.innerHTML = '<p class="loading">Genererar rapport...</p>';
    
    try {
        const { startDate, endDate } = getReportDateRange(reportPeriod);
        
        if (reportType === 'personal') {
            await generatePersonalReport(startDate, endDate);
        } else {
            await generateSummaryReport(startDate, endDate);
        }
    } catch (error) {
        console.error("Error generating report:", error);
        reportContent.innerHTML = '<p class="error-text">Kunde inte generera rapport</p>';
    }
}

async function generatePersonalReport(startDate, endDate) {
    const entriesRef = ref(db, `schema/timeEntries/${currentStaffId}`);
    const snapshot = await get(entriesRef);
    const reportContent = document.getElementById('reportContent');
    
    if (!snapshot.exists()) {
        reportContent.innerHTML = '<p class="info-text">Inga registreringar för vald period</p>';
        return;
    }
    
    const entries = snapshot.val();
    let reportHTML = `
        <h4>Personlig tidsrapport</h4>
        <p>Period: ${startDate.toLocaleDateString('sv-SE')} - ${endDate.toLocaleDateString('sv-SE')}</p>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Instämpling</th>
                    <th>Utstämpling</th>
                    <th>Timmar</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let totalHours = 0;
    
    for (const date in entries) {
        const entryDate = new Date(date);
        if (entryDate >= startDate && entryDate <= endDate) {
            const dayEntries = Object.values(entries[date]).sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            const clockIn = dayEntries.find(e => e.type === 'in');
            const clockOut = dayEntries.findLast(e => e.type === 'out');
            const hours = await calculateDayHours(dayEntries, date, currentStaffId);
            totalHours += hours;
            
            reportHTML += `
                <tr>
                    <td>${entryDate.toLocaleDateString('sv-SE')}</td>
                    <td>${clockIn ? clockIn.time : '-'}</td>
                    <td>${clockOut ? clockOut.time : '-'}</td>
                    <td>${hours.toFixed(1)}</td>
                </tr>
            `;
        }
    }
    
    reportHTML += `
            </tbody>
        </table>
        <div class="report-summary">
            Total arbetstid: ${totalHours.toFixed(1)} timmar
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
}

async function generateSummaryReport(startDate, endDate) {
    // Check if user is admin
    if (currentUserData.role !== 'admin') {
        document.getElementById('reportContent').innerHTML = 
            '<p class="error-text">Endast administratörer kan se sammanfattningsrapporter</p>';
        return;
    }
    
    const entriesRef = ref(db, `schema/timeEntries`);
    const usersRef = ref(db, `schema/users`);
    
    const [entriesSnapshot, usersSnapshot] = await Promise.all([
        get(entriesRef),
        get(usersRef)
    ]);
    
    const reportContent = document.getElementById('reportContent');
    
    if (!entriesSnapshot.exists() || !usersSnapshot.exists()) {
        reportContent.innerHTML = '<p class="info-text">Ingen data tillgänglig</p>';
        return;
    }
    
    const allEntries = entriesSnapshot.val();
    const users = usersSnapshot.val();
    
    let reportHTML = `
        <h4>Sammanfattande tidsrapport</h4>
        <p>Period: ${startDate.toLocaleDateString('sv-SE')} - ${endDate.toLocaleDateString('sv-SE')}</p>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Personal</th>
                    <th>Arbetade timmar</th>
                    <th>Arbetsdagar</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let grandTotal = 0;
    
    for (const userId in users) {
        if (allEntries[userId]) {
            const userEntries = allEntries[userId];
            let userHours = 0;
            let workDays = 0;
            
            for (const date in userEntries) {
                const entryDate = new Date(date);
                if (entryDate >= startDate && entryDate <= endDate) {
                    const dayEntries = Object.values(userEntries[date]);
                    const hours = await calculateDayHours(dayEntries, date, userId);
                    if (hours > 0) {
                        userHours += hours;
                        workDays++;
                    }
                }
            }
            
            grandTotal += userHours;
            
            reportHTML += `
                <tr>
                    <td>${users[userId].name}</td>
                    <td>${userHours.toFixed(1)}</td>
                    <td>${workDays}</td>
                </tr>
            `;
        }
    }
    
    reportHTML += `
            </tbody>
        </table>
        <div class="report-summary">
            Total arbetstid (alla anställda): ${grandTotal.toFixed(1)} timmar
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    // Konvertera söndag (0) till 7 för beräkning
    const dayOfWeek = day === 0 ? 7 : day;
    // Beräkna differensen till måndag (dag 1)
    const diff = dayOfWeek - 1;
    d.setDate(d.getDate() - diff);
    return d;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getDateRange(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(period) {
        case 'today':
            return { 
                startDate: today, 
                endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
            };
        case 'week':
            const weekStart = getWeekStart(today);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return { startDate: weekStart, endDate: weekEnd };
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return { startDate: monthStart, endDate: monthEnd };
        case 'custom':
            const customStart = new Date(document.getElementById('customStartDate').value);
            const customEnd = new Date(document.getElementById('customEndDate').value);
            return { startDate: customStart, endDate: customEnd };
        default:
            return { startDate: today, endDate: today };
    }
}

function getReportDateRange(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(period) {
        case 'thisWeek':
            const weekStart = getWeekStart(today);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return { startDate: weekStart, endDate: weekEnd };
        case 'lastWeek':
            const lastWeekStart = getWeekStart(today);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
            return { startDate: lastWeekStart, endDate: lastWeekEnd };
        case 'thisMonth':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return { startDate: monthStart, endDate: monthEnd };
        case 'lastMonth':
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            return { startDate: lastMonthStart, endDate: lastMonthEnd };
        case 'custom':
            const customStart = new Date(document.getElementById('reportStartDate').value);
            const customEnd = new Date(document.getElementById('reportEndDate').value);
            return { startDate: customStart, endDate: customEnd };
        default:
            return { startDate: today, endDate: today };
    }
}

async function calculateDayHours(entries, date = null, userId = null) {
    let totalHours = 0;
    const sortedEntries = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    for (let i = 0; i < sortedEntries.length - 1; i += 2) {
        if (sortedEntries[i].type === 'in' && sortedEntries[i + 1].type === 'out') {
            const timeIn = sortedEntries[i].time.split(':');
            const timeOut = sortedEntries[i + 1].time.split(':');
            
            const minutesIn = parseInt(timeIn[0]) * 60 + parseInt(timeIn[1]);
            const minutesOut = parseInt(timeOut[0]) * 60 + parseInt(timeOut[1]);
            
            const diffMinutes = minutesOut - minutesIn;
            totalHours += diffMinutes / 60;
        }
    }
    
    // Dra av rasttid från schemat
    if (date && userId) {
        try {
            const scheduleRef = ref(db, `schema/schedules/${userId}/${date}`);
            const snapshot = await get(scheduleRef);
            
            if (snapshot.exists()) {
                const schedule = snapshot.val();
                const breakMinutes = schedule.breakMinutes || 0;
                totalHours -= breakMinutes / 60;
            }
        } catch (error) {
            console.error('Error fetching break time:', error);
        }
    }
    
    return totalHours;
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '100px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '2000';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '100px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '2000';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function initializeEventListeners() {
    // User switching
    document.getElementById('switchUserBtn').addEventListener('click', switchUser);
    
    // Quick actions in overview
    document.getElementById('quickClockIn').addEventListener('click', () => {
        showClockModal('in');
    });
    
    document.getElementById('quickClockOut').addEventListener('click', () => {
        showClockModal('out');
    });
    
    document.getElementById('viewMySchedule').addEventListener('click', () => {
        document.querySelector('[data-tab="schedule"]').click();
    });
    
    // Clock buttons in timesheet
    document.getElementById('clockInBtn').addEventListener('click', () => {
        showClockModal('in');
    });
    
    document.getElementById('clockOutBtn').addEventListener('click', () => {
        showClockModal('out');
    });
    
    // Timesheet period change
    document.getElementById('timesheetPeriod').addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            document.getElementById('customDateRange').style.display = 'flex';
        } else {
            document.getElementById('customDateRange').style.display = 'none';
            loadTimesheet();
        }
    });
    
    document.getElementById('applyCustomRange').addEventListener('click', () => {
        loadTimesheet();
    });
    
    // Schedule navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        currentWeekOffset--;
        loadSchedule();
    });
    
    document.getElementById('nextWeek').addEventListener('click', () => {
        currentWeekOffset++;
        loadSchedule();
    });
    
    document.getElementById('todayWeek').addEventListener('click', () => {
        currentWeekOffset = 0;
        loadSchedule();
    });
    
    // Report controls
    document.getElementById('reportPeriod').addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            document.getElementById('reportCustomDates').style.display = 'flex';
        } else {
            document.getElementById('reportCustomDates').style.display = 'none';
        }
    });
    
    document.getElementById('generateReport').addEventListener('click', generateReport);
    
    document.getElementById('exportReport').addEventListener('click', () => {
        // TODO: Implement Excel export
        alert('Export-funktionen kommer snart!');
    });
    
    // Admin button
    document.getElementById('adminButton').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
    
    // Modal controls
    document.getElementById('confirmClock').addEventListener('click', handleClockConfirm);
    document.getElementById('cancelClock').addEventListener('click', hideClockModal);
    document.getElementById('modalOverlay').addEventListener('click', hideClockModal);
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

let currentClockType = null;

function showClockModal(type) {
    currentClockType = type;
    const modal = document.getElementById('clockModal');
    const overlay = document.getElementById('modalOverlay');
    const title = document.getElementById('clockModalTitle');
    const timeInput = document.getElementById('clockTime');
    
    title.textContent = type === 'in' ? 'Stämpla in' : 'Stämpla ut';
    
    // Set current time as default
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function hideClockModal() {
    const modal = document.getElementById('clockModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    document.getElementById('clockComment').value = '';
    currentClockType = null;
}

async function handleClockConfirm() {
    const time = document.getElementById('clockTime').value;
    const comment = document.getElementById('clockComment').value;
    
    if (!time) {
        showErrorMessage('Ange en tid');
        return;
    }
    
    try {
        if (currentClockType === 'in') {
            await clockIn(time, comment);
        } else {
            await clockOut(time, comment);
        }
        
        hideClockModal();
    } catch (error) {
        console.error("Error clocking in/out:", error);
        showErrorMessage('Något gick fel. Försök igen.');
    }
}

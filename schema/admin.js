// Schema Administration - JavaScript
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, update, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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
let editingUserId = null;
let selectedScheduleUser = null;
let selectedWeek = null;
let systemSettings = {
    defaultBreak: 30,
    defaultStartTime: '08:00',
    defaultEndTime: '17:00'
};

// Logout function
window.logout = () => {
    auth.signOut().then(() => {
        window.location.href = "../index/login.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
};

// ==========================================
// AUTHENTICATION
// ==========================================

// Check authentication on page load
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Redirect to login page if not authenticated
        window.location.href = "../index/login.html";
        return;
    }
    
    // User is authenticated
    currentUser = user;
    await loadUserData();
    
    // Check if user is admin
    if (!currentUserData || currentUserData.role !== 'admin') {
        alert('Du har inte behörighet att se denna sida');
        window.location.href = 'schema.html';
        return;
    }
    
    initializeAdmin();
});

async function loadUserData() {
    try {
        const userRef = ref(db, `schema/users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            currentUserData = snapshot.val();
        } else {
            // Create user profile if it doesn't exist
            console.log("Creating new user profile...");
            currentUserData = {
                email: currentUser.email,
                name: currentUser.email.split('@')[0],
                role: 'staff',
                createdAt: new Date().toISOString()
            };
            await set(userRef, currentUserData);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        alert(`Databasfel: ${error.message}\n\nKontrollera att Firebase Realtime Database security rules är korrekt konfigurerade.\n\nSe README.md för instruktioner.`);
        throw error;
    }
}

function initializeAdmin() {
    initializeTabs();
    loadUsers();
    loadScheduleUsers();
    loadSettings();
    initializeEventListeners();
    
    // Set current week
    const today = new Date();
    const weekPicker = document.getElementById('scheduleWeekPicker');
    weekPicker.value = getWeekString(today);
}

// ==========================================
// TAB NAVIGATION
// ==========================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const sections = document.querySelectorAll('.admin-section');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabId}-section`).classList.add('active');
        });
    });
}

// ==========================================
// USER MANAGEMENT
// ==========================================

async function loadUsers() {
    const usersRef = ref(db, 'schema/users');
    const usersList = document.getElementById('usersList');
    
    try {
        const snapshot = await get(usersRef);
        usersList.innerHTML = '';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            for (const userId in users) {
                const user = users[userId];
                const userCard = createUserCard(userId, user);
                usersList.appendChild(userCard);
            }
        } else {
            usersList.innerHTML = '<p class="info-text">Ingen personal registrerad än</p>';
        }
    } catch (error) {
        console.error("Error loading users:", error);
        usersList.innerHTML = '<p class="error-text">Kunde inte läsa in personal</p>';
    }
}

function createUserCard(userId, user) {
    const card = document.createElement('div');
    card.className = `user-card ${user.role === 'admin' ? 'admin' : ''}`;
    
    card.innerHTML = `
        <h4>${user.name}</h4>
        <p><strong>E-post:</strong> ${user.email}</p>
        <p><strong>Roll:</strong> ${user.role === 'admin' ? 'Administratör' : 'Personal'}</p>
        ${user.employeeId ? `<p><strong>Anställningsnr:</strong> ${user.employeeId}</p>` : ''}
        <div class="user-actions">
            <button class="small-btn" onclick="editUser('${userId}')">Redigera</button>
            <button class="small-btn" style="background: #dc3545;" onclick="deleteUser('${userId}')">Ta bort</button>
        </div>
    `;
    
    return card;
}

window.editUser = async function(userId) {
    editingUserId = userId;
    const userRef = ref(db, `schema/users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
        const user = snapshot.val();
        
        document.getElementById('userModalTitle').textContent = 'Redigera personal';
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userPin').value = user.pin || '';
        document.getElementById('userEmployeeId').value = user.employeeId || '';
        
        showUserModal();
    }
};

window.deleteUser = async function(userId) {
    if (!confirm('Är du säker på att du vill ta bort denna personal? Detta kan inte ångras.')) {
        return;
    }
    
    try {
        await remove(ref(db, `schema/users/${userId}`));
        showSuccessMessage('Personal borttagen');
        loadUsers();
        loadScheduleUsers();
    } catch (error) {
        console.error("Error deleting user:", error);
        showErrorMessage('Kunde inte ta bort personal');
    }
};

async function saveUser() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    const employeeId = document.getElementById('userEmployeeId').value;
    const pin = document.getElementById('userPin').value;
    
    if (!name || !email) {
        showErrorMessage('Namn och e-post är obligatoriska');
        return;
    }
    
    if (!pin || pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
        showErrorMessage('Personalkod måste vara 4 siffror');
        return;
    }
    
    const userData = {
        name,
        email,
        role,
        pin,
        employeeId: employeeId || null,
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (editingUserId) {
            // Update existing user
            await update(ref(db, `schema/users/${editingUserId}`), userData);
            showSuccessMessage('Personal uppdaterad');
        } else {
            // Create new user (note: in real app, you'd use Firebase Auth)
            const newUserId = push(ref(db, 'schema/users')).key;
            userData.createdAt = new Date().toISOString();
            await set(ref(db, `schema/users/${newUserId}`), userData);
            showSuccessMessage('Personal tillagd');
        }
        
        hideUserModal();
        loadUsers();
        loadScheduleUsers();
    } catch (error) {
        console.error("Error saving user:", error);
        showErrorMessage('Kunde inte spara personal');
    }
}

// ==========================================
// SCHEDULE MANAGEMENT
// ==========================================

async function loadScheduleUsers() {
    const usersRef = ref(db, 'schema/users');
    const select = document.getElementById('scheduleUserSelect');
    
    try {
        const snapshot = await get(usersRef);
        select.innerHTML = '<option value="">Välj en person...</option>';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            for (const userId in users) {
                const user = users[userId];
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = user.name;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error("Error loading users for schedule:", error);
    }
}

async function loadScheduleEditor(userId, weekString) {
    selectedScheduleUser = userId;
    selectedWeek = weekString;
    
    const editor = document.getElementById('scheduleEditor');
    const grid = document.getElementById('scheduleEditorGrid');
    
    editor.style.display = 'block';
    
    // Calculate week number
    const [year, week] = weekString.split('-W');
    document.getElementById('editWeekNumber').textContent = `${week}, ${year}`;
    
    // Get week start date
    const weekStart = getDateOfISOWeek(week, year);
    
    // Create day editors
    grid.innerHTML = '';
    const weekDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Load existing schedule for this day
        const scheduleRef = ref(db, `schema/schedules/${userId}/${dateStr}`);
        const snapshot = await get(scheduleRef);
        
        let schedule = {
            type: 'day',
            startTime: systemSettings.defaultStartTime,
            endTime: systemSettings.defaultEndTime,
            breakMinutes: systemSettings.defaultBreak
        };
        
        if (snapshot.exists()) {
            schedule = snapshot.val();
        }
        
        const dayEditor = createDayEditor(i, weekDays[i], dateStr, schedule);
        grid.appendChild(dayEditor);
    }
}

function createDayEditor(index, dayName, date, schedule) {
    const div = document.createElement('div');
    div.className = 'day-editor';
    
    div.innerHTML = `
        <h5>${dayName}</h5>
        <small>${new Date(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</small>
        <select id="type-${index}" data-date="${date}">
            <option value="day" ${schedule.type === 'day' ? 'selected' : ''}>Arbete</option>
            <option value="off" ${schedule.type === 'off' ? 'selected' : ''}>Ledig</option>
        </select>
        <input type="time" id="start-${index}" value="${schedule.startTime || '08:00'}" 
               ${schedule.type === 'off' ? 'disabled' : ''}>
        <input type="time" id="end-${index}" value="${schedule.endTime || '17:00'}"
               ${schedule.type === 'off' ? 'disabled' : ''}>
        <label style="font-size: 12px; margin-top: 5px;">Rast (min):</label>
        <input type="number" id="break-${index}" value="${schedule.breakMinutes !== undefined ? schedule.breakMinutes : systemSettings.defaultBreak}" min="0" max="120" step="15"
               ${schedule.type === 'off' ? 'disabled' : ''} style="width: 60px;">
    `;
    
    // Add event listener to disable times when "off" is selected
    const select = div.querySelector('select');
    select.addEventListener('change', (e) => {
        const startInput = div.querySelector(`#start-${index}`);
        const endInput = div.querySelector(`#end-${index}`);
        const breakInput = div.querySelector(`#break-${index}`);
        
        if (e.target.value === 'off') {
            startInput.disabled = true;
            endInput.disabled = true;
            breakInput.disabled = true;
        } else {
            startInput.disabled = false;
            endInput.disabled = false;
            breakInput.disabled = false;
            // Default times for day shift
            startInput.value = '08:00';
            endInput.value = '17:00';
        }
    });
    
    return div;
}

async function saveSchedule() {
    if (!selectedScheduleUser || !selectedWeek) {
        showErrorMessage('Välj personal och vecka först');
        return;
    }
    
    try {
        const grid = document.getElementById('scheduleEditorGrid');
        const dayEditors = grid.querySelectorAll('.day-editor');
        
        for (let i = 0; i < dayEditors.length; i++) {
            const type = document.getElementById(`type-${i}`).value;
            const date = document.getElementById(`type-${i}`).dataset.date;
            const startTime = document.getElementById(`start-${i}`).value;
            const endTime = document.getElementById(`end-${i}`).value;
            const breakMinutes = parseInt(document.getElementById(`break-${i}`).value) || 0;
            
            const scheduleData = {
                type,
                startTime: type !== 'off' ? startTime : null,
                endTime: type !== 'off' ? endTime : null,
                breakMinutes: type !== 'off' ? breakMinutes : 0,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.uid
            };
            
            await set(ref(db, `schema/schedules/${selectedScheduleUser}/${date}`), scheduleData);
        }
        
        showSuccessMessage('Schema sparat!');
    } catch (error) {
        console.error("Error saving schedule:", error);
        showErrorMessage('Kunde inte spara schema');
    }
}

async function copyPreviousWeek() {
    if (!selectedScheduleUser || !selectedWeek) {
        showErrorMessage('Välj personal och vecka först');
        return;
    }
    
    const [year, week] = selectedWeek.split('-W');
    const prevWeek = parseInt(week) - 1;
    const prevYear = prevWeek < 1 ? parseInt(year) - 1 : year;
    const prevWeekNum = prevWeek < 1 ? 52 : prevWeek;
    
    try {
        const prevWeekStart = getDateOfISOWeek(prevWeekNum, prevYear);
        const currentWeekStart = getDateOfISOWeek(week, year);
        
        for (let i = 0; i < 7; i++) {
            const prevDate = new Date(prevWeekStart);
            prevDate.setDate(prevDate.getDate() + i);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            
            const currentDate = new Date(currentWeekStart);
            currentDate.setDate(currentDate.getDate() + i);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            // Get previous week's schedule
            const prevScheduleRef = ref(db, `schema/schedules/${selectedScheduleUser}/${prevDateStr}`);
            const snapshot = await get(prevScheduleRef);
            
            if (snapshot.exists()) {
                const schedule = snapshot.val();
                
                // Update inputs
                document.getElementById(`type-${i}`).value = schedule.type;
                if (schedule.startTime) document.getElementById(`start-${i}`).value = schedule.startTime;
                if (schedule.endTime) document.getElementById(`end-${i}`).value = schedule.endTime;
                
                // Enable/disable time inputs
                const startInput = document.getElementById(`start-${i}`);
                const endInput = document.getElementById(`end-${i}`);
                startInput.disabled = schedule.type === 'off';
                endInput.disabled = schedule.type === 'off';
            }
        }
        
        showSuccessMessage('Schema kopierat från föregående vecka');
    } catch (error) {
        console.error("Error copying schedule:", error);
        showErrorMessage('Kunde inte kopiera schema');
    }
}

// ==========================================
// TIME APPROVAL
// ==========================================

async function loadApprovals() {
    const period = document.getElementById('approvalPeriod').value;
    const { startDate, endDate } = getApprovalDateRange(period);
    
    const approvalsList = document.getElementById('approvalsList');
    approvalsList.innerHTML = '<p class="loading">Läser in tidrapporter...</p>';
    
    try {
        const entriesRef = ref(db, 'schema/timeEntries');
        const usersRef = ref(db, 'schema/users');
        
        const [entriesSnapshot, usersSnapshot] = await Promise.all([
            get(entriesRef),
            get(usersRef)
        ]);
        
        if (!entriesSnapshot.exists() || !usersSnapshot.exists()) {
            approvalsList.innerHTML = '<p class="info-text">Inga tidrapporter för vald period</p>';
            return;
        }
        
        const allEntries = entriesSnapshot.val();
        const users = usersSnapshot.val();
        
        let html = '<table class="report-table"><thead><tr><th>Personal</th><th>Datum</th><th>In</th><th>Ut</th><th>Timmar</th><th>Status</th></tr></thead><tbody>';
        
        let hasData = false;
        
        for (const userId in allEntries) {
            const userEntries = allEntries[userId];
            const userName = users[userId]?.name || 'Okänd';
            
            for (const date in userEntries) {
                const entryDate = new Date(date);
                
                if (entryDate >= startDate && entryDate <= endDate) {
                    hasData = true;
                    const dayEntries = Object.values(userEntries[date]).sort((a, b) => 
                        new Date(a.timestamp) - new Date(b.timestamp)
                    );
                    
                    const clockIn = dayEntries.find(e => e.type === 'in');
                    const clockOut = dayEntries.findLast(e => e.type === 'out');
                    const hours = await calculateDayHours(dayEntries, date, userId);
                    
                    html += `
                        <tr>
                            <td>${userName}</td>
                            <td>${entryDate.toLocaleDateString('sv-SE')}</td>
                            <td>${clockIn ? clockIn.time : '-'}</td>
                            <td>${clockOut ? clockOut.time : '-'}</td>
                            <td>${hours.toFixed(1)}</td>
                            <td>
                                <span style="color: #28a745;">✓ Godkänd</span>
                            </td>
                        </tr>
                    `;
                }
            }
        }
        
        html += '</tbody></table>';
        
        if (hasData) {
            approvalsList.innerHTML = html;
        } else {
            approvalsList.innerHTML = '<p class="info-text">Inga tidrapporter för vald period</p>';
        }
        
    } catch (error) {
        console.error("Error loading approvals:", error);
        approvalsList.innerHTML = '<p class="error-text">Kunde inte läsa in tidrapporter</p>';
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

// ==========================================
// SETTINGS
// ==========================================

async function loadSettings() {
    const settingsRef = ref(db, 'schema/settings');
    
    try {
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
            const settings = snapshot.val();
            
            // Spara i global variabel
            systemSettings = {
                defaultBreak: settings.defaultBreak || 30,
                defaultStartTime: settings.defaultStartTime || '08:00',
                defaultEndTime: settings.defaultEndTime || '17:00',
                loginMethod: settings.loginMethod || 'pin'
            };
            
            // Uppdatera UI
            if (settings.defaultStartTime) {
                document.getElementById('defaultStartTime').value = settings.defaultStartTime;
            }
            if (settings.defaultEndTime) {
                document.getElementById('defaultEndTime').value = settings.defaultEndTime;
            }
            if (settings.defaultBreak !== undefined) {
                document.getElementById('defaultBreak').value = settings.defaultBreak;
            }
            if (settings.loginMethod) {
                document.getElementById('loginMethod').value = settings.loginMethod;
            }
            if (settings.editDays !== undefined) {
                document.getElementById('editDays').value = settings.editDays;
            }
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

async function saveSettings() {
    const settings = {
        defaultStartTime: document.getElementById('defaultStartTime').value,
        defaultEndTime: document.getElementById('defaultEndTime').value,
        defaultBreak: parseInt(document.getElementById('defaultBreak').value),
        loginMethod: document.getElementById('loginMethod').value,
        editDays: parseInt(document.getElementById('editDays').value),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
    };
    
    try {
        await set(ref(db, 'schema/settings'), settings);
        showSuccessMessage('Inställningar sparade');
    } catch (error) {
        console.error("Error saving settings:", error);
        showErrorMessage('Kunde inte spara inställningar');
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getWeekString(date) {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getDateOfISOWeek(week, year) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const dayOfWeek = dow === 0 ? 7 : dow; // Konvertera söndag (0) till 7
    const ISOweekStart = new Date(simple);
    
    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - dayOfWeek + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - dayOfWeek);
    }
    return ISOweekStart;
}

function getApprovalDateRange(period) {
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
        default:
            return { startDate: today, endDate: today };
    }
}

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
// MODAL FUNCTIONS
// ==========================================

function showUserModal() {
    document.getElementById('userModal').classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function hideUserModal() {
    document.getElementById('userModal').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
    
    // Reset form
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userRole').value = 'staff';
    document.getElementById('userPin').value = '';
    document.getElementById('userEmployeeId').value = '';
    
    editingUserId = null;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function initializeEventListeners() {
    // User management
    document.getElementById('addUserBtn').addEventListener('click', () => {
        editingUserId = null;
        document.getElementById('userModalTitle').textContent = 'Lägg till personal';
        showUserModal();
    });
    
    document.getElementById('saveUser').addEventListener('click', saveUser);
    document.getElementById('cancelUser').addEventListener('click', hideUserModal);
    document.getElementById('modalOverlay').addEventListener('click', hideUserModal);
    
    // Schedule management
    document.getElementById('scheduleUserSelect').addEventListener('change', (e) => {
        const userId = e.target.value;
        const weekString = document.getElementById('scheduleWeekPicker').value;
        
        if (userId && weekString) {
            loadScheduleEditor(userId, weekString);
        }
    });
    
    document.getElementById('scheduleWeekPicker').addEventListener('change', (e) => {
        const userId = document.getElementById('scheduleUserSelect').value;
        const weekString = e.target.value;
        
        if (userId && weekString) {
            loadScheduleEditor(userId, weekString);
        }
    });
    
    document.getElementById('schedPrevWeek').addEventListener('click', () => {
        const picker = document.getElementById('scheduleWeekPicker');
        const [year, week] = picker.value.split('-W');
        const prevWeek = parseInt(week) - 1;
        const newYear = prevWeek < 1 ? parseInt(year) - 1 : year;
        const newWeek = prevWeek < 1 ? 52 : prevWeek;
        
        picker.value = `${newYear}-W${String(newWeek).padStart(2, '0')}`;
        picker.dispatchEvent(new Event('change'));
    });
    
    document.getElementById('schedNextWeek').addEventListener('click', () => {
        const picker = document.getElementById('scheduleWeekPicker');
        const [year, week] = picker.value.split('-W');
        const nextWeek = parseInt(week) + 1;
        const newYear = nextWeek > 52 ? parseInt(year) + 1 : year;
        const newWeek = nextWeek > 52 ? 1 : nextWeek;
        
        picker.value = `${newYear}-W${String(newWeek).padStart(2, '0')}`;
        picker.dispatchEvent(new Event('change'));
    });
    
    document.getElementById('saveSchedule').addEventListener('click', saveSchedule);
    document.getElementById('copySchedule').addEventListener('click', copyPreviousWeek);
    
    // Time approval
    document.getElementById('loadApprovals').addEventListener('click', loadApprovals);
    
    // Settings
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
}

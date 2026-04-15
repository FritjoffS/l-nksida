import { auth, database, ref, get, onValue, set, update, onAuthStateChanged, signOut } from '../scripts/firebase-config.js';

// DOM-element
let startDateInput, endDateInput, loadDataBtn, todayBtn, weekBtn, monthBtn;
let deviceFilterSelect, manageDevicesBtn, deviceModal, closeModalBtn, devicesListEl;
let totalCountEl, totalDaysEl, avgPerDayEl, avgPerHourEl;
let dailyStatsBody, hourlyChartEl, detailsBody, detailsContainer, showDetailsToggle;
let deviceStatsContainer;
let loadingOverlay, messageBox;

// Authentication
let currentUser = null;

// Device management
let allDevices = {};
let selectedDeviceId = 'all';

// Data cache
let currentData = null;
let activeListener = null;
let isLiveMode = false;
let currentDailyStats = null;
let selectedDate = null;

// Initialisera sidan
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Not logged in, redirect to login page
            window.location.href = '../index/login.html';
        } else {
            // User is logged in
            currentUser = user;
            await initializeApp();
        }
    });
});

// Initialize the app after authentication is confirmed
async function initializeApp() {
    initializeElements();
    attachEventListeners();
    setTodayAsDefault();
    await loadDevices(); // Vänta på att enheter laddas först
    setupLiveUpdates(); // Starta live-uppdateringar för idag
}

// Logout function (accessible from navbar)
window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = '../index/login.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
};

function initializeElements() {
    // Datuminmatning
    startDateInput = document.getElementById('startDate');
    endDateInput = document.getElementById('endDate');
    
    // Knappar
    loadDataBtn = document.getElementById('loadDataBtn');
    todayBtn = document.getElementById('todayBtn');
    weekBtn = document.getElementById('weekBtn');
    monthBtn = document.getElementById('monthBtn');
    manageDevicesBtn = document.getElementById('manageDevicesBtn');
    
    // Device filter
    deviceFilterSelect = document.getElementById('deviceFilter');
    
    // Modal
    deviceModal = document.getElementById('deviceModal');
    closeModalBtn = document.getElementById('closeModal');
    devicesListEl = document.getElementById('devicesList');
    
    // Sammanfattning
    totalCountEl = document.getElementById('totalCount');
    totalDaysEl = document.getElementById('totalDays');
    avgPerDayEl = document.getElementById('avgPerDay');
    avgPerHourEl = document.getElementById('avgPerHour');
    
    // Tabeller och diagram
    dailyStatsBody = document.getElementById('dailyStatsBody');
    hourlyChartEl = document.getElementById('hourlyChart');
    deviceStatsContainer = document.getElementById('deviceStatsContainer');
    detailsBody = document.getElementById('detailsBody');
    detailsContainer = document.getElementById('detailsContainer');
    showDetailsToggle = document.getElementById('showDetailsToggle');
    
    // UI-element
    loadingOverlay = document.getElementById('loadingOverlay');
    messageBox = document.getElementById('messageBox');
}

function attachEventListeners() {
    loadDataBtn.addEventListener('click', loadData);
    todayBtn.addEventListener('click', setTodayPeriod);
    weekBtn.addEventListener('click', setWeekPeriod);
    monthBtn.addEventListener('click', setMonthPeriod);
    showDetailsToggle.addEventListener('change', toggleDetails);
    manageDevicesBtn.addEventListener('click', openDeviceModal);
    closeModalBtn.addEventListener('click', closeDeviceModal);
    deviceFilterSelect.addEventListener('change', handleDeviceFilter);
    
    // Stäng modal vid klick utanför
    deviceModal.addEventListener('click', (e) => {
        if (e.target === deviceModal) {
            closeDeviceModal();
        }
    });
}

function setTodayAsDefault() {
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;
}

function setTodayPeriod() {
    setTodayAsDefault();
    setupLiveUpdates();
}

function setWeekPeriod() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = söndag, 1 = måndag, etc.
    
    // Beräkna antal dagar tillbaka till senaste måndag
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    startDateInput.value = monday.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];
    stopLiveUpdates();
    loadData();
}

function setMonthPeriod() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];
    stopLiveUpdates();
    loadData();
}

function toggleDetails() {
    if (showDetailsToggle.checked) {
        detailsContainer.style.display = 'block';
        if (currentData) {
            displayDetails(currentData);
        }
    } else {
        detailsContainer.style.display = 'none';
    }
}

// =================================
// Device Management
// =================================

async function loadDevices() {
    try {
        const devicesRef = ref(database, 'devices');
        const snapshot = await get(devicesRef);
        
        if (snapshot.exists()) {
            allDevices = snapshot.val();
        } else {
            allDevices = {};
        }
        
        updateDeviceFilter();
        
        // Lyssna på ändringar i devices
        onValue(devicesRef, (snapshot) => {
            if (snapshot.exists()) {
                allDevices = snapshot.val();
                updateDeviceFilter();
                
                // Uppdatera data om en enhet har ändrats
                if (currentData) {
                    displayDeviceStats(currentData);
                }
            }
        });
    } catch (error) {
        console.error('Fel vid laddning av enheter:', error);
    }
}

function updateDeviceFilter() {
    const currentSelection = deviceFilterSelect.value;
    deviceFilterSelect.innerHTML = '<option value="all">Alla enheter</option>';
    
    Object.keys(allDevices).forEach(deviceId => {
        const device = allDevices[deviceId];
        const option = document.createElement('option');
        option.value = deviceId;
        option.textContent = device.name || `Device-${deviceId}`;
        deviceFilterSelect.appendChild(option);
    });
    
    // Återställ valet om det fortfarande finns
    if (currentSelection && (currentSelection === 'all' || allDevices[currentSelection])) {
        deviceFilterSelect.value = currentSelection;
    }
}

function handleDeviceFilter() {
    selectedDeviceId = deviceFilterSelect.value;
    
    if (currentData) {
        // Filtrera och visa data igen
        const filteredData = filterDataByDevice(currentData, selectedDeviceId);
        displayData(filteredData);
    }
}

function filterDataByDevice(data, deviceId) {
    if (deviceId === 'all') {
        return data;
    }
    
    const filteredEntries = data.entries.filter(entry => entry.device_id === deviceId);
    
    return {
        ...data,
        entries: filteredEntries
    };
}

function openDeviceModal() {
    deviceModal.style.display = 'flex';
    renderDevicesList();
}

function closeDeviceModal() {
    deviceModal.style.display = 'none';
}

async function renderDevicesList() {
    devicesListEl.innerHTML = '<p class="no-data">Laddar enheter...</p>';
    
    try {
        const devicesRef = ref(database, 'devices');
        const snapshot = await get(devicesRef);
        
        if (snapshot.exists()) {
            const devices = snapshot.val();
            devicesListEl.innerHTML = '';
            
            // Sortera efter device_id
            const sortedDeviceIds = Object.keys(devices).sort();
            
            sortedDeviceIds.forEach(deviceId => {
                const device = devices[deviceId];
                const deviceItem = createDeviceItem(deviceId, device);
                devicesListEl.appendChild(deviceItem);
            });
        } else {
            devicesListEl.innerHTML = '<p class="no-data">Inga enheter hittades. Enheter kommer automatiskt att upptäckas när de loggar data.</p>';
        }
    } catch (error) {
        console.error('Fel vid hämtning av enheter:', error);
        devicesListEl.innerHTML = '<p class="no-data">Kunde inte ladda enheter</p>';
    }
}

function createDeviceItem(deviceId, device) {
    const item = document.createElement('div');
    item.className = 'device-item';
    
    const isNew = device.first_seen && isRecentlyAdded(device.first_seen);
    const statusClass = device.active !== false ? 'active' : 'inactive';
    const statusText = device.active !== false ? 'Aktiv' : 'Inaktiv';
    
    item.innerHTML = `
        <div class="device-item-header">
            <div class="device-item-info">
                <div class="device-item-name">
                    ${device.name || `Device-${deviceId}`}
                    ${isNew ? '<span class="new-device-badge">NY</span>' : ''}
                </div>
                <div class="device-item-id">ID: ${deviceId}</div>
            </div>
            <div class="device-status ${statusClass}">${statusText}</div>
        </div>
        <div class="device-item-details">
            <div><strong>MAC:</strong> ${device.mac_address || '-'}</div>
            <div><strong>Först sedd:</strong> ${device.first_seen || '-'}</div>
            <div><strong>Senast sedd:</strong> ${device.last_seen || '-'}</div>
        </div>
        <div class="device-item-actions">
            <input type="text" 
                   id="name-${deviceId}" 
                   placeholder="Ange namn..." 
                   value="${device.name || ''}"
                   data-device-id="${deviceId}">
            <button class="btn btn-small btn-success" onclick="saveDeviceName('${deviceId}')">
                💾 Spara namn
            </button>
            <button class="btn btn-small ${device.active !== false ? 'btn-danger' : 'btn-success'}" 
                    onclick="toggleDeviceActive('${deviceId}', ${device.active !== false})">
                ${device.active !== false ? '🚫 Inaktivera' : '✅ Aktivera'}
            </button>
        </div>
    `;
    
    return item;
}

function isRecentlyAdded(timestamp) {
    const now = new Date();
    const added = new Date(timestamp);
    const hoursDiff = (now - added) / (1000 * 60 * 60);
    return hoursDiff < 24; // Ny om mindre än 24 timmar
}

// Globala funktioner för att anropas från HTML
window.saveDeviceName = async function(deviceId) {
    const nameInput = document.getElementById(`name-${deviceId}`);
    const newName = nameInput.value.trim();
    
    if (!newName) {
        showMessage('Ange ett namn för enheten', 'warning');
        return;
    }
    
    try {
        const deviceRef = ref(database, `devices/${deviceId}`);
        await update(deviceRef, { name: newName });
        
        allDevices[deviceId].name = newName;
        updateDeviceFilter();
        showMessage('Enhetsnamn sparat', 'success');
    } catch (error) {
        console.error('Fel vid sparande av enhetsnamn:', error);
        showMessage('Kunde inte spara enhetsnamn', 'error');
    }
};

window.toggleDeviceActive = async function(deviceId, currentlyActive) {
    try {
        const deviceRef = ref(database, `devices/${deviceId}`);
        const newActiveState = !currentlyActive;
        
        await update(deviceRef, { active: newActiveState });
        
        allDevices[deviceId].active = newActiveState;
        renderDevicesList();
        showMessage(`Enhet ${newActiveState ? 'aktiverad' : 'inaktiverad'}`, 'success');
    } catch (error) {
        console.error('Fel vid ändring av enhetsstatus:', error);
        showMessage('Kunde inte ändra enhetsstatus', 'error');
    }
};

async function detectAndRegisterDevice(entry) {
    const deviceId = entry.device_id;
    
    if (!deviceId) {
        return; // Ingen device_id
    }
    
    // Kolla först i cache
    if (allDevices[deviceId]) {
        return; // Enheten finns redan
    }
    
    // Dubbelkolla i Firebase för att undvika race conditions
    try {
        const deviceRef = ref(database, `devices/${deviceId}`);
        const snapshot = await get(deviceRef);
        
        if (snapshot.exists()) {
            // Enheten finns redan i Firebase, uppdatera bara cache
            allDevices[deviceId] = snapshot.val();
            updateDeviceFilter();
            return;
        }
        
        // Ny enhet - registrera den
        const newDevice = {
            device_id: deviceId,
            name: entry.device_name || `Device-${deviceId}`,
            mac_address: entry.mac_address || '',
            first_seen: entry.timestamp,
            last_seen: entry.timestamp,
            active: true
        };
        
        await set(deviceRef, newDevice);
        allDevices[deviceId] = newDevice;
        
        updateDeviceFilter();
        showMessage(`Ny enhet upptäckt: ${deviceId}`, 'info');
    } catch (error) {
        console.error('Fel vid registrering av ny enhet:', error);
    }
}

async function updateDeviceLastSeen(deviceId, timestamp) {
    if (!deviceId || !allDevices[deviceId]) return;
    
    try {
        const deviceRef = ref(database, `devices/${deviceId}`);
        await update(deviceRef, { last_seen: timestamp });
    } catch (error) {
        console.error('Fel vid uppdatering av last_seen:', error);
    }
}

async function loadData() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
        showMessage('Välj både start- och slutdatum', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showMessage('Startdatum kan inte vara efter slutdatum', 'error');
        return;
    }
    
    // Stäng av live-läge om annat än idag
    const today = new Date().toISOString().split('T')[0];
    if (startDate !== today || endDate !== today) {
        stopLiveUpdates();
    }
    
    showLoading(true);
    
    try {
        const data = await fetchCustomerData(startDate, endDate);
        currentData = data;
        
        if (data.entries.length === 0) {
            showMessage('Ingen data hittades för vald period', 'warning');
            resetDisplay();
        } else {
            displayData(data);
            showMessage(`Data laddad: ${data.entries.length} registreringar`, 'success');
        }
    } catch (error) {
        console.error('Fel vid hämtning av data:', error);
        showMessage('Ett fel uppstod vid hämtning av data', 'error');
    } finally {
        showLoading(false);
    }
}

async function fetchCustomerData(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allEntries = [];
    
    // Loop genom alla datum i perioden
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        
        const dayPath = `customers/${year}/${month}/${day}`;
        const dayRef = ref(database, dayPath);
        
        try {
            const snapshot = await get(dayRef);
            if (snapshot.exists()) {
                const dayData = snapshot.val();
                // Konvertera till array med datum
                Object.keys(dayData).forEach(key => {
                    const entry = {
                        ...dayData[key],
                        id: key,
                        date: `${year}-${month}-${day}`
                    };
                    allEntries.push(entry);
                    
                    // Upptäck och registrera nya enheter
                    if (entry.device_id) {
                        detectAndRegisterDevice(entry);
                        updateDeviceLastSeen(entry.device_id, entry.timestamp);
                    }
                });
            }
        } catch (error) {
            console.warn(`Kunde inte hämta data för ${year}-${month}-${day}:`, error);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sortera efter tidsstämpel
    allEntries.sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    return {
        entries: allEntries,
        startDate,
        endDate
    };
}

function displayData(data) {
    const { entries } = data;
    
    // Filtrera enligt vald enhet
    const filteredData = filterDataByDevice(data, selectedDeviceId);
    const filteredEntries = filteredData.entries;
    
    // Beräkna statistik
    const stats = calculateStatistics(filteredEntries);
    
    // Spara dagstatistik för senare användning
    currentDailyStats = stats.dailyStats;
    selectedDate = null;
    
    // Uppdatera sammanfattning
    updateSummary(stats);
    
    // Visa dagsstatistik
    displayDailyStats(stats.dailyStats);
    
    // Visa timstatistik (genomsnitt över alla dagar)
    displayHourlyStats(stats.hourlyStats, null);
    
    // Visa detaljer om toggle är på (använd filtrerad data)
    if (showDetailsToggle.checked) {
        displayDetails(filteredData);
    }
}

function calculateStatistics(entries) {
    if (entries.length === 0) {
        return {
            totalCount: 0,
            totalDays: 0,
            avgPerDay: 0,
            avgPerHour: 0,
            dailyStats: [],
            hourlyStats: {}
        };
    }
    
    // Gruppera per dag
    const dailyData = {};
    
    entries.forEach(entry => {
        const date = entry.date;
        
        if (!dailyData[date]) {
            dailyData[date] = {
                date,
                entries: []
            };
        }
        
        dailyData[date].entries.push(entry);
    });
    
    // Beräkna statistik per dag
    const dailyStats = Object.values(dailyData).map(day => {
        const dayEntries = day.entries;
        const lastEntry = dayEntries[dayEntries.length - 1];
        const firstEntry = dayEntries[0];
        
        // Beräkna öppettid i timmar
        const firstTime = new Date(firstEntry.timestamp);
        const lastTime = new Date(lastEntry.timestamp);
        const hoursOpen = (lastTime - firstTime) / (1000 * 60 * 60);
        
        // Räkna antalet poster = antalet kunder
        const customerCount = dayEntries.length;
        
        return {
            date: day.date,
            count: customerCount, // Antal poster/registreringar
            firstTime: firstEntry.timestamp,
            lastTime: lastEntry.timestamp,
            hoursOpen: hoursOpen > 0 ? hoursOpen : 0,
            customersPerHour: hoursOpen > 0 ? (customerCount / hoursOpen).toFixed(1) : 0,
            entries: dayEntries
        };
    });
    
    // Sortera efter datum
    dailyStats.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Beräkna timstatistik (genomsnitt över alla dagar)
    const hourlyData = {};
    
    dailyStats.forEach(day => {
        day.entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            
            if (!hourlyData[hour]) {
                hourlyData[hour] = {
                    total: 0,
                    count: 0
                };
            }
            
            hourlyData[hour].total += 1; // Räkna varje registrering
            hourlyData[hour].count += 1;
        });
    });
    
    const hourlyStats = {};
    Object.keys(hourlyData).forEach(hour => {
        hourlyStats[hour] = hourlyData[hour].total / dailyStats.length;
    });
    
    // Totala statistiken
    const totalCount = dailyStats.reduce((sum, day) => sum + day.count, 0);
    const totalDays = dailyStats.length;
    const avgPerDay = totalDays > 0 ? (totalCount / totalDays).toFixed(1) : 0;
    
    // Beräkna antal kunder senaste timmen (från senaste registreringen)
    let customersLastHour = 0;
    if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        const lastTime = new Date(lastEntry.timestamp);
        const oneHourAgo = new Date(lastTime.getTime() - 60 * 60 * 1000);
        
        customersLastHour = entries.filter(entry => {
            const entryTime = new Date(entry.timestamp);
            return entryTime >= oneHourAgo && entryTime <= lastTime;
        }).length;
    }
    
    return {
        totalCount,
        totalDays,
        avgPerDay,
        avgPerHour: customersLastHour,
        dailyStats,
        hourlyStats
    };
}

function updateSummary(stats) {
    totalCountEl.textContent = stats.totalCount;
    totalDaysEl.textContent = stats.totalDays;
    avgPerDayEl.textContent = stats.avgPerDay;
    avgPerHourEl.textContent = stats.avgPerHour;
}

function displayDailyStats(dailyStats) {
    dailyStatsBody.innerHTML = '';
    
    if (dailyStats.length === 0) {
        dailyStatsBody.innerHTML = '<tr><td colspan="5" class="no-data">Ingen data</td></tr>';
        return;
    }
    
    dailyStats.forEach(day => {
        const row = document.createElement('tr');
        row.classList.add('clickable-row');
        row.dataset.date = day.date;
        
        // Markera vald rad
        if (selectedDate === day.date) {
            row.classList.add('selected-row');
        }
        
        // Formatera datum
        const dateObj = new Date(day.date);
        const dateStr = dateObj.toLocaleDateString('sv-SE', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Formatera tider
        const firstTime = new Date(day.firstTime).toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const lastTime = new Date(day.lastTime).toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        row.innerHTML = `
            <td>${dateStr}</td>
            <td class="number">${day.count}</td>
            <td>${firstTime}</td>
            <td>${lastTime}</td>
            <td class="number">${day.customersPerHour}</td>
        `;
        
        // Lägg till klickhändelse
        row.addEventListener('click', () => {
            showHourlyStatsForDay(day);
        });
        
        dailyStatsBody.appendChild(row);
    });
}

function displayHourlyStats(hourlyStats, selectedDayDate) {
    hourlyChartEl.innerHTML = '';
    
    if (Object.keys(hourlyStats).length === 0) {
        hourlyChartEl.innerHTML = '<p class="no-data">Ingen data att visa</p>';
        return;
    }
    
    // Uppdatera rubrik baserat på om en dag är vald
    const hourlySection = document.querySelector('.hourly-stats h2');
    if (selectedDayDate) {
        const dateObj = new Date(selectedDayDate);
        const dateStr = dateObj.toLocaleDateString('sv-SE', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        hourlySection.textContent = `Fördelning per timme - ${dateStr}`;
    } else {
        hourlySection.textContent = 'Fördelning per timme (genomsnitt över alla dagar)';
    }
    
    // Hitta max för skalning
    const maxValue = Math.max(...Object.values(hourlyStats));
    
    // Skapa staplar för varje timme
    for (let hour = 0; hour < 24; hour++) {
        const value = hourlyStats[hour] || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'hour-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'hour-bar';
        bar.style.height = `${percentage}%`;
        
        if (selectedDayDate) {
            bar.title = `${hour}:00 - ${Math.round(value)} registreringar`;
        } else {
            bar.title = `${hour}:00 - ${value.toFixed(1)} registreringar/dag`;
        }
        
        const label = document.createElement('div');
        label.className = 'hour-label';
        label.textContent = `${hour}:00`;
        
        const valueLabel = document.createElement('div');
        valueLabel.className = 'hour-value';
        if (selectedDayDate) {
            valueLabel.textContent = value > 0 ? Math.round(value) : '';
        } else {
            valueLabel.textContent = value > 0 ? value.toFixed(1) : '';
        }
        
        barContainer.appendChild(valueLabel);
        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        
        hourlyChartEl.appendChild(barContainer);
    }
}

function showHourlyStatsForDay(day) {
    selectedDate = day.date;
    
    // Beräkna timstatistik för denna specifika dag
    const hourlyStats = {};
    
    day.entries.forEach(entry => {
        const hour = new Date(entry.timestamp).getHours();
        
        if (!hourlyStats[hour]) {
            hourlyStats[hour] = 0;
        }
        
        hourlyStats[hour] += 1;
    });
    
    // Uppdatera displayen
    displayDailyStats(currentDailyStats); // Uppdatera för att markera vald rad
    displayHourlyStats(hourlyStats, day.date);
    
    // Scrolla till timdiagrammet
    document.querySelector('.hourly-stats').scrollIntoView({ behavior: 'smooth' });
}

function displayDetails(data) {
    detailsBody.innerHTML = '';
    
    if (data.entries.length === 0) {
        detailsBody.innerHTML = '<tr><td colspan="3" class="no-data">Ingen data</td></tr>';
        return;
    }
    
    // Visa senaste 500 registreringar (för att inte överbelasta)
    const entriesToShow = data.entries.slice(-500);
    
    entriesToShow.reverse().forEach(entry => {
        const row = document.createElement('tr');
        
        const deviceId = entry.device_id || '-';
        const deviceName = allDevices[deviceId]?.name || entry.device_name || deviceId;
        const displayDevice = deviceId !== '-' ? `${deviceName} (${deviceId})` : '-';
        
        row.innerHTML = `
            <td>${entry.timestamp}</td>
            <td>${displayDevice}</td>
            <td class="number">1</td>
        `;
        
        detailsBody.appendChild(row);
    });
}

function resetDisplay() {
    totalCountEl.textContent = '-';
    totalDaysEl.textContent = '-';
    avgPerDayEl.textContent = '-';
    avgPerHourEl.textContent = '-';
    
    dailyStatsBody.innerHTML = '<tr><td colspan="5" class="no-data">Ingen data för vald period</td></tr>';
    hourlyChartEl.innerHTML = '<p class="no-data">Ingen data att visa</p>';
    deviceStatsContainer.innerHTML = '<p class="no-data">Ingen data att visa</p>';
    detailsBody.innerHTML = '';
}

function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showMessage(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = `message-box message-${type}`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 4000);
}

// Live-uppdateringar
function setupLiveUpdates() {
    stopLiveUpdates(); // Stäng av eventuell tidigare listener
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const todayPath = `customers/${year}/${month}/${day}`;
    const todayRef = ref(database, todayPath);
    
    isLiveMode = true;
    updateLiveIndicator(true);
    
    // Lyssna på ändringar i dagens data
    activeListener = onValue(todayRef, (snapshot) => {
        if (snapshot.exists()) {
            // Hämta all data för vald period (för att inkludera historik om det finns)
            loadData();
        } else {
            // Ingen data ännu idag
            loadData();
        }
    }, (error) => {
        console.error('Fel vid lyssning på data:', error);
        showMessage('Live-uppdatering misslyckades', 'error');
    });
}

function stopLiveUpdates() {
    if (activeListener) {
        // Firebase onValue returnerar en unsubscribe-funktion
        activeListener();
        activeListener = null;
    }
    isLiveMode = false;
    updateLiveIndicator(false);
}

function updateLiveIndicator(isLive) {
    const subtitle = document.querySelector('.subtitle');
    if (isLive) {
        subtitle.innerHTML = 'Statistik över kundflöde i butiken <span style="color: #2ecc71; font-weight: 600;">● LIVE</span>';
    } else {
        subtitle.textContent = 'Statistik över kundflöde i butiken';
    }
}

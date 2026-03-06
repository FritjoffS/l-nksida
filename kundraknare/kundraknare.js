import { database, ref, get, onValue } from '../scripts/firebase-config.js';

// DOM-element
let startDateInput, endDateInput, loadDataBtn, todayBtn, weekBtn, monthBtn;
let totalCountEl, totalDaysEl, avgPerDayEl, avgPerHourEl;
let dailyStatsBody, hourlyChartEl, detailsBody, detailsContainer, showDetailsToggle;
let loadingOverlay, messageBox;

// Data cache
let currentData = null;
let activeListener = null;
let isLiveMode = false;

// Initialisera sidan
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    attachEventListeners();
    setTodayAsDefault();
    setupLiveUpdates(); // Starta live-uppdateringar för idag
});

function initializeElements() {
    // Datuminmatning
    startDateInput = document.getElementById('startDate');
    endDateInput = document.getElementById('endDate');
    
    // Knappar
    loadDataBtn = document.getElementById('loadDataBtn');
    todayBtn = document.getElementById('todayBtn');
    weekBtn = document.getElementById('weekBtn');
    monthBtn = document.getElementById('monthBtn');
    
    // Sammanfattning
    totalCountEl = document.getElementById('totalCount');
    totalDaysEl = document.getElementById('totalDays');
    avgPerDayEl = document.getElementById('avgPerDay');
    avgPerHourEl = document.getElementById('avgPerHour');
    
    // Tabeller och diagram
    dailyStatsBody = document.getElementById('dailyStatsBody');
    hourlyChartEl = document.getElementById('hourlyChart');
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
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    startDateInput.value = weekAgo.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];
    stopLiveUpdates();
    loadData();
}

function setMonthPeriod() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    
    startDateInput.value = monthAgo.toISOString().split('T')[0];
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
                    allEntries.push({
                        ...dayData[key],
                        id: key,
                        date: `${year}-${month}-${day}`
                    });
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
    
    // Beräkna statistik
    const stats = calculateStatistics(entries);
    
    // Uppdatera sammanfattning
    updateSummary(stats);
    
    // Visa dagsstatistik
    displayDailyStats(stats.dailyStats);
    
    // Visa timstatistik
    displayHourlyStats(stats.hourlyStats);
    
    // Visa detaljer om toggle är på
    if (showDetailsToggle.checked) {
        displayDetails(data);
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
        dailyStatsBody.innerHTML = '<tr><td colspan="6" class="no-data">Ingen data</td></tr>';
        return;
    }
    
    dailyStats.forEach(day => {
        const row = document.createElement('tr');
        
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
            <td class="number">${day.hoursOpen.toFixed(1)}</td>
            <td class="number">${day.customersPerHour}</td>
        `;
        
        dailyStatsBody.appendChild(row);
    });
}

function displayHourlyStats(hourlyStats) {
    hourlyChartEl.innerHTML = '';
    
    if (Object.keys(hourlyStats).length === 0) {
        hourlyChartEl.innerHTML = '<p class="no-data">Ingen data att visa</p>';
        return;
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
        bar.title = `${hour}:00 - ${value.toFixed(1)} registreringar/dag`;
        
        const label = document.createElement('div');
        label.className = 'hour-label';
        label.textContent = `${hour}:00`;
        
        const valueLabel = document.createElement('div');
        valueLabel.className = 'hour-value';
        valueLabel.textContent = value > 0 ? value.toFixed(1) : '';
        
        barContainer.appendChild(valueLabel);
        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        
        hourlyChartEl.appendChild(barContainer);
    }
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
        
        row.innerHTML = `
            <td>${entry.timestamp}</td>
            <td>${entry.device || '-'}</td>
            <td class="number">${entry.count}</td>
        `;
        
        detailsBody.appendChild(row);
    });
}

function resetDisplay() {
    totalCountEl.textContent = '-';
    totalDaysEl.textContent = '-';
    avgPerDayEl.textContent = '-';
    avgPerHourEl.textContent = '-';
    
    dailyStatsBody.innerHTML = '<tr><td colspan="6" class="no-data">Ingen data för vald period</td></tr>';
    hourlyChartEl.innerHTML = '<p class="no-data">Ingen data att visa</p>';
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

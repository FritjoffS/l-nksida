import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const deviceIdInput = document.getElementById('device-id');
const loadDataBtn = document.getElementById('loadDataBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const messageDiv = document.getElementById('message');
const statsDiv = document.getElementById('stats');
const sessionsList = document.getElementById('sessions-list');

// State
let allSessions = [];
let currentFilter = 'all';

// Show/hide loading overlay
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Show message
function showMessage(message, type = 'info') {
  if (!messageDiv) return;
  
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  if (type !== 'loading') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

function clearMessage() {
  if (messageDiv) {
    messageDiv.style.display = 'none';
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    font-size: 16px;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Check authentication state
function checkAuthState() {
  showLoading();
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      console.log('User authenticated:', user.email);
      hideLoading();
      loadSavedConfig();
    } else {
      // User is not signed in, redirect to login
      console.log('No user authenticated, redirecting to login...');
      window.location.href = '../index/login.html';
    }
  });
}

// Load saved configuration
function loadSavedConfig() {
  const savedDeviceId = localStorage.getItem('motion-device-id');
  
  if (savedDeviceId) {
    deviceIdInput.value = savedDeviceId;
    // Auto-load data if config exists
    loadData();
  }
}

// Save configuration
function saveConfig() {
  const deviceId = deviceIdInput.value.trim();
  
  if (!deviceId) {
    showToast('Ange ett Device ID!', 'error');
    return;
  }
  
  localStorage.setItem('motion-device-id', deviceId);
  showToast('Konfiguration sparad!', 'success');
}

// Load data from Firebase
async function loadData() {
  const deviceId = deviceIdInput.value.trim();
  
  if (!deviceId) {
    showToast('Ange ett Device ID först!', 'error');
    return;
  }
  
  showMessage('Laddar data...', 'loading');
  
  try {
    // Get status
    const statusRef = ref(db, `motion/${deviceId}/status`);
    const statusSnapshot = await get(statusRef);
    const statusData = statusSnapshot.val();
    
    // Get events
    const eventsRef = ref(db, `motion/${deviceId}/events`);
    const eventsSnapshot = await get(eventsRef);
    const eventsData = eventsSnapshot.val();
    
    if (!eventsData) {
      showMessage('Ingen data hittades för denna enhet.', 'error');
      return;
    }
    
    // Process data
    processData(statusData, eventsData);
    statsDiv.style.display = 'block';
    clearMessage();
    showToast('Data uppdaterad!', 'success');
    
  } catch (error) {
    console.error('Error loading data:', error);
    showMessage('Fel vid hämtning av data: ' + error.message, 'error');
  }
}

// Process data from Firebase
function processData(status, events) {
  allSessions = [];
  
  // Extract all sessions
  for (const year in events) {
    for (const month in events[year]) {
      for (const day in events[year][month]) {
        for (const sessionId in events[year][month][day]) {
          const session = events[year][month][day][sessionId];
          if (session.timestamp_start) {
            allSessions.push({
              ...session,
              id: sessionId,
              date: `${year}-${month}-${day}`
            });
          }
        }
      }
    }
  }
  
  // Sort sessions (newest first)
  allSessions.sort((a, b) => {
    return new Date(b.timestamp_start) - new Date(a.timestamp_start);
  });
  
  // Update status
  updateStatus(status);
  
  // Calculate statistics
  calculateStats();
  
  // Display sessions
  displaySessions();
}

// Update device status
function updateStatus(status) {
  const statusElement = document.getElementById('device-status');
  const lastSeenElement = document.getElementById('last-seen');
  
  if (status && status.device_online) {
    statusElement.innerHTML = '<span class="status-indicator status-online"></span>Online';
    lastSeenElement.textContent = 'Senast sedd: ' + formatTimestamp(status.started_at);
  } else {
    statusElement.innerHTML = '<span class="status-indicator status-offline"></span>Offline';
    lastSeenElement.textContent = status && status.started_at ? 
      'Senast sedd: ' + formatTimestamp(status.started_at) : '-';
  }
}

// Calculate statistics
function calculateStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  let todayTime = 0, todayCount = 0;
  let weekTime = 0, weekCount = 0;
  let totalTime = 0, totalCount = 0;
  
  allSessions.forEach(session => {
    const sessionDate = new Date(session.timestamp_start);
    const duration = session.duration_ms || 0;
    
    totalTime += duration;
    totalCount++;
    
    if (sessionDate >= today) {
      todayTime += duration;
      todayCount++;
    }
    
    if (sessionDate >= weekAgo) {
      weekTime += duration;
      weekCount++;
    }
  });
  
  document.getElementById('today-time').textContent = formatDuration(todayTime);
  document.getElementById('today-sessions').textContent = todayCount + ' sessioner';
  
  document.getElementById('week-time').textContent = formatDuration(weekTime);
  document.getElementById('week-sessions').textContent = weekCount + ' sessioner';
  
  document.getElementById('total-time').textContent = formatDuration(totalTime);
  document.getElementById('total-sessions').textContent = totalCount + ' sessioner';
}

// Filter sessions
function filterSessions(filter) {
  currentFilter = filter;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });
  
  displaySessions();
}

// Display sessions
function displaySessions() {
  if (!sessionsList) return;
  
  sessionsList.innerHTML = '';
  
  let filteredSessions = [...allSessions];
  
  // Filter based on selected period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (currentFilter === 'today') {
    filteredSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.timestamp_start);
      return sessionDate >= today;
    });
  } else if (currentFilter === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    filteredSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.timestamp_start);
      return sessionDate >= weekAgo;
    });
  } else if (currentFilter === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    filteredSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.timestamp_start);
      return sessionDate >= monthAgo;
    });
  }
  
  // Display sessions or empty state
  if (filteredSessions.length === 0) {
    sessionsList.innerHTML = `
      <div class="empty-state">
        <p>Inga sessioner hittades för vald period.</p>
      </div>
    `;
    return;
  }
  
  filteredSessions.forEach(session => {
    const sessionItem = document.createElement('div');
    sessionItem.className = 'session-item';
    
    const startTime = formatTimestamp(session.timestamp_start);
    const endTime = session.timestamp_stop ? formatTimestamp(session.timestamp_stop) : 'Pågår';
    const duration = formatDuration(session.duration_ms || 0);
    
    sessionItem.innerHTML = `
      <div class="session-header">
        <div class="session-date">${startTime}</div>
        <div class="session-duration">${duration}</div>
      </div>
      <div class="session-times">
        Start: ${new Date(session.timestamp_start).toLocaleString('sv-SE')} | 
        Stopp: ${session.timestamp_stop ? new Date(session.timestamp_stop).toLocaleString('sv-SE') : 'Pågår'}
      </div>
    `;
    
    sessionsList.appendChild(sessionItem);
  });
}

// Format duration from milliseconds
function formatDuration(ms) {
  if (!ms) return '0m';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Event listeners
loadDataBtn.addEventListener('click', loadData);
saveConfigBtn.addEventListener('click', saveConfig);

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    filterSessions(btn.dataset.filter);
  });
});

// Initialize on page load
checkAuthState();

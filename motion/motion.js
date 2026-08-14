import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getDatabase, ref, get, onValue, off, remove } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const deviceIdInput = document.getElementById('device-id');
const firebaseUrlInput = document.getElementById('firebase-url');
const realtimeToggle = document.getElementById('realtime-toggle');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const messageDiv = document.getElementById('message');
const statsDiv = document.getElementById('stats');
const sessionsList = document.getElementById('sessions-list');
const connectionBadge = document.getElementById('connection-badge');
const updateIndicator = document.getElementById('update-indicator');

// State
let allSessions = [];
let currentFilter = 'all';
let statusUnsubscribe = null;
let eventsUnsubscribe = null;
let isConnected = false;

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
  const savedUrl = localStorage.getItem('firebase-url');
  const savedDeviceId = localStorage.getItem('motion-device-id');
  const realtimeEnabled = localStorage.getItem('realtime-enabled');
  
  if (savedUrl && firebaseUrlInput) {
    firebaseUrlInput.value = savedUrl;
  }
  if (savedDeviceId && deviceIdInput) {
    deviceIdInput.value = savedDeviceId;
  }
  if (realtimeEnabled !== null && realtimeToggle) {
    realtimeToggle.checked = realtimeEnabled === 'true';
  }
  
  // Auto-connect if config exists
  if (savedUrl && savedDeviceId) {
    connectFirebase();
  }
}

// Save configuration
function saveConfig() {
  const url = firebaseUrlInput ? firebaseUrlInput.value.trim() : '';
  const deviceId = deviceIdInput ? deviceIdInput.value.trim() : '';
  const realtimeEnabled = realtimeToggle ? realtimeToggle.checked : true;
  
  if (!deviceId) {
    showToast('Ange ett Device ID!', 'error');
    return;
  }
  
  localStorage.setItem('firebase-url', url);
  localStorage.setItem('motion-device-id', deviceId);
  localStorage.setItem('realtime-enabled', realtimeEnabled);
  
  showToast('Konfiguration sparad!', 'success');
}

// Connect to Firebase
function connectFirebase() {
  const deviceId = deviceIdInput ? deviceIdInput.value.trim() : '';
  const realtimeEnabled = realtimeToggle ? realtimeToggle.checked : true;
  
  if (!deviceId) {
    showToast('Ange ett Device ID först!', 'error');
    return;
  }

  // Disconnect any existing listeners
  disconnectFirebase();

  updateConnectionBadge('connecting');
  showMessage('Ansluter...', 'loading');

  try {
    if (realtimeEnabled) {
      setupRealtimeListeners(deviceId);
    } else {
      loadDataOnce(deviceId);
    }

    isConnected = true;
    updateConnectionBadge('connected');
    clearMessage();
    if (statsDiv) statsDiv.style.display = 'block';

  } catch (error) {
    console.error('Connection error:', error);
    showMessage('Fel vid anslutning: ' + error.message, 'error');
    updateConnectionBadge('disconnected');
  }
}

// Disconnect from Firebase
function disconnectFirebase() {
  if (statusUnsubscribe) {
    statusUnsubscribe();
    statusUnsubscribe = null;
  }
  if (eventsUnsubscribe) {
    eventsUnsubscribe();
    eventsUnsubscribe = null;
  }
  isConnected = false;
  updateConnectionBadge('disconnected');
  showToast('Frånkopplad', 'info');
}

// Setup realtime listeners
function setupRealtimeListeners(deviceId) {
  const statusRef = ref(db, `motion/${deviceId}/status`);
  const eventsRef = ref(db, `motion/${deviceId}/events`);

  // Listen to status changes
  statusUnsubscribe = onValue(statusRef, (snapshot) => {
    const statusData = snapshot.val();
    updateStatus(statusData);
    showUpdateIndicator();
  }, (error) => {
    console.error('Status listener error:', error);
  });

  // Listen to events changes
  eventsUnsubscribe = onValue(eventsRef, (snapshot) => {
    const eventsData = snapshot.val();
    if (eventsData) {
      processEvents(eventsData);
      showUpdateIndicator();
    }
  }, (error) => {
    console.error('Events listener error:', error);
  });

  console.log('✅ Realtime listeners activated');
}

// Load data once (no realtime updates)
async function loadDataOnce(deviceId) {
  showMessage('Hämtar data...', 'loading');
  
  try {
    const statusRef = ref(db, `motion/${deviceId}/status`);
    const statusSnapshot = await get(statusRef);
    const statusData = statusSnapshot.val();
    
    const eventsRef = ref(db, `motion/${deviceId}/events`);
    const eventsSnapshot = await get(eventsRef);
    const eventsData = eventsSnapshot.val();
    
    if (!eventsData) {
      showMessage('Ingen data hittades för denna enhet.', 'error');
      return;
    }
    
    updateStatus(statusData);
    processEvents(eventsData);
    clearMessage();
    showToast('Data hämtad!', 'success');
    
  } catch (error) {
    console.error('Error loading data:', error);
    showMessage('Fel vid hämtning av data: ' + error.message, 'error');
  }
}

// Process events from Firebase
function processEvents(events) {
  const previousCount = allSessions.length;
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
  
  // Calculate statistics
  calculateStats();
  
  // Display sessions (mark new if count increased)
  displaySessions(allSessions.length > previousCount);
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
function displaySessions(markNew = false) {
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
        <p style="font-size: 1.2em;">Inga sessioner hittades</p>
        <p>Väntar på data från sensorn...</p>
      </div>
    `;
    return;
  }
  
  filteredSessions.forEach((session, index) => {
    const sessionItem = document.createElement('div');
    sessionItem.className = 'session-item';
    
    // Mark the first session as new if markNew is true
    if (markNew && index === 0) {
      sessionItem.classList.add('new');
    }
    
    const startTime = formatTimestamp(session.timestamp_start);
    const endTime = session.timestamp_stop ? formatTimestamp(session.timestamp_stop) : 'Pågår';
    const duration = session.motion_time || formatDuration(session.duration_ms || 0);
    
    sessionItem.innerHTML = `
      <div class="session-header">
        <div class="session-date">${startTime}</div>
        <div class="session-duration">${duration}</div>
      </div>
      <div class="session-times">
        Start: ${new Date(session.timestamp_start).toLocaleString('sv-SE')}
        ${session.timestamp_stop ? ` • Stopp: ${new Date(session.timestamp_stop).toLocaleString('sv-SE')}` : ' • Pågående'}
      </div>
      <button class="delete-session-btn" data-session-id="${session.id}" data-session-date="${session.date}" title="Radera session">🗑️</button>
    `;
    
    // Add delete button event listener
    const deleteBtn = sessionItem.querySelector('.delete-session-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sessionId = deleteBtn.getAttribute('data-session-id');
      const sessionDate = deleteBtn.getAttribute('data-session-date');
      deleteSession(sessionId, sessionDate);
    });
    
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

// Delete session
async function deleteSession(sessionId, sessionDate) {
  const deviceId = deviceIdInput ? deviceIdInput.value.trim() : '';
  
  if (!deviceId) {
    showToast('Device ID saknas!', 'error');
    return;
  }
  
  // Confirm deletion
  if (!confirm('Är du säker på att du vill radera denna session?')) {
    return;
  }
  
  try {
    // Parse date string (format: "YYYY-MM-DD")
    const [year, month, day] = sessionDate.split('-');
    
    // Construct Firebase path
    const sessionPath = `motion/${deviceId}/events/${year}/${month}/${day}/${sessionId}`;
    const sessionRef = ref(db, sessionPath);
    
    // Delete from Firebase
    await remove(sessionRef);
    
    // Remove from local array
    const sessionIndex = allSessions.findIndex(s => s.id === sessionId && s.date === sessionDate);
    if (sessionIndex !== -1) {
      allSessions.splice(sessionIndex, 1);
    }
    
    // Recalculate stats and refresh display
    calculateStats();
    displaySessions();
    
    showToast('Session raderad!', 'success');
    
  } catch (error) {
    console.error('Error deleting session:', error);
    showToast('Fel vid radering: ' + error.message, 'error');
  }
}

// Update connection badge
function updateConnectionBadge(status) {
  if (!connectionBadge) return;
  
  connectionBadge.className = 'connection-badge';
  
  if (status === 'connected') {
    connectionBadge.classList.add('connection-connected');
    const realtimeEnabled = realtimeToggle && realtimeToggle.checked;
    connectionBadge.textContent = realtimeEnabled ? '🟢 Ansluten (Realtid)' : '🟢 Ansluten';
  } else if (status === 'connecting') {
    connectionBadge.classList.add('connection-connecting');
    connectionBadge.textContent = '🟡 Ansluter...';
  } else {
    connectionBadge.classList.add('connection-disconnected');
    connectionBadge.textContent = '🔴 Frånkopplad';
  }
}

// Show update indicator
function showUpdateIndicator() {
  if (!updateIndicator) return;
  
  updateIndicator.classList.add('show');
  
  setTimeout(() => {
    updateIndicator.classList.remove('show');
  }, 2000);
}

// Event listeners
if (connectBtn) {
  connectBtn.addEventListener('click', connectFirebase);
}

if (disconnectBtn) {
  disconnectBtn.addEventListener('click', disconnectFirebase);
}

if (saveConfigBtn) {
  saveConfigBtn.addEventListener('click', saveConfig);
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    filterSessions(btn.dataset.filter);
  });
});

// Disconnect when page closes
window.addEventListener('beforeunload', () => {
  disconnectFirebase();
});

// Initialize on page load
checkAuthState();

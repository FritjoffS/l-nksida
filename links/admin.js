/**
 * Link-Apps Administration
 * Hantera konfigurationen för dynamiska link-appar
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Config path in Firebase
const CONFIG_PATH = 'link-apps-config';

// DOM Elements
let appsGrid, loadingState, emptyState, appCount;
let appModal, appForm, modalTitle, appIdInput, appTitleInput, appDescInput, appIconInput;
let addAppBtn, closeModalBtn, cancelBtn, deleteBtn, saveBtn, appIdPreview;

// State
let currentEditId = null;
let appsData = {};

// Initialize DOM elements
function initDOMElements() {
    appsGrid = document.getElementById('appsGrid');
    loadingState = document.getElementById('loadingState');
    emptyState = document.getElementById('emptyState');
    appCount = document.getElementById('appCount');
    
    appModal = document.getElementById('appModal');
    appForm = document.getElementById('appForm');
    modalTitle = document.getElementById('modalTitle');
    appIdInput = document.getElementById('appId');
    appTitleInput = document.getElementById('appTitle');
    appDescInput = document.getElementById('appDescription');
    appIconInput = document.getElementById('appIcon');
    appIdPreview = document.getElementById('appIdPreview');
    
    addAppBtn = document.getElementById('addAppBtn');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelBtn = document.getElementById('cancelBtn');
    deleteBtn = document.getElementById('deleteBtn');
    saveBtn = document.getElementById('saveBtn');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check auth state
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "../index/login.html";
        } else {
            console.log("User logged in:", user.email);
            loadApps();
        }
    });
}

// Load apps from Firebase
async function loadApps() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    appsGrid.innerHTML = '';
    
    try {
        const configRef = ref(db, CONFIG_PATH);
        const snapshot = await get(configRef);
        
        loadingState.style.display = 'none';
        
        if (snapshot.exists()) {
            appsData = snapshot.val();
            const apps = Object.entries(appsData);
            
            appCount.textContent = apps.length;
            
            if (apps.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            apps.sort((a, b) => a[1].title.localeCompare(b[1].title, 'sv'));
            
            apps.forEach(([id, data]) => {
                renderAppCard(id, data);
            });
        } else {
            appsData = {};
            appCount.textContent = '0';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading apps:', error);
        loadingState.style.display = 'none';
        showToast('Kunde inte ladda appar', 'error');
    }
}

// Render a single app card
function renderAppCard(id, data) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.innerHTML = `
        <div class="app-card-header">
            <div class="app-icon">${data.emptyIcon || '📁'}</div>
            <div class="app-info">
                <h3>${escapeHtml(data.title)}</h3>
                <span class="app-path">/links/?app=${escapeHtml(id)}</span>
            </div>
        </div>
        <div class="app-description">${escapeHtml(data.description || 'Ingen beskrivning')}</div>
        <div class="app-actions">
            <button class="btn btn-edit" onclick="window.editApp('${escapeHtml(id)}')">✏️ Redigera</button>
            <button class="btn btn-secondary" onclick="window.openApp('${escapeHtml(id)}')">🔗 Öppna</button>
        </div>
    `;
    appsGrid.appendChild(card);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open modal
function openModal(editId = null) {
    currentEditId = editId;
    
    if (editId) {
        // Edit mode
        modalTitle.textContent = 'Redigera app';
        const data = appsData[editId];
        if (data) {
            appIdInput.value = editId;
            appIdInput.disabled = true; // Can't change ID after creation
            appTitleInput.value = data.title || '';
            appDescInput.value = data.description || '';
            appIconInput.value = data.emptyIcon || '';
            updateEmojiSelection(data.emptyIcon);
        }
        deleteBtn.style.display = 'block';
    } else {
        // Add mode
        modalTitle.textContent = 'Lägg till app';
        appIdInput.value = '';
        appIdInput.disabled = false;
        appTitleInput.value = '';
        appDescInput.value = '';
        appIconInput.value = '📁';
        updateEmojiSelection('📁');
        deleteBtn.style.display = 'none';
    }
    
    appIdPreview.textContent = appIdInput.value || '...';
    appModal.classList.add('active');
    
    if (!editId) {
        appIdInput.focus();
    } else {
        appTitleInput.focus();
    }
}

// Close modal
function closeModal() {
    appModal.classList.remove('active');
    currentEditId = null;
    appForm.reset();
}

// Update emoji selection
function updateEmojiSelection(selectedEmoji) {
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.emoji === selectedEmoji);
    });
}

// Save app
async function saveApp() {
    const id = appIdInput.value.trim().toLowerCase();
    const title = appTitleInput.value.trim();
    const description = appDescInput.value.trim();
    const icon = appIconInput.value.trim() || '📁';
    
    if (!id || !title) {
        showToast('App-ID och visningsnamn krävs', 'error');
        return;
    }
    
    // Validate ID format
    if (!/^[a-z0-9-]+$/.test(id)) {
        showToast('App-ID får endast innehålla små bokstäver, siffror och bindestreck', 'error');
        return;
    }
    
    // Check if ID already exists (only for new apps)
    if (!currentEditId && appsData[id]) {
        showToast(`App-ID "${id}" finns redan`, 'error');
        return;
    }
    
    try {
        const appRef = ref(db, `${CONFIG_PATH}/${id}`);
        await set(appRef, {
            title: title,
            description: description || `${title}länkar`,
            emptyIcon: icon
        });
        
        showToast(currentEditId ? 'App uppdaterad!' : 'App skapad!', 'success');
        closeModal();
        await loadApps();
    } catch (error) {
        console.error('Error saving app:', error);
        showToast('Kunde inte spara appen', 'error');
    }
}

// Delete app
async function deleteApp() {
    if (!currentEditId) return;
    
    const confirmed = confirm(
        `Är du säker på att du vill radera "${appsData[currentEditId]?.title}"?\n\n` +
        `OBS: Detta raderar endast konfigurationen. Länkdatan under "${currentEditId}/" påverkas inte.`
    );
    
    if (!confirmed) return;
    
    try {
        const appRef = ref(db, `${CONFIG_PATH}/${currentEditId}`);
        await remove(appRef);
        
        showToast('App raderad!', 'success');
        closeModal();
        await loadApps();
    } catch (error) {
        console.error('Error deleting app:', error);
        showToast('Kunde inte radera appen', 'error');
    }
}

// Open app in new tab
function openApp(appId) {
    window.open(`index.html?app=${appId}`, '_blank');
}

// Edit app
function editApp(appId) {
    openModal(appId);
}

// Setup event listeners
function setupEventListeners() {
    addAppBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveApp);
    deleteBtn.addEventListener('click', deleteApp);
    
    // Close on overlay click
    appModal.addEventListener('click', (e) => {
        if (e.target === appModal) closeModal();
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && appModal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Update preview as user types
    appIdInput.addEventListener('input', () => {
        const value = appIdInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        appIdPreview.textContent = value || '...';
    });
    
    // Emoji picker
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appIconInput.value = btn.dataset.emoji;
            updateEmojiSelection(btn.dataset.emoji);
        });
    });
    
    // Form submit
    appForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveApp();
    });
}

// Expose functions to window
window.openApp = openApp;
window.editApp = editApp;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    checkAuthState();
});

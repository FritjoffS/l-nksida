/**
 * Dynamisk Link-App
 * Laddar konfiguration från Firebase baserat på URL-parameter (?app=kontor)
 * 
 * Firebase struktur:
 * link-apps-config/        <- App-konfiguration
 *   kontor/
 *     title: "Kontor"
 *     emptyIcon: "🏢"
 *     description: "kontorslänkar"
 * 
 * link-apps-data/          <- Länkdata för varje app
 *   kontor/
 *     Fortnox/
 *       url: "https://..."
 *       imageUrl: "https://..."
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Firebase paths
const DATA_PATH = 'link-apps-data/';
/* const DATA_PATH = '/'; */
const CONFIG_PATH = 'link-apps-config/';

// Configuration (loaded from Firebase)
let config = {
  dbPath: '',
  title: '',
  emptyIcon: '📁',
  description: ''
};

// DOM Elements
let loadingOverlay, loadingText, buttonContainer, linkModal, linkForm, modalTitle;
let linkNameInput, linkUrlInput, linkImageInput, deleteBtn, addLinkBtn, closeModalBtn, cancelBtn;
let errorState, mainContent, pageTitle;

// State
let currentEditKey = null;
let linksData = [];

// Get app name from URL parameter
function getAppFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('app');
}

// Initialize DOM elements
function initDOMElements() {
  loadingOverlay = document.getElementById('loadingOverlay');
  loadingText = document.getElementById('loadingText');
  buttonContainer = document.getElementById('buttonContainer');
  linkModal = document.getElementById('linkModal');
  linkForm = document.getElementById('linkForm');
  modalTitle = document.getElementById('modalTitle');
  linkNameInput = document.getElementById('linkName');
  linkUrlInput = document.getElementById('linkUrl');
  linkImageInput = document.getElementById('linkImage');
  deleteBtn = document.getElementById('deleteBtn');
  addLinkBtn = document.getElementById('addLinkBtn');
  closeModalBtn = document.getElementById('closeModalBtn');
  cancelBtn = document.getElementById('cancelBtn');
  errorState = document.getElementById('errorState');
  mainContent = document.getElementById('mainContent');
  pageTitle = document.getElementById('pageTitle');
}

// Show loading state
function showLoading(message = 'Laddar...') {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
    if (loadingText) loadingText.textContent = message;
  }
}

// Hide loading state
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Show error state
function showError(message) {
  hideLoading();
  if (mainContent) mainContent.style.display = 'none';
  if (errorState) {
    errorState.style.display = 'flex';
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.textContent = message;
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
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Validate URL
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Validate image URL
function isValidImageUrl(urlString) {
  if (!urlString) return false;
  if (urlString.startsWith('data:image/')) return true;
  return isValidUrl(urlString);
}

// Load app configuration from Firebase
async function loadAppConfig(appName) {
  try {
    const configRef = ref(db, CONFIG_PATH + appName);
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      config = {
        dbPath: appName,
        title: data.title || appName,
        emptyIcon: data.emptyIcon || '📁',
        description: data.description || `${data.title || appName}länkar`
      };
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error loading app config:', error);
    return false;
  }
}

// Update page with config
function updatePageWithConfig() {
  if (pageTitle) pageTitle.textContent = config.title;
  document.title = config.title;
  if (loadingText) loadingText.textContent = `Laddar ${config.description}...`;
  if (buttonContainer) buttonContainer.setAttribute('aria-label', config.description);
}

// Logout
async function logout() {
  try {
    showLoading();
    await signOut(auth);
    window.location.href = "../index/login.html";
  } catch (error) {
    hideLoading();
    console.error("Logout error:", error);
    showToast('Ett fel uppstod vid utloggning.', 'error');
  }
}

// Modal functions
function openModal(editKey = null) {
  currentEditKey = editKey;
  
  if (editKey) {
    modalTitle.textContent = 'Redigera länk';
    const link = linksData.find(l => l.buttonId === editKey);
    if (link) {
      linkNameInput.value = link.buttonId;
      linkUrlInput.value = link.linkToFollow;
      linkImageInput.value = link.imageUrl || '';
    }
    deleteBtn.style.display = 'block';
  } else {
    modalTitle.textContent = 'Lägg till länk';
    linkNameInput.value = '';
    linkUrlInput.value = '';
    linkImageInput.value = '';
    deleteBtn.style.display = 'none';
  }
  
  linkModal.classList.add('active');
  linkNameInput.focus();
}

function closeModal() {
  linkModal.classList.remove('active');
  currentEditKey = null;
  linkForm.reset();
}

// Save link
async function saveLink(event) {
  event.preventDefault();
  
  const name = linkNameInput.value.trim();
  const url = linkUrlInput.value.trim();
  const imageUrl = linkImageInput.value.trim();
  
  if (!name || !url) {
    showToast('Både benämning och URL krävs', 'error');
    return;
  }
  
  if (!isValidUrl(url)) {
    showToast('Ange en giltig URL (börjar med http:// eller https://)', 'error');
    return;
  }
  
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    showToast('Ange en giltig bild-URL (http/https eller data:image/...)', 'error');
    return;
  }
  
  showLoading();
  
  try {
    if (currentEditKey && currentEditKey !== name) {
      const oldRef = ref(db, DATA_PATH + config.dbPath + "/" + currentEditKey);
      await remove(oldRef);
    }
    
    const linkRef = ref(db, DATA_PATH + config.dbPath + "/" + name);
    const linkData = {
      url: url,
      imageUrl: imageUrl || null
    };
    await set(linkRef, linkData);
    
    showToast(currentEditKey ? 'Länk uppdaterad!' : 'Länk tillagd!', 'success');
    closeModal();
    await loadButtons();
  } catch (error) {
    console.error("Error saving link:", error);
    hideLoading();
    showToast('Kunde inte spara länken', 'error');
  }
}

// Delete link
async function deleteLink() {
  if (!currentEditKey) return;
  
  if (!confirm(`Är du säker på att du vill radera "${currentEditKey}"?`)) {
    return;
  }
  
  showLoading();
  
  try {
    const linkRef = ref(db, DATA_PATH + config.dbPath + "/" + currentEditKey);
    await remove(linkRef);
    
    showToast('Länk raderad!', 'success');
    closeModal();
    await loadButtons();
  } catch (error) {
    console.error("Error deleting link:", error);
    hideLoading();
    showToast('Kunde inte radera länken', 'error');
  }
}

// Load buttons
async function loadButtons() {
  showLoading(`Laddar ${config.description}...`);

  try {
    const dataRef = ref(db, DATA_PATH + config.dbPath);
    const snapshot = await get(dataRef);
    
    buttonContainer.innerHTML = '';
    linksData = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const linkToFollow = typeof data === 'string' ? data : data.url;
        const imageUrl = typeof data === 'object' ? data.imageUrl : null;
        
        linksData.push({
          buttonId: childSnapshot.key,
          linkToFollow: linkToFollow,
          imageUrl: imageUrl
        });
      });

      linksData.sort((a, b) => a.buttonId.localeCompare(b.buttonId, 'sv'));

      linksData.forEach(({ buttonId, linkToFollow, imageUrl }) => {
        if (!buttonId || typeof buttonId !== 'string') return;
        if (!isValidUrl(linkToFollow)) return;

        const wrapper = document.createElement("div");
        wrapper.className = "link-button-wrapper";
        wrapper.setAttribute('role', 'listitem');

        const button = document.createElement("button");
        button.className = "linkButton";
        button.setAttribute('aria-label', `Öppna ${buttonId}`);
        button.title = buttonId;

        if (imageUrl && isValidImageUrl(imageUrl)) {
          button.style.backgroundImage = "url('" + imageUrl + "')";
          button.style.backgroundPosition = "center";
          button.style.backgroundSize = "contain";
          button.style.backgroundRepeat = "no-repeat";
          
          const img = new Image();
          img.onerror = function () {
            button.style.backgroundImage = "none";
            button.style.backgroundColor = "#555";
            button.textContent = buttonId.replace(/Button$/, "");
            button.style.color = "#fff";
            button.style.fontSize = "16px";
            button.style.fontWeight = "bold";
          };
          img.src = imageUrl;
        } else {
          button.style.backgroundColor = "#555";
          button.textContent = buttonId.replace(/Button$/, "");
          button.style.color = "#fff";
          button.style.fontSize = "16px";
          button.style.fontWeight = "bold";
        }

        button.addEventListener("click", function (e) {
          if (e.target.closest('.edit-btn')) return;
          
          if (linkToFollow && isValidUrl(linkToFollow)) {
            const newWindow = window.open(linkToFollow, "_blank", "noopener,noreferrer");
            if (!newWindow) {
              showToast('Popup blockerad. Tillåt popups för denna sida.', 'error');
            }
          }
        });

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.innerHTML = "✏️";
        editBtn.title = "Redigera länk";
        editBtn.setAttribute('aria-label', `Redigera ${buttonId}`);
        editBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          openModal(buttonId);
        });

        wrapper.appendChild(button);
        wrapper.appendChild(editBtn);
        buttonContainer.appendChild(wrapper);
      });

      hideLoading();
      
      if (linksData.length === 0) {
        showEmptyState();
      }
    } else {
      hideLoading();
      showEmptyState();
    }
  } catch (error) {
    console.error("Error loading buttons:", error);
    hideLoading();
    showToast('Ett fel uppstod vid laddning av länkar.', 'error');
    showEmptyState('Ett fel uppstod vid laddning');
  }
}

// Show empty state
function showEmptyState(message = null) {
  const defaultMessage = `Inga ${config.title.toLowerCase()}länkar tillgängliga`;
  if (buttonContainer) {
    buttonContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${config.emptyIcon}</div>
        <h2>${message || defaultMessage}</h2>
        <p>Klicka på "Lägg till länk" för att skapa din första länk.</p>
      </div>
    `;
  }
}

// Setup event listeners
function setupEventListeners() {
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => openModal());
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  if (linkForm) {
    linkForm.addEventListener('submit', saveLink);
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteLink);
  }
  
  if (linkModal) {
    linkModal.addEventListener('click', (e) => {
      if (e.target === linkModal) {
        closeModal();
      }
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && linkModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Initialize app
async function init() {
  initDOMElements();
  showLoading('Kontrollerar inloggning...');
  
  // Check authentication FIRST before loading anything
  const user = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
  
  if (!user) {
    // Save current URL for redirect after login
    const currentUrl = window.location.href;
    sessionStorage.setItem('redirectAfterLogin', currentUrl);
    window.location.href = "../index/login.html";
    return;
  }
  
  console.log("User is logged in:", user.email);
  
  const appName = getAppFromUrl();
  
  if (!appName) {
    showError('Ingen app angiven. Använd ?app=kontor i URL:en.');
    return;
  }
  
  showLoading('Laddar konfiguration...');
  
  const configLoaded = await loadAppConfig(appName);
  
  if (!configLoaded) {
    showError(`Appen "${appName}" finns inte. Kontrollera att den är konfigurerad i Firebase.`);
    return;
  }
  
  updatePageWithConfig();
  setupEventListeners();
  
  // Expose logout
  window.logout = logout;
  
  // Load buttons directly since we already verified auth
  loadButtons();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

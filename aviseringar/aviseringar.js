import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const buttonContainer = document.getElementById('buttonContainer');
const aviseringModal = document.getElementById('aviseringModal');
const aviseringForm = document.getElementById('aviseringForm');
const modalTitle = document.getElementById('modalTitle');
const aviseringNameInput = document.getElementById('aviseringName');
const aviseringTextInput = document.getElementById('aviseringText');
const deleteBtn = document.getElementById('deleteBtn');
const addBtn = document.getElementById('addBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');

// State
let currentEditKey = null;
let aviseringarData = [];

// Show loading state
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }
}

// Hide loading state
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
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
    font-size: 16px;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Copy text to clipboard
async function copyTextToClipboard(textToCopy, buttonName) {
  try {
    await navigator.clipboard.writeText(textToCopy);
    showToast(`"${buttonName}" kopierad till urklippet!`, 'success');
  } catch (err) {
    console.error('Kunde inte kopiera texten: ', err);
    showToast('Kunde inte kopiera texten', 'error');
  }
}

// Function to check if a user is logged in or not
function checkAuthState() {
  showLoading();
  
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "../index/login.html";
    } else {
      console.log("User is logged in:", user.email);
      loadButtons();
    }
  }, (error) => {
    console.error("Auth error:", error);
    hideLoading();
    showToast('Autentiseringsfel. Omdirigerar till login...', 'error');
    setTimeout(() => {
      window.location.href = "../index/login.html";
    }, 2000);
  });
}

// Function to log out the user
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

window.logout = logout;

// Modal Functions
function openModal(editKey = null) {
  currentEditKey = editKey;
  
  if (editKey) {
    // Edit mode
    modalTitle.textContent = 'Redigera avisering';
    const avisering = aviseringarData.find(a => a.buttonId === editKey);
    if (avisering) {
      aviseringNameInput.value = avisering.buttonId;
      aviseringTextInput.value = avisering.textToCopy;
    }
    deleteBtn.style.display = 'block';
  } else {
    // Add mode
    modalTitle.textContent = 'Lägg till avisering';
    aviseringNameInput.value = '';
    aviseringTextInput.value = '';
    deleteBtn.style.display = 'none';
  }
  
  aviseringModal.classList.add('active');
  aviseringNameInput.focus();
}

function closeModal() {
  aviseringModal.classList.remove('active');
  currentEditKey = null;
  aviseringForm.reset();
}

// Save avisering (add or update)
async function saveAvisering(event) {
  event.preventDefault();
  
  const name = aviseringNameInput.value.trim();
  const text = aviseringTextInput.value.trim();
  
  if (!name || !text) {
    showToast('Både benämning och text krävs', 'error');
    return;
  }
  
  showLoading();
  
  try {
    // If editing and name changed, remove old entry
    if (currentEditKey && currentEditKey !== name) {
      const oldRef = ref(db, "aviseringar/" + currentEditKey);
      await remove(oldRef);
    }
    
    // Save the new/updated entry
    const aviseringRef = ref(db, "aviseringar/" + name);
    await set(aviseringRef, text);
    
    showToast(currentEditKey ? 'Avisering uppdaterad!' : 'Avisering tillagd!', 'success');
    closeModal();
    await loadButtons();
  } catch (error) {
    console.error("Error saving avisering:", error);
    hideLoading();
    showToast('Kunde inte spara aviseringen', 'error');
  }
}

// Delete avisering
async function deleteAvisering() {
  if (!currentEditKey) return;
  
  if (!confirm(`Är du säker på att du vill radera "${currentEditKey}"?`)) {
    return;
  }
  
  showLoading();
  
  try {
    const aviseringRef = ref(db, "aviseringar/" + currentEditKey);
    await remove(aviseringRef);
    
    showToast('Avisering raderad!', 'success');
    closeModal();
    await loadButtons();
  } catch (error) {
    console.error("Error deleting avisering:", error);
    hideLoading();
    showToast('Kunde inte radera aviseringen', 'error');
  }
}

// Function to load buttons dynamically and attach event listeners
async function loadButtons() {
  showLoading();

  try {
    const aviseringarRef = ref(db, "aviseringar");
    const snapshot = await get(aviseringarRef);
    
    // Clear container
    buttonContainer.innerHTML = '';
    aviseringarData = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const buttonId = childSnapshot.key;
        const textToCopy = childSnapshot.val();
        
        aviseringarData.push({
          buttonId: buttonId,
          textToCopy: textToCopy
        });
      });

      // Sort alphabetically
      aviseringarData.sort((a, b) => a.buttonId.localeCompare(b.buttonId, 'sv'));

      // Create buttons
      aviseringarData.forEach(({ buttonId, textToCopy }) => {
        if (!buttonId || typeof buttonId !== 'string') return;

        // Create button wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "avisering-button-wrapper";
        wrapper.setAttribute('role', 'listitem');

        // Create the main button
        const button = document.createElement("button");
        button.className = "aviseringButton";
        button.textContent = buttonId.replace(/Button$/, "");
        button.setAttribute('aria-label', `Kopiera ${buttonId}`);
        button.title = "Klicka för att kopiera";

        // Click to copy text
        button.addEventListener("click", function (e) {
          // Ignore if clicking on edit button
          if (e.target.closest('.edit-btn')) return;
          
          if (textToCopy) {
            copyTextToClipboard(textToCopy, buttonId);
          }
        });

        // Create edit button overlay
        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.innerHTML = "✏️";
        editBtn.title = "Redigera avisering";
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
      
      if (aviseringarData.length === 0) {
        showEmptyState();
      }
    } else {
      hideLoading();
      showEmptyState();
    }
  } catch (error) {
    console.error("Error loading buttons:", error);
    hideLoading();
    showToast('Ett fel uppstod vid laddning av aviseringar.', 'error');
    showEmptyState('Ett fel uppstod vid laddning');
  }
}

// Show empty state
function showEmptyState(message = 'Inga aviseringar tillgängliga') {
  if (buttonContainer) {
    buttonContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>${message}</h2>
        <p>Klicka på "Lägg till avisering" för att skapa din första avisering.</p>
      </div>
    `;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  
  // Add button
  if (addBtn) {
    addBtn.addEventListener('click', () => openModal());
  }
  
  // Close modal buttons
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  // Form submit
  if (aviseringForm) {
    aviseringForm.addEventListener('submit', saveAvisering);
  }
  
  // Delete button
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteAvisering);
  }
  
  // Close modal on overlay click
  if (aviseringModal) {
    aviseringModal.addEventListener('click', (e) => {
      if (e.target === aviseringModal) {
        closeModal();
      }
    });
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aviseringModal.classList.contains('active')) {
      closeModal();
    }
  });
});
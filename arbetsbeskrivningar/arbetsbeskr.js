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
const arbetsbeskrModal = document.getElementById('arbetsbeskrModal');
const arbetsbeskrForm = document.getElementById('arbetsbeskrForm');
const modalTitle = document.getElementById('modalTitle');
const arbetsbeskrNameInput = document.getElementById('arbetsbeskrName');
const arbetsbeskrTextInput = document.getElementById('arbetsbeskrText');
const deleteBtn = document.getElementById('deleteBtn');
const addBtn = document.getElementById('addBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');

// State
let currentEditKey = null;
let arbetsbeskrData = [];

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
    modalTitle.textContent = 'Redigera arbetsbeskrivning';
    const arbetsbeskr = arbetsbeskrData.find(a => a.buttonId === editKey);
    if (arbetsbeskr) {
      arbetsbeskrNameInput.value = arbetsbeskr.buttonId;
      arbetsbeskrTextInput.value = arbetsbeskr.textToCopy;
    }
    deleteBtn.style.display = 'block';
  } else {
    // Add mode
    modalTitle.textContent = 'Lägg till arbetsbeskrivning';
    arbetsbeskrNameInput.value = '';
    arbetsbeskrTextInput.value = '';
    deleteBtn.style.display = 'none';
  }
  
  arbetsbeskrModal.classList.add('active');
  arbetsbeskrNameInput.focus();
}

function closeModal() {
  arbetsbeskrModal.classList.remove('active');
  currentEditKey = null;
  arbetsbeskrForm.reset();
}

// Save arbetsbeskrivning (add or update)
async function saveArbetsbeskr(event) {
  event.preventDefault();
  
  const name = arbetsbeskrNameInput.value.trim();
  const text = arbetsbeskrTextInput.value.trim();
  
  if (!name || !text) {
    showToast('Både benämning och text krävs', 'error');
    return;
  }
  
  showLoading();
  
  try {
    // If editing and name changed, remove old entry
    if (currentEditKey && currentEditKey !== name) {
      const oldRef = ref(db, "arbetsbeskr/" + currentEditKey);
      await remove(oldRef);
    }
    
    // Save the new/updated entry
    const arbetsbeskrRef = ref(db, "arbetsbeskr/" + name);
    await set(arbetsbeskrRef, text);
    
    showToast(currentEditKey ? 'Arbetsbeskrivning uppdaterad!' : 'Arbetsbeskrivning tillagd!', 'success');
    closeModal();
    await loadButtons();
  } catch (error) {
    console.error("Error saving arbetsbeskrivning:", error);
    hideLoading();
    showToast('Kunde inte spara arbetsbeskrivningen', 'error');
  }
}

// Delete arbetsbeskrivning
async function deleteArbetsbeskr() {
  if (!currentEditKey) return;
  
  if (!confirm(`Är du säker på att du vill radera "${currentEditKey}"?`)) {
    return;
  }
  
  showLoading();
  
  try {
    const arbetsbeskrRef = ref(db, "arbetsbeskr/" + currentEditKey);
    await remove(arbetsbeskrRef);
    
    showToast('Arbetsbeskrivning raderad!', 'success');
    closeModal();
    await loadButtons();
  } catch (error) {
    console.error("Error deleting arbetsbeskrivning:", error);
    hideLoading();
    showToast('Kunde inte radera arbetsbeskrivningen', 'error');
  }
}

// Function to load buttons dynamically and attach event listeners
async function loadButtons() {
  showLoading();

  try {
    const arbetsbeskrRef = ref(db, "arbetsbeskr");
    const snapshot = await get(arbetsbeskrRef);
    
    // Clear container
    buttonContainer.innerHTML = '';
    arbetsbeskrData = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const buttonId = childSnapshot.key;
        const textToCopy = childSnapshot.val();
        
        arbetsbeskrData.push({
          buttonId: buttonId,
          textToCopy: textToCopy
        });
      });

      // Sort alphabetically
      arbetsbeskrData.sort((a, b) => a.buttonId.localeCompare(b.buttonId, 'sv'));

      // Create buttons
      arbetsbeskrData.forEach(({ buttonId, textToCopy }) => {
        if (!buttonId || typeof buttonId !== 'string') return;

        // Create button wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "arbetsbeskr-button-wrapper";
        wrapper.setAttribute('role', 'listitem');

        // Create the main button
        const button = document.createElement("button");
        button.className = "arbetsbeskrButton";
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
        editBtn.title = "Redigera arbetsbeskrivning";
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
      
      if (arbetsbeskrData.length === 0) {
        showEmptyState();
      }
    } else {
      hideLoading();
      showEmptyState();
    }
  } catch (error) {
    console.error("Error loading buttons:", error);
    hideLoading();
    showToast('Ett fel uppstod vid laddning av arbetsbeskrivningar.', 'error');
    showEmptyState('Ett fel uppstod vid laddning');
  }
}

// Show empty state
function showEmptyState(message = 'Inga arbetsbeskrivningar tillgängliga') {
  if (buttonContainer) {
    buttonContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>${message}</h2>
        <p>Klicka på "Lägg till arbetsbeskrivning" för att skapa din första arbetsbeskrivning.</p>
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
  if (arbetsbeskrForm) {
    arbetsbeskrForm.addEventListener('submit', saveArbetsbeskr);
  }
  
  // Delete button
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteArbetsbeskr);
  }
  
  // Close modal on overlay click
  if (arbetsbeskrModal) {
    arbetsbeskrModal.addEventListener('click', (e) => {
      if (e.target === arbetsbeskrModal) {
        closeModal();
      }
    });
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && arbetsbeskrModal.classList.contains('active')) {
      closeModal();
    }
  });
});
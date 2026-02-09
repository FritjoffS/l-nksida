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
const linkModal = document.getElementById('linkModal');
const linkForm = document.getElementById('linkForm');
const modalTitle = document.getElementById('modalTitle');
const linkNameInput = document.getElementById('linkName');
const linkUrlInput = document.getElementById('linkUrl');
const linkImageInput = document.getElementById('linkImage');
const deleteBtn = document.getElementById('deleteBtn');
const addLinkBtn = document.getElementById('addLinkBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');

// State
let currentEditKey = null;
let linksData = [];

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
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Validate URL before opening
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Validate image URL (allows data URLs and regular URLs)
function isValidImageUrl(urlString) {
  if (!urlString) return false;
  
  // Allow data URLs for images
  if (urlString.startsWith('data:image/')) {
    return true;
  }
  
  // Also allow regular http/https URLs
  return isValidUrl(urlString);
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
    modalTitle.textContent = 'Redigera länk';
    const link = linksData.find(l => l.buttonId === editKey);
    if (link) {
      linkNameInput.value = link.buttonId;
      linkUrlInput.value = link.linkToFollow;
      linkImageInput.value = link.imageUrl || '';
    }
    deleteBtn.style.display = 'block';
  } else {
    // Add mode
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

// Save link (add or update)
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
  
  // Validate image URL if provided
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    showToast('Ange en giltig bild-URL (http/https eller data:image/...)', 'error');
    return;
  }
  
  showLoading();
  
  try {
    // If editing and name changed, remove old entry
    if (currentEditKey && currentEditKey !== name) {
      const oldRef = ref(db, "butik/" + currentEditKey);
      await remove(oldRef);
    }
    
    // Save the new/updated entry as an object
    const linkRef = ref(db, "butik/" + name);
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
    const linkRef = ref(db, "butik/" + currentEditKey);
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

// Function to load buttons dynamically and attach event listeners
async function loadButtons() {
  showLoading();

  try {
    const butikRef = ref(db, "butik");
    const snapshot = await get(butikRef);
    
    // Clear container
    buttonContainer.innerHTML = '';
    linksData = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        // Support both old format (string) and new format (object)
        const linkToFollow = typeof data === 'string' ? data : data.url;
        const imageUrl = typeof data === 'object' ? data.imageUrl : null;
        
        linksData.push({
          buttonId: childSnapshot.key,
          linkToFollow: linkToFollow,
          imageUrl: imageUrl
        });
      });

      // Sort alphabetically by buttonid
      linksData.sort((a, b) => a.buttonId.localeCompare(b.buttonId, 'sv'));

      // Create buttons
      linksData.forEach(({ buttonId, linkToFollow, imageUrl }) => {
        if (!buttonId || typeof buttonId !== 'string') return;
        if (!isValidUrl(linkToFollow)) return;

        // Create button wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "link-button-wrapper";
        wrapper.setAttribute('role', 'listitem');

        // Create the main button
        const button = document.createElement("button");
        button.className = "linkButton";
        button.setAttribute('aria-label', `Öppna ${buttonId}`);

        // Set background image - use custom URL if provided, otherwise fall back to text
        if (imageUrl && isValidImageUrl(imageUrl)) {
          button.style.backgroundImage = "url('" + imageUrl + "')";
          button.style.backgroundPosition = "center";
          button.style.backgroundSize = "contain";
          button.style.backgroundRepeat = "no-repeat";
          
          // Verify the image loads
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
          // No image URL provided, show text
          button.style.backgroundColor = "#555";
          button.textContent = buttonId.replace(/Button$/, "");
          button.style.color = "#fff";
          button.style.fontSize = "16px";
          button.style.fontWeight = "bold";
        }

        // Click to open link
        button.addEventListener("click", function (e) {
          // Ignore if clicking on edit button
          if (e.target.closest('.edit-btn')) return;
          
          if (linkToFollow && isValidUrl(linkToFollow)) {
            const newWindow = window.open(linkToFollow, "_blank", "noopener,noreferrer");
            if (!newWindow) {
              showToast('Popup blockerad. Tillåt popups för denna sida.', 'error');
            }
          }
        });

        // Create edit button overlay
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
function showEmptyState(message = 'Inga butikslänkar tillgängliga') {
  if (buttonContainer) {
    buttonContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏢</div>
        <h2>${message}</h2>
        <p>Klicka på "Lägg till länk" för att skapa din första länk.</p>
      </div>
    `;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  
  // Add link button
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => openModal());
  }
  
  // Close modal buttons
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  // Form submit
  if (linkForm) {
    linkForm.addEventListener('submit', saveLink);
  }
  
  // Delete button
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteLink);
  }
  
  // Close modal on overlay click
  if (linkModal) {
    linkModal.addEventListener('click', (e) => {
      if (e.target === linkModal) {
        closeModal();
      }
    });
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && linkModal.classList.contains('active')) {
      closeModal();
    }
  });
});

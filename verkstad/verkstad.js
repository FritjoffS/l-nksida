import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const buttonContainer = document.getElementById('buttonContainer');

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
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Function to check if a user is logged in or not
function checkAuthState() {
  showLoading();
  
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // User is not signed in, redirect to the login page
      window.location.href = "../index/login.html";
    } else {
      console.log("User is logged in:", user.email);
      // User authenticated, load buttons
      loadButtons();
    }
  }, (error) => {
    // Handle auth errors
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
    
    const errorMessages = {
      'auth/network-request-failed': 'Nätverksfel. Kontrollera din internetanslutning.',
      'default': 'Ett fel uppstod vid utloggning. Försök igen.'
    };
    
    const message = errorMessages[error.code] || errorMessages.default;
    showToast(message, 'error');
  }
}

// Attach logout to the global window object for navbar
window.logout = logout;

// Function to load buttons dynamically and attach event listeners
async function loadButtons() {
  showLoading();

  try {
    const verkstadRef = ref(db, "verkstad");
    const snapshot = await get(verkstadRef);
    
    if (snapshot.exists()) {
      // Collect all children into an array
      const buttonsData = [];
      snapshot.forEach((childSnapshot) => {
        buttonsData.push({
          buttonId: childSnapshot.key,
          linkToFollow: childSnapshot.val()
        });
      });

      // Sort alphabetically by buttonId
      buttonsData.sort((a, b) => a.buttonId.localeCompare(b.buttonId));

      // Create buttons in sorted order
      buttonsData.forEach(({ buttonId, linkToFollow }) => {
        // Validate button ID (basic sanitization)
        if (!buttonId || typeof buttonId !== 'string') {
          console.warn('Invalid buttonId:', buttonId);
          return;
        }

        // Validate URL
        if (!isValidUrl(linkToFollow)) {
          console.warn(`Invalid URL for button ${buttonId}:`, linkToFollow);
          return;
        }

        // Create a button dynamically
        const button = document.createElement("button");
        button.id = buttonId;
        button.className = "linkButton";
        button.setAttribute('role', 'listitem');
        button.setAttribute('aria-label', `Öppna ${buttonId.replace(/Button$/, '')} i ny flik`);

        // Set background image for the button (unique per button)
        const imgUrl = "../images/" + encodeURIComponent(buttonId) + ".png";
        button.style.backgroundImage = "url('" + imgUrl + "')";
        button.style.backgroundPosition = "center";
        button.style.color = "#fff";

        // Try to load the image, if it fails, display the key as text
        const img = new Image();
        img.onload = function () {
          // Image loaded successfully
          button.setAttribute('aria-label', `Öppna ${buttonId.replace(/Button$/, '')}`);
        };
        img.onerror = function () {
          // Image failed, show text instead
          button.style.backgroundImage = "none";
          button.style.backgroundColor = "#555";
          button.textContent = buttonId.replace(/Button$/, "");
          button.style.color = "#fff";
          button.style.fontSize = "16px";
          button.style.fontWeight = "bold";
        };
        img.src = imgUrl;

        // Attach event listener to the button
        button.addEventListener("click", function () {
          if (linkToFollow && isValidUrl(linkToFollow)) {
            // Open with security attributes
            const newWindow = window.open(linkToFollow, "_blank", "noopener,noreferrer");
            if (!newWindow) {
              showToast('Popup blockerad. Tillåt popups för denna sida.', 'error');
            }
          } else {
            console.error(`Invalid URL for button: ${buttonId}`);
            showToast('Ogiltig länk', 'error');
          }
        });

        // Append the button to the container
        buttonContainer.appendChild(button);
      });

      hideLoading();
      
      if (buttonsData.length === 0) {
        showEmptyState();
      }
    } else {
      console.log("No data available");
      hideLoading();
      showEmptyState();
    }
  } catch (error) {
    console.error("Error loading buttons from database:", error);
    hideLoading();
    
    const errorMessages = {
      'PERMISSION_DENIED': 'Du har inte behörighet att ladda verkstadslänkar.',
      'NETWORK_ERROR': 'Nätverksfel. Kontrollera din internetanslutning.',
      'default': 'Ett fel uppstod vid laddning av länkar. Försök igen senare.'
    };
    
    const message = errorMessages[error.code] || errorMessages.default;
    showToast(message, 'error');
    showEmptyState('Ett fel uppstod vid laddning');
  }
}

// Show empty state
function showEmptyState(message = 'Inga verkstadslänkar tillgängliga') {
  if (buttonContainer) {
    buttonContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔧</div>
        <h2>${message}</h2>
        <p>Kontakta administratören om du tror detta är ett fel.</p>
      </div>
    `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
});

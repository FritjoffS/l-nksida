// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { 
  getAuth, 
  onAuthStateChanged,
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';

// Import Firebase config
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Loading state management
let authCheckComplete = false;

// Show loading overlay
function showLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }
}

// Hide loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Check if user is authenticated
function checkAuthState() {
  showLoading();
  
  onAuthStateChanged(auth, (user) => {
    authCheckComplete = true;
    
    if (!user) {
      // User is not signed in, redirect to login page
      window.location.href = 'login.html';
    } else {
      // User is signed in, hide loading and show content
      hideLoading();
      console.log('User authenticated:', user.email);
    }
  }, (error) => {
    // Handle auth errors
    console.error('Auth error:', error);
    hideLoading();
    // Redirect to login on error
    window.location.href = 'login.html';
  });
}

// Logout function
async function logout() {
  try {
    showLoading();
    await signOut(auth);
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    hideLoading();
    console.error('Logout error:', error);
    
    // Show user-friendly error message
    const errorMessages = {
      'auth/network-request-failed': 'Nätverksfel. Kontrollera din internetanslutning.',
      'default': 'Ett fel uppstod vid utloggning. Försök igen.'
    };
    
    const message = errorMessages[error.code] || errorMessages.default;
    alert(message);
  }
}

// Make logout function available globally for navbar
window.logout = logout;

// Load and display app version from manifest.json
async function loadAppVersion() {
  try {
    const response = await fetch('../manifest.json');
    const manifest = await response.json();
    const versionElement = document.getElementById('appVersion');
    if (versionElement && manifest.version) {
      versionElement.textContent = `v${manifest.version}`;
    }
  } catch (error) {
    console.error('Error loading app version:', error);
    // Fallback to default if manifest can't be loaded
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
      versionElement.textContent = 'v2.1.1';
    }
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

// PWA Install Prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installButton = document.getElementById('installButton');
const dismissInstall = document.getElementById('dismissInstall');

// Check if app was already installed or dismissed
function checkInstallStatus() {
  // Don't show if already dismissed
  if (localStorage.getItem('installDismissed')) {
    return false;
  }
  
  // Don't show if running in standalone mode (already installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  return true;
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default mini-infobar
  e.preventDefault();
  
  // Save the event for later use
  deferredPrompt = e;
  
  // Show custom install banner if not dismissed
  if (checkInstallStatus()) {
    setTimeout(() => {
      if (installBanner) {
        installBanner.style.display = 'block';
      }
    }, 3000); // Show after 3 seconds
  }
});

// Install button click handler
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear the deferred prompt
    deferredPrompt = null;
    
    // Hide the banner
    if (installBanner) {
      installBanner.style.display = 'none';
    }
  });
}

// Dismiss button click handler
if (dismissInstall) {
  dismissInstall.addEventListener('click', () => {
    if (installBanner) {
      installBanner.style.display = 'none';
    }
    // Remember dismissal for 7 days
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('installDismissed', dismissedUntil.toString());
  });
}

// Clear dismissal if time has passed
const dismissedUntil = localStorage.getItem('installDismissed');
if (dismissedUntil && Date.now() > parseInt(dismissedUntil)) {
  localStorage.removeItem('installDismissed');
}

// Log if app is installed
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  if (installBanner) {
    installBanner.style.display = 'none';
  }
  showToast('App installerad!', 'success');
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  loadAppVersion();
});

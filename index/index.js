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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
});

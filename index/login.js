// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';

// Import Firebase config
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');
const togglePasswordButton = document.getElementById('togglePassword');
const forgotPasswordLink = document.getElementById('forgotPassword');
const loadingSpinner = document.getElementById('loadingSpinner');

// Input validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  errorMessage.classList.add('shake');
  setTimeout(() => errorMessage.classList.remove('shake'), 500);
}

// Hide error message
function hideError() {
  errorMessage.style.display = 'none';
}

// Show loading state
function setLoading(isLoading) {
  if (isLoading) {
    loginButton.disabled = true;
    loadingSpinner.style.display = 'inline-block';
    loginButton.textContent = 'Loggar in...';
  } else {
    loginButton.disabled = false;
    loadingSpinner.style.display = 'none';
    loginButton.textContent = 'Logga in';
  }
}

// Toggle password visibility
togglePasswordButton.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePasswordButton.textContent = type === 'password' ? '👁️' : '🙈';
});

// Check auth state on page load
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, redirect to homepage
      window.location.href = 'index.html';
    }
  });
}

// Login function
async function login() {
  hideError();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validate inputs
  if (!email || !password) {
    showError('Vänligen fyll i både e-post och lösenord');
    return;
  }

  if (!validateEmail(email)) {
    showError('Vänligen ange en giltig e-postadress');
    return;
  }

  if (!validatePassword(password)) {
    showError('Lösenordet måste vara minst 6 tecken');
    return;
  }

  setLoading(true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Successful login, redirect handled by onAuthStateChanged
    window.location.href = 'index.html';
  } catch (error) {
    setLoading(false);
    
    // User-friendly error messages
    switch (error.code) {
      case 'auth/invalid-email':
        showError('Ogiltig e-postadress');
        break;
      case 'auth/user-disabled':
        showError('Detta konto har inaktiverats');
        break;
      case 'auth/user-not-found':
        showError('Ingen användare hittades med denna e-postadress');
        break;
      case 'auth/wrong-password':
        showError('Felaktigt lösenord');
        break;
      case 'auth/invalid-credential':
        showError('Felaktig e-post eller lösenord');
        break;
      case 'auth/too-many-requests':
        showError('För många inloggningsförsök. Försök igen senare.');
        break;
      case 'auth/network-request-failed':
        showError('Nätverksfel. Kontrollera din internetanslutning.');
        break;
      default:
        showError('Ett fel uppstod vid inloggning. Försök igen.');
        console.error('Login error:', error);
    }
  }
}

// Forgot password function
async function handleForgotPassword() {
  const email = emailInput.value.trim();

  if (!email) {
    showError('Ange din e-postadress först');
    emailInput.focus();
    return;
  }

  if (!validateEmail(email)) {
    showError('Vänligen ange en giltig e-postadress');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showError('Återställningslänk skickad till din e-post!');
    errorMessage.style.backgroundColor = '#d4edda';
    errorMessage.style.color = '#155724';
    errorMessage.style.borderColor = '#c3e6cb';
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
        showError('Ingen användare hittades med denna e-postadress');
        break;
      case 'auth/invalid-email':
        showError('Ogiltig e-postadress');
        break;
      default:
        showError('Ett fel uppstod. Försök igen.');
        console.error('Password reset error:', error);
    }
  }
}

// Event listeners
loginButton.addEventListener('click', login);
forgotPasswordLink.addEventListener('click', (e) => {
  e.preventDefault();
  handleForgotPassword();
});

// Allow Enter key to submit
emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    passwordInput.focus();
  }
});

passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    login();
  }
});

// Clear error on input
emailInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// Initialize
checkAuthState();

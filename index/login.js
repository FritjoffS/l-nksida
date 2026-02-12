// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { 
  getDatabase, 
  ref as dbRef, 
  push 
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';

// Import Firebase config
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');
const togglePasswordButton = document.getElementById('togglePassword');
const forgotPasswordLink = document.getElementById('forgotPassword');
const loadingSpinner = document.getElementById('loadingSpinner');

// Rate Limiting Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minuter
const ATTEMPT_RESET_TIME = 15 * 60 * 1000; // 15 minuter
const STORAGE_KEY = 'loginAttempts';
const LOCKOUT_KEY = 'lockoutUntil';

// Rate Limiting State
class RateLimiter {
  constructor() {
    this.loadState();
  }

  loadState() {
    const attemptsData = localStorage.getItem(STORAGE_KEY);
    const lockoutData = localStorage.getItem(LOCKOUT_KEY);
    
    this.attempts = attemptsData ? JSON.parse(attemptsData) : [];
    this.lockoutUntil = lockoutData ? parseInt(lockoutData) : null;
    
    // Rensa gamla försök (äldre än 15 min)
    this.cleanOldAttempts();
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.attempts));
    if (this.lockoutUntil) {
      localStorage.setItem(LOCKOUT_KEY, this.lockoutUntil.toString());
    }
  }

  cleanOldAttempts() {
    const cutoffTime = Date.now() - ATTEMPT_RESET_TIME;
    this.attempts = this.attempts.filter(timestamp => timestamp > cutoffTime);
  }

  isLockedOut() {
    if (!this.lockoutUntil) return false;
    
    if (Date.now() < this.lockoutUntil) {
      return true;
    }
    
    // Lockout har gått ut, rensa
    this.unlock();
    return false;
  }

  getRemainingLockoutTime() {
    if (!this.lockoutUntil) return 0;
    const remaining = this.lockoutUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  addAttempt() {
    this.cleanOldAttempts();
    this.attempts.push(Date.now());
    
    if (this.attempts.length >= MAX_LOGIN_ATTEMPTS) {
      this.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    }
    
    this.saveState();
  }

  reset() {
    this.attempts = [];
    this.lockoutUntil = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  }

  unlock() {
    this.lockoutUntil = null;
    localStorage.removeItem(LOCKOUT_KEY);
  }

  getAttemptsRemaining() {
    this.cleanOldAttempts();
    return Math.max(0, MAX_LOGIN_ATTEMPTS - this.attempts.length);
  }
}

const rateLimiter = new RateLimiter();

// Security Logging
let cachedIpAddress = null;

async function getIpAddress() {
  if (cachedIpAddress) return cachedIpAddress;
  
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    cachedIpAddress = data.ip;
    return cachedIpAddress;
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
    return 'unknown';
  }
}

function hashEmail(email) {
  // Simple hash for privacy (not cryptographic)
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function logSecurityEvent(eventType, email, details = {}) {
  try {
    const ipAddress = await getIpAddress();
    const userAgent = navigator.userAgent;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: eventType,
      ipAddress: ipAddress,
      emailHash: email ? hashEmail(email) : null,
      userAgent: userAgent,
      ...details
    };
    
    const logsRef = dbRef(db, 'security_logs/login_attempts');
    await push(logsRef, logEntry);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Check lockout status on page load and update UI
function checkLockoutStatus() {
  if (rateLimiter.isLockedOut()) {
    const remainingMs = rateLimiter.getRemainingLockoutTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    
    loginButton.disabled = true;
    
    // Visa initial meddelande
    if (remainingMinutes > 1) {
      errorMessage.textContent = `För många misslyckade försök. Kontot är låst i ${remainingMinutes} minuter.`;
    } else {
      errorMessage.textContent = `För många misslyckade försök. Kontot är låst i ${remainingSeconds} sekunder.`;
    }
    errorMessage.style.display = 'block';
    
    // Starta nedräkning
    const countdownInterval = setInterval(() => {
      if (!rateLimiter.isLockedOut()) {
        clearInterval(countdownInterval);
        loginButton.disabled = false;
        errorMessage.textContent = 'Du kan nu försöka logga in igen.';
        errorMessage.style.backgroundColor = '#d4edda';
        errorMessage.style.color = '#155724';
        setTimeout(() => {
          hideError();
          errorMessage.style.backgroundColor = '';
          errorMessage.style.color = '';
        }, 3000);
      } else {
        const ms = rateLimiter.getRemainingLockoutTime();
        const min = Math.ceil(ms / 60000);
        const sec = Math.ceil(ms / 1000);
        
        // Uppdatera endast textContent för att undvika omladdning
        if (min > 1) {
          errorMessage.textContent = `För många misslyckade försök. Kontot är låst i ${min} minuter.`;
        } else {
          errorMessage.textContent = `För många misslyckade försök. Kontot är låst i ${sec} sekunder.`;
        }
      }
    }, 1000);
  }
}

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
      // User is signed in, redirect to saved URL or homepage
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectUrl || 'index.html';
    }
  });
}

// Login function
async function login() {
  hideError();
  
  // Check if user is locked out
  if (rateLimiter.isLockedOut()) {
    const remainingMs = rateLimiter.getRemainingLockoutTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    
    if (remainingMinutes > 1) {
      showError(`För många misslyckade försök. Försök igen om ${remainingMinutes} minuter.`);
    } else {
      showError(`För många misslyckade försök. Försök igen om ${remainingSeconds} sekunder.`);
    }
    return;
  }
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validate inputs
  if (!email || !password) {
    logSecurityEvent('login_failed', email, {
      errorCode: 'validation/missing-fields',
      attemptsRemaining: rateLimiter.getAttemptsRemaining()
    }).catch(err => console.error('Security log failed:', err));
    showError('Vänligen fyll i både e-post och lösenord');
    return;
  }

  if (!validateEmail(email)) {
    logSecurityEvent('login_failed', email, {
      errorCode: 'validation/invalid-email',
      attemptsRemaining: rateLimiter.getAttemptsRemaining()
    }).catch(err => console.error('Security log failed:', err));
    showError('Vänligen ange en giltig e-postadress');
    return;
  }

  if (!validatePassword(password)) {
    logSecurityEvent('login_failed', email, {
      errorCode: 'validation/password-too-short',
      passwordLength: password.length,
      attemptsRemaining: rateLimiter.getAttemptsRemaining()
    }).catch(err => console.error('Security log failed:', err));
    showError('Lösenordet måste vara minst 6 tecken');
    return;
  }

  setLoading(true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Successful login - reset rate limiter
    rateLimiter.reset();
    
    // Log security event (non-blocking)
    logSecurityEvent('login_success', email, {
      method: 'email_password'
    }).catch(err => console.error('Security log failed:', err));
    
    // Track successful login in Google Analytics
    if (window.logAnalyticsEvent) {
      window.logAnalyticsEvent('login_success', {
        method: 'email'
      });
    }
    
    // Redirect to saved URL or homepage
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectUrl || 'index.html';
  } catch (error) {
    setLoading(false);
    
    // Log security event (non-blocking)
    logSecurityEvent('login_failed', email, {
      errorCode: error.code || 'unknown',
      attemptsRemaining: rateLimiter.getAttemptsRemaining()
    }).catch(err => console.error('Security log failed:', err));
    
    // Track failed login attempt in Google Analytics
    if (window.logAnalyticsEvent) {
      window.logAnalyticsEvent('login_failed', {
        error_code: error.code || 'unknown',
        attempts_remaining: rateLimiter.getAttemptsRemaining()
      });
    }
    
    // Add failed attempt to rate limiter
    rateLimiter.addAttempt();
    
    // Check if now locked out
    if (rateLimiter.isLockedOut()) {
      // Log security event for rate limit (non-blocking)
      logSecurityEvent('rate_limited', email, {
        lockoutDurationMinutes: Math.ceil(LOCKOUT_DURATION / 60000),
        totalAttempts: rateLimiter.attempts.length
      }).catch(err => console.error('Security log failed:', err));
      
      // Track rate limit lockout in Google Analytics
      if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent('login_rate_limited', {
          lockout_duration_minutes: Math.ceil(LOCKOUT_DURATION / 60000)
        });
      }
      
      showError(`För många misslyckade försök. Kontot är låst i ${Math.ceil(LOCKOUT_DURATION / 60000)} minuter.`);
      loginButton.disabled = true;
      checkLockoutStatus(); // Start countdown
      return;
    }
    
    // Show attempts remaining warning if getting close to limit
    const remaining = rateLimiter.getAttemptsRemaining();
    let errorMsg = '';
    
    // User-friendly error messages - DON'T reveal if email exists
    switch (error.code) {
      case 'auth/invalid-email':
        errorMsg = 'Ogiltig e-postadress';
        break;
      case 'auth/user-disabled':
        errorMsg = 'Detta konto har inaktiverats';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        // Use same message for all credential errors to not reveal if email exists
        errorMsg = 'Felaktig e-post eller lösenord';
        break;
      case 'auth/too-many-requests':
        errorMsg = 'För många inloggningsförsök. Försök igen senare.';
        break;
      case 'auth/network-request-failed':
        errorMsg = 'Nätverksfel. Kontrollera din internetanslutning.';
        break;
      default:
        errorMsg = 'Ett fel uppstod vid inloggning. Försök igen.';
    }
    
    // Add warning about remaining attempts
    if (remaining <= 2 && remaining > 0) {
      errorMsg += ` (${remaining} försök kvar)`;
    }
    
    showError(errorMsg);
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
    
    // Reset color after 5 seconds
    setTimeout(() => {
      errorMessage.style.backgroundColor = '';
      errorMessage.style.color = '';
      hideError();
    }, 5000);
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
checkLockoutStatus();

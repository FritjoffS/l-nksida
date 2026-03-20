// Google Analytics Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics, logEvent, isSupported } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

// Your web app's Firebase configuration for Analytics
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const analyticsConfig = {
  apiKey: "AIzaSyDOFeJ1GvtXtffzCwQFg2M3CCVtpn875KQ",
  authDomain: "l-nksida.firebaseapp.com",
  databaseURL: "https://l-nksida-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "l-nksida",
  storageBucket: "l-nksida.firebasestorage.app",
  messagingSenderId: "258147870107",
  appId: "1:258147870107:web:ce637517bc30b7578cad3e",
  measurementId: "G-2JNJPN33L9"
};

// Initialize Firebase Analytics only if supported (checks for IndexedDB availability)
let analytics = null;

isSupported().then((supported) => {
  if (supported) {
    // Initialize Firebase Analytics (separate from the main Firebase app)
    const analyticsApp = initializeApp(analyticsConfig, "analytics");
    analytics = getAnalytics(analyticsApp);
    
    // Log page view
    logEvent(analytics, 'page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
    
    // Export analytics for use in other scripts if needed
    window.firebaseAnalytics = analytics;
    
    console.log('Google Analytics initialized for L-nksida');
  } else {
    console.log('Google Analytics not supported in this environment (IndexedDB unavailable)');
  }
}).catch((error) => {
  console.error('Error checking Analytics support:', error);
});

// Helper function to log custom events
window.logAnalyticsEvent = function(eventName, parameters = {}) {
  if (!analytics) {
    console.log('Analytics not available, skipping event:', eventName);
    return;
  }
  try {
    logEvent(analytics, eventName, parameters);
    console.log('Analytics event logged:', eventName, parameters);
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

// Log when user interacts with guides
window.logGuideInteraction = function(action, guideId = null, stepId = null) {
  const eventData = {
    action: action
  };
  
  if (guideId) eventData.guide_id = guideId;
  if (stepId) eventData.step_id = stepId;
  
  window.logAnalyticsEvent('guide_interaction', eventData);
};

// Log when user uses admin functions
window.logAdminAction = function(action, details = null) {
  const eventData = {
    action: action
  };
  
  if (details) eventData.details = details;
  
  window.logAnalyticsEvent('admin_action', eventData);
};

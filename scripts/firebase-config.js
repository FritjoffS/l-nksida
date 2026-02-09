// Firebase configuration - shared across all modules
// Central configuration file - all other files should import from here

export const firebaseConfig = {
  apiKey: "AIzaSyDOFeJ1GvtXtffzCwQFg2M3CCVtpn875KQ",
  authDomain: "l-nksida.firebaseapp.com",
  databaseURL: "https://l-nksida-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "l-nksida",
  storageBucket: "l-nksida.firebasestorage.app",
  messagingSenderId: "258147870107",
  appId: "1:258147870107:web:ce637517bc30b7578cad3e"
};

// Firebase modular SDK imports (v9+/v10+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getDatabase, ref, get, set, remove, onValue, push, update } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Re-export Firebase functions for convenience
export { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  ref, 
  get, 
  set, 
  remove, 
  onValue,
  push,
  update
};

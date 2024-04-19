// firebase-handler.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBICefnA70xIvkdxhPtRzopKrsMrCSj-GQ",
    authDomain: "lenksida.firebaseapp.com",
    databaseURL: "https://lenksida-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "lenksida",
    storageBucket: "lenksida.appspot.com",
    messagingSenderId: "344382936717",
    appId: "1:344382936717:web:67c0f34fdb4341573b34c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(); // Get a reference to the database

// Function to save text to Firebase
export function saveText(cykelText) {
    return set(ref(database, 'cykelText'), cykelText);
}

// Function to retrieve text from Firebase
export function retrieveText() {
    return get(ref(database, 'cykelText')).then((snapshot) => {
        return snapshot.val();
    });
}

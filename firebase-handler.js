// firebase-handler.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
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

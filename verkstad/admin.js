import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Check auth state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../index/login.html";
  }
});

// Global variable for current edit
let currentEditKey = null;

// Function to fetch and display all database entries
async function loadEntries() {
  const tableBody = document.getElementById("entriesTableBody");
  tableBody.innerHTML = ""; // Clear existing rows

  try {
    const verkstadRef = ref(db, "verkstad");
    const snapshot = await get(verkstadRef);
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const data = childSnapshot.val();
        const value = data && data.label ? data.label : ""; // Ensure value is a string

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${key}</td>
          <td>
            <button onclick="window.editEntry('${key}', '${String(value).replace(/'/g, "\\'")}')">Ändra Post</button>
            <button onclick="window.deleteEntry('${key}')">Radera Post</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error loading entries:", error);
  }
}

// Function to add a new entry
async function addEntry() {
  const key = document.getElementById("newKey").value.trim();
  const value = document.getElementById("newValue").value.trim();

  if (key && value) {
    try {
      const entryRef = ref(db, "verkstad/" + key);
      await set(entryRef, value);
      alert("Entry added successfully!");
      loadEntries();
    } catch (error) {
      console.error("Error adding entry:", error);
    }
  } else {
    alert("Both key and value are required.");
  }
}

// Function to delete an entry
async function deleteEntry(key) {
  if (confirm(`Are you sure you want to delete "${key}"?`)) {
    try {
      const entryRef = ref(db, "verkstad/" + key);
      await remove(entryRef);
      alert("Entry deleted successfully!");
      loadEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  }
}

// Function to edit an entry
async function editEntry(key) {
  try {
    const entryRef = ref(db, "verkstad/" + key);
    const snapshot = await get(entryRef);
    const currentValue = snapshot.val();

    // Show the modal and populate the input fields with the current key and value
    currentEditKey = key;
    document.getElementById("editKeyInput").value = key;
    document.getElementById("editTextarea").value = currentValue || "";
    document.getElementById("editModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
  } catch (error) {
    console.error("Error fetching current value for editing:", error);
  }
}

// Function to save edit
async function saveEdit() {
  const newKey = document.getElementById("editKeyInput").value.trim();
  const newValue = document.getElementById("editTextarea").value.trim();

  if (currentEditKey && newKey && newValue) {
    try {
      // If the key has changed, remove the old key and save the new key-value pair
      if (currentEditKey !== newKey) {
        const oldEntryRef = ref(db, "verkstad/" + currentEditKey);
        await remove(oldEntryRef);
        
        const newEntryRef = ref(db, "verkstad/" + newKey);
        await set(newEntryRef, newValue);
        
        alert("Entry updated successfully!");
        closeModal();
        loadEntries();
      } else {
        // If the key hasn't changed, just update the value
        const entryRef = ref(db, "verkstad/" + currentEditKey);
        await set(entryRef, newValue);
        
        alert("Entry updated successfully!");
        closeModal();
        loadEntries();
      }
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  }
}

// Function to close modal
function closeModal() {
  document.getElementById("editModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
  currentEditKey = null;
}

// Expose functions to global window object for onclick handlers
window.addEntry = addEntry;
window.deleteEntry = deleteEntry;
window.editEntry = editEntry;
window.saveEdit = saveEdit;
window.closeModal = closeModal;

// Load entries on page load
loadEntries();

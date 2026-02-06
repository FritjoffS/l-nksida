import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Check auth state - redirect to login if not authenticated
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
    const kontorRef = ref(db, "kontor");
    const snapshot = await get(kontorRef);
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const value = childSnapshot.val();

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${escapeHtml(key)}</td>
          <td class="url-cell" title="${escapeHtml(value)}">${escapeHtml(truncateUrl(value))}</td>
          <td>
            <button onclick="window.editEntry('${escapeAttr(key)}')">Ändra</button>
            <button onclick="window.deleteEntry('${escapeAttr(key)}')">Radera</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error loading entries:", error);
    showToast("Kunde inte ladda poster", "error");
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to escape attribute values
function escapeAttr(text) {
  if (!text) return "";
  return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// Helper function to truncate long URLs
function truncateUrl(url) {
  if (!url) return "";
  return url.length > 40 ? url.substring(0, 40) + "..." : url;
}

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === "error" ? "#f44336" : type === "success" ? "#4CAF50" : "#2196F3"};
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Function to add a new entry
async function addEntry() {
  const keyInput = document.getElementById("newKey");
  const valueInput = document.getElementById("newValue");
  const key = keyInput.value.trim();
  const value = valueInput.value.trim();

  if (key && value) {
    // Validate URL
    if (!isValidUrl(value)) {
      showToast("Ange en giltig URL (börjar med http:// eller https://)", "error");
      return;
    }

    try {
      const entryRef = ref(db, "kontor/" + key);
      await set(entryRef, value);
      showToast("Länk sparad!", "success");
      keyInput.value = "";
      valueInput.value = "";
      loadEntries();
    } catch (error) {
      console.error("Error adding entry:", error);
      showToast("Kunde inte spara länken", "error");
    }
  } else {
    showToast("Både benämning och URL krävs", "error");
  }
}

// Validate URL
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

// Function to delete an entry
async function deleteEntry(key) {
  if (confirm(`Är du säker på att du vill radera "${key}"?`)) {
    try {
      const entryRef = ref(db, "kontor/" + key);
      await remove(entryRef);
      showToast("Länk raderad!", "success");
      loadEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      showToast("Kunde inte radera länken", "error");
    }
  }
}

// Function to edit an entry
async function editEntry(key) {
  try {
    const entryRef = ref(db, "kontor/" + key);
    const snapshot = await get(entryRef);
    const currentValue = snapshot.val();

    // Show the modal and populate the input fields
    currentEditKey = key;
    document.getElementById("editKeyInput").value = key;
    document.getElementById("editTextarea").value = currentValue || "";
    document.getElementById("editModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
    
    // Focus on the input field
    document.getElementById("editKeyInput").focus();
  } catch (error) {
    console.error("Error fetching current value for editing:", error);
    showToast("Kunde inte hämta data för redigering", "error");
  }
}

// Function to save edit
async function saveEdit() {
  const newKey = document.getElementById("editKeyInput").value.trim();
  const newValue = document.getElementById("editTextarea").value.trim();

  if (!currentEditKey || !newKey || !newValue) {
    showToast("Både benämning och URL krävs", "error");
    return;
  }

  // Validate URL
  if (!isValidUrl(newValue)) {
    showToast("Ange en giltig URL (börjar med http:// eller https://)", "error");
    return;
  }

  try {
    // If the key has changed, remove the old key and save the new
    if (currentEditKey !== newKey) {
      const oldEntryRef = ref(db, "kontor/" + currentEditKey);
      await remove(oldEntryRef);

      const newEntryRef = ref(db, "kontor/" + newKey);
      await set(newEntryRef, newValue);
    } else {
      const entryRef = ref(db, "kontor/" + currentEditKey);
      await set(entryRef, newValue);
    }

    showToast("Länk uppdaterad!", "success");
    closeModal();
    loadEntries();
  } catch (error) {
    console.error("Error updating entry:", error);
    showToast("Kunde inte uppdatera länken", "error");
  }
}

// Function to close modal
function closeModal() {
  document.getElementById("editModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
  currentEditKey = null;
}

// Handle Escape key to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("editModal").style.display === "block") {
    closeModal();
  }
});

// Expose functions to global window object for onclick handlers
window.addEntry = addEntry;
window.deleteEntry = deleteEntry;
window.editEntry = editEntry;
window.saveEdit = saveEdit;
window.closeModal = closeModal;

// Load entries on page load
loadEntries();

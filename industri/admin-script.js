// ES Module - Firebase imports
import { database, ref, get, set, remove } from '../scripts/firebase-config.js';

// Function to fetch and display all database entries
function loadEntries() {
  const tableBody = document.getElementById("entriesTableBody");
  tableBody.innerHTML = ""; // Clear existing rows

  get(ref(database, "industri")).then(snapshot => {
    snapshot.forEach(childSnapshot => {
      const key = childSnapshot.key;
      const data = childSnapshot.val();
      const value = data && data.label ? data.label : ""; // Ensure value is a string

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${key}</td>
        <!-- <td>${value}</td> -->
        <td>
          <button onclick="editEntry('${key}', '${value.replace(/'/g, "\\'")}')">Ändra Post</button>
          <button onclick="deleteEntry('${key}')">Radera Post</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }).catch(error => {
    console.error("Error loading entries:", error);
  });
}

// Function to add a new entry
window.addEntry = function addEntry() {
  const key = document.getElementById("newKey").value.trim();
  const value = document.getElementById("newValue").value.trim();

  if (key && value) {
    set(ref(database, "industri/" + key), value).then(() => {
      alert("Posten tillagd!");
      loadEntries();
    }).catch(error => {
      console.error("Error adding entry:", error);
    });
  } else {
    alert("Benämning och Beskrivning krävs!");
  }
}

// Function to delete an entry
window.deleteEntry = function deleteEntry(key) {
  if (confirm(`Are you sure you want to delete "${key}"?`)) {
    remove(ref(database, "industri/" + key)).then(() => {
      alert("Posten raderad!");
      loadEntries();
    }).catch(error => {
      console.error("Error deleting entry:", error);
    });
  }
}

let currentEditKey = null;

window.editEntry = function editEntry(key) {
  // Fetch the current value from the database
  get(ref(database, "industri/" + key)).then(snapshot => {
    const currentValue = snapshot.val();

    // Show the modal and populate the input fields with the current key and value
    currentEditKey = key;
    document.getElementById("editKeyInput").value = key;
    document.getElementById("editTextarea").value = currentValue || "";
    document.getElementById("editModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
  }).catch(error => {
    console.error("Error fetching current value for editing:", error);
  });
}

window.saveEdit = function saveEdit() {
  const newKey = document.getElementById("editKeyInput").value.trim();
  const newValue = document.getElementById("editTextarea").value.trim();

  if (currentEditKey && newKey && newValue) {
    // If the key has changed, remove the old key and save the new key-value pair
    if (currentEditKey !== newKey) {
      remove(ref(database, "industri/" + currentEditKey)).then(() => {
        set(ref(database, "industri/" + newKey), newValue).then(() => {
          alert("Posten uppdaterad!");
          closeModal();
          loadEntries();
        }).catch(error => {
          console.error("Error updating entry:", error);
        });
      }).catch(error => {
        console.error("Error removing old key:", error);
      });
    } else {
      // If the key hasn't changed, just update the value
      set(ref(database, "industri/" + currentEditKey), newValue).then(() => {
        alert("Posten uppdaterad!");
        closeModal();
        loadEntries();
      }).catch(error => {
        console.error("Error updating entry:", error);
      });
    }
  }
}

window.closeModal = function closeModal() {
  document.getElementById("editModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
  currentEditKey = null;
}

// Load entries on page load
window.onload = loadEntries;

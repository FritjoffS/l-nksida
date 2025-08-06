    // Function to fetch and display all database entries
    function loadEntries() {
      const database = firebase.database();
      const tableBody = document.getElementById("entriesTableBody");
      tableBody.innerHTML = ""; // Clear existing rows

      database.ref("template").once("value").then(snapshot => {
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
    function addEntry() {
      const key = document.getElementById("newKey").value.trim();
      const value = document.getElementById("newValue").value.trim();

      if (key && value) {
        const database = firebase.database();
        database.ref("template/" + key).set(value).then(() => {
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
    function deleteEntry(key) {
      if (confirm(`Are you sure you want to delete "${key}"?`)) {
        const database = firebase.database();
        database.ref("template/" + key).remove().then(() => {
          alert("Posten raderad!");
          loadEntries();
        }).catch(error => {
          console.error("Error deleting entry:", error);
        });
      }
    }

    let currentEditKey = null;

    function editEntry(key) {
      const database = firebase.database();

      // Fetch the current value from the database
      database.ref("template/" + key).once("value").then(snapshot => {
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

    function saveEdit() {
      const newKey = document.getElementById("editKeyInput").value.trim();
      const newValue = document.getElementById("editTextarea").value.trim();

      if (currentEditKey && newKey && newValue) {
        const database = firebase.database();

        // If the key has changed, remove the old key and save the new key-value pair
        if (currentEditKey !== newKey) {
          database.ref("template/" + currentEditKey).remove().then(() => {
            database.ref("template/" + newKey).set(newValue).then(() => {
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
          database.ref("template/" + currentEditKey).set(newValue).then(() => {
            alert("Posten uppdaterad!");
            closeModal();
            loadEntries();
          }).catch(error => {
            console.error("Error updating entry:", error);
          });
        }
      }
    }

    function closeModal() {
      document.getElementById("editModal").style.display = "none";
      document.getElementById("modalOverlay").style.display = "none";
      currentEditKey = null;
    }

    // Load entries on page load
    window.onload = loadEntries;
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, child, update, remove, push } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Database
const auth = getAuth(app);
const db = getDatabase(app);

// Check auth state
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "../index/login.html";
    }
  });
}

// Logout function
function logout() {
  signOut(auth).then(() => {
    window.location.href = "../index/login.html";
  }).catch((error) => {
    console.error("Logout error:", error);
  });
}

// Attach logout to the global window object
window.logout = logout;

// Call checkAuthState on page load
checkAuthState();

const numberRows = 23; // Number of rows to generate

const titleInput = document.querySelector("#titleInput");
const insertButton = document.querySelector("#insertButton");
const updateButton = document.querySelector("#updateButton");
const deleteButton = document.querySelector("#deleteButton");
const printButton = document.querySelector("#printButton");
const clearButton = document.querySelector("#clearButton");
const exportButton = document.querySelector("#exportButton");
const importButton = document.querySelector("#importButton");

async function InsertData() {
  // Check if the title input is not empty
  if (titleInput.value.trim() === "") {
    alert("Överskrift måste fyllas i");
    return;
  }

  // Check if title already exists
  const dbref = ref(db);
  const snapshot = await get(child(dbref, "lathund/products"));
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const existingTitle = Object.values(data).find(item => 
      item.title.toLowerCase() === titleInput.value.trim().toLowerCase()
    );
    
    if (existingTitle) {
      alert("En sida med namnet '" + titleInput.value + "' finns redan. Välj ett annat namn.");
      return;
    }
  }

  const dataObject = {
    title: titleInput.value,
  };

  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);
    
    dataObject["produkt" + i] = produktInput.value;
    dataObject["produktNummer" + i] = produktNummerInput.value;
  }

  if (Object.keys(dataObject).length > 1) {
    const newPostRef = push(ref(db, "lathund/products"));
    set(newPostRef, dataObject)
      .then(() => {
        alert("Sidan sparad som: " + titleInput.value);
        displaySavedTitles();
      })
      .catch((error) => {
        alert(error);
      });
  } else {
    alert("Minst en produkt och dess produktnummer måste fyllas i");
  }
}

// Function to find data based on the selected identifier from dropdown
function FindData() {
  const selectedIdentifier = document.getElementById('savedTitlesDropdown').value;
  
  if (!selectedIdentifier) {
    alert("Välj en sida först");
    return;
  }

  const dbref = ref(db);

  get(child(dbref, "lathund/products/" + selectedIdentifier))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        titleInput.value = data.title;

        for (let i = 1; i <= numberRows; i++) {
          const produktInput = document.querySelector("#produkt" + i);
          const produktNummerInput = document.querySelector("#produktNummer" + i);

          produktInput.value = data["produkt" + i] || "";
          produktNummerInput.value = data["produktNummer" + i] || "";

          // Trigger barcode generation manually
          handleInputChange({ target: produktNummerInput });
        }
      } else {
        alert("Sidan finns inte");
      }
    })
    .catch((error) => {
      alert(error);
    });
}

// Function to update data based on the selected title
async function UpdateData() {
  const selectedIdentifier = document.getElementById('savedTitlesDropdown').value;

  if (selectedIdentifier === "") {
    alert("Välj en sida att uppdatera");
    return;
  }

  // Check if new title already exists (excluding current entry)
  const dbref = ref(db);
  const snapshot = await get(child(dbref, "lathund/products"));
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const existingEntry = Object.entries(data).find(([key, item]) => 
      key !== selectedIdentifier && 
      item.title.toLowerCase() === titleInput.value.trim().toLowerCase()
    );
    
    if (existingEntry) {
      alert("En sida med namnet '" + titleInput.value + "' finns redan. Välj ett annat namn.");
      return;
    }
  }

  const dataObject = {
    title: titleInput.value,
  };

  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);
    
    dataObject["produkt" + i] = produktInput.value;
    dataObject["produktNummer" + i] = produktNummerInput.value;
  }

  update(ref(db, "lathund/products/" + selectedIdentifier), dataObject)
    .then(() => {
      alert("Sidan uppdaterad");
      displaySavedTitles();
    })
    .catch((error) => {
      alert(error);
    });
}

// Function to delete data based on the selected title
function DeleteData() {
  const selectedIdentifier = document.getElementById('savedTitlesDropdown').value;

  if (selectedIdentifier === "") {
    alert("Välj en sida att ta bort");
    return;
  }

  // Ask for confirmation
  const confirmation = window.confirm("Vill du ta bort denna sidan?");

  // If the user confirms, proceed with deletion
  if (confirmation) {
    remove(ref(db, "lathund/products/" + selectedIdentifier))
      .then(() => {
        alert("Sidan borttagen");
        
        // Clear form and refresh dropdown
        clearForm();
        displaySavedTitles();
      })
      .catch((error) => {
        alert(error);
      });
  } else {
    alert("Sidan ej raderad");
  }
}

// Function to display saved titles
function displaySavedTitles() {
  const dbref = ref(db);

  get(child(dbref, "lathund/products"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.entries(data);

        // Sort entries alphabetically by title
        entries.sort((a, b) => {
          const titleA = a[1].title.toLowerCase();
          const titleB = b[1].title.toLowerCase();
          return titleA.localeCompare(titleB);
        });

        // Extract identifiers and titles
        const identifiers = entries.map(([key, value]) => key);
        const titles = entries.map(([key, value]) => value.title);

        // Populate dropdown with titles and associate each title with its identifier
        populateDropdownList(identifiers, titles);
      } else {
        populateDropdownList([], []);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

// Function to populate dropdown list
function populateDropdownList(identifiers, titles) {
  const dropdown = document.getElementById('savedTitlesDropdown');

  // Clear existing options
  dropdown.innerHTML = '<option value="">Välj en sida</option>';

  // Add titles to the dropdown
  titles.forEach((title, index) => {
    const option = document.createElement('option');
    option.value = identifiers[index];
    option.textContent = title;
    dropdown.appendChild(option);
  });
}

// Function to fill the form with data for the selected title
function findDataForSelectedTitle() {
  const selectedIdentifier = document.getElementById('savedTitlesDropdown').value;
  
  if (selectedIdentifier) {
    FindData();
  }
}

// Function to clear form
function clearForm() {
  titleInput.value = "";
  
  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);
    const barcodeImg = document.querySelector(`#produktSection${i} .barcode`);
    
    produktInput.value = "";
    produktNummerInput.value = "";
    if (barcodeImg) barcodeImg.src = "";
  }
  
  document.getElementById('savedTitlesDropdown').value = "";
}

// Call the function to display saved titles on page load
displaySavedTitles();

// Attach event listener to the dropdown list to trigger data retrieval on selection change
document.getElementById('savedTitlesDropdown').addEventListener('change', findDataForSelectedTitle);

insertButton.addEventListener("click", function () {
  if (titleInput.value.trim() !== "") {
    InsertData();
  } else {
    alert("Överskrift måste fyllas i");
  }
});

updateButton.addEventListener("click", function () {
  if (titleInput.value.trim() !== "") {
    UpdateData();
  } else {
    alert("Hämta sidan du vill uppdatera.");
  }
});

deleteButton.addEventListener("click", function () {
  if (titleInput.value.trim() !== "") {
    DeleteData();
  } else {
    alert("Hämta sidan du vill radera.");
  }
});

printButton.addEventListener("click", function () {
  window.print();
});

clearButton.addEventListener("click", function () {
  clearForm();
});

exportButton.addEventListener("click", function () {
  exportData();
});

importButton.addEventListener("click", function () {
  importData();
});

function generateBarcode(produktNummer, barcodeImg) {
  if (produktNummer) {
    JsBarcode(barcodeImg, produktNummer, {
      format: "CODE128",
      displayValue: false,
    });
  } else {
    // Clear the barcode image if the produktNummer is empty
    barcodeImg.src = '';
  }
}

function handleInputChange(event) {
  const section = event.target.closest('section');
  const produktNummerInput = section.querySelector('[name="produktNummer"]');
  const barcodeImg = section.querySelector('.barcode');

  generateBarcode(produktNummerInput.value, barcodeImg);
}

const form = document.getElementById('productForm');
for (let i = 1; i <= numberRows; i++) {
  const section = document.createElement('section');
  section.id = `produktSection${i}`;

  const produktInput = document.createElement('input');
  produktInput.type = 'text';
  produktInput.id = `produkt${i}`;
  produktInput.name = 'produkt';
  produktInput.placeholder = 'Produkt';

  const produktNummerInput = document.createElement('input');
  produktNummerInput.type = 'text';
  produktNummerInput.id = `produktNummer${i}`;
  produktNummerInput.name = 'produktNummer';
  produktNummerInput.placeholder = 'Produktnummer';

  const barcodeImg = document.createElement('img');
  barcodeImg.className = 'barcode';

  section.appendChild(produktInput);
  section.appendChild(produktNummerInput);
  section.appendChild(barcodeImg);

  form.appendChild(section);

  // Attach event listener to input elements
  produktNummerInput.addEventListener('input', handleInputChange);
}

// Initial barcode generation on page load
document.querySelectorAll('[name="produktNummer"]').forEach(input => {
  const section = input.closest('section');
  const barcodeImg = section.querySelector('.barcode');
  generateBarcode(input.value, barcodeImg);
});

// Function to convert a string to an ArrayBuffer, used by export function
function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
}

function exportData() {
  const selectedTitle = document.getElementById('savedTitlesDropdown').value;

  // Check if a title is selected
  if (!selectedTitle) {
    alert("Välj en sida att exportera");
    return;
  }

  const dataObject = {
    title: titleInput.value,
  };

  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);
    
    dataObject["produkt" + i] = produktInput.value;
    dataObject["produktNummer" + i] = produktNummerInput.value;
  }

  // Convert the object data to an array of objects
  const dataArray = [dataObject];

  // Create an array for the headers
  const headers = ["Produkter", "prodNr"];

  // Create an array for the transposed data
  const transposedData = [headers];

  // Loop through the dataArray and push the values to transposedData
  dataArray.forEach(function (row) {
    for (let i = 1; i <= numberRows; i++) {
      const rowData = [row['produkt' + i], row['produktNummer' + i]];
      transposedData.push(rowData);
    }
  });

  // Convert the transposed data to XLSX format using SheetJS
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(transposedData);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");

  // Use XLSX.write to create a binary string
  const binaryString = XLSX.write(workbook, {
    bookType: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bookSST: false,
    type: "binary"
  });

  // Convert the binary string to a Blob
  const blob = new Blob([s2ab(binaryString)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");

  // Set the exported file name based on the title
  link.download = titleInput.value + ".xlsx";

  link.href = window.URL.createObjectURL(blob);
  link.click();
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx";

  input.addEventListener("change", function () {
    const file = input.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });

          // Assuming the first sheet is the one you want to import
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

          // Extract the filename (excluding extension) and use it as the title
          const filenameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
          const newPostRef = push(ref(db, "lathund/products"));
          set(child(newPostRef, "title"), filenameWithoutExtension);

          // Set the data to the new post
          jsonData.forEach((row, index) => {
            set(child(newPostRef, "produkt" + (index + 1)), row.Produkter || "");
            set(child(newPostRef, "produktNummer" + (index + 1)), row.prodNr || "");
          });

          alert("Data importerad");
          displaySavedTitles();
        } catch (error) {
          alert("Ogiltig XLSX-fil");
        }
      };

      reader.readAsBinaryString(file);
    }
  });

  input.click();
}

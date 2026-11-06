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
const saveButton = document.querySelector("#saveButton");
const pageSearch = document.querySelector("#pageSearch");
const pageStatus = document.querySelector("#pageStatus");
const toastContainer = document.querySelector("#toastContainer");

function showToast(message, type) {
  if (!type) {
    type = /fel uppstod|ogiltig/i.test(message) ? "error"
      : /sparad|uppdaterad|borttagen|importerad/i.test(message) ? "success"
      : "warning";
  }
  const toastEl = document.createElement("div");
  toastEl.className = `toast ${type}`;
  toastEl.setAttribute("role", type === "error" ? "alert" : "status");
  toastEl.textContent = message;
  toastContainer.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), type === "error" ? 6000 : 3500);
}

// Non-blocking toasts replace the blocking alert() dialogs.
const alert = (message) => showToast(message);
const deleteButton = document.querySelector("#deleteButton");
const printButton = document.querySelector("#printButton");
const clearButton = document.querySelector("#clearButton");
const exportButton = document.querySelector("#exportButton");
const importButton = document.querySelector("#importButton");
const savedTitlesDropdown = document.querySelector("#savedTitlesDropdown");
let activeRecordId = "";
let savedFormSnapshot = "";

// Security: Input sanitization and validation
const MAX_TITLE_LENGTH = 100;
const MAX_PRODUCT_LENGTH = 200;
const MAX_PRODUCT_NUMBER_LENGTH = 50;

// Form values are inserted as input values or textContent, not parsed as HTML.
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim();
}

// Validate title input
function validateTitle(title) {
  const sanitized = sanitizeInput(title);
  
  if (sanitized.length === 0) {
    return { valid: false, message: "Överskrift måste fyllas i", sanitized };
  }
  
  if (sanitized.length > MAX_TITLE_LENGTH) {
    return { valid: false, message: `Överskrift får max vara ${MAX_TITLE_LENGTH} tecken`, sanitized };
  }
  
  return { valid: true, sanitized };
}

// Validate product name
function validateProductName(name) {
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length > MAX_PRODUCT_LENGTH) {
    return { valid: false, message: `Produktnamn får max vara ${MAX_PRODUCT_LENGTH} tecken`, sanitized };
  }
  
  return { valid: true, sanitized };
}

// Validate product number
function validateProductNumber(number) {
  const sanitized = sanitizeInput(number);
  
  if (sanitized.length > MAX_PRODUCT_NUMBER_LENGTH) {
    return { valid: false, message: `Produktnummer får max vara ${MAX_PRODUCT_NUMBER_LENGTH} tecken`, sanitized };
  }
  
  // Product numbers should typically be alphanumeric with some special chars
  if (sanitized && !/^[a-zA-Z0-9åäöÅÄÖ\-_.\s'"`<>]*$/.test(sanitized)) {
    return { valid: false, message: "Produktnummer innehåller ogiltiga tecken", sanitized: '' };
  }
  
  return { valid: true, sanitized };
}

async function InsertData() {
  // Validate and sanitize title
  const titleValidation = validateTitle(titleInput.value);
  if (!titleValidation.valid) {
    alert(titleValidation.message);
    return;
  }
  
  const sanitizedTitle = titleValidation.sanitized;

  // Check if title already exists
  const dbref = ref(db);
  const snapshot = await get(child(dbref, "lathund/products"));
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const existingTitle = Object.values(data).find(item => 
      item.title.toLowerCase() === sanitizedTitle.toLowerCase()
    );
    
    if (existingTitle) {
      alert("En sida med namnet '" + sanitizedTitle + "' finns redan. Välj ett annat namn.");
      return;
    }
  }

  const dataObject = {
    title: sanitizedTitle,
  };

  let hasValidProduct = false;

  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);
    
    // Validate and sanitize product data
    const produktValidation = validateProductName(produktInput.value);
    const nummerValidation = validateProductNumber(produktNummerInput.value);
    
    if (!produktValidation.valid) {
      alert(`Rad ${i}: ${produktValidation.message}`);
      return;
    }
    
    if (!nummerValidation.valid) {
      alert(`Rad ${i}: ${nummerValidation.message}`);
      return;
    }
    
    dataObject["produkt" + i] = produktValidation.sanitized;
    dataObject["produktNummer" + i] = nummerValidation.sanitized;
    
    // Check if at least one product has data
    if (produktValidation.sanitized || nummerValidation.sanitized) {
      hasValidProduct = true;
    }
  }

  if (hasValidProduct) {
    const newPostRef = push(ref(db, "lathund/products"));
    set(newPostRef, dataObject)
      .then(() => {
        alert("Sidan sparad som: " + sanitizedTitle);
        activeRecordId = newPostRef.key;
        populateForm(dataObject);
        markFormAsSaved();
        displaySavedTitles(activeRecordId);
      })
      .catch((error) => {
        console.error("Save error:", error);
        alert("Ett fel uppstod vid sparande. Försök igen.");
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
        populateForm(data);
        activeRecordId = selectedIdentifier;
        markFormAsSaved();
        updateActionButtons();
      } else {
        alert("Sidan finns inte");
        savedTitlesDropdown.value = activeRecordId;
        updateActionButtons();
      }
    })
    .catch((error) => {
      console.error("Load error:", error);
      alert("Ett fel uppstod vid laddning. Försök igen.");
      savedTitlesDropdown.value = activeRecordId;
      updateActionButtons();
    });
}

// Function to update data based on the selected title
async function UpdateData() {
  const selectedIdentifier = activeRecordId;

  if (!selectedIdentifier || savedTitlesDropdown.value !== selectedIdentifier) {
    alert("Välj en sida att uppdatera");
    return;
  }

  // Validate and sanitize title
  const titleValidation = validateTitle(titleInput.value);
  if (!titleValidation.valid) {
    alert(titleValidation.message);
    return;
  }
  
  const sanitizedTitle = titleValidation.sanitized;

  // Check if new title already exists (excluding current entry)
  const dbref = ref(db);
  const snapshot = await get(child(dbref, "lathund/products"));
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const existingEntry = Object.entries(data).find(([key, item]) => 
      key !== selectedIdentifier && 
      item.title.toLowerCase() === sanitizedTitle.toLowerCase()
    );
    
    if (existingEntry) {
      alert("En sida med namnet '" + sanitizedTitle + "' finns redan. Välj ett annat namn.");
      return;
    }
  }

  const dataObject = {
    title: sanitizedTitle,
  };

  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);
    
    // Validate and sanitize product data
    const produktValidation = validateProductName(produktInput.value);
    const nummerValidation = validateProductNumber(produktNummerInput.value);
    
    if (!produktValidation.valid) {
      alert(`Rad ${i}: ${produktValidation.message}`);
      return;
    }
    
    if (!nummerValidation.valid) {
      alert(`Rad ${i}: ${nummerValidation.message}`);
      return;
    }
    
    dataObject["produkt" + i] = produktValidation.sanitized;
    dataObject["produktNummer" + i] = nummerValidation.sanitized;
  }

  update(ref(db, "lathund/products/" + selectedIdentifier), dataObject)
    .then(() => {
      alert("Sidan uppdaterad");
      activeRecordId = selectedIdentifier;
      populateForm(dataObject);
      markFormAsSaved();
      displaySavedTitles(activeRecordId);
    })
    .catch((error) => {
      console.error("Update error:", error);
      alert("Ett fel uppstod vid uppdatering. Försök igen.");
    });
}

// Function to delete data based on the selected title
function DeleteData() {
  const selectedIdentifier = activeRecordId;

  if (!selectedIdentifier || savedTitlesDropdown.value !== selectedIdentifier) {
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
        console.error("Delete error:", error);
        alert("Ett fel uppstod vid borttagning. Försök igen.");
      });
  }
}

// Function to display saved titles
function displaySavedTitles(selectedIdentifier = activeRecordId) {
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
        populateDropdownList(identifiers, titles, selectedIdentifier);
      } else {
        populateDropdownList([], [], "");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

// Function to populate dropdown list
let savedPages = [];

function populateDropdownList(identifiers, titles, selectedIdentifier = activeRecordId) {
  savedPages = identifiers.map((id, index) => ({ id, title: sanitizeInput(titles[index]) }));
  activeRecordId = identifiers.includes(selectedIdentifier) ? selectedIdentifier : "";
  renderDropdown();
}

// Renders the dropdown filtered by the search box; the open page is always kept.
function renderDropdown() {
  const filter = pageSearch.value.trim().toLowerCase();
  const matches = savedPages.filter(page =>
    page.id === activeRecordId || page.title.toLowerCase().includes(filter)
  );

  savedTitlesDropdown.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = filter
    ? `${matches.length} träff(ar) – välj en sida`
    : `Välj en sida (${savedPages.length})`;
  savedTitlesDropdown.appendChild(placeholder);

  // textContent displays titles as text rather than interpreting them as HTML.
  matches.forEach(page => {
    const option = document.createElement("option");
    option.value = page.id;
    option.textContent = page.title;
    savedTitlesDropdown.appendChild(option);
  });

  savedTitlesDropdown.value = activeRecordId;
  updateActionButtons();
}

// Function to fill the form with data for the selected title
function findDataForSelectedTitle() {
  const selectedIdentifier = savedTitlesDropdown.value;

  if (hasUnsavedChanges()) {
    const discardChanges = window.confirm("Du har osparade ändringar. Vill du kasta dem och öppna en annan sida?");
    if (!discardChanges) {
      savedTitlesDropdown.value = activeRecordId;
      updateActionButtons();
      return;
    }
  }

  updateActionButtons();
  if (selectedIdentifier) {
    FindData();
  } else {
    clearForm();
  }
}

function getFormSnapshot() {
  const values = [titleInput.value];
  for (let i = 1; i <= numberRows; i++) {
    values.push(
      document.querySelector("#produkt" + i).value,
      document.querySelector("#produktNummer" + i).value
    );
  }
  return JSON.stringify(values);
}

function hasUnsavedChanges() {
  return savedFormSnapshot !== getFormSnapshot();
}

function markFormAsSaved() {
  savedFormSnapshot = getFormSnapshot();
}

function updateActionButtons() {
  const hasSelection = Boolean(activeRecordId && savedTitlesDropdown.value === activeRecordId);
  deleteButton.disabled = !hasSelection;
  exportButton.disabled = !hasSelection;
  updatePageStatus();
}

function updatePageStatus() {
  const page = savedPages.find(p => p.id === activeRecordId);
  const unsaved = hasUnsavedChanges();
  pageStatus.classList.toggle("unsaved", unsaved);
  const name = page ? `Öppen sida: ${page.title}` : "Ny sida (ej sparad)";
  pageStatus.textContent = unsaved ? `${name} ● osparade ändringar` : name;
}

function populateForm(data) {
  titleInput.value = sanitizeInput(data.title || "");

  for (let i = 1; i <= numberRows; i++) {
    const produktInput = document.querySelector("#produkt" + i);
    const produktNummerInput = document.querySelector("#produktNummer" + i);

    produktInput.value = sanitizeInput(data["produkt" + i] || "");
    produktNummerInput.value = sanitizeInput(data["produktNummer" + i] || "");
    handleInputChange({ target: produktNummerInput });
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
  
  activeRecordId = "";
  savedTitlesDropdown.value = "";
  markFormAsSaved();
  updateActionButtons();
}

// Call the function to display saved titles on page load
displaySavedTitles();

// Attach event listener to the dropdown list to trigger data retrieval on selection change
savedTitlesDropdown.addEventListener('change', findDataForSelectedTitle);

window.addEventListener("beforeunload", (event) => {
  if (hasUnsavedChanges()) {
    event.preventDefault();
    event.returnValue = "";
  }
});

saveButton.addEventListener("click", saveCurrentPage);

function saveCurrentPage() {
  if (titleInput.value.trim() === "") {
    alert("Överskrift måste fyllas i");
    titleInput.focus();
    return;
  }
  if (activeRecordId) {
    UpdateData();
  } else {
    InsertData();
  }
}

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveCurrentPage();
  }
});

pageSearch.addEventListener("input", renderDropdown);
pageSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const firstMatch = [...savedTitlesDropdown.options].find(option => option.value && option.value !== activeRecordId)
    || [...savedTitlesDropdown.options].find(option => option.value);
  if (firstMatch) {
    savedTitlesDropdown.value = firstMatch.value;
    findDataForSelectedTitle();
  }
});

document.querySelector(".formcontainer").addEventListener("input", updatePageStatus);

insertButton.addEventListener("click", function () {
  if (titleInput.value.trim() !== "") {
    InsertData();
  } else {
    alert("Överskrift måste fyllas i");
    titleInput.focus();
  }
});

deleteButton.addEventListener("click", function () {
  if (!savedTitlesDropdown.value) {
    alert("Hämta sidan du vill radera.");
    return;
  }
  DeleteData();
});

printButton.addEventListener("click", function () {
  window.print();
});

clearButton.addEventListener("click", function () {
  if (hasUnsavedChanges() && !window.confirm("Du har osparade ändringar. Vill du rensa formuläret och kasta dem?")) {
    return;
  }
  clearForm();
  pageSearch.value = "";
  renderDropdown();
  titleInput.focus();
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

markFormAsSaved();
updateActionButtons();

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
  const selectedTitle = activeRecordId;

  // Check if a title is selected
  if (!selectedTitle || savedTitlesDropdown.value !== selectedTitle) {
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

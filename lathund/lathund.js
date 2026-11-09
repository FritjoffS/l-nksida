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

const initialRowCount = 3;
const MAX_ROWS = 24;

// The navbar is position: fixed, so the sticky toolbar must sit below it.
const navbarHost = document.getElementById("navbar");
const navResizeObserver = new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty("--nav-offset", `${entry.target.getBoundingClientRect().height}px`);
});
const observeNavbar = () => {
  const nav = navbarHost.querySelector("nav");
  if (nav) navResizeObserver.observe(nav);
};
new MutationObserver(observeNavbar).observe(navbarHost, { childList: true, subtree: true });
observeNavbar();

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
const form = document.getElementById("productForm");
const addRowButton = document.getElementById("addRowButton");
const rowCountStatus = document.getElementById("rowCountStatus");
const rowMoveStatus = document.getElementById("rowMoveStatus");
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

function getRows() {
  return Array.from(form.querySelectorAll("section"), section => ({
    produkt: section.querySelector('[name="produkt"]').value,
    produktNummer: section.querySelector('[name="produktNummer"]').value,
  }));
}

function collectProductData(title) {
  const rows = getRows();
  const data = { title, rowCount: rows.length };

  for (const [index, row] of rows.entries()) {
    const product = validateProductName(row.produkt);
    const number = validateProductNumber(row.produktNummer);
    if (!product.valid || !number.valid) {
      alert(`Rad ${index + 1}: ${!product.valid ? product.message : number.message}`);
      return null;
    }
    data[`produkt${index + 1}`] = product.sanitized;
    data[`produktNummer${index + 1}`] = number.sanitized;
  }
  return data;
}

function readProductRows(data) {
  const indices = Object.keys(data)
    .map(key => /^(?:produkt|produktNummer)([1-9]\d*)$/.exec(key))
    .filter(Boolean)
    .map(match => Number(match[1]));
  const legacyCount = indices.reduce((max, index) => Math.max(max, index), 0);
  const count = Number.isSafeInteger(data.rowCount) && data.rowCount >= 0
    ? Math.max(data.rowCount, legacyCount)
    : legacyCount;
  const rows = Array.from({ length: count }, (_, index) => ({
    produkt: String(data[`produkt${index + 1}`] ?? ""),
    produktNummer: String(data[`produktNummer${index + 1}`] ?? ""),
  }));
  if (!Number.isSafeInteger(data.rowCount)) {
    while (rows.length && !rows[rows.length - 1].produkt && !rows[rows.length - 1].produktNummer) {
      rows.pop();
    }
  }
  return rows;
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
  let snapshot;
  try {
    snapshot = await get(child(dbref, "lathund/products"));
  } catch (error) {
    console.error("Save lookup error:", error);
    alert("Ett fel uppstod vid sparande. Försök igen.");
    return;
  }
  
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

  const dataObject = collectProductData(sanitizedTitle);
  if (!dataObject) return;
  const hasValidProduct = getRows().some(row => row.produkt.trim() || row.produktNummer.trim());

  if (hasValidProduct) {
    const newPostRef = push(ref(db, "lathund/products"));
    const submittedSnapshot = getFormSnapshot();
    const previousRecordId = activeRecordId;
    set(newPostRef, dataObject)
      .then(() => {
        alert("Sidan sparad som: " + sanitizedTitle);
        finishSave(newPostRef.key, previousRecordId, dataObject, submittedSnapshot);
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
  let snapshot;
  try {
    snapshot = await get(child(dbref, "lathund/products"));
  } catch (error) {
    console.error("Update lookup error:", error);
    alert("Ett fel uppstod vid uppdatering. Försök igen.");
    return;
  }
  
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

  const dataObject = collectProductData(sanitizedTitle);
  if (!dataObject) return;

  const existingData = snapshot.exists() ? snapshot.val()[selectedIdentifier] : null;
  const removedFields = {};
  if (existingData) {
    Object.keys(existingData).forEach(key => {
      if (/^(?:produkt|produktNummer)[1-9]\d*$/.test(key) && !(key in dataObject)) {
        removedFields[key] = null;
      }
    });
  }

  const submittedSnapshot = getFormSnapshot();
  update(ref(db, "lathund/products/" + selectedIdentifier), { ...removedFields, ...dataObject })
    .then(() => {
      alert("Sidan uppdaterad");
      finishSave(selectedIdentifier, selectedIdentifier, dataObject, submittedSnapshot);
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
      console.error("Load titles error:", error);
      alert("Ett fel uppstod när sparade sidor skulle hämtas. Försök igen.");
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
  return JSON.stringify([titleInput.value, getRows()]);
}

function hasUnsavedChanges() {
  return savedFormSnapshot !== getFormSnapshot();
}

function markFormAsSaved() {
  savedFormSnapshot = getFormSnapshot();
}

function finishSave(recordId, previousRecordId, data, submittedSnapshot) {
  if (activeRecordId !== previousRecordId) return;
  activeRecordId = recordId;
  if (getFormSnapshot() === submittedSnapshot) {
    populateForm(data);
    markFormAsSaved();
  } else {
    savedFormSnapshot = JSON.stringify([data.title, readProductRows(data)]);
  }
  updatePageStatus();
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
  finishRowDrag(true);
  titleInput.value = sanitizeInput(data.title || "");
  const rows = readProductRows(data);
  form.replaceChildren();
  if (rows.length) {
    rows.forEach(row => addProductRow(row));
  } else {
    for (let i = 0; i < initialRowCount; i++) addProductRow();
  }
  updateRowLabels();
}

// Function to clear form
function clearForm() {
  finishRowDrag(true);
  titleInput.value = "";
  form.replaceChildren();
  for (let i = 0; i < initialRowCount; i++) addProductRow();
  updateRowLabels();
  
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
    try {
      JsBarcode(barcodeImg, produktNummer, {
        format: "CODE128",
        displayValue: false,
      });
    } catch (error) {
      barcodeImg.removeAttribute("src");
      console.error("Barcode error:", error);
      alert("Ogiltigt produktnummer för streckkod: " + produktNummer);
    }
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

function updateRowLabels() {
  const sections = form.querySelectorAll("section");
  addRowButton.disabled = sections.length >= MAX_ROWS;
  rowCountStatus.textContent = sections.length > MAX_ROWS
    ? `${sections.length} rader. Ta bort rader för att nå max ${MAX_ROWS}.`
    : `${sections.length} av ${MAX_ROWS} rader${sections.length === MAX_ROWS ? " – max antal rader" : ""}`;
  sections.forEach((section, index) => {
    const rowNumber = index + 1;
    section.querySelector('[name="produkt"]').setAttribute("aria-label", `Produkt, rad ${rowNumber}`);
    section.querySelector('[name="produktNummer"]').setAttribute("aria-label", `Produktnummer, rad ${rowNumber}`);
    section.querySelector(".remove-row").setAttribute("aria-label", `Ta bort rad ${rowNumber}`);
    section.querySelector(".drag-row").setAttribute("aria-label", `Flytta rad ${rowNumber}`);
  });
}

function announceRowPosition(section) {
  const index = Array.from(form.children).indexOf(section);
  rowMoveStatus.textContent = `Raden är på plats ${index + 1} av ${form.children.length}.`;
}

function moveProductRow(section, direction) {
  const sibling = direction === "up" ? section.previousElementSibling : section.nextElementSibling;
  if (!sibling) return;

  if (direction === "up") {
    form.insertBefore(section, sibling);
  } else {
    form.insertBefore(sibling, section);
  }
  updateRowLabels();
  updatePageStatus();
  section.querySelector(".drag-row").focus();
  announceRowPosition(section);
}

let rowDrag = null;

function positionDraggedRow(clientY) {
  const target = Array.from(form.children).find(row =>
    row !== rowDrag.section && clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2
  );
  if (target === rowDrag.section.nextElementSibling || (!target && !rowDrag.section.nextElementSibling)) return;
  form.insertBefore(rowDrag.section, target || null);
  updateRowLabels();
  updatePageStatus();
}

function scrollDuringDrag() {
  if (!rowDrag || !rowDrag.dragging) return;
  const edge = 60;
  const speed = rowDrag.clientY < edge ? -12 : rowDrag.clientY > window.innerHeight - edge ? 12 : 0;
  if (!speed) {
    rowDrag.scrollFrame = null;
    return;
  }
  const previousScroll = window.scrollY;
  window.scrollBy(0, speed);
  if (window.scrollY === previousScroll) {
    rowDrag.scrollFrame = null;
    return;
  }
  positionDraggedRow(rowDrag.clientY);
  rowDrag.scrollFrame = requestAnimationFrame(scrollDuringDrag);
}

function finishRowDrag(cancelled) {
  if (!rowDrag) return;
  const { section, originalNext, dragging, scrollFrame, pointerId } = rowDrag;
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  if (cancelled && section.parentElement === form) {
    form.insertBefore(section, originalNext && originalNext.parentElement === form ? originalNext : null);
  }
  section.classList.remove("dragging-row");
  rowDrag = null;
  if (form.hasPointerCapture(pointerId)) form.releasePointerCapture(pointerId);
  updateRowLabels();
  updatePageStatus();
  if (dragging && !cancelled && section.parentElement === form) announceRowPosition(section);
}

form.addEventListener("pointermove", event => {
  if (!rowDrag || event.pointerId !== rowDrag.pointerId) return;
  rowDrag.clientY = event.clientY;
  if (!rowDrag.dragging && Math.abs(event.clientY - rowDrag.startY) >= 5) {
    rowDrag.dragging = true;
    rowDrag.section.classList.add("dragging-row");
  }
  if (rowDrag.dragging) {
    positionDraggedRow(event.clientY);
    if (rowDrag.scrollFrame === null) scrollDuringDrag();
  }
});

form.addEventListener("pointerup", event => {
  if (rowDrag && event.pointerId === rowDrag.pointerId) finishRowDrag(false);
});
form.addEventListener("pointercancel", event => {
  if (rowDrag && event.pointerId === rowDrag.pointerId) finishRowDrag(true);
});
form.addEventListener("lostpointercapture", event => {
  if (rowDrag && event.pointerId === rowDrag.pointerId) finishRowDrag(true);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && rowDrag) {
    finishRowDrag(true);
  }
});

function updateRowEmptyState(section) {
  const isEmpty = !section.querySelector('[name="produkt"]').value.trim()
    && !section.querySelector('[name="produktNummer"]').value.trim();
  section.classList.toggle("empty-row", isEmpty);
}

function addProductRow(row = { produkt: "", produktNummer: "" }) {
  const section = document.createElement('section');

  const produktInput = document.createElement('input');
  produktInput.type = 'text';
  produktInput.name = 'produkt';
  produktInput.placeholder = 'Produkt';
  produktInput.value = row.produkt;

  const produktNummerInput = document.createElement('input');
  produktNummerInput.type = 'text';
  produktNummerInput.name = 'produktNummer';
  produktNummerInput.placeholder = 'Nummer';
  produktNummerInput.value = row.produktNummer;

  const barcodeImg = document.createElement('img');
  barcodeImg.className = 'barcode';
  barcodeImg.alt = "";

  const rowControls = document.createElement("div");
  rowControls.className = "row-controls";

  const dragHandle = document.createElement("button");
  dragHandle.type = "button";
  dragHandle.className = "drag-row";
  dragHandle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>';
  dragHandle.title = "Dra för att flytta raden, eller använd piltangenterna";
  dragHandle.setAttribute("aria-describedby", "rowMoveHelp");
  dragHandle.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || rowDrag) return;
    rowDrag = {
      section, pointerId: event.pointerId, startY: event.clientY, clientY: event.clientY,
      originalNext: section.nextElementSibling, dragging: false, scrollFrame: null,
    };
    form.setPointerCapture(event.pointerId);
  });
  dragHandle.addEventListener("keydown", event => {
    if (!rowDrag && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      moveProductRow(section, event.key === "ArrowUp" ? "up" : "down");
    }
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-row";
  removeButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
  removeButton.title = "Ta bort raden";
  removeButton.addEventListener("click", () => {
    if ((produktInput.value.trim() || produktNummerInput.value.trim())
      && !window.confirm("Vill du ta bort raden och dess innehåll?")) return;
    finishRowDrag(true);
    section.remove();
    if (!form.children.length) addProductRow();
    updateRowLabels();
    updatePageStatus();
  });

  section.appendChild(produktInput);
  section.appendChild(produktNummerInput);
  section.appendChild(barcodeImg);
  rowControls.append(dragHandle, removeButton);
  section.appendChild(rowControls);

  form.appendChild(section);

  produktNummerInput.addEventListener('input', handleInputChange);
  section.addEventListener("input", () => updateRowEmptyState(section));
  updateRowEmptyState(section);
  if (row.produktNummer) handleInputChange({ target: produktNummerInput });
  return produktInput;
}

addRowButton.addEventListener("click", () => {
  if (form.querySelectorAll("section").length >= MAX_ROWS) {
    showToast(`En lathund kan ha högst ${MAX_ROWS} rader.`, "warning");
    return;
  }
  const input = addProductRow();
  updateRowLabels();
  updatePageStatus();
  input.focus();
});

for (let i = 0; i < initialRowCount; i++) addProductRow();
updateRowLabels();
markFormAsSaved();
updateActionButtons();

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

  const transposedData = [
    ["Produkter", "prodNr"],
    ...getRows().map(row => [row.produkt, row.produktNummer]),
  ];

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

      reader.onload = async function (e) {
        let dataObject;
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          if (!sheet) throw new Error("Arbetsblad saknas");
          const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", blankrows: true });
          const headers = sheetRows.shift() || [];
          const productColumn = headers.indexOf("Produkter");
          const numberColumn = headers.indexOf("prodNr");
          if (productColumn < 0 || numberColumn < 0) throw new Error("Kolumnerna Produkter och prodNr saknas");

          const rows = sheetRows.map(row => ({
            produkt: String(row[productColumn] ?? ""),
            produktNummer: String(row[numberColumn] ?? ""),
          }));
          while (rows.length && !rows[rows.length - 1].produkt && !rows[rows.length - 1].produktNummer) {
            rows.pop();
          }
          if (rows.length > MAX_ROWS) {
            showToast(`Filen har ${rows.length} rader. En lathund kan ha högst ${MAX_ROWS} rader.`, "warning");
            return;
          }
          dataObject = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            rowCount: rows.length,
          };
          rows.forEach((row, index) => {
            dataObject[`produkt${index + 1}`] = row.produkt;
            dataObject[`produktNummer${index + 1}`] = row.produktNummer;
          });
        } catch (error) {
          console.error("Import error:", error);
          alert("Ogiltig XLSX-fil. Kontrollera att kolumnerna Produkter och prodNr finns.");
          return;
        }

        try {
          const newPostRef = push(ref(db, "lathund/products"));
          await set(newPostRef, dataObject);
          alert("Data importerad");
          displaySavedTitles();
        } catch (error) {
          console.error("Import save error:", error);
          alert("Ett fel uppstod vid import. Försök igen.");
        }
      };

      reader.onerror = () => {
        console.error("File read error:", reader.error);
        alert("Ett fel uppstod när filen lästes. Försök igen.");
      };
      reader.readAsBinaryString(file);
    }
  });

  input.click();
}

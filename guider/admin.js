/**
 * Guide Admin - Hantera guider och steg
 * Moderniserad version med Firebase v10+ och toast-notifikationer
 */

// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getDatabase, ref, get, set, remove, push } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dmtfxmepd';
const CLOUDINARY_UPLOAD_PRESET = 'l-nksida-guides';

// DOM Elements
let loadingOverlay, guideSelector, customGuideSection, customGuideNameInput;
let guideDisplayNameSection, guideDisplayNameInput;
let stepsTableBody, stepsGrid;
let newStepForm, newTitleInput, newTextInput, newImageUrlInput, newAltTextInput;
let editModal, editStepIdInput, editTitleInput, editTextInput, editImageUrlInput, editAltTextInput;

// State
let allGuides = [];
let currentEditKey = null;

// Initialize DOM elements
function initDOMElements() {
    loadingOverlay = document.getElementById('loadingOverlay');
    guideSelector = document.getElementById('guideSelector');
    customGuideSection = document.getElementById('customGuideSection');
    customGuideNameInput = document.getElementById('customGuideName');
    guideDisplayNameSection = document.getElementById('guideDisplayNameSection');
    guideDisplayNameInput = document.getElementById('guideDisplayName');
    stepsTableBody = document.getElementById('stepsTableBody');
    stepsGrid = document.getElementById('stepsGrid');
    
    // Form inputs
    newTitleInput = document.getElementById('newTitle');
    newTextInput = document.getElementById('newText');
    newImageUrlInput = document.getElementById('newImageUrl');
    newAltTextInput = document.getElementById('newAltText');
    
    // Edit modal
    editModal = document.getElementById('editModal');
    editStepIdInput = document.getElementById('editStepId');
    editTitleInput = document.getElementById('editTitle');
    editTextInput = document.getElementById('editText');
    editImageUrlInput = document.getElementById('editImageUrl');
    editAltTextInput = document.getElementById('editAltText');
}

// Show loading state
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading state
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check auth state
function checkAuthState() {
    showLoading();
    
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "../index/login.html";
        } else {
            hideLoading();
            loadGuideDropdown();
        }
    }, (error) => {
        console.error("Auth error:", error);
        hideLoading();
        showToast('Autentiseringsfel. Omdirigerar till login...', 'error');
        setTimeout(() => {
            window.location.href = "../index/login.html";
        }, 2000);
    });
}

// Load available guides into dropdown
async function loadGuideDropdown() {
    try {
        const guidesRef = ref(database, 'guider');
        const snapshot = await get(guidesRef);
        
        // Clear existing options except defaults
        guideSelector.innerHTML = `
            <option value="">-- Välj guide --</option>
            <option value="newGuide">➕ Skapa ny guide</option>
        `;

        if (snapshot.exists()) {
            allGuides = [];
            snapshot.forEach(childSnapshot => {
                const guideId = childSnapshot.key;
                const guideData = childSnapshot.val();
                allGuides.push({ id: guideId, ...guideData });
                
                const option = document.createElement("option");
                option.value = guideId;
                option.textContent = guideData.displayName || formatGuideName(guideId);
                guideSelector.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error loading guides:", error);
        showToast('Fel vid laddning av guider', 'error');
    }
}

// Format guide ID to display name
function formatGuideName(guideId) {
    return guideId
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/Guide$/, '')
        .trim();
}

// Get selected guide ID
function getSelectedGuide() {
    if (guideSelector.value === 'newGuide') {
        return customGuideNameInput ? customGuideNameInput.value.trim() : null;
    }
    return guideSelector.value || null;
}

// Handle guide selection change
function onGuideSelectionChange() {
    const value = guideSelector.value;
    
    if (value === 'newGuide') {
        customGuideSection.style.display = 'block';
        guideDisplayNameSection.style.display = 'none';
        clearStepsDisplay();
    } else if (value) {
        customGuideSection.style.display = 'none';
        guideDisplayNameSection.style.display = 'block';
        loadCurrentDisplayName(value);
        loadSteps();
    } else {
        customGuideSection.style.display = 'none';
        guideDisplayNameSection.style.display = 'none';
        clearStepsDisplay();
    }
}

// Clear steps display
function clearStepsDisplay() {
    if (stepsGrid) {
        stepsGrid.innerHTML = '';
    }
    if (stepsTableBody) {
        stepsTableBody.innerHTML = '';
    }
}

// Load current display name
async function loadCurrentDisplayName(guideId) {
    try {
        const displayNameRef = ref(database, `guider/${guideId}/displayName`);
        const snapshot = await get(displayNameRef);
        
        if (snapshot.exists()) {
            guideDisplayNameInput.value = snapshot.val();
        } else {
            guideDisplayNameInput.value = formatGuideName(guideId);
        }
    } catch (error) {
        console.error("Error loading display name:", error);
        guideDisplayNameInput.value = formatGuideName(guideId);
    }
}

// Update guide display name
async function updateGuideDisplayName() {
    const selectedGuide = getSelectedGuide();
    const newDisplayName = guideDisplayNameInput.value.trim();
    
    if (!selectedGuide) {
        showToast('Välj en guide först', 'error');
        return;
    }
    
    if (!newDisplayName) {
        showToast('Ange ett visningsnamn', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const displayNameRef = ref(database, `guider/${selectedGuide}/displayName`);
        await set(displayNameRef, newDisplayName);
        showToast('Visningsnamn uppdaterat!', 'success');
        loadGuideDropdown();
    } catch (error) {
        console.error("Error updating display name:", error);
        showToast('Kunde inte uppdatera visningsnamn', 'error');
    } finally {
        hideLoading();
    }
}

// Natural sort for step keys
function naturalSort(a, b) {
    const regex = /(\d+)|(\D+)/g;
    const aParts = a.match(regex) || [];
    const bParts = b.match(regex) || [];
    
    const maxLength = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxLength; i++) {
        const aPart = aParts[i] || '';
        const bPart = bParts[i] || '';
        
        if (!isNaN(aPart) && !isNaN(bPart)) {
            const diff = parseInt(aPart) - parseInt(bPart);
            if (diff !== 0) return diff;
        } else {
            const diff = aPart.localeCompare(bPart, 'sv');
            if (diff !== 0) return diff;
        }
    }
    
    return 0;
}

// Load steps for selected guide
async function loadSteps() {
    const selectedGuide = getSelectedGuide();
    
    if (!selectedGuide) {
        clearStepsDisplay();
        return;
    }
    
    showLoading();
    
    try {
        const stepsRef = ref(database, `guider/${selectedGuide}/steps`);
        const snapshot = await get(stepsRef);
        
        clearStepsDisplay();
        
        if (snapshot.exists()) {
            const entries = [];
            snapshot.forEach(childSnapshot => {
                entries.push({
                    key: childSnapshot.key,
                    data: childSnapshot.val()
                });
            });
            
            // Sort naturally
            entries.sort((a, b) => naturalSort(a.key, b.key));
            
            // Render steps as cards
            renderStepsGrid(entries);
        } else {
            renderEmptyState();
        }
    } catch (error) {
        console.error("Error loading steps:", error);
        showToast('Fel vid laddning av steg', 'error');
    } finally {
        hideLoading();
    }
}

// Render steps as grid of cards
function renderStepsGrid(entries) {
    if (!stepsGrid) return;
    
    if (entries.length === 0) {
        renderEmptyState();
        return;
    }
    
    stepsGrid.innerHTML = entries.map((entry, index) => `
        <div class="step-card" data-step-id="${entry.key}">
            <div class="step-card-header">
                <span class="step-number">${index + 1}</span>
                <span class="step-id">${entry.key}</span>
                <div class="step-card-actions">
                    <button class="btn-icon edit-step" data-step-id="${entry.key}" title="Redigera">✏️</button>
                    <button class="btn-icon delete-step" data-step-id="${entry.key}" title="Ta bort">🗑️</button>
                </div>
            </div>
            <div class="step-card-body">
                <h4>${entry.data.title || 'Ingen titel'}</h4>
                <p>${truncateText(entry.data.text || entry.data.content || '', 100)}</p>
                ${entry.data.imageUrl ? `<div class="step-image-preview"><img src="${entry.data.imageUrl}" alt="${entry.data.altText || ''}"></div>` : ''}
            </div>
        </div>
    `).join('');
    
    attachStepEventListeners();
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Render empty state
function renderEmptyState() {
    if (!stepsGrid) return;
    
    stepsGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>Inga steg ännu</h3>
            <p>Lägg till ditt första steg i formuläret ovan.</p>
        </div>
    `;
}

// Attach event listeners to step cards
function attachStepEventListeners() {
    stepsGrid.querySelectorAll('.edit-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editEntry(btn.dataset.stepId);
        });
    });
    
    stepsGrid.querySelectorAll('.delete-step').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEntry(btn.dataset.stepId);
        });
    });
}

// Get next step ID
async function getNextStepId() {
    const selectedGuide = getSelectedGuide();
    if (!selectedGuide) return 'step1';
    
    try {
        const stepsRef = ref(database, `guider/${selectedGuide}/steps`);
        const snapshot = await get(stepsRef);
        
        if (!snapshot.exists()) return 'step1';
        
        let maxNum = 0;
        snapshot.forEach(childSnapshot => {
            const match = childSnapshot.key.match(/step(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNum) maxNum = num;
            }
        });
        
        return `step${maxNum + 1}`;
    } catch (error) {
        console.error("Error getting next step ID:", error);
        return `step${Date.now()}`;
    }
}

// Add new step
async function addStep() {
    const title = newTitleInput.value.trim();
    const text = newTextInput.value.trim();
    const imageUrl = newImageUrlInput.value.trim();
    const altText = newAltTextInput.value.trim();
    const selectedGuide = getSelectedGuide();

    if (!selectedGuide) {
        showToast('Välj eller skapa en guide först', 'error');
        return;
    }

    if (!title || !text) {
        showToast('Titel och beskrivning krävs', 'error');
        return;
    }

    showLoading();

    try {
        const stepId = await getNextStepId();
        const stepData = {
            title: title,
            text: text,
            imageUrl: imageUrl || null,
            altText: altText || null
        };

        const stepRef = ref(database, `guider/${selectedGuide}/steps/${stepId}`);
        await set(stepRef, stepData);
        
        showToast('Steg tillagt!', 'success');
        clearForm();
        loadSteps();
        
        // Refresh dropdown if new guide was created
        if (guideSelector.value === 'newGuide') {
            await loadGuideDropdown();
            guideSelector.value = selectedGuide;
            onGuideSelectionChange();
        }
    } catch (error) {
        console.error("Error adding step:", error);
        showToast('Kunde inte lägga till steg', 'error');
    } finally {
        hideLoading();
    }
}

// Clear form
function clearForm() {
    if (newTitleInput) newTitleInput.value = '';
    if (newTextInput) newTextInput.value = '';
    if (newImageUrlInput) newImageUrlInput.value = '';
    if (newAltTextInput) newAltTextInput.value = '';
}

// Edit step
async function editEntry(stepId) {
    const selectedGuide = getSelectedGuide();
    if (!selectedGuide) {
        showToast('Välj en guide först', 'error');
        return;
    }

    try {
        const stepRef = ref(database, `guider/${selectedGuide}/steps/${stepId}`);
        const snapshot = await get(stepRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            currentEditKey = stepId;
            
            editStepIdInput.value = stepId;
            editTitleInput.value = data.title || '';
            editTextInput.value = data.text || data.content || '';
            editImageUrlInput.value = data.imageUrl || '';
            editAltTextInput.value = data.altText || '';
            
            editModal.classList.add('active');
        }
    } catch (error) {
        console.error("Error loading step for edit:", error);
        showToast('Kunde inte ladda steget', 'error');
    }
}

// Save edit
async function saveEdit() {
    const newStepId = editStepIdInput.value.trim();
    const newTitle = editTitleInput.value.trim();
    const newText = editTextInput.value.trim();
    const newImageUrl = editImageUrlInput.value.trim();
    const newAltText = editAltTextInput.value.trim();
    const selectedGuide = getSelectedGuide();

    if (!selectedGuide) {
        showToast('Välj en guide först', 'error');
        return;
    }

    if (!newStepId || !newTitle || !newText) {
        showToast('Steg-ID, titel och beskrivning krävs', 'error');
        return;
    }

    showLoading();

    try {
        const stepData = {
            title: newTitle,
            text: newText,
            imageUrl: newImageUrl || null,
            altText: newAltText || null
        };

        // If step ID changed, remove old and create new
        if (currentEditKey !== newStepId) {
            const oldRef = ref(database, `guider/${selectedGuide}/steps/${currentEditKey}`);
            await remove(oldRef);
        }
        
        const newRef = ref(database, `guider/${selectedGuide}/steps/${newStepId}`);
        await set(newRef, stepData);
        
        showToast('Steg uppdaterat!', 'success');
        closeEditModal();
        loadSteps();
    } catch (error) {
        console.error("Error saving edit:", error);
        showToast('Kunde inte spara ändringarna', 'error');
    } finally {
        hideLoading();
    }
}

// Delete step
async function deleteEntry(stepId) {
    const selectedGuide = getSelectedGuide();
    if (!selectedGuide) {
        showToast('Välj en guide först', 'error');
        return;
    }

    if (!confirm(`Är du säker på att du vill ta bort steg "${stepId}"?`)) {
        return;
    }

    showLoading();

    try {
        const stepRef = ref(database, `guider/${selectedGuide}/steps/${stepId}`);
        await remove(stepRef);
        
        showToast('Steg borttaget!', 'success');
        loadSteps();
    } catch (error) {
        console.error("Error deleting step:", error);
        showToast('Kunde inte ta bort steget', 'error');
    } finally {
        hideLoading();
    }
}

// Delete entire guide
async function deleteGuide() {
    const selectedGuide = getSelectedGuide();
    
    if (!selectedGuide) {
        showToast('Välj en guide först', 'error');
        return;
    }
    
    const guide = allGuides.find(g => g.id === selectedGuide);
    const guideName = guide?.displayName || selectedGuide;
    
    if (!confirm(`Är du säker på att du vill ta bort hela guiden "${guideName}"?\n\nDetta tar bort alla steg och kan inte ångras.`)) {
        return;
    }

    showLoading();

    try {
        const guideRef = ref(database, `guider/${selectedGuide}`);
        await remove(guideRef);
        
        showToast('Guide borttagen!', 'success');
        guideSelector.value = '';
        onGuideSelectionChange();
        loadGuideDropdown();
    } catch (error) {
        console.error("Error deleting guide:", error);
        showToast('Kunde inte ta bort guiden', 'error');
    } finally {
        hideLoading();
    }
}

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('active');
    currentEditKey = null;
}

// Upload image using Cloudinary widget
function uploadImage(targetInputId = 'newImageUrl') {
    if (!auth.currentUser) {
        showToast('Du måste vara inloggad för att ladda upp bilder', 'error');
        return;
    }

    // Check if cloudinary is loaded
    if (typeof cloudinary === 'undefined') {
        showToast('Bilduppladdning är inte tillgänglig just nu', 'error');
        return;
    }

    const widget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        folder: 'guides',
        maxFileSize: 5000000,
        maxImageFileSize: 5000000,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        multiple: false,
        sources: ['local', 'url'],
        showAdvancedOptions: false,
        cropping: false,
        theme: 'minimal'
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            const imageUrl = result.info.secure_url;
            const targetInput = document.getElementById(targetInputId);
            if (targetInput) {
                targetInput.value = imageUrl;
            }
            showToast('Bild uppladdad!', 'success');
        } else if (error) {
            console.error('Upload error:', error);
            showToast('Fel vid uppladdning', 'error');
        }
    });

    widget.open();
}

// Setup event listeners
function setupEventListeners() {
    // Guide selector
    if (guideSelector) {
        guideSelector.addEventListener('change', onGuideSelectionChange);
    }
    
    // Add step button
    const addStepBtn = document.getElementById('addStepBtn');
    if (addStepBtn) {
        addStepBtn.addEventListener('click', addStep);
    }
    
    // Clear form button
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearForm);
    }
    
    // Update display name button
    const updateNameBtn = document.getElementById('updateNameBtn');
    if (updateNameBtn) {
        updateNameBtn.addEventListener('click', updateGuideDisplayName);
    }
    
    // Delete guide button
    const deleteGuideBtn = document.getElementById('deleteGuideBtn');
    if (deleteGuideBtn) {
        deleteGuideBtn.addEventListener('click', deleteGuide);
    }
    
    // Upload image buttons
    const uploadNewBtn = document.getElementById('uploadNewImageBtn');
    if (uploadNewBtn) {
        uploadNewBtn.addEventListener('click', () => uploadImage('newImageUrl'));
    }
    
    const uploadEditBtn = document.getElementById('uploadEditImageBtn');
    if (uploadEditBtn) {
        uploadEditBtn.addEventListener('click', () => uploadImage('editImageUrl'));
    }
    
    // Edit modal
    const closeModalBtn = document.getElementById('closeEditModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditModal);
    }
    
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }
    
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveEdit);
    }
    
    // Close modal on overlay click
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }
    
    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal && editModal.classList.contains('active')) {
            closeEditModal();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    checkAuthState();
});

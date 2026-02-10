/**
 * Guide View - Visar enskild guide
 * Moderniserad version med PWA-stöd och toast-notifikationer
 */

// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dmtfxmepd';
const CLOUDINARY_UPLOAD_PRESET = 'l-nksida-guides';

// DOM Elements
let loadingOverlay, stepsContainer, pageTitle;

// State
let currentGuide = null;
let guideId = null;

// Initialize DOM elements
function initDOMElements() {
    loadingOverlay = document.getElementById('loadingOverlay');
    stepsContainer = document.getElementById('stepsContainer');
    pageTitle = document.getElementById('pageTitle');
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

// Get URL parameter
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || '';
}

// Check auth state
function checkAuthState() {
    showLoading();
    
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "../index/login.html";
        } else {
            loadGuideSteps();
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

// Load guide data from Firebase
async function loadGuideSteps() {
    guideId = getUrlParameter('guide');

    if (!guideId) {
        hideLoading();
        stepsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <h3>Ingen guide specificerad</h3>
                <p>Gå tillbaka till guidelistan för att välja en guide.</p>
            </div>
        `;
        return;
    }

    try {
        const guideRef = ref(database, `guider/${guideId}`);
        const snapshot = await get(guideRef);

        if (snapshot.exists()) {
            currentGuide = snapshot.val();
            const displayName = currentGuide.displayName || guideId.replace(/([A-Z])/g, ' $1').trim();
            pageTitle.textContent = displayName;
            document.title = displayName + ' - Guide';

            hideLoading();
            renderGuideSteps();
        } else {
            hideLoading();
            stepsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Guide hittades inte</h3>
                    <p>Ingen guide hittades för "${guideId}".</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading guide:", error);
        hideLoading();
        showToast('Fel vid laddning av guide.', 'error');
        stepsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Fel vid laddning</h3>
                <p>Kunde inte ladda guiden. Försök igen senare.</p>
            </div>
        `;
    }
}

// Convert steps to array (handles both old object format and new array format)
function stepsToArray(steps) {
    if (!steps) return [];
    
    if (Array.isArray(steps)) {
        return steps;
    }
    
    // Old format: object with step keys
    const keys = Object.keys(steps).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)) || 0;
        const numB = parseInt(b.match(/\d+/)) || 0;
        return numA - numB;
    });
    return keys.map(key => steps[key]);
}

// Render guide steps on the main page
function renderGuideSteps() {
    stepsContainer.innerHTML = "";

    if (!currentGuide) return;

    // Ensure steps is an array
    if (!Array.isArray(currentGuide.steps)) {
        currentGuide.steps = stepsToArray(currentGuide.steps);
    }

    if (currentGuide.steps.length === 0) {
        stepsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>Inga steg ännu</h3>
                <p>Denna guide har inga steg. Klicka på "Lägg till steg" för att lägga till.</p>
            </div>
        `;
        return;
    }

    currentGuide.steps.forEach((step, index) => {
        const section = document.createElement("section");
        section.className = "guide-step";
        section.dataset.index = index;
        
        // Step header with number and title
        const stepTitle = step.title ? `${step.title}` : `Steg ${index + 1}`;
        
        // Get text content (supports both 'text' and 'content' fields)
        const textContent = step.text || step.content || '';
        
        section.innerHTML = `
            <!-- View Mode -->
            <div class="step-view-mode">
                <div class="step-header">
                    <span class="step-number">${index + 1}</span>
                    <h2>${stepTitle}</h2>
                    <button class="btn-icon step-edit-btn" data-index="${index}" title="Redigera steg">✏️</button>
                </div>
                <div class="step-content">
                    <p>${textContent.replace(/\n/g, '<br>')}</p>
                    ${step.imageUrl ? `<img src="${step.imageUrl}" alt="${step.altText || step.title || 'Guide-bild'}" loading="lazy">` : ''}
                </div>
            </div>
            
            <!-- Edit Mode -->
            <div class="step-edit-mode hidden">
                <div class="step-edit-header">
                    <span class="step-number">${index + 1}</span>
                    <h3>Redigera Steg ${index + 1}</h3>
                </div>
                <div class="step-edit-form">
                    <div class="form-group">
                        <label>Titel</label>
                        <input type="text" class="edit-title" data-index="${index}" value="${step.title || ''}" placeholder="Stegets titel...">
                    </div>
                    <div class="form-group">
                        <label>Beskrivning</label>
                        <textarea class="edit-text" data-index="${index}" rows="4" placeholder="Beskrivning av steget...">${textContent}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Bild-URL</label>
                        <div class="image-input-group">
                            <input type="text" class="edit-image" data-index="${index}" value="${step.imageUrl || ''}" placeholder="https://...">
                            <button type="button" class="btn btn-sm btn-secondary upload-image-btn" data-index="${index}" title="Ladda upp bild">
                                📷 Ladda upp
                            </button>
                        </div>
                        ${step.imageUrl ? `<img src="${step.imageUrl}" alt="Förhandsgranskning" class="edit-image-preview">` : '<div class="edit-image-preview-placeholder">Ingen bild</div>'}
                    </div>
                    <div class="form-group">
                        <label>Alt-text för bild</label>
                        <input type="text" class="edit-alt" data-index="${index}" value="${step.altText || ''}" placeholder="Beskrivning för skärmläsare...">
                    </div>
                    <div class="step-edit-actions">
                        <div class="step-move-controls">
                            <button class="btn btn-sm btn-secondary move-up-btn" data-index="${index}" ${index === 0 ? 'disabled' : ''}>▲ Upp</button>
                            <button class="btn btn-sm btn-secondary move-down-btn" data-index="${index}" ${index === currentGuide.steps.length - 1 ? 'disabled' : ''}>▼ Ner</button>
                            <button class="btn btn-sm btn-danger delete-step-btn" data-index="${index}">🗑️ Ta bort</button>
                        </div>
                        <div class="step-save-controls">
                            <button class="btn btn-secondary cancel-edit-btn" data-index="${index}">Avbryt</button>
                            <button class="btn btn-success save-step-btn" data-index="${index}">💾 Spara</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        stepsContainer.appendChild(section);
    });

    // Add "Add new step" button at the bottom
    const addStepSection = document.createElement('div');
    addStepSection.className = 'add-step-section';
    addStepSection.innerHTML = `
        <button class="btn btn-primary add-step-bottom-btn" title="Lägg till nytt steg">
            ➕ Lägg till steg
        </button>
    `;
    stepsContainer.appendChild(addStepSection);

    // Attach event listeners for inline editing
    attachInlineEditListeners();
}

// Attach event listeners for inline step editing
function attachInlineEditListeners() {
    // Edit buttons
    stepsContainer.querySelectorAll('.step-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            enterEditMode(index);
        });
    });

    // Cancel buttons
    stepsContainer.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            exitEditMode(index);
        });
    });

    // Save step buttons
    stepsContainer.querySelectorAll('.save-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            saveStepInline(index);
        });
    });

    // Move up buttons
    stepsContainer.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            moveStepInline(index, -1);
        });
    });

    // Move down buttons
    stepsContainer.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            moveStepInline(index, 1);
        });
    });

    // Delete buttons
    stepsContainer.querySelectorAll('.delete-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteStepInline(index);
        });
    });

    // Image URL preview update
    stepsContainer.querySelectorAll('.edit-image').forEach(input => {
        input.addEventListener('input', (e) => {
            const section = e.target.closest('.guide-step');
            const preview = section.querySelector('.edit-image-preview');
            const placeholder = section.querySelector('.edit-image-preview-placeholder');
            
            if (e.target.value) {
                if (preview) {
                    preview.src = e.target.value;
                } else if (placeholder) {
                    const img = document.createElement('img');
                    img.src = e.target.value;
                    img.alt = 'Förhandsgranskning';
                    img.className = 'edit-image-preview';
                    placeholder.replaceWith(img);
                }
            }
        });
    });

    // Add step button at bottom
    const addStepBottomBtn = stepsContainer.querySelector('.add-step-bottom-btn');
    if (addStepBottomBtn) {
        addStepBottomBtn.addEventListener('click', addNewStep);
    }

    // Upload image buttons
    stepsContainer.querySelectorAll('.upload-image-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('.upload-image-btn');
            const index = parseInt(button.dataset.index);
            uploadImage(index);
        });
    });
}

// Upload image using Cloudinary widget
function uploadImage(stepIndex) {
    if (!auth.currentUser) {
        showToast('Du måste vara inloggad för att ladda upp bilder', 'error');
        return;
    }

    // Check if cloudinary is loaded
    if (typeof cloudinary === 'undefined') {
        showToast('Bilduppladdning är inte tillgänglig just nu. Ladda om sidan.', 'error');
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
            
            // Find the image input for this step and update it
            const section = stepsContainer.querySelector(`.guide-step[data-index="${stepIndex}"]`);
            if (section) {
                const imageInput = section.querySelector('.edit-image');
                if (imageInput) {
                    imageInput.value = imageUrl;
                    // Trigger input event to update preview
                    imageInput.dispatchEvent(new Event('input'));
                }
            }
            
            showToast('Bild uppladdad!', 'success');
        } else if (error) {
            console.error('Upload error:', error);
            showToast('Fel vid uppladdning', 'error');
        }
    });

    widget.open();
}

// Enter edit mode for a step
function enterEditMode(index) {
    const section = stepsContainer.querySelector(`.guide-step[data-index="${index}"]`);
    if (!section) return;
    
    section.classList.add('editing');
    section.querySelector('.step-view-mode').classList.add('hidden');
    section.querySelector('.step-edit-mode').classList.remove('hidden');
}

// Exit edit mode for a step (cancel)
function exitEditMode(index) {
    renderGuideSteps(); // Re-render to reset any changes
}

// Convert array to object format for Firebase (step0, step1, etc.)
function stepsArrayToObject(stepsArray) {
    const stepsObject = {};
    stepsArray.forEach((step, index) => {
        stepsObject[`step${index + 1}`] = {
            title: step.title || `Steg ${index + 1}`,
            text: step.text || 'Beskrivning...',
            imageUrl: step.imageUrl || '',
            altText: step.altText || ''
        };
    });
    return stepsObject;
}

// Prepare guide data for saving (converts steps array to object)
function prepareGuideForSave() {
    return {
        ...currentGuide,
        steps: stepsArrayToObject(currentGuide.steps)
    };
}

// Save a single step inline
async function saveStepInline(index) {
    const section = stepsContainer.querySelector(`.guide-step[data-index="${index}"]`);
    if (!section) return;
    
    // Get values from form
    const title = section.querySelector('.edit-title').value.trim();
    const text = section.querySelector('.edit-text').value.trim();
    const imageUrl = section.querySelector('.edit-image').value.trim();
    const altText = section.querySelector('.edit-alt').value.trim();
    
    // Validate required fields
    if (!title) {
        showToast('Titel är obligatorisk.', 'error');
        section.querySelector('.edit-title').focus();
        return;
    }
    if (!text) {
        showToast('Beskrivning är obligatorisk.', 'error');
        section.querySelector('.edit-text').focus();
        return;
    }
    
    // Update the step in memory
    currentGuide.steps[index] = {
        title,
        text,
        imageUrl,
        altText
    };
    
    // Save to Firebase
    showLoading();
    try {
        const guideRef = ref(database, `guider/${guideId}`);
        await set(guideRef, prepareGuideForSave());
        showToast('Steget har sparats!', 'success');
        renderGuideSteps();
    } catch (error) {
        console.error('Error saving step:', error);
        showToast('Kunde inte spara steget.', 'error');
    } finally {
        hideLoading();
    }
}

// Move step inline
async function moveStepInline(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentGuide.steps.length) return;

    const [movedStep] = currentGuide.steps.splice(index, 1);
    currentGuide.steps.splice(newIndex, 0, movedStep);
    
    // Save to Firebase
    showLoading();
    try {
        const guideRef = ref(database, `guider/${guideId}`);
        await set(guideRef, prepareGuideForSave());
        showToast('Steget har flyttats!', 'success');
        renderGuideSteps();
    } catch (error) {
        console.error('Error moving step:', error);
        showToast('Kunde inte flytta steget.', 'error');
    } finally {
        hideLoading();
    }
}

// Delete step inline
async function deleteStepInline(index) {
    if (!confirm('Är du säker på att du vill ta bort detta steg?')) return;
    
    const removedStep = currentGuide.steps.splice(index, 1)[0];
    
    // Save to Firebase
    showLoading();
    try {
        const guideRef = ref(database, `guider/${guideId}`);
        await set(guideRef, prepareGuideForSave());
        showToast('Steget har tagits bort!', 'success');
        renderGuideSteps();
    } catch (error) {
        console.error('Error deleting step:', error);
        // Revert the removal
        currentGuide.steps.splice(index, 0, removedStep);
        showToast('Kunde inte ta bort steget.', 'error');
    } finally {
        hideLoading();
    }
}

// Add new step
async function addNewStep() {
    if (!Array.isArray(currentGuide.steps)) {
        currentGuide.steps = [];
    }
    
    const stepNumber = currentGuide.steps.length + 1;
    const newStep = { 
        title: `Steg ${stepNumber}`, 
        text: 'Beskrivning av steget...', 
        imageUrl: '', 
        altText: '' 
    };
    currentGuide.steps.push(newStep);
    
    // Save to Firebase
    showLoading();
    try {
        const guideRef = ref(database, `guider/${guideId}`);
        await set(guideRef, prepareGuideForSave());
        showToast('Nytt steg har lagts till!', 'success');
        renderGuideSteps();
        
        // Enter edit mode for the new step
        setTimeout(() => {
            const newIndex = currentGuide.steps.length - 1;
            enterEditMode(newIndex);
            
            // Scroll to the new step
            const newSection = stepsContainer.querySelector(`.guide-step[data-index="${newIndex}"]`);
            if (newSection) {
                newSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } catch (error) {
        console.error('Error adding step:', error);
        currentGuide.steps.pop(); // Revert
        showToast('Kunde inte lägga till steg.', 'error');
    } finally {
        hideLoading();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add step button
    const addStepBtn = document.getElementById('addStepBtn');
    if (addStepBtn) {
        addStepBtn.addEventListener('click', addNewStep);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    checkAuthState();
});

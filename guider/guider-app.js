/**
 * Guider App - Kombinerad JS för guidelista och enskild guidevisning
 * Detekterar automatiskt vilken sida som laddas
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

// ==========================================================================
// SHARED UTILITIES
// ==========================================================================

let loadingOverlay;

function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

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

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || '';
}

// ==========================================================================
// GUIDE LIST PAGE (guider.html)
// ==========================================================================

const GuideList = {
    // DOM Elements
    guideContainer: null,
    guideModal: null,
    guideForm: null,
    modalTitle: null,
    guideNameInput: null,
    guideDescriptionInput: null,
    guideCategoryInput: null,
    guideIdInput: null,
    addGuideBtn: null,
    closeModalBtn: null,
    cancelBtn: null,
    deleteBtn: null,
    searchInput: null,
    
    // State
    allGuides: [],
    currentEditGuideId: null,

    init() {
        this.guideContainer = document.getElementById('guideContainer');
        this.guideModal = document.getElementById('guideModal');
        this.guideForm = document.getElementById('guideForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.guideNameInput = document.getElementById('guideName');
        this.guideDescriptionInput = document.getElementById('guideDescription');
        this.guideCategoryInput = document.getElementById('guideCategory');
        this.guideIdInput = document.getElementById('guideId');
        this.addGuideBtn = document.getElementById('addGuideBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.searchInput = document.getElementById('searchInput');
        
        this.setupEventListeners();
    },

    setupEventListeners() {
        if (this.addGuideBtn) {
            this.addGuideBtn.addEventListener('click', () => this.openAddModal());
        }
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.guideForm) {
            this.guideForm.addEventListener('submit', (e) => this.saveGuide(e));
        }
        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', () => {
                if (this.currentEditGuideId) {
                    this.deleteGuide(this.currentEditGuideId);
                }
            });
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.displayGuides());
        }
        if (this.guideModal) {
            this.guideModal.addEventListener('click', (e) => {
                if (e.target === this.guideModal) {
                    this.closeModal();
                }
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.guideModal && this.guideModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    },

    async loadGuides() {
        showLoading();
        try {
            const guidesRef = ref(database, 'guider');
            const snapshot = await get(guidesRef);
            
            if (snapshot.exists()) {
                const guidesData = snapshot.val();
                this.allGuides = Object.keys(guidesData).map(key => ({
                    id: key,
                    ...guidesData[key]
                }));
                this.allGuides.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'sv'));
            } else {
                this.allGuides = [];
            }
            
            hideLoading();
            this.displayGuides();
        } catch (error) {
            console.error("Error loading guides:", error);
            hideLoading();
            showToast('Fel vid laddning av guider.', 'error');
            this.showEmptyState('Ett fel uppstod vid laddning');
        }
    },

    displayGuides() {
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase() : '';

        const filteredGuides = this.allGuides.filter(guide => {
            const name = guide.displayName?.toLowerCase() || '';
            const description = guide.description?.toLowerCase() || '';
            const category = guide.category?.toLowerCase() || '';
            return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
        });

        if (filteredGuides.length === 0) {
            this.showEmptyState(searchTerm ? 'Inga guider matchar sökningen' : null);
            return;
        }

        this.guideContainer.innerHTML = filteredGuides.map(guide => `
            <div class="guide-card" role="listitem">
                <div class="guide-actions">
                    <button class="icon-btn edit" data-guide-id="${guide.id}" title="Redigera guide">✏️</button>
                    <button class="icon-btn delete" data-guide-id="${guide.id}" title="Ta bort guide">🗑️</button>
                </div>
                <div class="guide-info" data-guide-id="${guide.id}">
                    <h3>${guide.displayName || 'Namnlös Guide'}</h3>
                    <p>${guide.description || 'Ingen beskrivning.'}</p>
                    ${guide.category ? `<span class="guide-category">${guide.category}</span>` : ''}
                </div>
            </div>
        `).join('');

        this.attachCardListeners();
    },

    attachCardListeners() {
        this.guideContainer.querySelectorAll('.icon-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(btn.dataset.guideId);
            });
        });

        this.guideContainer.querySelectorAll('.icon-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteGuide(btn.dataset.guideId);
            });
        });

        this.guideContainer.querySelectorAll('.guide-info').forEach(info => {
            info.addEventListener('click', () => {
                window.location.href = `guide.html?guide=${info.dataset.guideId}`;
            });
        });
    },

    showEmptyState(message = null) {
        const defaultMessage = 'Inga guider tillgängliga';
        this.guideContainer.innerHTML = `
            <div class="no-results">
                <div class="empty-icon">📖</div>
                <h3>${message || defaultMessage}</h3>
                <p>Klicka på "Lägg till guide" för att skapa din första guide.</p>
            </div>
        `;
    },

    openAddModal() {
        this.currentEditGuideId = null;
        this.modalTitle.textContent = 'Lägg till ny guide';
        this.guideForm.reset();
        this.guideIdInput.value = '';
        this.deleteBtn.style.display = 'none';
        this.guideModal.classList.add('active');
        this.guideNameInput.focus();
    },

    openEditModal(guideId) {
        this.currentEditGuideId = guideId;
        const guide = this.allGuides.find(g => g.id === guideId);
        if (!guide) return;

        this.modalTitle.textContent = 'Redigera guide';
        this.guideIdInput.value = guide.id;
        this.guideNameInput.value = guide.displayName || '';
        this.guideDescriptionInput.value = guide.description || '';
        this.guideCategoryInput.value = guide.category || '';
        this.deleteBtn.style.display = 'block';
        this.guideModal.classList.add('active');
        this.guideNameInput.focus();
    },

    closeModal() {
        this.guideModal.classList.remove('active');
        this.currentEditGuideId = null;
        this.guideForm.reset();
    },

    async saveGuide(event) {
        event.preventDefault();
        
        const guideName = this.guideNameInput.value.trim();
        const guideDescription = this.guideDescriptionInput.value.trim();
        const guideCategory = this.guideCategoryInput.value.trim();

        if (!guideName) {
            showToast('Guidenamn krävs', 'error');
            return;
        }

        const guideData = {
            displayName: guideName,
            description: guideDescription,
            category: guideCategory,
        };

        showLoading();

        try {
            let guideRef;
            if (this.currentEditGuideId) {
                guideRef = ref(database, `guider/${this.currentEditGuideId}`);
                const originalGuide = this.allGuides.find(g => g.id === this.currentEditGuideId);
                if (originalGuide && originalGuide.steps) {
                    guideData.steps = originalGuide.steps;
                }
            } else {
                guideRef = push(ref(database, 'guider'));
                guideData.steps = { step1: { title: "Nytt steg", text: "Redigera denna guide för att lägga till innehåll." } };
            }
            
            await set(guideRef, guideData);
            showToast(this.currentEditGuideId ? 'Guide uppdaterad!' : 'Guide tillagd!', 'success');
            this.closeModal();
            await this.loadGuides();
        } catch (error) {
            console.error("Error saving guide:", error);
            hideLoading();
            showToast('Kunde inte spara guiden', 'error');
        }
    },

    async deleteGuide(guideId) {
        const guide = this.allGuides.find(g => g.id === guideId);
        if (!guide) return;

        if (!confirm(`Är du säker på att du vill ta bort guiden "${guide.displayName || guide.id}"?`)) {
            return;
        }

        showLoading();

        try {
            const guideRef = ref(database, `guider/${guideId}`);
            await remove(guideRef);
            showToast('Guide borttagen!', 'success');
            this.closeModal();
            await this.loadGuides();
        } catch (error) {
            console.error("Error deleting guide:", error);
            hideLoading();
            showToast('Kunde inte radera guiden', 'error');
        }
    }
};

// ==========================================================================
// GUIDE VIEW PAGE (guide.html)
// ==========================================================================

const GuideView = {
    // DOM Elements
    stepsContainer: null,
    pageTitle: null,
    
    // State
    currentGuide: null,
    guideId: null,

    init() {
        this.stepsContainer = document.getElementById('stepsContainer');
        this.pageTitle = document.getElementById('pageTitle');
        this.setupEventListeners();
    },

    setupEventListeners() {
        const addStepBtn = document.getElementById('addStepBtn');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => this.addNewStep());
        }
    },

    async loadGuide() {
        this.guideId = getUrlParameter('guide');

        if (!this.guideId) {
            hideLoading();
            this.stepsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📖</div>
                    <h3>Ingen guide specificerad</h3>
                    <p>Gå tillbaka till guidelistan för att välja en guide.</p>
                </div>
            `;
            return;
        }

        try {
            const guideRef = ref(database, `guider/${this.guideId}`);
            const snapshot = await get(guideRef);

            if (snapshot.exists()) {
                this.currentGuide = snapshot.val();
                const displayName = this.currentGuide.displayName || this.guideId.replace(/([A-Z])/g, ' $1').trim();
                this.pageTitle.textContent = displayName;
                document.title = displayName + ' - Guide';

                hideLoading();
                this.renderSteps();
            } else {
                hideLoading();
                this.stepsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>Guide hittades inte</h3>
                        <p>Ingen guide hittades för "${this.guideId}".</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error loading guide:", error);
            hideLoading();
            showToast('Fel vid laddning av guide.', 'error');
            this.stepsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Fel vid laddning</h3>
                    <p>Kunde inte ladda guiden. Försök igen senare.</p>
                </div>
            `;
        }
    },

    stepsToArray(steps) {
        if (!steps) return [];
        if (Array.isArray(steps)) return steps;
        
        const keys = Object.keys(steps).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)) || 0;
            const numB = parseInt(b.match(/\d+/)) || 0;
            return numA - numB;
        });
        return keys.map(key => steps[key]);
    },

    stepsArrayToObject(stepsArray) {
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
    },

    prepareForSave() {
        return {
            ...this.currentGuide,
            steps: this.stepsArrayToObject(this.currentGuide.steps)
        };
    },

    renderSteps() {
        this.stepsContainer.innerHTML = "";

        if (!this.currentGuide) return;

        if (!Array.isArray(this.currentGuide.steps)) {
            this.currentGuide.steps = this.stepsToArray(this.currentGuide.steps);
        }

        if (this.currentGuide.steps.length === 0) {
            this.stepsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>Inga steg ännu</h3>
                    <p>Denna guide har inga steg. Klicka på "Lägg till steg" för att lägga till.</p>
                </div>
            `;
            return;
        }

        this.currentGuide.steps.forEach((step, index) => {
            const section = document.createElement("section");
            section.className = "guide-step";
            section.dataset.index = index;
            
            const stepTitle = step.title ? `${step.title}` : `Steg ${index + 1}`;
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
                                <button class="btn btn-sm btn-secondary move-down-btn" data-index="${index}" ${index === this.currentGuide.steps.length - 1 ? 'disabled' : ''}>▼ Ner</button>
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
            
            this.stepsContainer.appendChild(section);
        });

        // Add "Add new step" button at the bottom
        const addStepSection = document.createElement('div');
        addStepSection.className = 'add-step-section';
        addStepSection.innerHTML = `
            <button class="btn btn-primary add-step-bottom-btn" title="Lägg till nytt steg">
                ➕ Lägg till steg
            </button>
        `;
        this.stepsContainer.appendChild(addStepSection);

        this.attachStepListeners();
    },

    attachStepListeners() {
        const self = this;

        // Edit buttons
        this.stepsContainer.querySelectorAll('.step-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                self.enterEditMode(parseInt(e.target.dataset.index));
            });
        });

        // Cancel buttons
        this.stepsContainer.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                self.renderSteps();
            });
        });

        // Save step buttons
        this.stepsContainer.querySelectorAll('.save-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                self.saveStep(parseInt(e.target.dataset.index));
            });
        });

        // Move up buttons
        this.stepsContainer.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                self.moveStep(parseInt(e.target.dataset.index), -1);
            });
        });

        // Move down buttons
        this.stepsContainer.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                self.moveStep(parseInt(e.target.dataset.index), 1);
            });
        });

        // Delete buttons
        this.stepsContainer.querySelectorAll('.delete-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                self.deleteStep(parseInt(e.target.dataset.index));
            });
        });

        // Image URL preview update
        this.stepsContainer.querySelectorAll('.edit-image').forEach(input => {
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
        const addStepBottomBtn = this.stepsContainer.querySelector('.add-step-bottom-btn');
        if (addStepBottomBtn) {
            addStepBottomBtn.addEventListener('click', () => self.addNewStep());
        }

        // Upload image buttons
        this.stepsContainer.querySelectorAll('.upload-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('.upload-image-btn');
                self.uploadImage(parseInt(button.dataset.index));
            });
        });
    },

    enterEditMode(index) {
        const section = this.stepsContainer.querySelector(`.guide-step[data-index="${index}"]`);
        if (!section) return;
        
        section.classList.add('editing');
        section.querySelector('.step-view-mode').classList.add('hidden');
        section.querySelector('.step-edit-mode').classList.remove('hidden');
    },

    uploadImage(stepIndex) {
        if (!auth.currentUser) {
            showToast('Du måste vara inloggad för att ladda upp bilder', 'error');
            return;
        }

        if (typeof cloudinary === 'undefined') {
            showToast('Bilduppladdning är inte tillgänglig just nu. Ladda om sidan.', 'error');
            return;
        }

        const self = this;
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
                
                const section = self.stepsContainer.querySelector(`.guide-step[data-index="${stepIndex}"]`);
                if (section) {
                    const imageInput = section.querySelector('.edit-image');
                    if (imageInput) {
                        imageInput.value = imageUrl;
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
    },

    async saveStep(index) {
        const section = this.stepsContainer.querySelector(`.guide-step[data-index="${index}"]`);
        if (!section) return;
        
        const title = section.querySelector('.edit-title').value.trim();
        const text = section.querySelector('.edit-text').value.trim();
        const imageUrl = section.querySelector('.edit-image').value.trim();
        const altText = section.querySelector('.edit-alt').value.trim();
        
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
        
        this.currentGuide.steps[index] = { title, text, imageUrl, altText };
        
        showLoading();
        try {
            const guideRef = ref(database, `guider/${this.guideId}`);
            await set(guideRef, this.prepareForSave());
            showToast('Steget har sparats!', 'success');
            this.renderSteps();
        } catch (error) {
            console.error('Error saving step:', error);
            showToast('Kunde inte spara steget.', 'error');
        } finally {
            hideLoading();
        }
    },

    async moveStep(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.currentGuide.steps.length) return;

        const [movedStep] = this.currentGuide.steps.splice(index, 1);
        this.currentGuide.steps.splice(newIndex, 0, movedStep);
        
        showLoading();
        try {
            const guideRef = ref(database, `guider/${this.guideId}`);
            await set(guideRef, this.prepareForSave());
            showToast('Steget har flyttats!', 'success');
            this.renderSteps();
        } catch (error) {
            console.error('Error moving step:', error);
            showToast('Kunde inte flytta steget.', 'error');
        } finally {
            hideLoading();
        }
    },

    async deleteStep(index) {
        if (!confirm('Är du säker på att du vill ta bort detta steg?')) return;
        
        const removedStep = this.currentGuide.steps.splice(index, 1)[0];
        
        showLoading();
        try {
            const guideRef = ref(database, `guider/${this.guideId}`);
            await set(guideRef, this.prepareForSave());
            showToast('Steget har tagits bort!', 'success');
            this.renderSteps();
        } catch (error) {
            console.error('Error deleting step:', error);
            this.currentGuide.steps.splice(index, 0, removedStep);
            showToast('Kunde inte ta bort steget.', 'error');
        } finally {
            hideLoading();
        }
    },

    async addNewStep() {
        if (!Array.isArray(this.currentGuide.steps)) {
            this.currentGuide.steps = [];
        }
        
        const stepNumber = this.currentGuide.steps.length + 1;
        const newStep = { 
            title: `Steg ${stepNumber}`, 
            text: 'Beskrivning av steget...', 
            imageUrl: '', 
            altText: '' 
        };
        this.currentGuide.steps.push(newStep);
        
        showLoading();
        try {
            const guideRef = ref(database, `guider/${this.guideId}`);
            await set(guideRef, this.prepareForSave());
            showToast('Nytt steg har lagts till!', 'success');
            this.renderSteps();
            
            const self = this;
            setTimeout(() => {
                const newIndex = self.currentGuide.steps.length - 1;
                self.enterEditMode(newIndex);
                
                const newSection = self.stepsContainer.querySelector(`.guide-step[data-index="${newIndex}"]`);
                if (newSection) {
                    newSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } catch (error) {
            console.error('Error adding step:', error);
            this.currentGuide.steps.pop();
            showToast('Kunde inte lägga till steg.', 'error');
        } finally {
            hideLoading();
        }
    }
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================

function checkAuthState(onSuccess) {
    showLoading();
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onSuccess();
        } else {
            window.location.href = "../index/login.html";
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

document.addEventListener('DOMContentLoaded', () => {
    loadingOverlay = document.getElementById('loadingOverlay');
    
    // Detect which page we're on by checking for page-specific elements
    const isGuideListPage = document.getElementById('guideContainer') !== null;
    const isGuideViewPage = document.getElementById('stepsContainer') !== null;
    
    if (isGuideListPage) {
        GuideList.init();
        checkAuthState(() => GuideList.loadGuides());
    } else if (isGuideViewPage) {
        GuideView.init();
        checkAuthState(() => GuideView.loadGuide());
    }
});

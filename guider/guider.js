// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getDatabase, ref, get, set, remove, push } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';

// Import Firebase config from its actual location
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
let loadingOverlay, guideContainer, guideModal, guideForm, modalTitle;
let guideNameInput, guideDescriptionInput, guideCategoryInput, guideIdInput;
let addGuideBtn, closeModalBtn, cancelBtn, deleteBtn, searchInput;

// State
let allGuides = [];
let currentEditGuideId = null;

// Initialize DOM elements
function initDOMElements() {
    loadingOverlay = document.getElementById('loadingOverlay');
    guideContainer = document.getElementById('guideContainer');
    guideModal = document.getElementById('guideModal');
    guideForm = document.getElementById('guideForm');
    modalTitle = document.getElementById('modalTitle');
    guideNameInput = document.getElementById('guideName');
    guideDescriptionInput = document.getElementById('guideDescription');
    guideCategoryInput = document.getElementById('guideCategory');
    guideIdInput = document.getElementById('guideId');
    addGuideBtn = document.getElementById('addGuideBtn');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelBtn = document.getElementById('cancelBtn');
    deleteBtn = document.getElementById('deleteBtn');
    searchInput = document.getElementById('searchInput');
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

// Show toast notification (matching verkstad pattern)
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

// Check auth state and load guides
function checkAuthState() {
    showLoading();
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in, loading guides...");
            loadGuides();
        } else {
            console.log("User not authenticated, redirecting to login");
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

// Load guides from Firebase
async function loadGuides() {
    showLoading();

    try {
        const guidesRef = ref(database, 'guider');
        const snapshot = await get(guidesRef);
        
        if (snapshot.exists()) {
            const guidesData = snapshot.val();
            allGuides = Object.keys(guidesData).map(key => ({
                id: key,
                ...guidesData[key]
            }));
            // Sortera guiderna alfabetiskt baserat på displayName
            allGuides.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'sv'));
            console.log(`${allGuides.length} guides loaded and sorted.`);
        } else {
            allGuides = [];
            console.log("No guides found in database.");
        }
        
        hideLoading();
        displayGuides();
    } catch (error) {
        console.error("Error loading guides:", error);
        hideLoading();
        showToast('Fel vid laddning av guider.', 'error');
        showEmptyState('Ett fel uppstod vid laddning');
    }
}

// Display guides based on current filters
function displayGuides() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredGuides = allGuides.filter(guide => {
        const name = guide.displayName?.toLowerCase() || '';
        const description = guide.description?.toLowerCase() || '';
        const category = guide.category?.toLowerCase() || '';
        return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
    });

    if (filteredGuides.length === 0) {
        showEmptyState(searchTerm ? 'Inga guider matchar sökningen' : null);
        return;
    }

    guideContainer.innerHTML = filteredGuides.map(guide => `
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

    // Attach event listeners to guide cards
    attachGuideEventListeners();
}

// Attach event listeners to guide cards
function attachGuideEventListeners() {
    // Edit buttons
    guideContainer.querySelectorAll('.icon-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const guideId = btn.dataset.guideId;
            openEditGuideModal(guideId);
        });
    });

    // Delete buttons
    guideContainer.querySelectorAll('.icon-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const guideId = btn.dataset.guideId;
            deleteGuide(guideId);
        });
    });

    // Guide info click (open guide)
    guideContainer.querySelectorAll('.guide-info').forEach(info => {
        info.addEventListener('click', () => {
            const guideId = info.dataset.guideId;
            window.location.href = `guide.html?guide=${guideId}`;
        });
    });
}

// Show empty state
function showEmptyState(message = null) {
    const defaultMessage = 'Inga guider tillgängliga';
    guideContainer.innerHTML = `
        <div class="no-results">
            <div class="empty-icon">📖</div>
            <h3>${message || defaultMessage}</h3>
            <p>Klicka på "Lägg till guide" för att skapa din första guide.</p>
        </div>
    `;
}

// Modal handling
function openAddGuideModal() {
    currentEditGuideId = null;
    modalTitle.textContent = 'Lägg till ny guide';
    guideForm.reset();
    guideIdInput.value = '';
    deleteBtn.style.display = 'none';
    guideModal.classList.add('active');
    guideNameInput.focus();
}

function openEditGuideModal(guideId) {
    currentEditGuideId = guideId;
    const guide = allGuides.find(g => g.id === guideId);
    if (!guide) return;

    modalTitle.textContent = 'Redigera guide';
    guideIdInput.value = guide.id;
    guideNameInput.value = guide.displayName || '';
    guideDescriptionInput.value = guide.description || '';
    guideCategoryInput.value = guide.category || '';
    deleteBtn.style.display = 'block';
    guideModal.classList.add('active');
    guideNameInput.focus();
}

function closeModal() {
    guideModal.classList.remove('active');
    currentEditGuideId = null;
    guideForm.reset();
}

// Save or update guide
async function saveGuide(event) {
    event.preventDefault();
    
    const guideName = guideNameInput.value.trim();
    const guideDescription = guideDescriptionInput.value.trim();
    const guideCategory = guideCategoryInput.value.trim();

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
        if (currentEditGuideId) {
            // Update existing guide
            guideRef = ref(database, `guider/${currentEditGuideId}`);
            const originalGuide = allGuides.find(g => g.id === currentEditGuideId);
            // Preserve existing steps if they exist
            if (originalGuide && originalGuide.steps) {
                guideData.steps = originalGuide.steps;
            }
        } else {
            // Create new guide - get a new push key
            guideRef = push(ref(database, 'guider'));
            // Add a placeholder step so it's a valid guide that can be edited
            guideData.steps = [{ title: "Nytt steg", content: "Redigera denna guide för att lägga till innehåll." }];
        }
        
        await set(guideRef, guideData);
        showToast(currentEditGuideId ? 'Guide uppdaterad!' : 'Guide tillagd!', 'success');
        closeModal();
        await loadGuides();
    } catch (error) {
        console.error("Error saving guide:", error);
        hideLoading();
        showToast('Kunde inte spara guiden', 'error');
    }
}

// Delete guide
async function deleteGuide(guideId) {
    const guide = allGuides.find(g => g.id === guideId);
    if (!guide) return;

    if (!confirm(`Är du säker på att du vill ta bort guiden "${guide.displayName || guide.id}"?`)) {
        return;
    }

    showLoading();

    try {
        const guideRef = ref(database, `guider/${guideId}`);
        await remove(guideRef);
        showToast('Guide borttagen!', 'success');
        closeModal();
        await loadGuides();
    } catch (error) {
        console.error("Error deleting guide:", error);
        hideLoading();
        showToast('Kunde inte radera guiden', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add guide button
    if (addGuideBtn) {
        addGuideBtn.addEventListener('click', () => openAddGuideModal());
    }
    
    // Close modal buttons
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Form submit
    if (guideForm) {
        guideForm.addEventListener('submit', saveGuide);
    }
    
    // Delete button
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (currentEditGuideId) {
                deleteGuide(currentEditGuideId);
            }
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', displayGuides);
    }
    
    // Close modal on overlay click
    if (guideModal) {
        guideModal.addEventListener('click', (e) => {
            if (e.target === guideModal) {
                closeModal();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && guideModal && guideModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    checkAuthState();
});

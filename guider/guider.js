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

let allGuides = [];
let currentEditGuideId = null;

// Check auth state and load guides
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in, loading guides...");
            loadGuides();
        } else {
            console.log("User not authenticated, redirecting to login");
            window.location.href = "../index/login.html";
        }
    });
}

// Load guides from Firebase
async function loadGuides() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const guideContainer = document.getElementById('guideContainer');
    loadingIndicator.style.display = 'block';
    guideContainer.style.display = 'none';

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
            allGuides.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
            console.log(`${allGuides.length} guides loaded and sorted.`);
        } else {
            allGuides = [];
            console.log("No guides found in database.");
        }
        displayGuides();
    } catch (error) {
        console.error("Error loading guides:", error);
        loadingIndicator.innerHTML = '<p style="color: red;">Fel vid laddning av guider.</p>';
    } finally {
        loadingIndicator.style.display = 'none';
        guideContainer.style.display = 'grid';
    }
}

// Display guides based on current filters
function displayGuides() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const guideContainer = document.getElementById('guideContainer');

    const filteredGuides = allGuides.filter(guide => {
        const name = guide.displayName?.toLowerCase() || '';
        const description = guide.description?.toLowerCase() || '';
        const category = guide.category?.toLowerCase() || '';
        return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
    });

    if (filteredGuides.length === 0) {
        guideContainer.innerHTML = '<div class="no-results">Inga guider hittades.</div>';
        return;
    }

    guideContainer.innerHTML = filteredGuides.map(guide => `
        <div class="product-card" style="position: relative;">
            <div class="product-actions">
                <button class="icon-btn edit" onclick='window.openEditGuideModal("${guide.id}")' title="Redigera guide">✏️</button>
                <button class="icon-btn delete" onclick='window.deleteGuide("${guide.id}")' title="Ta bort guide">🗑️</button>
            </div>
            <div class="product-info" onclick="window.location.href='guide.html?guide=${guide.id}'" style="cursor: pointer; padding-top: 40px;">
                <h3>${guide.displayName || 'Namnlös Guide'}</h3>
                <p>${guide.description || 'Ingen beskrivning.'}</p>
                ${guide.category ? `<span class="product-category-badge">${guide.category}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Modal handling
window.openAddGuideModal = () => {
    currentEditGuideId = null;
    document.getElementById('modalTitle').textContent = 'Lägg till ny guide';
    document.getElementById('guideForm').reset();
    document.getElementById('guideId').value = '';
    document.getElementById('guideModal').classList.add('active');
};

window.openEditGuideModal = (guideId) => {
    currentEditGuideId = guideId;
    const guide = allGuides.find(g => g.id === guideId);
    if (!guide) return;

    document.getElementById('modalTitle').textContent = 'Redigera guide';
    document.getElementById('guideId').value = guide.id;
    document.getElementById('guideName').value = guide.displayName || '';
    document.getElementById('guideDescription').value = guide.description || '';
    document.getElementById('guideCategory').value = guide.category || '';
    document.getElementById('guideModal').classList.add('active');
};

window.closeModal = () => {
    document.getElementById('guideModal').classList.remove('active');
};

// Save or update guide
window.saveGuide = async (event) => {
    event.preventDefault();
    const guideName = document.getElementById('guideName').value;
    const guideDescription = document.getElementById('guideDescription').value;
    const guideCategory = document.getElementById('guideCategory').value;

    const guideData = {
        displayName: guideName,
        description: guideDescription,
        category: guideCategory,
    };

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
        showStatus(currentEditGuideId ? 'Guide uppdaterad!' : 'Guide tillagd!', 'success');
        closeModal();
        loadGuides();
    } catch (error) {
        console.error("Error saving guide:", error);
        showStatus('Fel vid sparande av guide.', 'error');
    }
};

// Delete guide
window.deleteGuide = async (guideId) => {
    const guide = allGuides.find(g => g.id === guideId);
    if (!guide) return;

    if (confirm(`Är du säker på att du vill ta bort guiden "${guide.displayName || guide.id}"?`)) {
        try {
            const guideRef = ref(database, `guider/${guideId}`);
            await remove(guideRef);
            showStatus('Guide borttagen!', 'success');
            loadGuides();
        } catch (error) {
            console.error("Error deleting guide:", error);
            showStatus('Fel vid borttagning av guide.', 'error');
        }
    }
};

// Utility to show status messages
function showStatus(message, type = 'success') {
    // First, remove any existing status messages to prevent overlap
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) {
        existingStatus.remove();
    }

    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);

    // Animate in
    setTimeout(() => {
        statusDiv.style.transform = 'translateX(0)';
    }, 10);


    // Animate out and remove
    setTimeout(() => {
        statusDiv.style.transform = 'translateX(400px)';
        setTimeout(() => {
            statusDiv.remove();
        }, 300);
    }, 3000);
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    document.getElementById('searchInput').addEventListener('input', displayGuides);
});

/**
 * Link-Apps Administration
 * Hantera konfigurationen för dynamiska link-appar
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Config path in Firebase
const CONFIG_PATH = 'link-apps-config';

// DOM Elements
let appsGrid, loadingState, emptyState, appCount;
let appModal, appForm, modalTitle, appIdInput, appTitleInput, appDescInput, appIconInput;
let addAppBtn, closeModalBtn, cancelBtn, deleteBtn, saveBtn, appIdPreview;

// State
let currentEditId = null;
let appsData = {};

// Initialize DOM elements
function initDOMElements() {
    appsGrid = document.getElementById('appsGrid');
    loadingState = document.getElementById('loadingState');
    emptyState = document.getElementById('emptyState');
    appCount = document.getElementById('appCount');
    
    appModal = document.getElementById('appModal');
    appForm = document.getElementById('appForm');
    modalTitle = document.getElementById('modalTitle');
    appIdInput = document.getElementById('appId');
    appTitleInput = document.getElementById('appTitle');
    appDescInput = document.getElementById('appDescription');
    appIconInput = document.getElementById('appIcon');
    appIdPreview = document.getElementById('appIdPreview');
    
    addAppBtn = document.getElementById('addAppBtn');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelBtn = document.getElementById('cancelBtn');
    deleteBtn = document.getElementById('deleteBtn');
    saveBtn = document.getElementById('saveBtn');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check auth state
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "../index/login.html";
        } else {
            console.log("User logged in:", user.email);
            loadApps();
        }
    });
}

// Load apps from Firebase
async function loadApps() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    appsGrid.innerHTML = '';
    
    try {
        const configRef = ref(db, CONFIG_PATH);
        const snapshot = await get(configRef);
        
        loadingState.style.display = 'none';
        
        if (snapshot.exists()) {
            appsData = snapshot.val();
            const apps = Object.entries(appsData);
            
            appCount.textContent = apps.length;
            
            if (apps.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            apps.sort((a, b) => a[1].title.localeCompare(b[1].title, 'sv'));
            
            apps.forEach(([id, data]) => {
                renderAppCard(id, data);
            });
        } else {
            appsData = {};
            appCount.textContent = '0';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading apps:', error);
        loadingState.style.display = 'none';
        showToast('Kunde inte ladda appar', 'error');
    }
}

// Render a single app card
function renderAppCard(id, data) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.innerHTML = `
        <div class="app-card-header">
            <div class="app-icon">${data.emptyIcon || '📁'}</div>
            <div class="app-info">
                <h3>${escapeHtml(data.title)}</h3>
                <span class="app-path">/links/?app=${escapeHtml(id)}</span>
            </div>
        </div>
        <div class="app-description">${escapeHtml(data.description || 'Ingen beskrivning')}</div>
        <div class="app-actions">
            <button class="btn btn-edit" onclick="window.editApp('${escapeHtml(id)}')">✏️ Redigera</button>
            <button class="btn btn-secondary" onclick="window.openApp('${escapeHtml(id)}')">🔗 Öppna</button>
        </div>
    `;
    appsGrid.appendChild(card);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open modal
function openModal(editId = null) {
    currentEditId = editId;
    
    if (editId) {
        // Edit mode
        modalTitle.textContent = 'Redigera app';
        const data = appsData[editId];
        if (data) {
            appIdInput.value = editId;
            appIdInput.disabled = true; // Can't change ID after creation
            appTitleInput.value = data.title || '';
            appDescInput.value = data.description || '';
            appIconInput.value = data.emptyIcon || '';
            updateEmojiSelection(data.emptyIcon);
        }
        deleteBtn.style.display = 'block';
    } else {
        // Add mode
        modalTitle.textContent = 'Lägg till app';
        appIdInput.value = '';
        appIdInput.disabled = false;
        appTitleInput.value = '';
        appDescInput.value = '';
        appIconInput.value = '📁';
        updateEmojiSelection('📁');
        deleteBtn.style.display = 'none';
    }
    
    appIdPreview.textContent = appIdInput.value || '...';
    appModal.classList.add('active');
    
    if (!editId) {
        appIdInput.focus();
    } else {
        appTitleInput.focus();
    }
}

// Close modal
function closeModal() {
    appModal.classList.remove('active');
    currentEditId = null;
    appForm.reset();
}

// Update emoji selection
function updateEmojiSelection(selectedEmoji) {
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.emoji === selectedEmoji);
    });
}

// Save app
async function saveApp() {
    const id = appIdInput.value.trim().toLowerCase();
    const title = appTitleInput.value.trim();
    const description = appDescInput.value.trim();
    const icon = appIconInput.value.trim() || '📁';
    
    if (!id || !title) {
        showToast('App-ID och visningsnamn krävs', 'error');
        return;
    }
    
    // Validate ID format
    if (!/^[a-z0-9-]+$/.test(id)) {
        showToast('App-ID får endast innehålla små bokstäver, siffror och bindestreck', 'error');
        return;
    }
    
    // Check if ID already exists (only for new apps)
    if (!currentEditId && appsData[id]) {
        showToast(`App-ID "${id}" finns redan`, 'error');
        return;
    }
    
    try {
        const appRef = ref(db, `${CONFIG_PATH}/${id}`);
        await set(appRef, {
            title: title,
            description: description || `${title}länkar`,
            emptyIcon: icon
        });
        
        showToast(currentEditId ? 'App uppdaterad!' : 'App skapad!', 'success');
        closeModal();
        await loadApps();
    } catch (error) {
        console.error('Error saving app:', error);
        showToast('Kunde inte spara appen', 'error');
    }
}

// Delete app
async function deleteApp() {
    if (!currentEditId) return;
    
    const confirmed = confirm(
        `Är du säker på att du vill radera "${appsData[currentEditId]?.title}"?\n\n` +
        `OBS: Detta raderar endast konfigurationen. Länkdatan under "${currentEditId}/" påverkas inte.`
    );
    
    if (!confirmed) return;
    
    try {
        const appRef = ref(db, `${CONFIG_PATH}/${currentEditId}`);
        await remove(appRef);
        
        showToast('App raderad!', 'success');
        closeModal();
        await loadApps();
    } catch (error) {
        console.error('Error deleting app:', error);
        showToast('Kunde inte radera appen', 'error');
    }
}

// Open app in new tab
function openApp(appId) {
    window.open(`index.html?app=${appId}`, '_blank');
}

// Edit app
function editApp(appId) {
    openModal(appId);
}

// Setup event listeners
function setupEventListeners() {
    addAppBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveApp);
    deleteBtn.addEventListener('click', deleteApp);
    
    // Close on overlay click
    appModal.addEventListener('click', (e) => {
        if (e.target === appModal) closeModal();
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && appModal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Update preview as user types
    appIdInput.addEventListener('input', () => {
        const value = appIdInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        appIdPreview.textContent = value || '...';
    });
    
    // Emoji picker
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appIconInput.value = btn.dataset.emoji;
            updateEmojiSelection(btn.dataset.emoji);
        });
    });
    
    // Form submit
    appForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveApp();
    });
}

// Expose functions to window
window.openApp = openApp;
window.editApp = editApp;

// ============================================
// NAVBAR MANAGEMENT
// ============================================

const NAVBAR_CONFIG_PATH = 'navbar-config';

// Navbar DOM Elements
let navbarLoadingState, navbarContent, mainLinksContainer, categoriesContainer;
let navLinkModal, navLinkForm, navLinkModalTitle;
let navLinkIdInput, navLinkLabelInput, navLinkHrefInput, navLinkIconInput;
let navLinkTypeInput, navLinkCategoryIdInput;
let navCategoryModal, navCategoryForm, navCategoryModalTitle;
let navCategoryIdInput, navCategoryLabelInput, navCategoryIconInput;

// Navbar State
let navbarData = { mainLinks: [], categories: [] };
let currentNavEditId = null;
let currentNavEditType = null; // 'mainLink', 'categoryLink', 'category'
let currentNavCategoryContext = null;

function initNavbarDOMElements() {
    navbarLoadingState = document.getElementById('navbarLoadingState');
    navbarContent = document.getElementById('navbarContent');
    mainLinksContainer = document.getElementById('mainLinksContainer');
    categoriesContainer = document.getElementById('categoriesContainer');
    
    // Link modal
    navLinkModal = document.getElementById('navLinkModal');
    navLinkForm = document.getElementById('navLinkForm');
    navLinkModalTitle = document.getElementById('navLinkModalTitle');
    navLinkIdInput = document.getElementById('navLinkId');
    navLinkLabelInput = document.getElementById('navLinkLabel');
    navLinkHrefInput = document.getElementById('navLinkHref');
    navLinkIconInput = document.getElementById('navLinkIcon');
    navLinkTypeInput = document.getElementById('navLinkType');
    navLinkCategoryIdInput = document.getElementById('navLinkCategoryId');
    
    // Category modal
    navCategoryModal = document.getElementById('navCategoryModal');
    navCategoryForm = document.getElementById('navCategoryForm');
    navCategoryModalTitle = document.getElementById('navCategoryModalTitle');
    navCategoryIdInput = document.getElementById('navCategoryId');
    navCategoryLabelInput = document.getElementById('navCategoryLabel');
    navCategoryIconInput = document.getElementById('navCategoryIcon');
}

// Load navbar config from Firebase
async function loadNavbarConfig() {
    if (!navbarLoadingState || !navbarContent) return;
    
    navbarLoadingState.style.display = 'block';
    navbarContent.style.display = 'none';
    
    try {
        const configRef = ref(db, NAVBAR_CONFIG_PATH);
        const snapshot = await get(configRef);
        
        if (snapshot.exists()) {
            navbarData = snapshot.val();
            // Ensure arrays exist
            navbarData.mainLinks = navbarData.mainLinks || [];
            navbarData.categories = navbarData.categories || [];
        } else {
            navbarData = { mainLinks: [], categories: [] };
        }
        
        navbarLoadingState.style.display = 'none';
        navbarContent.style.display = 'block';
        renderNavbarConfig();
    } catch (error) {
        console.error('Error loading navbar config:', error);
        navbarLoadingState.innerHTML = '<p style="color: #f44336;">Kunde inte ladda navbar-konfiguration</p>';
    }
}

// Render navbar configuration
function renderNavbarConfig() {
    renderMainLinks();
    renderCategories();
}

// Render main links
function renderMainLinks() {
    if (!mainLinksContainer) return;
    
    if (navbarData.mainLinks.length === 0) {
        mainLinksContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5);">Inga huvudlänkar konfigurerade</p>';
        return;
    }
    
    mainLinksContainer.innerHTML = navbarData.mainLinks.map((link, index) => `
        <div class="nav-item" data-id="${escapeHtml(link.id)}">
            ${link.icon ? `<img src="${escapeHtml(link.icon)}" alt="" class="nav-item-icon">` : '<span class="nav-item-icon">🔗</span>'}
            <div class="nav-item-info">
                <div class="nav-item-label">${escapeHtml(link.label)}</div>
                <div class="nav-item-href">${escapeHtml(link.href)}</div>
            </div>
            <div class="nav-item-actions">
                <button class="btn btn-edit" onclick="window.editMainLink('${escapeHtml(link.id)}')">✏️</button>
                <button class="btn btn-danger" onclick="window.deleteMainLink('${escapeHtml(link.id)}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Render categories
function renderCategories() {
    if (!categoriesContainer) return;
    
    if (navbarData.categories.length === 0) {
        categoriesContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5);">Inga kategorier konfigurerade</p>';
        return;
    }
    
    categoriesContainer.innerHTML = navbarData.categories.map(cat => `
        <div class="category-card" data-id="${escapeHtml(cat.id)}">
            <div class="category-header">
                ${cat.icon ? `<img src="${escapeHtml(cat.icon)}" alt="">` : ''}
                <div class="category-header-info">
                    <h4>${escapeHtml(cat.label)}</h4>
                </div>
                <div class="nav-item-actions">
                    <button class="btn btn-edit" onclick="window.editCategory('${escapeHtml(cat.id)}')">✏️</button>
                    <button class="btn btn-danger" onclick="window.deleteCategory('${escapeHtml(cat.id)}')">🗑️</button>
                </div>
            </div>
            <div class="category-links">
                ${(cat.links || []).map(link => `
                    <div class="nav-item" data-id="${escapeHtml(link.id)}">
                        ${link.icon ? `<img src="${escapeHtml(link.icon)}" alt="" class="nav-item-icon">` : '<span class="nav-item-icon">🔗</span>'}
                        <div class="nav-item-info">
                            <div class="nav-item-label">${escapeHtml(link.label)}</div>
                            <div class="nav-item-href">${escapeHtml(link.href)}</div>
                        </div>
                        <div class="nav-item-actions">
                            <button class="btn btn-edit" onclick="window.editCategoryLink('${escapeHtml(cat.id)}', '${escapeHtml(link.id)}')">✏️</button>
                            <button class="btn btn-danger" onclick="window.deleteCategoryLink('${escapeHtml(cat.id)}', '${escapeHtml(link.id)}')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="add-link-to-category">
                <button class="btn btn-secondary" onclick="window.addLinkToCategory('${escapeHtml(cat.id)}')">➕ Lägg till länk</button>
            </div>
        </div>
    `).join('');
}

// Open nav link modal
function openNavLinkModal(type = 'main', categoryId = null, editId = null) {
    currentNavEditType = type === 'category' ? 'categoryLink' : 'mainLink';
    currentNavEditId = editId;
    currentNavCategoryContext = categoryId;
    
    navLinkTypeInput.value = type;
    navLinkCategoryIdInput.value = categoryId || '';
    
    const deleteBtn = document.getElementById('deleteNavLinkBtn');
    
    if (editId) {
        navLinkModalTitle.textContent = 'Redigera länk';
        let link = null;
        
        if (type === 'main') {
            link = navbarData.mainLinks.find(l => l.id === editId);
        } else {
            const cat = navbarData.categories.find(c => c.id === categoryId);
            if (cat && cat.links) {
                link = cat.links.find(l => l.id === editId);
            }
        }
        
        if (link) {
            navLinkIdInput.value = link.id;
            navLinkIdInput.disabled = true;
            navLinkLabelInput.value = link.label || '';
            navLinkHrefInput.value = link.href || '';
            navLinkIconInput.value = link.icon || '';
        }
        deleteBtn.style.display = 'block';
    } else {
        navLinkModalTitle.textContent = 'Lägg till länk';
        navLinkIdInput.value = '';
        navLinkIdInput.disabled = false;
        navLinkLabelInput.value = '';
        navLinkHrefInput.value = '';
        navLinkIconInput.value = '';
        deleteBtn.style.display = 'none';
    }
    
    navLinkModal.classList.add('active');
    if (!editId) navLinkIdInput.focus();
}

// Close nav link modal
function closeNavLinkModal() {
    navLinkModal.classList.remove('active');
    currentNavEditId = null;
    currentNavEditType = null;
    navLinkForm.reset();
}

// Save nav link
async function saveNavLink() {
    const id = navLinkIdInput.value.trim().toLowerCase();
    const label = navLinkLabelInput.value.trim();
    const href = navLinkHrefInput.value.trim();
    const icon = navLinkIconInput.value.trim();
    const type = navLinkTypeInput.value;
    const categoryId = navLinkCategoryIdInput.value;
    
    if (!id || !label || !href) {
        showToast('ID, visningstext och URL krävs', 'error');
        return;
    }
    
    if (!/^[a-z0-9-]+$/.test(id)) {
        showToast('ID får endast innehålla små bokstäver, siffror och bindestreck', 'error');
        return;
    }
    
    const linkData = { id, label, href, icon: icon || null };
    
    try {
        if (type === 'main') {
            if (!currentNavEditId) {
                // Check for duplicate
                if (navbarData.mainLinks.some(l => l.id === id)) {
                    showToast('En länk med detta ID finns redan', 'error');
                    return;
                }
                navbarData.mainLinks.push(linkData);
            } else {
                const index = navbarData.mainLinks.findIndex(l => l.id === currentNavEditId);
                if (index !== -1) {
                    navbarData.mainLinks[index] = linkData;
                }
            }
        } else {
            // Category link
            const catIndex = navbarData.categories.findIndex(c => c.id === categoryId);
            if (catIndex !== -1) {
                if (!navbarData.categories[catIndex].links) {
                    navbarData.categories[catIndex].links = [];
                }
                
                if (!currentNavEditId) {
                    if (navbarData.categories[catIndex].links.some(l => l.id === id)) {
                        showToast('En länk med detta ID finns redan i kategorin', 'error');
                        return;
                    }
                    navbarData.categories[catIndex].links.push(linkData);
                } else {
                    const linkIndex = navbarData.categories[catIndex].links.findIndex(l => l.id === currentNavEditId);
                    if (linkIndex !== -1) {
                        navbarData.categories[catIndex].links[linkIndex] = linkData;
                    }
                }
            }
        }
        
        await saveNavbarToFirebase();
        showToast(currentNavEditId ? 'Länk uppdaterad!' : 'Länk tillagd!', 'success');
        closeNavLinkModal();
        renderNavbarConfig();
    } catch (error) {
        console.error('Error saving nav link:', error);
        showToast('Kunde inte spara länken', 'error');
    }
}

// Open category modal
function openCategoryModal(editId = null) {
    currentNavEditId = editId;
    currentNavEditType = 'category';
    
    const deleteBtn = document.getElementById('deleteNavCategoryBtn');
    
    if (editId) {
        navCategoryModalTitle.textContent = 'Redigera kategori';
        const cat = navbarData.categories.find(c => c.id === editId);
        if (cat) {
            navCategoryIdInput.value = cat.id;
            navCategoryIdInput.disabled = true;
            navCategoryLabelInput.value = cat.label || '';
            navCategoryIconInput.value = cat.icon || '';
        }
        deleteBtn.style.display = 'block';
    } else {
        navCategoryModalTitle.textContent = 'Lägg till kategori';
        navCategoryIdInput.value = '';
        navCategoryIdInput.disabled = false;
        navCategoryLabelInput.value = '';
        navCategoryIconInput.value = '';
        deleteBtn.style.display = 'none';
    }
    
    navCategoryModal.classList.add('active');
    if (!editId) navCategoryIdInput.focus();
}

// Close category modal
function closeCategoryModal() {
    navCategoryModal.classList.remove('active');
    currentNavEditId = null;
    currentNavEditType = null;
    navCategoryForm.reset();
}

// Save category
async function saveCategory() {
    const id = navCategoryIdInput.value.trim().toLowerCase();
    const label = navCategoryLabelInput.value.trim();
    const icon = navCategoryIconInput.value.trim();
    
    if (!id || !label) {
        showToast('ID och visningstext krävs', 'error');
        return;
    }
    
    if (!/^[a-z0-9-]+$/.test(id)) {
        showToast('ID får endast innehålla små bokstäver, siffror och bindestreck', 'error');
        return;
    }
    
    try {
        if (!currentNavEditId) {
            if (navbarData.categories.some(c => c.id === id)) {
                showToast('En kategori med detta ID finns redan', 'error');
                return;
            }
            navbarData.categories.push({ id, label, icon: icon || null, links: [] });
        } else {
            const index = navbarData.categories.findIndex(c => c.id === currentNavEditId);
            if (index !== -1) {
                navbarData.categories[index] = {
                    ...navbarData.categories[index],
                    id, label, icon: icon || null
                };
            }
        }
        
        await saveNavbarToFirebase();
        showToast(currentNavEditId ? 'Kategori uppdaterad!' : 'Kategori skapad!', 'success');
        closeCategoryModal();
        renderNavbarConfig();
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Kunde inte spara kategorin', 'error');
    }
}

// Delete main link
async function deleteMainLink(id) {
    if (!confirm(`Radera huvudlänken "${navbarData.mainLinks.find(l => l.id === id)?.label}"?`)) return;
    
    navbarData.mainLinks = navbarData.mainLinks.filter(l => l.id !== id);
    await saveNavbarToFirebase();
    showToast('Länk raderad!', 'success');
    renderNavbarConfig();
}

// Delete category link
async function deleteCategoryLink(categoryId, linkId) {
    const cat = navbarData.categories.find(c => c.id === categoryId);
    if (!cat) return;
    
    const link = cat.links?.find(l => l.id === linkId);
    if (!confirm(`Radera länken "${link?.label}"?`)) return;
    
    cat.links = (cat.links || []).filter(l => l.id !== linkId);
    await saveNavbarToFirebase();
    showToast('Länk raderad!', 'success');
    renderNavbarConfig();
}

// Delete category
async function deleteCategory(id) {
    const cat = navbarData.categories.find(c => c.id === id);
    if (!confirm(`Radera kategorin "${cat?.label}" och alla dess länkar?`)) return;
    
    navbarData.categories = navbarData.categories.filter(c => c.id !== id);
    await saveNavbarToFirebase();
    showToast('Kategori raderad!', 'success');
    renderNavbarConfig();
}

// Save navbar config to Firebase
async function saveNavbarToFirebase() {
    const configRef = ref(db, NAVBAR_CONFIG_PATH);
    await set(configRef, navbarData);
}

// Window functions for navbar
window.editMainLink = (id) => openNavLinkModal('main', null, id);
window.deleteMainLink = deleteMainLink;
window.addLinkToCategory = (categoryId) => openNavLinkModal('category', categoryId, null);
window.editCategoryLink = (categoryId, linkId) => openNavLinkModal('category', categoryId, linkId);
window.deleteCategoryLink = deleteCategoryLink;
window.editCategory = (id) => openCategoryModal(id);
window.deleteCategory = deleteCategory;

// Setup navbar event listeners
function setupNavbarEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            
            // Load navbar config when switching to navbar tab
            if (btn.dataset.tab === 'navbar') {
                loadNavbarConfig();
            }
        });
    });
    
    // Add main link button
    document.getElementById('addMainLinkBtn')?.addEventListener('click', () => openNavLinkModal('main'));
    
    // Add category button
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCategoryModal());
    
    // Nav link modal
    document.getElementById('closeNavLinkModalBtn')?.addEventListener('click', closeNavLinkModal);
    document.getElementById('cancelNavLinkBtn')?.addEventListener('click', closeNavLinkModal);
    document.getElementById('saveNavLinkBtn')?.addEventListener('click', saveNavLink);
    document.getElementById('deleteNavLinkBtn')?.addEventListener('click', async () => {
        const type = navLinkTypeInput.value;
        const categoryId = navLinkCategoryIdInput.value;
        if (type === 'main') {
            await deleteMainLink(currentNavEditId);
        } else {
            await deleteCategoryLink(categoryId, currentNavEditId);
        }
        closeNavLinkModal();
    });
    
    navLinkModal?.addEventListener('click', (e) => {
        if (e.target === navLinkModal) closeNavLinkModal();
    });
    
    navLinkForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveNavLink();
    });
    
    // Nav category modal
    document.getElementById('closeNavCategoryModalBtn')?.addEventListener('click', closeCategoryModal);
    document.getElementById('cancelNavCategoryBtn')?.addEventListener('click', closeCategoryModal);
    document.getElementById('saveNavCategoryBtn')?.addEventListener('click', saveCategory);
    document.getElementById('deleteNavCategoryBtn')?.addEventListener('click', async () => {
        await deleteCategory(currentNavEditId);
        closeCategoryModal();
    });
    
    navCategoryModal?.addEventListener('click', (e) => {
        if (e.target === navCategoryModal) closeCategoryModal();
    });
    
    navCategoryForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCategory();
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    initNavbarDOMElements();
    setupEventListeners();
    setupNavbarEventListeners();
    checkAuthState();
});

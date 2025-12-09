// Firebase v10+ imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getDatabase, ref, get, set, remove } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';

// Import Firebase config
import { firebaseConfig } from '../scripts/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Global variables
let productsDB = { categories: [] };
let isDataLoaded = false;
let currentEditProduct = null;
let currentCategoryForEdit = '';
let currentSubcategoryForEdit = '';
let isEditingCategory = false;

// Load data from Firebase
async function loadProductsFromFirebase() {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('productContainer').style.display = 'none';
        
        const productsRef = ref(database, 'products');
        const snapshot = await get(productsRef);
        const data = snapshot.val();
        
        if (data) {
            // Convert Firebase data to expected format with safety checks
            productsDB.categories = Object.keys(data).map(key => {
                const category = data[key];
                return {
                    name: category.name || key,
                    subgroups: category.subgroups || [],
                    products: Array.isArray(category.products) ? category.products : []
                };
            });
            
            console.log('Produkter laddade från Firebase:', productsDB.categories.length, 'kategorier');
            
            // Debug: visa struktur
            productsDB.categories.forEach(cat => {
                console.log(`Kategori: ${cat.name}, Produkter: ${cat.products.length}`);
            });
        } else {
            console.warn('Ingen produktdata hittades i Firebase');
            productsDB.categories = [];
        }
        
        isDataLoaded = true;
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('productContainer').style.display = 'grid';
        
        // Update interface after data is loaded
        populateMainCategoryFilter();
        updateResults();
        
    } catch (error) {
        console.error('Fel vid laddning av produkter från Firebase:', error);
        document.getElementById('loadingIndicator').innerHTML = 
            '<p style="color: red;">Fel vid laddning av produkter. Försök igen senare.</p>';
    }
}

// Function to check if a user is logged in or not
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // User is not signed in, redirect to the login page
            window.location.href = "../index/login.html";
        } else {
            console.log("User is signed in");
            // Load products after authentication
            loadProductsFromFirebase();
        }
    });
}

// Function to log out the user
window.logout = async function() {
    try {
        await signOut(auth);
        // Sign-out successful, redirect to login page
        window.location.href = "../index/login.html";
    } catch (error) {
        console.error("Logout error:", error);
    }
};

// Initiera gränssnittet
function init() {
    document.getElementById('searchInput').addEventListener('input', updateResults);
    document.getElementById('mainCategory').addEventListener('change', updateSubcategories);
    document.getElementById('subCategory').addEventListener('change', updateSubtypes);
    document.getElementById('subType').addEventListener('change', updateResults);
}

// Fyll filterdropdown med fabrikat från databasen
function populateMainCategoryFilter() {
    if (!isDataLoaded) return;
    
    const select = document.getElementById('mainCategory');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Alla Fabrikat</option>';
    
    productsDB.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
    
    // Behåll valt värde om det finns kvar
    if (currentValue && productsDB.categories.some(c => c.name === currentValue)) {
        select.value = currentValue;
    }
}

// Uppdatera underkategorier
function updateSubcategories() {
    if (!isDataLoaded) return;
    
    const mainCategory = document.getElementById('mainCategory').value;
    const subCategorySelect = document.getElementById('subCategory');
    subCategorySelect.innerHTML = '<option value="">Välj underkategori</option>';

    if (mainCategory) {
        const category = productsDB.categories.find(c => c.name === mainCategory);

        if (category && category.subgroups) {
            category.subgroups.forEach(subgroup => {
                const option = document.createElement('option');
                option.value = subgroup.name;
                option.textContent = subgroup.name;
                subCategorySelect.appendChild(option);
            });
            subCategorySelect.disabled = false;
        } else {
            subCategorySelect.disabled = true;
        }
    } else {
        subCategorySelect.disabled = true;
    }

    updateResults();
}

// Uppdatera undergrupper
function updateSubtypes() {
    if (!isDataLoaded) return;
    
    const mainCategory = document.getElementById('mainCategory').value;
    const subCategory = document.getElementById('subCategory').value;
    const subTypeSelect = document.getElementById('subType');
    subTypeSelect.innerHTML = '<option value="">Välj underkategori</option>';

    if (mainCategory && subCategory) {
        const category = productsDB.categories.find(c => c.name === mainCategory);
        const subgroup = category.subgroups.find(sg => sg.name === subCategory);

        if (subgroup && subgroup.subtypes) {
            subgroup.subtypes.forEach(subtype => {
                const option = document.createElement('option');
                option.value = subtype;
                option.textContent = subtype;
                subTypeSelect.appendChild(option);
            });
            subTypeSelect.disabled = false;
        } else {
            subTypeSelect.disabled = true;
        }
    } else {
        subTypeSelect.disabled = true;
    }

    updateResults();
}

// Filtrera produkter
function filterProducts() {
    if (!isDataLoaded) return [];
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const mainCategory = document.getElementById('mainCategory').value;
    const subCategory = document.getElementById('subCategory').value;
    const subType = document.getElementById('subType').value;

    return productsDB.categories.flatMap(category => {
        if (mainCategory && category.name !== mainCategory) return [];

        // Säkerhetskontroll för products array
        if (!category.products || !Array.isArray(category.products)) {
            console.warn(`Kategori ${category.name} har ingen products array`);
            return [];
        }

        return category.products.filter(product => {
            // Säkerhetskontroller för produktegenskaper
            if (!product || typeof product !== 'object') {
                console.warn('Ogiltig produkt funnen:', product);
                return false;
            }

            const productName = product.name || '';
            const productNumber = product.productNumber || '';
            const productInfo = product.info || '';
            const productSpecs = product.specs || {};

            const matchesSearch = productName.toLowerCase().includes(searchTerm) ||
                productNumber.toLowerCase().includes(searchTerm) ||
                productInfo.toLowerCase().includes(searchTerm) ||
                Object.values(productSpecs).some(spec => 
                    spec && spec.toString().toLowerCase().includes(searchTerm)
                );

            const matchesSubcategory = !subCategory || product.subcategory === subCategory;
            const matchesSubtype = !subType || product.subtype === subType;

            return matchesSearch && matchesSubcategory && matchesSubtype;
        });
    });
}

// Uppdatera resultat
function updateResults() {
    if (!isDataLoaded) return;
    
    try {
        const filteredProducts = filterProducts();
        const container = document.getElementById('productContainer');

        if (filteredProducts.length === 0) {
            container.innerHTML = '<div class="no-results">Inga produkter hittades med aktuella filter</div>';
            return;
        }

        container.innerHTML = productsDB.categories.flatMap(category => {
            if (!category.products) return [];
            
            return category.products.filter(product => {
                return filteredProducts.some(fp => 
                    fp.name === product.name && 
                    fp.productNumber === product.productNumber
                );
            }).map(product => {
                // Säkerhetskontroller för produktdata
                const productName = product.name || 'Okänt produktnamn';
                const productNumber = product.productNumber || 'Okänt nummer';
                const productInfo = product.info || 'Ingen info tillgänglig';
                const productImage = product.image || '../images/placeholder.png';
                const productSpecs = product.specs || {};

                return `
                    <div class="product-card">
                        <div class="product-actions">
                            <button class="icon-btn edit" onclick='editProduct(${JSON.stringify(product).replace(/'/g, "&apos;")}, "${category.name}")' title="Redigera produkt">
                                ✏️
                            </button>
                            <button class="icon-btn delete" onclick='deleteProduct("${category.name}", "${productNumber}")' title="Ta bort produkt">
                                🗑️
                            </button>
                        </div>
                        <img src="${productImage}" class="product-image" alt="${productName}" onerror="this.src='../images/placeholder.png'">
                        <div class="product-info">
                            <h3>${productName}</h3>
                            <div class="product-number-container" style="display: flex; align-items: center;">
                                <p class="product-number" style="margin-right: 8px;">${productNumber}</p>
                                <button class="copy-button" data-product-number="${productNumber}" style="background-image: url('../images/copy.jpg'); background-size: contain; background-repeat: no-repeat; width: 24px; height: 24px; border: none; cursor: pointer;"></button>
                            </div>                        
                            <p>${productInfo}</p>
                            <div class="specs">
                                ${Object.entries(productSpecs).map(([key, value]) => `
                                    <p><strong>${key}:</strong> ${value || 'N/A'}</p>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            });
        }).join('');

        // Lägg till event listeners för kopieringsknapparna
        document.querySelectorAll('.copy-button').forEach(button => {
            button.addEventListener('click', () => {
                const productNumber = button.getAttribute('data-product-number');
                copyTextToClipboard(productNumber);
            });
        });

    } catch (error) {
        console.error('Fel vid uppdatering av resultat:', error);
        const container = document.getElementById('productContainer');
        container.innerHTML = '<div class="no-results">Ett fel uppstod vid visning av produkter</div>';
    }
}

// Funktion för att kopiera text till urklipp
function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const message = document.createElement("div");
        message.textContent = "Produktnumret har kopierats";
        message.style.position = "fixed";
        message.style.backgroundColor = "#333";
        message.style.bottom = "10px";
        message.style.left = "50%";
        message.style.transform = "translateX(-50%)";
        message.style.color = "#fff";
        message.style.padding = "10px";
        message.style.borderRadius = "5px";
        message.style.zIndex = "1000";
        message.style.fontSize = "48px";
        message.style.transition = "opacity 1s";
        message.style.opacity = "1";

        document.body.appendChild(message);

        // Ta bort meddelandet efter 3 sekunder
        setTimeout(() => {
            message.style.opacity = "0";
            setTimeout(() => {
                document.body.removeChild(message);
            }, 1000);
        }, 3000);
    }).catch((err) => {
        console.error('Kunde inte kopiera texten: ', err);
    });
}

// Starta applikationen
window.onload = function() {
    checkAuthState();
    init();
};

// Edit Product Functions
window.editProduct = function(product, categoryName) {
    currentEditProduct = { ...product, categoryName };
    document.getElementById('modalTitle').textContent = 'Redigera produkt';
    
    populateModalCategories();
    document.getElementById('productCategory').value = categoryName;
    updateModalSubcategories();

    setTimeout(() => {
        document.getElementById('productSubcategory').value = product.subcategory;
        updateModalSubtypes();

        setTimeout(() => {
            document.getElementById('productSubtype').value = product.subtype || '';
            document.getElementById('productNumber').value = product.productNumber;
            document.getElementById('productName').value = product.name;
            document.getElementById('productInfo').value = product.info;
            document.getElementById('productImage').value = product.image;
            document.getElementById('productSpecs').value = product.specs ? JSON.stringify(product.specs, null, 2) : '';
        }, 50);
    }, 50);

    document.getElementById('productModal').classList.add('active');
};

window.openAddProductModal = function() {
    currentEditProduct = null;
    document.getElementById('modalTitle').textContent = 'Lägg till ny produkt';
    
    // Rensa formuläret
    document.getElementById('productForm').reset();
    
    populateModalCategories();
    updateModalSubcategories();
    
    document.getElementById('productModal').classList.add('active');
};

window.closeModal = function() {
    document.getElementById('productModal').classList.remove('active');
    currentEditProduct = null;
};

function populateModalCategories() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Välj Fabrikat</option>';

    productsDB.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });

    const newOption = document.createElement('option');
    newOption.value = '__NEW__';
    newOption.textContent = '➕ Nytt Fabrikat';
    newOption.style.color = '#28a745';
    newOption.style.fontWeight = 'bold';
    select.appendChild(newOption);
}

window.updateModalSubcategories = function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategorySelect = document.getElementById('productSubcategory');
    const subtypeSelect = document.getElementById('productSubtype');
    const editCategoryBtn = document.getElementById('editCategoryBtn');
    const editSubcategoryBtn = document.getElementById('editSubcategoryBtn');
    const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
    const deleteSubcategoryBtn = document.getElementById('deleteSubcategoryBtn');

    // Handle "New Category" selection
    if (categoryName === '__NEW__') {
        openAddCategory();
        return;
    }

    subcategorySelect.innerHTML = '<option value="">Välj underkategori</option>';
    subtypeSelect.innerHTML = '<option value="">Ingen undertyp</option>';
    editCategoryBtn.disabled = !categoryName;
    deleteCategoryBtn.disabled = !categoryName;
    editSubcategoryBtn.disabled = true;
    deleteSubcategoryBtn.disabled = true;

    if (categoryName) {
        const category = productsDB.categories.find(c => c.name === categoryName);
        if (category && category.subgroups) {
            category.subgroups.forEach(subgroup => {
                const option = document.createElement('option');
                option.value = subgroup.name;
                option.textContent = subgroup.name;
                subcategorySelect.appendChild(option);
            });
        }

        const newOption = document.createElement('option');
        newOption.value = '__NEW__';
        newOption.textContent = '➕ Ny Underkategori';
        newOption.style.color = '#28a745';
        newOption.style.fontWeight = 'bold';
        subcategorySelect.appendChild(newOption);
    }

    const newSubtypeOption = document.createElement('option');
    newSubtypeOption.value = '__NEW__';
    newSubtypeOption.textContent = '➕ Ny Undertyp';
    newSubtypeOption.style.color = '#28a745';
    newSubtypeOption.style.fontWeight = 'bold';
    subtypeSelect.appendChild(newSubtypeOption);
};

window.updateModalSubtypes = function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategoryName = document.getElementById('productSubcategory').value;
    const subtypeSelect = document.getElementById('productSubtype');
    const editSubcategoryBtn = document.getElementById('editSubcategoryBtn');
    const editSubtypeBtn = document.getElementById('editSubtypeBtn');
    const deleteSubcategoryBtn = document.getElementById('deleteSubcategoryBtn');
    const deleteSubtypeBtn = document.getElementById('deleteSubtypeBtn');

    // Handle "New Subcategory" selection
    if (subcategoryName === '__NEW__') {
        openAddSubcategory();
        return;
    }

    subtypeSelect.innerHTML = '<option value="">Ingen undertyp</option>';
    editSubcategoryBtn.disabled = !subcategoryName;
    deleteSubcategoryBtn.disabled = !subcategoryName;
    editSubtypeBtn.disabled = true;
    deleteSubtypeBtn.disabled = true;

    if (categoryName && subcategoryName) {
        const category = productsDB.categories.find(c => c.name === categoryName);
        if (category && category.subgroups) {
            const subgroup = category.subgroups.find(sg => sg.name === subcategoryName);
            if (subgroup && subgroup.subtypes) {
                subgroup.subtypes.forEach(subtype => {
                    const option = document.createElement('option');
                    option.value = subtype;
                    option.textContent = subtype;
                    subtypeSelect.appendChild(option);
                });
                editSubtypeBtn.disabled = false;
                deleteSubtypeBtn.disabled = false;
            }
        }
    }

    const newOption = document.createElement('option');
    newOption.value = '__NEW__';
    newOption.textContent = '➕ Ny Undertyp';
    newOption.style.color = '#28a745';
    newOption.style.fontWeight = 'bold';
    subtypeSelect.appendChild(newOption);
};

window.saveProduct = async function(event) {
    event.preventDefault();

    try {
        const categoryName = document.getElementById('productCategory').value;
        const subcategoryName = document.getElementById('productSubcategory').value;
        const subtypeName = document.getElementById('productSubtype').value;
        const productNumber = document.getElementById('productNumber').value;
        const productName = document.getElementById('productName').value;
        const productInfo = document.getElementById('productInfo').value;
        const productImage = document.getElementById('productImage').value;
        const productSpecsText = document.getElementById('productSpecs').value;

        let specs = {};
        if (productSpecsText.trim()) {
            try {
                specs = JSON.parse(productSpecsText);
            } catch (e) {
                showStatus('Ogiltigt JSON-format i specifikationer', 'error');
                return;
            }
        }

        const productData = {
            name: productName,
            subcategory: subcategoryName,
            subtype: subtypeName,
            image: productImage || `images/${categoryName.toLowerCase()}/${productNumber}.png`,
            info: productInfo,
            productNumber: productNumber,
            specs: specs
        };

        // Get current category data
        const categoryRef = ref(database, `products/${categoryName}`);
        const categorySnapshot = await get(categoryRef);
        const categoryData = categorySnapshot.val();

        if (!categoryData) {
            showStatus('Kategorin finns inte', 'error');
            return;
        }

        if (!categoryData.products) {
            categoryData.products = [];
        }

        // If editing and category changed, remove from old category
        if (currentEditProduct && currentEditProduct.categoryName !== categoryName) {
            const oldCategoryRef = ref(database, `products/${currentEditProduct.categoryName}`);
            const oldSnapshot = await get(oldCategoryRef);
            const oldCategoryData = oldSnapshot.val();
            oldCategoryData.products = oldCategoryData.products.filter(p => p.productNumber !== currentEditProduct.productNumber);
            await set(oldCategoryRef, oldCategoryData);
        }

        const existingIndex = categoryData.products.findIndex(p => p.productNumber === productNumber);

        if (existingIndex !== -1) {
            categoryData.products[existingIndex] = productData;
            showStatus('Produkt uppdaterad!', 'success');
        } else {
            categoryData.products.push(productData);
            showStatus('Produkt tillagd!', 'success');
        }

        await set(categoryRef, categoryData);

        closeModal();
        await loadProductsFromFirebase();

    } catch (error) {
        showStatus('Fel vid sparande: ' + error.message, 'error');
    }
};

window.deleteProduct = async function(categoryName, productNumber) {
    if (!confirm(`Är du säker på att du vill ta bort produkten ${productNumber}?`)) {
        return;
    }

    try {
        const categoryRef = ref(database, `products/${categoryName}`);
        const snapshot = await get(categoryRef);
        const categoryData = snapshot.val();

        if (!categoryData || !categoryData.products) {
            showStatus('Kategorin eller produkterna finns inte', 'error');
            return;
        }

        categoryData.products = categoryData.products.filter(p => p.productNumber !== productNumber);
        await set(categoryRef, categoryData);

        showStatus('Produkt borttagen', 'success');
        await loadProductsFromFirebase();

    } catch (error) {
        showStatus('Fel vid borttagning: ' + error.message, 'error');
    }
};

function showStatus(message, type = 'success') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);

    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// Handle subtype selection for __NEW__
document.addEventListener('DOMContentLoaded', () => {
    const subtypeSelect = document.getElementById('productSubtype');
    if (subtypeSelect) {
        subtypeSelect.addEventListener('change', function() {
            if (this.value === '__NEW__') {
                const categoryName = document.getElementById('productCategory').value;
                const subcategoryName = document.getElementById('productSubcategory').value;
                
                if (!categoryName || !subcategoryName) {
                    showStatus('Välj först fabrikat och underkategori', 'error');
                    this.value = '';
                    return;
                }
                openAddSubtype();
            }
        });
    }
});

// Category Management Functions
window.openAddCategory = function() {
    isEditingCategory = false;
    currentCategoryForEdit = '';
    document.getElementById('categoryModalTitle').textContent = 'Lägg till Fabrikat';
    document.getElementById('modalCategoryName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('categoryModal').classList.add('active');
};

window.openEditCategory = function() {
    const categoryName = document.getElementById('productCategory').value;
    if (!categoryName) return;

    isEditingCategory = true;
    currentCategoryForEdit = categoryName;
    document.getElementById('categoryModalTitle').textContent = 'Redigera Fabrikat';
    document.getElementById('modalCategoryName').value = categoryName;
    document.getElementById('categoryModal').classList.add('active');
};

window.closeCategoryModal = function() {
    document.getElementById('categoryModal').classList.remove('active');
    if (document.getElementById('productCategory').value === '__NEW__') {
        document.getElementById('productCategory').value = '';
    }
};

window.deleteCategory = async function() {
    const categoryName = document.getElementById('productCategory').value;
    if (!categoryName) return;

    // Kontrollera om det finns produkter i kategorin
    const category = productsDB.categories.find(c => c.name === categoryName);
    if (category && category.products && category.products.length > 0) {
        if (!confirm(`Fabrikat "${categoryName}" innehåller ${category.products.length} produkter. Är du säker på att du vill ta bort fabrikatet och alla dess produkter?`)) {
            return;
        }
    } else if (!confirm(`Är du säker på att du vill ta bort fabrikat "${categoryName}"?`)) {
        return;
    }

    try {
        const categoryRef = ref(database, `products/${categoryName}`);
        await remove(categoryRef);

        showStatus(`Fabrikat "${categoryName}" borttaget`, 'success');
        
        await loadProductsFromFirebase();
        populateModalCategories();
        document.getElementById('productCategory').value = '';
        updateModalSubcategories();
        populateMainCategoryFilter();

    } catch (error) {
        showStatus('Fel vid borttagning: ' + error.message, 'error');
    }
};

window.saveCategoryFromModal = async function(event) {
    event.preventDefault();
    const newName = document.getElementById('modalCategoryName').value.trim();

    if (!newName) {
        showStatus('Ange ett fabrikatnamn', 'error');
        return;
    }

    try {
        if (isEditingCategory && currentCategoryForEdit) {
            if (newName !== currentCategoryForEdit) {
                const oldCategoryRef = ref(database, `products/${currentCategoryForEdit}`);
                const snapshot = await get(oldCategoryRef);
                const categoryData = snapshot.val();

                const newCategoryRef = ref(database, `products/${newName}`);
                const newSnapshot = await get(newCategoryRef);
                if (newSnapshot.exists()) {
                    showStatus('Ett fabrikat med detta namn finns redan', 'error');
                    return;
                }

                categoryData.name = newName;
                await set(newCategoryRef, categoryData);
                await remove(oldCategoryRef);

                showStatus(`Fabrikat ändrat till "${newName}"`, 'success');
            }
        } else {
            const categoryRef = ref(database, `products/${newName}`);
            const snapshot = await get(categoryRef);

            if (snapshot.exists()) {
                showStatus('Fabrikatet finns redan', 'error');
                return;
            }

            await set(categoryRef, {
                name: newName,
                subgroups: [],
                products: []
            });

            showStatus(`Fabrikat "${newName}" tillagt!`, 'success');
        }

        closeCategoryModal();
        await loadProductsFromFirebase();
        
        // Uppdatera produktmodalens dropdown direkt
        populateModalCategories();
        document.getElementById('productCategory').value = newName;
        updateModalSubcategories();
        
        // Uppdatera huvudfiltret också
        populateMainCategoryFilter();

    } catch (error) {
        showStatus('Fel: ' + error.message, 'error');
    }
};

window.openAddSubcategory = function() {
    const categoryName = document.getElementById('productCategory').value;
    if (!categoryName) {
        showStatus('Välj först ett fabrikat', 'error');
        return;
    }

    isEditingCategory = false;
    currentCategoryForEdit = categoryName;
    currentSubcategoryForEdit = '';
    document.getElementById('subcategoryModalTitle').textContent = 'Lägg till Underkategori';
    document.getElementById('modalSubcategoryName').value = '';
    document.getElementById('productSubcategory').value = '';
    document.getElementById('subcategoryModal').classList.add('active');
};

window.openEditSubcategory = function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategoryName = document.getElementById('productSubcategory').value;
    if (!categoryName || !subcategoryName) return;

    isEditingCategory = true;
    currentCategoryForEdit = categoryName;
    currentSubcategoryForEdit = subcategoryName;
    document.getElementById('subcategoryModalTitle').textContent = 'Redigera Underkategori';
    document.getElementById('modalSubcategoryName').value = subcategoryName;
    document.getElementById('subcategoryModal').classList.add('active');
};

window.closeSubcategoryModal = function() {
    document.getElementById('subcategoryModal').classList.remove('active');
    if (document.getElementById('productSubcategory').value === '__NEW__') {
        document.getElementById('productSubcategory').value = '';
    }
};

window.deleteSubcategory = async function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategoryName = document.getElementById('productSubcategory').value;
    if (!categoryName || !subcategoryName) return;

    const category = productsDB.categories.find(c => c.name === categoryName);
    if (!category) return;

    // Kontrollera om det finns produkter i underkategorin
    const productsInSubcategory = category.products ? category.products.filter(p => p.subcategory === subcategoryName).length : 0;
    
    if (productsInSubcategory > 0) {
        if (!confirm(`Underkategori "${subcategoryName}" innehåller ${productsInSubcategory} produkter. Är du säker på att du vill ta bort underkategorin och alla dess produkter?`)) {
            return;
        }
    } else if (!confirm(`Är du säker på att du vill ta bort underkategori "${subcategoryName}"?`)) {
        return;
    }

    try {
        const categoryRef = ref(database, `products/${categoryName}`);
        const snapshot = await get(categoryRef);
        const categoryData = snapshot.val();

        // Ta bort underkategorin från subgroups
        categoryData.subgroups = categoryData.subgroups.filter(sg => sg.name !== subcategoryName);
        
        // Ta bort alla produkter i underkategorin
        if (categoryData.products) {
            categoryData.products = categoryData.products.filter(p => p.subcategory !== subcategoryName);
        }

        await set(categoryRef, categoryData);

        showStatus(`Underkategori "${subcategoryName}" borttagen`, 'success');
        
        await loadProductsFromFirebase();
        populateModalCategories();
        document.getElementById('productCategory').value = categoryName;
        updateModalSubcategories();
        document.getElementById('productSubcategory').value = '';
        populateMainCategoryFilter();
        updateSubcategories();

    } catch (error) {
        showStatus('Fel vid borttagning: ' + error.message, 'error');
    }
};

window.saveSubcategoryFromModal = async function(event) {
    event.preventDefault();
    const categoryName = currentCategoryForEdit;
    const newName = document.getElementById('modalSubcategoryName').value.trim();

    if (!newName) {
        showStatus('Ange ett underkategorinamn', 'error');
        return;
    }

    try {
        const categoryRef = ref(database, `products/${categoryName}`);
        const snapshot = await get(categoryRef);
        const categoryData = snapshot.val();

        if (!categoryData) {
            showStatus('Fabrikatet finns inte', 'error');
            return;
        }

        if (!categoryData.subgroups) {
            categoryData.subgroups = [];
        }

        if (isEditingCategory && currentSubcategoryForEdit) {
            const subgroup = categoryData.subgroups.find(sg => sg.name === currentSubcategoryForEdit);
            if (!subgroup) {
                showStatus('Underkategorin finns inte', 'error');
                return;
            }

            if (newName !== currentSubcategoryForEdit) {
                if (categoryData.subgroups.find(sg => sg.name === newName)) {
                    showStatus('En underkategori med detta namn finns redan', 'error');
                    return;
                }
                subgroup.name = newName;
                
                if (categoryData.products) {
                    categoryData.products.forEach(product => {
                        if (product.subcategory === currentSubcategoryForEdit) {
                            product.subcategory = newName;
                        }
                    });
                }
            }

            showStatus(`Underkategori ändrad till "${newName}"`, 'success');
        } else {
            if (categoryData.subgroups.find(sg => sg.name === newName)) {
                showStatus('Underkategorin finns redan', 'error');
                return;
            }

            categoryData.subgroups.push({
                name: newName,
                subtypes: []
            });

            showStatus(`Underkategori "${newName}" tillagd!`, 'success');
        }

        await set(categoryRef, categoryData);
        closeSubcategoryModal();
        await loadProductsFromFirebase();

        // Uppdatera produktmodalens dropdowns direkt
        populateModalCategories();
        document.getElementById('productCategory').value = categoryName;
        updateModalSubcategories();
        document.getElementById('productSubcategory').value = newName;
        updateModalSubtypes();
        
        // Uppdatera huvudfiltret
        populateMainCategoryFilter();
        updateSubcategories();

    } catch (error) {
        showStatus('Fel: ' + error.message, 'error');
    }
};

window.openAddSubtype = function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategoryName = document.getElementById('productSubcategory').value;
    
    if (!categoryName || !subcategoryName) {
        showStatus('Välj först fabrikat och underkategori', 'error');
        return;
    }

    isEditingCategory = false;
    currentCategoryForEdit = categoryName;
    currentSubcategoryForEdit = subcategoryName;
    document.getElementById('subtypeModalTitle').textContent = 'Lägg till Undertyp';
    document.getElementById('modalSubtypeName').value = '';
    document.getElementById('productSubtype').value = '';
    document.getElementById('subtypeModal').classList.add('active');
};

window.openEditSubtype = function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategoryName = document.getElementById('productSubcategory').value;
    const subtypeName = document.getElementById('productSubtype').value;
    
    if (!categoryName || !subcategoryName || !subtypeName) return;

    isEditingCategory = true;
    currentCategoryForEdit = categoryName;
    currentSubcategoryForEdit = subcategoryName;
    document.getElementById('subtypeModalTitle').textContent = 'Redigera Undertyp';
    document.getElementById('modalSubtypeName').value = subtypeName;
    document.getElementById('subtypeModal').classList.add('active');
};

window.closeSubtypeModal = function() {
    document.getElementById('subtypeModal').classList.remove('active');
    if (document.getElementById('productSubtype').value === '__NEW__') {
        document.getElementById('productSubtype').value = '';
    }
};

window.deleteSubtype = async function() {
    const categoryName = document.getElementById('productCategory').value;
    const subcategoryName = document.getElementById('productSubcategory').value;
    const subtypeName = document.getElementById('productSubtype').value;
    
    if (!categoryName || !subcategoryName || !subtypeName) return;

    const category = productsDB.categories.find(c => c.name === categoryName);
    if (!category) return;

    // Kontrollera om det finns produkter med denna undertyp
    const productsWithSubtype = category.products ? 
        category.products.filter(p => p.subcategory === subcategoryName && p.subtype === subtypeName).length : 0;
    
    if (productsWithSubtype > 0) {
        if (!confirm(`Undertyp "${subtypeName}" används av ${productsWithSubtype} produkter. Är du säker på att du vill ta bort undertypen? Produkterna kommer att bli utan undertyp.`)) {
            return;
        }
    } else if (!confirm(`Är du säker på att du vill ta bort undertyp "${subtypeName}"?`)) {
        return;
    }

    try {
        const categoryRef = ref(database, `products/${categoryName}`);
        const snapshot = await get(categoryRef);
        const categoryData = snapshot.val();

        const subgroup = categoryData.subgroups.find(sg => sg.name === subcategoryName);
        if (!subgroup) {
            showStatus('Underkategorin finns inte', 'error');
            return;
        }

        // Ta bort undertypen från subtypes array
        if (subgroup.subtypes) {
            subgroup.subtypes = subgroup.subtypes.filter(st => st !== subtypeName);
        }

        // Ta bort undertyp från produkter (sätt till tom sträng)
        if (categoryData.products) {
            categoryData.products.forEach(product => {
                if (product.subcategory === subcategoryName && product.subtype === subtypeName) {
                    product.subtype = '';
                }
            });
        }

        await set(categoryRef, categoryData);

        showStatus(`Undertyp "${subtypeName}" borttagen`, 'success');
        
        await loadProductsFromFirebase();
        populateModalCategories();
        document.getElementById('productCategory').value = categoryName;
        updateModalSubcategories();
        document.getElementById('productSubcategory').value = subcategoryName;
        updateModalSubtypes();
        document.getElementById('productSubtype').value = '';
        populateMainCategoryFilter();
        updateSubcategories();
        updateSubtypes();

    } catch (error) {
        showStatus('Fel vid borttagning: ' + error.message, 'error');
    }
};

window.saveSubtypeFromModal = async function(event) {
    event.preventDefault();
    const categoryName = currentCategoryForEdit;
    const subcategoryName = currentSubcategoryForEdit;
    const oldSubtypeName = isEditingCategory ? document.getElementById('productSubtype').value : '';
    const newName = document.getElementById('modalSubtypeName').value.trim();

    if (!newName) {
        showStatus('Ange ett undertypsnamn', 'error');
        return;
    }

    try {
        const categoryRef = ref(database, `products/${categoryName}`);
        const snapshot = await get(categoryRef);
        const categoryData = snapshot.val();

        const subgroup = categoryData.subgroups.find(sg => sg.name === subcategoryName);
        if (!subgroup) {
            showStatus('Underkategorin finns inte', 'error');
            return;
        }

        if (!subgroup.subtypes) {
            subgroup.subtypes = [];
        }

        if (isEditingCategory && oldSubtypeName) {
            const index = subgroup.subtypes.indexOf(oldSubtypeName);
            if (index === -1) {
                showStatus('Undertypen finns inte', 'error');
                return;
            }

            if (newName !== oldSubtypeName) {
                if (subgroup.subtypes.includes(newName)) {
                    showStatus('En undertyp med detta namn finns redan', 'error');
                    return;
                }
                subgroup.subtypes[index] = newName;
                
                if (categoryData.products) {
                    categoryData.products.forEach(product => {
                        if (product.subtype === oldSubtypeName && product.subcategory === subcategoryName) {
                            product.subtype = newName;
                        }
                    });
                }
            }

            showStatus(`Undertyp ändrad till "${newName}"`, 'success');
        } else {
            if (subgroup.subtypes.includes(newName)) {
                showStatus('Undertypen finns redan', 'error');
                return;
            }

            subgroup.subtypes.push(newName);
            showStatus(`Undertyp "${newName}" tillagd!`, 'success');
        }

        await set(categoryRef, categoryData);
        closeSubtypeModal();
        await loadProductsFromFirebase();

        // Uppdatera produktmodalens dropdowns direkt
        populateModalCategories();
        document.getElementById('productCategory').value = categoryName;
        updateModalSubcategories();
        document.getElementById('productSubcategory').value = subcategoryName;
        updateModalSubtypes();
        document.getElementById('productSubtype').value = newName;
        
        // Uppdatera huvudfiltret
        populateMainCategoryFilter();
        updateSubcategories();
        updateSubtypes();

    } catch (error) {
        showStatus('Fel: ' + error.message, 'error');
    }
};

// Close modal on outside click
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    document.getElementById('categoryModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCategoryModal();
        }
    });

    document.getElementById('subcategoryModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeSubcategoryModal();
        }
    });

    document.getElementById('subtypeModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeSubtypeModal();
        }
    });
});

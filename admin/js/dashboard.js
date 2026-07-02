/**
 * Gestione della dashboard del pannello di amministrazione
 * Utilizza le API per la gestione del menu e delle categorie
 */

const API_BASE_URL = '/api/menu';
const CATEGORIES_API_URL = '/api/categories';
const SUBHEADINGS_API_URL = '/api/subheadings';

async function fetchData(url, options = {}) {
    try {
        const token = localStorage.getItem('adminToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        console.log('Richiesta API:', url, options);
        const response = await fetch(url, { ...options, headers });
        console.log('Risposta API:', response.status);
        if (!response.ok) {
            let errorMsg = 'Errore nella richiesta';
            try {
                const error = await response.json();
                errorMsg = error.message || errorMsg;
            } catch (e) { errorMsg = `Errore ${response.status}: ${response.statusText}`; }
            throw new Error(errorMsg);
        }
        const data = await response.json();
        console.log('Dati ricevuti:', data);
        return data;
    } catch (error) {
        console.error('Errore nella richiesta API:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard caricata');
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const menuItemsContainer = document.getElementById('menuItems');
    const addDishBtn = document.getElementById('addDishBtn');
    const dishModal = document.getElementById('dishModal');
    const closeModal = document.getElementById('closeModal');
    const cancelDish = document.getElementById('cancelDish');
    const dishForm = document.getElementById('dishForm');
    const searchInput = document.getElementById('searchMenu');
    const categoryTabs = document.getElementById('categoryTabs');
    const imageUpload = document.getElementById('imageUpload');
    const dishImage = document.getElementById('dishImage');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const categoryModal = document.getElementById('categoryModal');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryForm = document.getElementById('categoryForm');
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    const cancelCategory = document.getElementById('cancelCategory');
    
    // Nuovi elementi per divisori
    const subheadingModal = document.getElementById('subheadingModal');
    const addSubheadingBtn = document.getElementById('addSubheadingBtn');
    const subheadingForm = document.getElementById('subheadingForm');
    const closeSubheadingModal = document.getElementById('closeSubheadingModal');
    const cancelSubheading = document.getElementById('cancelSubheading');

    let currentDishId = null;
    let currentCategory = 'antipasti';
    let allMenuItems = [];
    let allCategories = [];
    let allSubheadings = [];
    let currentImageUrl = null;
    let currentCategoryId = null;
    let currentSubheadingId = null;

    imageUpload.addEventListener('click', () => dishImage.click());
    dishImage.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                removeImageBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
            try {
                showLoading(true);
                const formData = new FormData();
                formData.append('image', file);
                const token = localStorage.getItem('adminToken');
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    currentImageUrl = data.data.imageUrl;
                    console.log('Immagine caricata:', currentImageUrl);
                } else {
                    showNotification('Errore durante l\'upload dell\'immagine: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Errore upload immagine:', error);
                showNotification('Errore durante l\'upload dell\'immagine!', 'error');
            } finally {
                showLoading(false);
            }
        }
    });

    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageUrl = null;
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        removeImageBtn.style.display = 'none';
    });

    async function loadCategories() {
        try {
            console.log('Caricamento categorie...');
            const data = await fetchData(CATEGORIES_API_URL);
            allCategories = data.data || [];
            console.log('Categorie caricate:', allCategories.length);
            renderCategoryTabs();
            populateCategorySelect();
            return allCategories;
        } catch (error) {
            console.error('Errore nel caricamento delle categorie:', error);
            showNotification(`Errore nel caricamento delle categorie: ${error.message}`, 'error');
            return [];
        }
    }

    function renderCategoryTabs() {
        if (!categoryTabs) return;
        categoryTabs.innerHTML = '';
        allCategories.forEach(cat => {
            const tab = document.createElement('div');
            tab.className = 'category-tab';
            if (cat.name === currentCategory) tab.classList.add('active');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = cat.displayName;
            nameSpan.style.flex = '1';
            nameSpan.style.cursor = 'pointer';
            nameSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCategory = cat.name;
                console.log('Categoria selezionata:', currentCategory);
                loadMenuItems(currentCategory, searchInput.value);
            });
            tab.appendChild(nameSpan);

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.style.background = 'none';
            editBtn.style.border = 'none';
            editBtn.style.color = 'var(--secondary-color)';
            editBtn.style.cursor = 'pointer';
            editBtn.style.padding = '0.25rem';
            editBtn.style.fontSize = '0.9rem';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editCategory(cat);
            });
            tab.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.style.background = 'none';
            deleteBtn.style.border = 'none';
            deleteBtn.style.color = '#f44336';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.padding = '0.25rem';
            deleteBtn.style.fontSize = '0.9rem';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCategory(cat._id, cat.name);
            });
            tab.appendChild(deleteBtn);

            categoryTabs.appendChild(tab);
        });
    }

    function populateCategorySelect() {
        const select = document.getElementById('dishCategory');
        const subCatSelect = document.getElementById('subheadingCategory');
        if (select) {
            select.innerHTML = '<option value="">Seleziona una categoria</option>';
            allCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.displayName;
                select.appendChild(option);
            });
        }
        if (subCatSelect) {
            subCatSelect.innerHTML = '<option value="">Seleziona una categoria</option>';
            allCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.displayName;
                subCatSelect.appendChild(option);
            });
        }
    }
    
    function populateDishSelectsForSubheading(category) {
        const afterSelect = document.getElementById('subheadingAfterItem');
        const beforeSelect = document.getElementById('subheadingBeforeItem');
        if (afterSelect && beforeSelect) {
            afterSelect.innerHTML = '<option value="">Nessuno (inizia prima)</option>';
            beforeSelect.innerHTML = '<option value="">Nessuno (aggiungi alla fine)</option>';
            const dishesInCategory = allMenuItems.filter(item => item.category === category).sort((a, b) => (a.order || 0) - (b.order || 0));
            dishesInCategory.forEach(dish => {
                const option1 = document.createElement('option');
                option1.value = dish._id;
                option1.textContent = `${dish.name} (Ordine: ${dish.order})`;
                afterSelect.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = dish._id;
                option2.textContent = `${dish.name} (Ordine: ${dish.order})`;
                beforeSelect.appendChild(option2);
            });
        }
    }
    
    async function loadSubheadings() {
        try {
            console.log('Caricamento divisori...');
            const data = await fetchData(SUBHEADINGS_API_URL);
            allSubheadings = data.data || [];
            console.log('Divisori caricati:', allSubheadings.length);
            return allSubheadings;
        } catch (error) {
            console.error('Errore nel caricamento dei divisori:', error);
            showNotification(`Errore nel caricamento dei divisori: ${error.message}`, 'error');
            return [];
        }
    }
    
    function addSubheading() {
        currentSubheadingId = null;
        document.getElementById('subheadingModalTitle').textContent = 'Aggiungi Nuovo Divisore';
        subheadingForm.reset();
        populateCategorySelect();
        populateDishSelectsForSubheading(currentCategory);
        document.getElementById('subheadingCategory').value = currentCategory;
        subheadingModal.style.display = 'flex';
    }
    
    async function editSubheading(id) {
        try {
            showLoading(true);
            const data = await fetchData(`${SUBHEADINGS_API_URL}/${id}`);
            const subheading = data.data;
            if (subheading) {
                currentSubheadingId = id;
                document.getElementById('subheadingModalTitle').textContent = 'Modifica Divisore';
                document.getElementById('subheadingName').value = subheading.name;
                document.getElementById('subheadingCategory').value = subheading.category;
                populateDishSelectsForSubheading(subheading.category);
                subheadingModal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Errore nel caricamento del divisore:', error);
            showNotification(`Errore nel caricamento del divisore: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteSubheading(id, name) {
        if (confirm(`Sei sicuro di voler eliminare il divisore "${name}"?`)) {
            try {
                showLoading(true);
                await fetchData(`${SUBHEADINGS_API_URL}/${id}`, { method: 'DELETE' });
                showNotification('Divisore eliminato con successo', 'success');
                await loadSubheadings();
                await loadMenuItems(currentCategory, searchInput.value); // Re-render menu items to include new subheadings
            } catch (error) {
                console.error('Errore durante l\'eliminazione del divisore:', error);
                showNotification(`Errore durante l'eliminazione: ${error.message}`, 'error');
            } finally {
                showLoading(false);
            }
        }
    }

    async function loadMenuItems(category = 'antipasti', searchQuery = '') {
        try {
            console.log('Caricamento menu...');
            showLoading(true);
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (searchQuery) params.append('search', searchQuery);
            const url = `${API_BASE_URL}?${params.toString()}`;
            const data = await fetchData(url);
            allMenuItems = data.data || [];
            console.log('Piatti caricati:', allMenuItems.length);
            renderMenuItems(allMenuItems, category, searchQuery);
            return allMenuItems;
        } catch (error) {
            console.error('Errore nel caricamento del menu:', error);
            showNotification(`Errore nel caricamento del menu: ${error.message}`, 'error');
            menuItemsContainer.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Errore nel caricamento del menu</p>
                    <p style="font-size: 0.9rem; color: #f44336;">${error.message}</p>
                    <button class="btn btn-outline mt-2" id="retryBtn">Riprova</button>
                </div>
            `;
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) retryBtn.addEventListener('click', () => loadMenuItems(currentCategory, searchInput.value));
            return [];
        } finally {
            showLoading(false);
        }
    }

    function renderMenuItems(items, category = 'antipasti', searchQuery = '') {
        console.log('Renderizzazione menu con', items.length, 'piatti e', allSubheadings.length, 'divisori');
        menuItemsContainer.innerHTML = '';
        let filteredItems = [...items];
        if (category) filteredItems = filteredItems.filter(item => item.category === category);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(query) || 
                (item.description && item.description.toLowerCase().includes(query))
            );
        }
        console.log('Piatti filtrati:', filteredItems.length);
        
        // Combina piatti e divisori per la categoria corrente
        const filteredSubheadings = allSubheadings.filter(sub => sub.category === category);
        const combined = [
            ...filteredItems.map(item => ({ type: 'item', data: item, order: item.order })),
            ...filteredSubheadings.map(sub => ({ type: 'subheading', data: sub, order: sub.order }))
        ];
        
        combined.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (combined.length === 0) {
            menuItemsContainer.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-utensils"></i>
                    <p>Nessun piatto o divisore trovato</p>
                    ${searchQuery || category ? '<button class="btn btn-outline mt-2" id="resetFilters">Azzera filtri</button>' : ''}
                </div>
            `;
            const resetBtn = document.getElementById('resetFilters');
            if (resetBtn) resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                if (allCategories.length > 0) {
                    currentCategory = allCategories[0].name;
                    renderCategoryTabs();
                }
                loadMenuItems(currentCategory);
            });
            return;
        }
        
        combined.forEach(elem => {
            if (elem.type === 'subheading') {
                const subheadingElement = document.createElement('div');
                subheadingElement.className = 'menu-item-card';
                subheadingElement.style.background = 'linear-gradient(135deg, #f5f7fa, #e4e8eb)';
                subheadingElement.innerHTML = `
                    <div class="menu-item-details menu-item-details-full">
                        <div class="menu-item-header">
                            <h3 class="menu-item-name" style="font-family: 'Playfair Display', serif; color: var(--primary-color); font-style: italic;">📌 ${elem.data.name}</h3>
                            <div style="display: flex; gap: 0.5rem;">
                                <span style="font-size: 0.85rem; color: #666;">Ordine: ${elem.data.order}</span>
                            </div>
                        </div>
                        <div class="menu-item-footer" style="justify-content: flex-end;">
                            <div class="menu-item-actions">
                                <button class="action-btn edit-btn" data-subheading-id="${elem.data._id}" title="Modifica">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" data-subheading-id="${elem.data._id}" title="Elimina">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                menuItemsContainer.appendChild(subheadingElement);
            } else {
                const item = elem.data;
                const dishElement = document.createElement('div');
                dishElement.className = 'menu-item-card';
                
                let imageHtml = '';
                let detailsClass = 'menu-item-details';
                if (!item.image) {
                    detailsClass += ' menu-item-details-full';
                }
                
                if (item.image) {
                    imageHtml = `<div class="menu-item-image" style="background-image: url('${item.image}')">
                        ${!item.isAvailable ? '<span class="menu-item-badge">Non disponibile</span>' : ''}
                    </div>`;
                }
                
                dishElement.innerHTML = `
                    ${imageHtml}
                    <div class="${detailsClass}">
                        <div class="menu-item-header">
                            <h3 class="menu-item-name">${item.name}</h3>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                                <span class="menu-item-price">€${item.price.toFixed(2)}</span>
                                <span style="font-size: 0.75rem; color: #999;">Ordine: ${item.order}</span>
                            </div>
                        </div>
                        ${item.description ? `<p class="menu-item-description">${item.description}</p>` : ''}
                        <div class="menu-item-footer">
                            <label class="status-toggle">
                                <input type="checkbox" ${item.isAvailable ? 'checked' : ''} data-id="${item._id}">
                                <span class="slider"></span>
                            </label>
                            <div class="menu-item-actions">
                                <button class="action-btn edit-btn" data-id="${item._id}" title="Modifica">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" data-id="${item._id}" title="Elimina">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                menuItemsContainer.appendChild(dishElement);
            }
        });
        
        setupEventListeners();
    }

    function setupEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dishId = e.currentTarget.getAttribute('data-id');
                const subId = e.currentTarget.getAttribute('data-subheading-id');
                if (subId) {
                    editSubheading(subId);
                } else if (dishId) {
                    editDish(dishId);
                }
            });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dishId = e.currentTarget.getAttribute('data-id');
                const subId = e.currentTarget.getAttribute('data-subheading-id');
                if (subId) {
                    const subheading = allSubheadings.find(s => s._id === subId);
                    deleteSubheading(subId, subheading ? subheading.name : '');
                } else if (dishId) {
                    deleteDish(dishId);
                }
            });
        });
        document.querySelectorAll('.status-toggle input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const dishId = e.target.getAttribute('data-id');
                const isAvailable = e.target.checked;
                toggleDishAvailability(dishId, isAvailable);
            });
        });
    }

    function addDish() {
        currentDishId = null;
        currentImageUrl = null;
        document.getElementById('modalTitle').textContent = 'Aggiungi Nuovo Piatto';
        dishForm.reset();
        document.getElementById('dishIsAvailable').checked = true;
        document.getElementById('dishShowImage').checked = true;
        document.getElementById('dishOrder').value = 0;
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        removeImageBtn.style.display = 'none';
        dishModal.style.display = 'flex';
    }

    async function editDish(id) {
        try {
            showLoading(true);
            const data = await fetchData(`${API_BASE_URL}/${id}`);
            const dish = data.data;
            if (dish) {
                currentDishId = id;
                currentImageUrl = dish.image || null;
                document.getElementById('modalTitle').textContent = 'Modifica Piatto';
                document.getElementById('dishName').value = dish.name || '';
                document.getElementById('dishCategory').value = dish.category || '';
                document.getElementById('dishPrice').value = dish.price || '';
                document.getElementById('dishDescription').value = dish.description || '';
                document.getElementById('dishIsAvailable').checked = dish.isAvailable !== false;
                document.getElementById('dishShowImage').checked = dish.showImage !== false;
                document.getElementById('dishOrder').value = dish.order || 0;
                if (dish.image) {
                    imagePreview.src = dish.image;
                    imagePreview.style.display = 'block';
                    removeImageBtn.style.display = 'block';
                } else {
                    imagePreview.style.display = 'none';
                    imagePreview.src = '';
                    removeImageBtn.style.display = 'none';
                }
                dishModal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Errore nel caricamento del piatto:', error);
            showNotification(`Errore nel caricamento del piatto: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }

    async function deleteDish(id) {
        if (confirm('Sei sicuro di voler eliminare questo piatto?')) {
            try {
                showLoading(true);
                await fetchData(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
                showNotification('Piatto eliminato con successo', 'success');
                loadMenuItems(currentCategory, searchInput.value);
            } catch (error) {
                console.error('Errore durante l\'eliminazione del piatto:', error);
                showNotification(`Errore durante l\'eliminazione: ${error.message}`, 'error');
            } finally {
                showLoading(false);
            }
        }
    }

    async function toggleDishAvailability(id, isAvailable) {
        try {
            showLoading(true);
            await fetchData(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ isAvailable })
            });
            const status = isAvailable ? 'attivato' : 'disattivato';
            showNotification(`Piatto ${status} con successo`, 'success');
            loadMenuItems(currentCategory, searchInput.value);
        } catch (error) {
            console.error('Errore durante l\'aggiornamento del piatto:', error);
            showNotification(`Errore durante l'aggiornamento: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }

    function showNotification(message, type = 'info') {
        console.log('Notifica:', type, message);
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 8px; color: white;
            z-index: 10000; display: flex; align-items: center; gap: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #4caf50;' : ''}
            ${type === 'error' ? 'background: #f44336;' : ''}
            ${type === 'info' ? 'background: #2196f3;' : ''}
        `;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">&times;</button>
        `;
        document.querySelectorAll('.notification').forEach(n => n.remove());
        document.body.appendChild(notification);
        const removeNotification = () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        };
        setTimeout(removeNotification, 5000);
        notification.querySelector('.close-notification').addEventListener('click', removeNotification);
    }

    function showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    function addCategory() {
        currentCategoryId = null;
        document.getElementById('categoryModalTitle').textContent = 'Aggiungi Nuova Categoria';
        categoryForm.reset();
        document.getElementById('categoryOrder').value = allCategories.length + 1;
        categoryModal.style.display = 'flex';
    }

    function editCategory(cat) {
        currentCategoryId = cat._id;
        document.getElementById('categoryModalTitle').textContent = 'Modifica Categoria';
        document.getElementById('categoryName').value = cat.displayName;
        document.getElementById('categoryOrder').value = cat.order;
        categoryModal.style.display = 'flex';
    }

    async function deleteCategory(id, name) {
        if (confirm(`Sei sicuro di voler eliminare la categoria "${name}"? I piatti in questa categoria non verranno eliminati, ma dovrai assegnarli a un'altra categoria.`)) {
            try {
                showLoading(true);
                await fetchData(`${CATEGORIES_API_URL}/${id}`, {
                    method: 'DELETE'
                });
                showNotification('Categoria eliminata con successo', 'success');
                await loadCategories();
                if (currentCategory === name && allCategories.length > 0) {
                    currentCategory = allCategories[0].name;
                }
                await loadMenuItems(currentCategory, searchInput.value);
            } catch (error) {
                console.error('Errore durante l\'eliminazione della categoria:', error);
                showNotification(`Errore durante l'eliminazione: ${error.message}`, 'error');
            } finally {
                showLoading(false);
            }
        }
    }

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryData = {
            name: document.getElementById('categoryName').value.toLowerCase().replace(/\s+/g, '-'),
            displayName: document.getElementById('categoryName').value,
            order: parseInt(document.getElementById('categoryOrder').value) || 0
        };
        try {
            showLoading(true);
            if (currentCategoryId) {
                await fetchData(`${CATEGORIES_API_URL}/${currentCategoryId}`, {
                    method: 'PUT',
                    body: JSON.stringify(categoryData)
                });
                showNotification('Categoria aggiornata con successo', 'success');
            } else {
                await fetchData(CATEGORIES_API_URL, {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });
                showNotification('Categoria aggiunta con successo', 'success');
            }
            await loadCategories();
            categoryModal.style.display = 'none';
            categoryForm.reset();
        } catch (error) {
            console.error('Errore durante il salvataggio della categoria:', error);
            showNotification(`Errore durante il salvataggio: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    });

    addDishBtn.addEventListener('click', addDish);
    addCategoryBtn.addEventListener('click', addCategory);
    addSubheadingBtn.addEventListener('click', addSubheading);
    closeModal.addEventListener('click', () => dishModal.style.display = 'none');
    cancelDish.addEventListener('click', () => dishModal.style.display = 'none');
    closeCategoryModal.addEventListener('click', () => categoryModal.style.display = 'none');
    cancelCategory.addEventListener('click', () => categoryModal.style.display = 'none');
    closeSubheadingModal.addEventListener('click', () => subheadingModal.style.display = 'none');
    cancelSubheading.addEventListener('click', () => subheadingModal.style.display = 'none');
    window.addEventListener('click', (e) => { 
        if (e.target === dishModal) dishModal.style.display = 'none'; 
        if (e.target === categoryModal) categoryModal.style.display = 'none'; 
        if (e.target === subheadingModal) subheadingModal.style.display = 'none'; 
    });
    
    // Update dish selects when category changes in subheading form
    document.getElementById('subheadingCategory').addEventListener('change', (e) => {
        populateDishSelectsForSubheading(e.target.value);
    });
    
    // Subheading form submit listener
    subheadingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(subheadingForm);
        const name = formData.get('name');
        const category = formData.get('category');
        const afterItemId = formData.get('afterItemId');
        const beforeItemId = formData.get('beforeItemId');
        
        const subheadingData = { name, category };
        if (afterItemId) subheadingData.afterItemId = afterItemId;
        if (beforeItemId) subheadingData.beforeItemId = beforeItemId;
        
        try {
            showLoading(true);
            if (currentSubheadingId) {
                await fetchData(`${SUBHEADINGS_API_URL}/${currentSubheadingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(subheadingData)
                });
                showNotification('Divisore aggiornato con successo', 'success');
            } else {
                await fetchData(SUBHEADINGS_API_URL, {
                    method: 'POST',
                    body: JSON.stringify(subheadingData)
                });
                showNotification('Divisore aggiunto con successo', 'success');
            }
            await loadSubheadings();
            await loadMenuItems(currentCategory, searchInput.value); // Re-render menu items
            subheadingModal.style.display = 'none';
            subheadingForm.reset();
        } catch (error) {
            console.error('Errore durante il salvataggio del divisore:', error);
            showNotification(`Errore durante il salvataggio: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    });
    
    const mobileLogoutBtn = document.getElementById('mobileLogout');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (Auth && Auth.logout) {
                Auth.logout();
            } else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('sessionTimestamp');
                window.location.href = 'login.html';
            }
        });
    }

    dishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dishData = {
            name: document.getElementById('dishName').value,
            category: document.getElementById('dishCategory').value,
            price: parseFloat(document.getElementById('dishPrice').value),
            description: document.getElementById('dishDescription').value,
            isAvailable: document.getElementById('dishIsAvailable').checked,
            showImage: document.getElementById('dishShowImage').checked,
            order: parseInt(document.getElementById('dishOrder').value) || 0
        };
        if (currentImageUrl) dishData.image = currentImageUrl;
        else dishData.image = '';
        console.log('Salvataggio piatto:', dishData);
        try {
            showLoading(true);
            if (currentDishId) {
                await fetchData(`${API_BASE_URL}/${currentDishId}`, {
                    method: 'PUT',
                    body: JSON.stringify(dishData)
                });
                showNotification('Piatto aggiornato con successo', 'success');
            } else {
                await fetchData(API_BASE_URL, {
                    method: 'POST',
                    body: JSON.stringify(dishData)
                });
                showNotification('Piatto aggiunto con successo', 'success');
            }
            await loadMenuItems(currentCategory, searchInput.value);
            dishModal.style.display = 'none';
            dishForm.reset();
        } catch (error) {
            console.error('Errore durante il salvataggio del piatto:', error);
            showNotification(`Errore durante il salvataggio: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    });

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadMenuItems(currentCategory, e.target.value), 300);
    });

    async function initDashboard() {
        await loadCategories();
        if (allCategories.length > 0) currentCategory = allCategories[0].name;
        await loadMenuItems(currentCategory);
        await loadSubheadings();
    }
    initDashboard();
});

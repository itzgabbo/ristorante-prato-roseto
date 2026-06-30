/**
 * Gestione della dashboard del pannello di amministrazione
 * Utilizza le API per la gestione del menu
 */

// URL base dell'API
const API_BASE_URL = '/api/menu';

// Funzione per gestire le richieste API
async function fetchData(url, options = {}) {
    try {
        const token = localStorage.getItem('adminToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Aggiungi il token di autenticazione se presente
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('Richiesta API:', url, options);
        const response = await fetch(url, {
            ...options,
            headers
        });

        console.log('Risposta API:', response.status);

        if (!response.ok) {
            let errorMsg = 'Errore nella richiesta';
            try {
                const error = await response.json();
                errorMsg = error.message || errorMsg;
            } catch (e) {
                errorMsg = `Errore ${response.status}: ${response.statusText}`;
            }
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
    
    // Verifica l'autenticazione
    if (!Auth.isAuthenticated()) {
        console.log('Non autenticato, reindirizzamento a login');
        window.location.href = 'login.html';
        return;
    }

    // Elementi del DOM
    const menuItemsContainer = document.getElementById('menuItems');
    const addDishBtn = document.getElementById('addDishBtn');
    const dishModal = document.getElementById('dishModal');
    const closeModal = document.getElementById('closeModal');
    const cancelDish = document.getElementById('cancelDish');
    const dishForm = document.getElementById('dishForm');
    const searchInput = document.getElementById('searchMenu');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const imageUpload = document.getElementById('imageUpload');
    const dishImage = document.getElementById('dishImage');
    const imagePreview = document.getElementById('imagePreview');
    
    let currentDishId = null;
    let currentCategory = 'all';
    let allMenuItems = [];
    let currentImageUrl = null;
    
    // Gestione upload immagine
    imageUpload.addEventListener('click', () => dishImage.click());
    
    dishImage.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Anteprima
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            // Upload al server
            try {
                showLoading(true);
                const formData = new FormData();
                formData.append('image', file);
                
                const token = localStorage.getItem('adminToken');
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
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

    // Carica i piatti dal server
    async function loadMenuItems(category = 'all', searchQuery = '') {
        try {
            console.log('Caricamento menu...');
            showLoading(true);
            
            // Costruisci l'URL con i parametri di query
            const params = new URLSearchParams();
            if (category !== 'all') params.append('category', category);
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
            
            // Mostra un messaggio chiaro nel contenitore
            menuItemsContainer.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Errore nel caricamento del menu</p>
                    <p style="font-size: 0.9rem; color: #f44336;">${error.message}</p>
                    <button class="btn btn-outline mt-2" id="retryBtn">Riprova</button>
                </div>
            `;
            
            // Aggiungi gestore per il pulsante di retry
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadMenuItems(currentCategory, searchInput.value));
            }
            
            return [];
        } finally {
            showLoading(false);
        }
    }
    
    // Renderizza i piatti nel DOM
    function renderMenuItems(items, category = 'all', searchQuery = '') {
        console.log('Renderizzazione menu con', items.length, 'piatti');
        menuItemsContainer.innerHTML = '';
        
        // Filtra i piatti
        let filteredItems = [...items];
        
        if (category !== 'all') {
            filteredItems = filteredItems.filter(item => item.category === category);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(query) || 
                (item.description && item.description.toLowerCase().includes(query))
            );
        }
        
        console.log('Piatti filtrati:', filteredItems.length);
        
        // Ordina i piatti
        filteredItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (filteredItems.length === 0) {
            menuItemsContainer.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-utensils"></i>
                    <p>Nessun piatto trovato</p>
                    ${searchQuery || category !== 'all' ? '<button class="btn btn-outline mt-2" id="resetFilters">Azzera filtri</button>' : ''}
                </div>
            `;

            // Aggiungi gestore eventi al pulsante di reset filtri
            const resetBtn = document.getElementById('resetFilters');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    document.querySelectorAll('.category-tab').forEach(tab => {
                        tab.classList.toggle('active', tab.getAttribute('data-category') === 'all');
                    });
                    currentCategory = 'all';
                    loadMenuItems();
                });
            }
            
            return;
        }
        
        // Aggiungi i piatti al DOM
        filteredItems.forEach(item => {
            const dishElement = document.createElement('div');
            dishElement.className = 'menu-item-card';
            dishElement.innerHTML = `
                <div class="menu-item-image" style="background-image: url('${item.image || '../piatto.jpg'}')">
                    ${!item.isAvailable ? '<span class="menu-item-badge">Non disponibile</span>' : ''}
                </div>
                <div class="menu-item-details">
                    <div class="menu-item-header">
                        <h3 class="menu-item-name">${item.name}</h3>
                        <span class="menu-item-price">€${item.price.toFixed(2)}</span>
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
        });
        
        // Aggiungi gestori di eventi ai pulsanti
        setupEventListeners();
    }
    
    // Configura i gestori di eventi
    function setupEventListeners() {
        // Pulsante modifica
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dishId = e.currentTarget.getAttribute('data-id');
                console.log('Modifica piatto:', dishId);
                editDish(dishId);
            });
        });
        
        // Pulsante elimina
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dishId = e.currentTarget.getAttribute('data-id');
                console.log('Elimina piatto:', dishId);
                deleteDish(dishId);
            });
        });
        
        // Toggle disponibilità
        document.querySelectorAll('.status-toggle input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const dishId = e.target.getAttribute('data-id');
                const isAvailable = e.target.checked;
                console.log('Cambia disponibilità piatto:', dishId, isAvailable);
                toggleDishAvailability(dishId, isAvailable);
            });
        });
    }
    
    // Aggiungi un nuovo piatto
    function addDish() {
        currentDishId = null;
        currentImageUrl = null;
        document.getElementById('modalTitle').textContent = 'Aggiungi Nuovo Piatto';
        dishForm.reset();
        document.getElementById('dishIsAvailable').checked = true;
        document.getElementById('dishOrder').value = 0;
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        dishModal.style.display = 'flex';
    }
    
    // Modifica un piatto esistente
    async function editDish(id) {
        try {
            showLoading(true);
            const data = await fetchData(`${API_BASE_URL}/${id}`);
            const dish = data.data;
            
            if (dish) {
                currentDishId = id;
                currentImageUrl = dish.image || null;
                document.getElementById('modalTitle').textContent = 'Modifica Piatto';
                
                // Compila il form con i dati del piatto
                document.getElementById('dishName').value = dish.name || '';
                document.getElementById('dishCategory').value = dish.category || 'antipasti';
                document.getElementById('dishPrice').value = dish.price || '';
                document.getElementById('dishDescription').value = dish.description || '';
                document.getElementById('dishIsAvailable').checked = dish.isAvailable !== false;
                document.getElementById('dishOrder').value = dish.order || 0;
                
                // Mostra anteprima immagine
                if (dish.image) {
                    imagePreview.src = dish.image;
                    imagePreview.style.display = 'block';
                } else {
                    imagePreview.style.display = 'none';
                    imagePreview.src = '';
                }
                
                dishModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Errore nel caricamento del piatto:', error);
            showNotification(`Errore nel caricamento del piatto: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Elimina un piatto
    async function deleteDish(id) {
        if (confirm('Sei sicuro di voler eliminare questo piatto?')) {
            try {
                showLoading(true);
                await fetchData(`${API_BASE_URL}/${id}`, {
                    method: 'DELETE'
                });
                
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
    
    // Attiva/disattiva la disponibilità di un piatto
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
    
    // Mostra una notifica
    function showNotification(message, type = 'info') {
        console.log('Notifica:', type, message);
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #4caf50;' : ''}
            ${type === 'error' ? 'background: #f44336;' : ''}
            ${type === 'info' ? 'background: #2196f3;' : ''}
        `;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">&times;</button>
        `;
        
        // Rimuovi notifiche precedenti
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        document.body.appendChild(notification);
        
        // Rimuovi la notifica dopo 5 secondi
        const removeNotification = () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        };
        
        setTimeout(removeNotification, 5000);
        
        // Chiudi la notifica al click
        notification.querySelector('.close-notification').addEventListener('click', removeNotification);
    }
    
    // Mostra/nascondi indicatore di caricamento
    function showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }
    
    // Gestione eventi
    addDishBtn.addEventListener('click', addDish);
    
    closeModal.addEventListener('click', () => {
        dishModal.style.display = 'none';
    });
    
    cancelDish.addEventListener('click', () => {
        dishModal.style.display = 'none';
    });
    
    // Chiudi il modale cliccando fuori dal contenuto
    window.addEventListener('click', (e) => {
        if (e.target === dishModal) {
            dishModal.style.display = 'none';
        }
    });
    
    // Gestione invio form
    dishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dishData = {
            name: document.getElementById('dishName').value,
            category: document.getElementById('dishCategory').value,
            price: parseFloat(document.getElementById('dishPrice').value),
            description: document.getElementById('dishDescription').value,
            isAvailable: document.getElementById('dishIsAvailable').checked,
            order: parseInt(document.getElementById('dishOrder').value) || 0
        };
        
        if (currentImageUrl) {
            dishData.image = currentImageUrl;
        }
        
        console.log('Salvataggio piatto:', dishData);
        
        try {
            showLoading(true);
            
            if (currentDishId) {
                // Aggiorna piatto esistente
                await fetchData(`${API_BASE_URL}/${currentDishId}`, {
                    method: 'PUT',
                    body: JSON.stringify(dishData)
                });
                
                showNotification('Piatto aggiornato con successo', 'success');
            } else {
                // Aggiungi nuovo piatto
                await fetchData(API_BASE_URL, {
                    method: 'POST',
                    body: JSON.stringify(dishData)
                });
                
                showNotification('Piatto aggiunto con successo', 'success');
            }
            
            // Ricarica il menu e chiudi il modale
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
    
    // Gestione ricerca
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            console.log('Ricerca:', e.target.value);
            loadMenuItems(currentCategory, e.target.value);
        }, 300);
    });
    
    // Gestione tab categorie
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.category-tab.active').classList.remove('active');
            tab.classList.add('active');
            currentCategory = tab.getAttribute('data-category');
            console.log('Categoria selezionata:', currentCategory);
            loadMenuItems(currentCategory, searchInput.value);
        });
    });
    
    // Carica il menu iniziale
    console.log('Caricamento menu iniziale...');
    loadMenuItems();
});

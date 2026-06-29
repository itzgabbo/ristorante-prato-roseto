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

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Errore nella richiesta');
        }

        return await response.json();
    } catch (error) {
        console.error('Errore nella richiesta API:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Verifica l'autenticazione
    if (!Auth.isAuthenticated()) {
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
    
    let currentDishId = null;
    let currentCategory = 'all';
    let menuItems = [];

    // Carica i piatti dal server
    async function loadMenuItems(category = 'all', searchQuery = '') {
        try {
            showLoading(true);
            
            // Costruisci l'URL con i parametri di query
            const params = new URLSearchParams();
            if (category !== 'all') params.append('category', category);
            if (searchQuery) params.append('search', searchQuery);
            
            const url = `${API_BASE_URL}?${params.toString()}`;
            const data = await fetchData(url);
            
            menuItems = data.data || [];
            renderMenuItems(menuItems);
            
            return menuItems;
        } catch (error) {
            console.error('Errore nel caricamento del menu:', error);
            showNotification('Errore nel caricamento del menu', 'error');
            return [];
        } finally {
            showLoading(false);
        }
    }
    
    // Renderizza i piatti nel DOM
    function renderMenuItems(items) {
        menuItemsContainer.innerHTML = '';
        
        if (items.length === 0) {
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
                            <input type="checkbox" ${item.isAvailable ? 'checked' : ''} data-id="${item.id}">
                            <span class="slider"></span>
                        </label>
                        <div class="menu-item-actions">
                            <button class="action-btn edit-btn" data-id="${item.id}" title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" data-id="${item.id}" title="Elimina">
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
                const dishId = parseInt(e.currentTarget.getAttribute('data-id'));
                editDish(dishId);
            });
        });
        
        // Pulsante elimina
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dishId = parseInt(e.currentTarget.getAttribute('data-id'));
                deleteDish(dishId);
            });
        });
        
        // Toggle disponibilità
        document.querySelectorAll('.status-toggle input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const dishId = parseInt(e.target.getAttribute('data-id'));
                toggleDishAvailability(dishId, e.target.checked);
            });
        });
    }
    
    // Aggiungi un nuovo piatto
    function addDish() {
        currentDishId = null;
        document.getElementById('modalTitle').textContent = 'Aggiungi Nuovo Piatto';
        dishForm.reset();
        dishModal.style.display = 'block';
        
        // Imposta i valori di default
        document.getElementById('dishIsAvailable').checked = true;
        document.getElementById('dishOrder').value = 0;
    }
    
    // Modifica un piatto esistente
    async function editDish(id) {
        try {
            showLoading(true);
            const data = await fetchData(`${API_BASE_URL}/${id}`);
            const dish = data.data;
            
            if (dish) {
                currentDishId = id;
                document.getElementById('modalTitle').textContent = 'Modifica Piatto';
                
                // Compila il form con i dati del piatto
                document.getElementById('dishName').value = dish.name || '';
                document.getElementById('dishCategory').value = dish.category || 'antipasti';
                document.getElementById('dishPrice').value = dish.price || '';
                document.getElementById('dishDescription').value = dish.description || '';
                document.getElementById('dishIsAvailable').checked = dish.isAvailable !== false;
                document.getElementById('dishOrder').value = dish.order || 0;
                
                dishModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Errore nel caricamento del piatto:', error);
            showNotification('Errore nel caricamento del piatto', 'error');
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
                showNotification(error.message || 'Errore durante l\'eliminazione del piatto', 'error');
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
            showNotification(error.message || 'Errore durante l\'aggiornamento del piatto', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // Mostra una notifica
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        // Rimuovi notifiche precedenti
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        document.body.appendChild(notification);
        
        // Mostra con animazione
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Rimuovi la notifica dopo 5 secondi
        const removeNotification = () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
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
        
        const formData = new FormData(dishForm);
        const dishData = {
            name: formData.get('name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            isAvailable: document.getElementById('dishIsAvailable').checked,
            order: parseInt(formData.get('order')) || 0
        };
        
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
            showNotification(error.message || 'Si è verificato un errore durante il salvataggio', 'error');
        } finally {
            showLoading(false);
        }
    });
    
    // Gestione ricerca
    searchInput.addEventListener('input', (e) => {
        loadMenuItems(currentCategory, e.target.value);
    });
    
    // Gestione tab categorie
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.category-tab.active').classList.remove('active');
            tab.classList.add('active');
            currentCategory = tab.getAttribute('data-category');
            loadMenuItems(currentCategory, searchInput.value);
        });
    });
    
    // Carica il menu iniziale
    loadMenuItems();
});

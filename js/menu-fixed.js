document.addEventListener('DOMContentLoaded', async () => {
    const menuContainer = document.getElementById('menu-sections');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const noItemsElement = document.getElementById('no-items-message');

    // Funzione per mostrare/nascondere il caricamento
    function showLoading(show) {
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // Funzione per mostrare/nascondere i messaggi di errore
    function showError(message) {
        console.error('Errore:', message);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        showLoading(false);
    }

    // Funzione per mostrare il messaggio "nessun piatto"
    function showNoItems() {
        if (noItemsElement) {
            noItemsElement.style.display = 'block';
        }
    }

    // Funzione per creare un elemento piatto
    function createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <h3>${item.name}</h3>
            <p class="description">${item.description || ''}</p>
            <p class="price">€${item.price.toFixed(2)}</p>
        `;
        return menuItem;
    }

    // Carica i dati del menu
    async function loadMenu() {
        try {
            showLoading(true);
            
            // Carica i dati dal file JSON locale
            const response = await fetch('../data/menu.json');
            const data = await response.json();
            const menuItems = data.dishes || [];
            
            if (menuItems.length === 0) {
                showNoItems();
                return;
            }
            
            // Raggruppa i piatti per categoria
            const itemsByCategory = {};
            menuItems.forEach(item => {
                if (!itemsByCategory[item.category]) {
                    itemsByCategory[item.category] = [];
                }
                itemsByCategory[item.category].push(item);
            });
            
            // Pulisci il contenitore
            menuContainer.innerHTML = '';
            
            // Aggiungi i piatti al menu
            Object.entries(itemsByCategory).forEach(([category, items]) => {
                const section = document.createElement('section');
                section.className = 'menu-section';
                section.id = `section-${category}`;
                section.innerHTML = `
                    <h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
                    <div class="menu-items"></div>
                `;
                
                const itemsContainer = section.querySelector('.menu-items');
                items.forEach(item => {
                    itemsContainer.appendChild(createMenuItem(item));
                });
                
                menuContainer.appendChild(section);
            });
            
        } catch (error) {
            showError('Impossibile caricare il menu. ' + error.message);
        } finally {
            showLoading(false);
        }
    }
    
    // Carica il menu quando la pagina è pronta
    loadMenu();
});

/**
 * Gestione del menu pubblico
 * Carica i piatti dal server e li visualizza nella pagina
 */

document.addEventListener('DOMContentLoaded', async function() {
    const menuContainer = document.getElementById('menu-sections');
    const categoryButtonsContainer = document.getElementById('categoryButtonsTop');
    const categoryButtonsBottom = document.getElementById('categoryButtonsBottom');

    // 1. First, always use static categories to 100% guarantee we have them
    const staticCategories = [
        { name: 'antipasti', displayName: 'Antipasti', order: 1 },
        { name: 'primi', displayName: 'Primi Piatti', order: 2 },
        { name: 'secondi', displayName: 'Secondi', order: 3 },
        { name: 'contorni', displayName: 'Contorni', order: 4 },
        { name: 'pizze', displayName: 'Pizze', order: 5 },
        { name: 'dessert', displayName: 'Dessert', order: 6 },
        { name: 'bevande', displayName: 'Bevande', order: 7 },
        { name: 'vini', displayName: 'Vini', order: 8 },
        { name: 'birre', displayName: 'Birre', order: 9 }
    ];

    // 2. Always populate both button containers RIGHT AWAY before any API calls
    if (categoryButtonsContainer) {
        categoryButtonsContainer.innerHTML = '';
        staticCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.setAttribute('data-category', category.name);
            btn.textContent = category.displayName;
            categoryButtonsContainer.appendChild(btn);
        });

        if (staticCategories.length > 0) {
            const firstBtn = categoryButtonsContainer.querySelector('.category-btn');
            if (firstBtn) firstBtn.classList.add('active');
        }
    }

    if (categoryButtonsBottom) {
        categoryButtonsBottom.innerHTML = '';
        staticCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.setAttribute('data-category', category.name);
            btn.textContent = category.displayName;
            categoryButtonsBottom.appendChild(btn);
        });

        if (staticCategories.length > 0) {
            const firstBtn = categoryButtonsBottom.querySelector('.category-btn');
            if (firstBtn) firstBtn.classList.add('active');
        }
    }

    // 3. Initialize category button listeners
    setupCategoryButtons();

    // 4. Now build menu sections
    menuContainer.innerHTML = '';
    staticCategories.forEach(category => {
        const section = document.createElement('div');
        section.className = 'menu-section';
        section.id = category.name;
        section.style.display = category.name === staticCategories[0].name ? 'block' : 'none';
        section.innerHTML = `<h2 class="section-title">${category.displayName}</h2><div class="menu-items"></div>`;
        menuContainer.appendChild(section);
    });

    try {
        showLoading(true);
        console.log('Caricamento categorie dalle API...');
        
        // Try to load categories from API, but keep static if fails
        let categories = [...staticCategories];
        try {
            const categoriesResponse = await fetch('/api/categories');
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                if (categoriesData.data && categoriesData.data.length > 0) {
                    categories = categoriesData.data;
                    categories.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));

                    // Re-populate button containers with API categories
                    if (categoryButtonsContainer) {
                        categoryButtonsContainer.innerHTML = '';
                        categories.forEach(category => {
                            const btn = document.createElement('button');
                            btn.className = 'category-btn';
                            btn.setAttribute('data-category', category.name);
                            btn.textContent = category.displayName;
                            categoryButtonsContainer.appendChild(btn);
                        });
                        if (categories.length > 0) categoryButtonsContainer.querySelector('.category-btn').classList.add('active');
                    }

                    if (categoryButtonsBottom) {
                        categoryButtonsBottom.innerHTML = '';
                        categories.forEach(category => {
                            const btn = document.createElement('button');
                            btn.className = 'category-btn';
                            btn.setAttribute('data-category', category.name);
                            btn.textContent = category.displayName;
                            categoryButtonsBottom.appendChild(btn);
                        });
                        if (categories.length > 0) categoryButtonsBottom.querySelector('.category-btn').classList.add('active');
                    }

                    // Rebuild sections
                    menuContainer.innerHTML = '';
                    categories.forEach(category => {
                        const section = document.createElement('div');
                        section.className = 'menu-section';
                        section.id = category.name;
                        section.style.display = category.name === categories[0].name ? 'block' : 'none';
                        section.innerHTML = `<h2 class="section-title">${category.displayName}</h2><div class="menu-items"></div>`;
                        menuContainer.appendChild(section);
                    });

                    setupCategoryButtons();
                }
            }
        } catch (catErr) {
            console.log('Using static categories (API categories failed):', catErr);
            categories = staticCategories;
        }

        // Load menu items
        console.log('Caricamento dati del menu...');
        const response = await fetch('/api/menu?available=true');
        if (response.ok) {
            const data = await response.json();
            const menuItems = data.data || [];
            console.log('Dati del menu caricati con successo:', menuItems.length, 'piatti');
            
            if (menuItems.length > 0) {
                const itemsByCategory = groupItemsByCategory(menuItems);
                categories.forEach(category => {
                    const section = document.getElementById(category.name);
                    if (section) {
                        const items = itemsByCategory[category.name] || [];
                        if (items.length > 0) {
                            renderMenuSection(section, items);
                        }
                    }
                });
            } else {
                showSampleData();
            }
        } else {
            throw new Error('Impossibile caricare il menu');
        }
        
    } catch (error) {
        console.error('Errore nel caricamento del menu:', error);
        showError('Errore nel caricamento, mostro dati di esempio');
        showSampleData();
    } finally {
        showLoading(false);
    }
});

/**
 * Raggruppa i piatti per categoria
 */
function groupItemsByCategory(items) {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }

        if (item.isAvailable !== false) {
            acc[item.category].push(item);
        }

        return acc;
    }, {});
}

/**
 * Renderizza una sezione del menu
 */
function renderMenuSection(sectionElement, items) {
    const itemsContainer = sectionElement.querySelector('.menu-items') || sectionElement;
    
    // Ordina i piatti per ordine e poi per nome
    items.sort((a, b) => {
        if (a.order !== b.order) {
            return (a.order || 0) - (b.order || 0);
        }
        return a.name.localeCompare(b.name);
    });
    
    // Genera l'HTML per ogni piatto
    const itemsHtml = items.map(item => `
        <div class="menu-item" data-category="${item.category}">
            ${item.image && item.showImage !== false ? `<div class="item-image" style="background-image: url('${item.image}');"></div>` : ''}
            <div class="item-info">
                <h4>${escapeHtml(item.name)}</h4>
                ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
            </div>
            <div class="item-price">
                ${item.price.toFixed(2)}€
            </div>
        </div>
    `).join('');
    
    itemsContainer.innerHTML = itemsHtml;
}

/**
 * Configura i pulsanti delle categorie
 */
function setupCategoryButtons() {
    const topButtons = document.querySelectorAll('.category-buttons:not(.category-buttons-bottom) .category-btn');
    const bottomButtons = document.querySelectorAll('.category-buttons-bottom .category-btn');
    const allButtons = document.querySelectorAll('.category-btn');

    allButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            const isBottomClick = button.closest('.category-buttons-bottom');

            // Aggiorna lo stato attivo di tutti i pulsanti (sincronizzazione)
            allButtons.forEach(btn => {
                if (btn.getAttribute('data-category') === category) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Mostra/nascondi le sezioni
            const sections = document.querySelectorAll('.menu-section');
            sections.forEach(section => {
                if (section.id === category) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });

            // Scorri fino alla sezione selezionata
            const section = document.getElementById(category);
            if (section) {
                if (isBottomClick) {
                    // Se cliccato dal basso, scrolla all'inizio della pagina
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    // Se cliccato dall'alto, scrolla alla sezione
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

/**
 * Mostra un messaggio di errore
 */
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    
    const menuContainer = document.querySelector('.menu-container') || document.body;
    menuContainer.prepend(errorContainer);
    
    // Rimuovi il messaggio dopo 5 secondi
    setTimeout(() => {
        errorContainer.remove();
    }, 5000);
}

/**
 * Mostra un messaggio quando non ci sono piatti
 */
function showNoItemsMessage() {
    const container = document.getElementById('menu-sections') || document.body;
    container.innerHTML = `
        <div class="no-items">
            <i class="fas fa-utensils"></i>
            <p>Al momento non ci sono piatti disponibili nel menu.</p>
            <p>Ritorna più tardi per scoprire le nostre novità!</p>
        </div>
    `;
}

/**
 * Mostra dati di esempio in caso di errore
 */
function showSampleData() {
    const sampleData = [
        { name: 'Bruschetta al pomodoro', description: 'Pane tostato con pomodoro fresco, aglio e basilico', price: 5.00, category: 'antipasti' },
        { name: 'Spaghetti Carbonara', description: 'Pasta con uova, guanciale, pecorino e pepe nero', price: 12.00, category: 'primi' },
        { name: 'Cotoletta alla Milanese', description: 'Cotoletta di vitello impanata con patate al forno', price: 15.00, category: 'secondi' },
        { name: 'Insalata mista', description: 'Misto di verdure fresche di stagione', price: 4.50, category: 'contorni' },
        { name: 'Margherita', description: 'Pomodoro, mozzarella, basilico fresco', price: 8.00, category: 'pizze' },
        { name: 'Tiramisù', description: 'Dolce al cucchiaio con savoiardi, caffè e mascarpone', price: 6.00, category: 'dessert' },
        { name: 'Acqua naturale', description: 'Bottiglia da 1L', price: 2.00, category: 'bevande' },
        { name: 'Chianti Classico', description: 'Vino rosso toscano, bicchiere', price: 5.00, category: 'vini' },
        { name: 'Birra alla spina', description: 'Birra chiara, media 40cl', price: 4.50, category: 'birre' }
    ];
    
    // Raggruppa i piatti per categoria
    const itemsByCategory = groupItemsByCategory(sampleData);
    
    // Popola ogni sezione del menu con i dati di esempio
    Object.keys(itemsByCategory).forEach(category => {
        const section = document.getElementById(category);
        if (section) {
            renderMenuSection(section, itemsByCategory[category]);
            section.style.display = 'block';
        }
    });
    
    // Mostra un messaggio informativo
    const menuContainer = document.querySelector('.menu-container');
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.innerHTML = `
        <p><i class="fas fa-info-circle"></i> Stai visualizzando un menu di esempio. I dati reali non sono al momento disponibili.</p>
    `;
    menuContainer.insertBefore(infoDiv, menuContainer.firstChild);
    
    // Aggiungi stile per il messaggio informativo
    const style = document.createElement('style');
    style.textContent = `
        .info-message {
            background: #e3f2fd;
            color: #0d47a1;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .info-message i {
            margin-right: 0.5rem;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Mostra/nascondi l'indicatore di caricamento
 */
function showLoading(show) {
    let loader = document.getElementById('menu-loader');
    
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'menu-loader';
        loader.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(loader);
    }
    
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Funzione di utilità per evitare XSS
 */
function escapeHtml(unsafe) {
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

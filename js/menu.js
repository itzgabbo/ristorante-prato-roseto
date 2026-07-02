document.addEventListener('DOMContentLoaded', async function() {
    const menuContainer = document.getElementById('menu-sections');
    const categoryButtonsTop = document.getElementById('category-bar-top');
    const categoryButtonsBottom = document.getElementById('category-bar-bottom');

    // 1. Static categories (fallback, no "Tutti")
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

    // HELPER: Filter out any unwanted categories (100% guarantee)
    function filterSafeCategories(categories) {
        return categories.filter(cat => {
            const lowerName = (cat.name || '').toLowerCase();
            const lowerDisplayName = (cat.displayName || '').toLowerCase();
            return !lowerName.includes('tutti') && !lowerName.includes('all') &&
                   !lowerDisplayName.includes('tutti') && !lowerDisplayName.includes('all');
        });
    }

    // HELPER: Render category buttons to a given container
    function renderCategoryButtons(container, categories) {
        if (!container) return;
        container.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.setAttribute('data-category', cat.name);
            btn.textContent = cat.displayName;
            container.appendChild(btn);
        });
        if (categories.length > 0) {
            const firstBtn = container.querySelector('.category-btn');
            if (firstBtn) firstBtn.classList.add('active');
        }
    }

    // INITIAL RENDER (BEFORE ANY API CALLS - 100% guarantee categories show up immediately)
    const safeStaticCategories = filterSafeCategories(staticCategories);
    renderCategoryButtons(categoryButtonsTop, safeStaticCategories);
    renderCategoryButtons(categoryButtonsBottom, safeStaticCategories);
    setupCategoryButtons();

    // Build initial menu sections
    menuContainer.innerHTML = '';
    safeStaticCategories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'menu-section';
        section.id = cat.name;
        section.style.display = cat.name === safeStaticCategories[0].name ? 'block' : 'none';
        section.innerHTML = `<h2 class="section-title">${cat.displayName}</h2><div class="menu-items"></div>`;
        menuContainer.appendChild(section);
    });

    try {
        showLoading(true);
        console.log('Caricamento categorie dalle API...');

        let categories = [...safeStaticCategories];
        try {
            const categoriesResponse = await fetch('/api/categories');
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                const apiCategories = categoriesData.data || [];
                if (apiCategories.length > 0) {
                    categories = filterSafeCategories(apiCategories);
                    categories.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));

                    // Re-render with API categories
                    renderCategoryButtons(categoryButtonsTop, categories);
                    renderCategoryButtons(categoryButtonsBottom, categories);

                    // Re-build sections
                    menuContainer.innerHTML = '';
                    categories.forEach(cat => {
                        const section = document.createElement('div');
                        section.className = 'menu-section';
                        section.id = cat.name;
                        section.style.display = cat.name === categories[0].name ? 'block' : 'none';
                        section.innerHTML = `<h2 class="section-title">${cat.displayName}</h2><div class="menu-items"></div>`;
                        menuContainer.appendChild(section);
                    });

                    setupCategoryButtons();
                }
            }
        } catch (catErr) {
            console.log('Using static categories:', catErr);
            categories = safeStaticCategories;
        }

        console.log('Caricamento dati del menu...');
        const response = await fetch('/api/menu?available=true');
        if (response.ok) {
            const data = await response.json();
            const menuItems = data.data || [];
            console.log('Dati del menu caricati con successo:', menuItems.length, 'piatti');

            if (menuItems.length > 0) {
                const itemsByCategory = groupItemsByCategory(menuItems);
                categories.forEach(cat => {
                    const section = document.getElementById(cat.name);
                    if (section) {
                        const items = itemsByCategory[cat.name] || [];
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

function groupItemsByCategory(items) {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        if (item.isAvailable !== false) acc[item.category].push(item);
        return acc;
    }, {});
}

function renderMenuSection(sectionElement, items) {
    const itemsContainer = sectionElement.querySelector('.menu-items') || sectionElement;
    items.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
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

function setupCategoryButtons() {
    const topButtons = document.querySelectorAll('#category-bar-top .category-btn');
    const bottomButtons = document.querySelectorAll('#category-bar-bottom .category-btn');
    const allButtons = document.querySelectorAll('.category-btn');

    allButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            allButtons.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-category') === category);
            });
            const sections = document.querySelectorAll('.menu-section');
            sections.forEach(section => {
                section.style.display = section.id === category ? 'block' : 'none';
            });
        });
    });
}

function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    const menuContainer = document.querySelector('.menu-container') || document.body;
    menuContainer.prepend(errorContainer);
    setTimeout(() => errorContainer.remove(), 5000);
}

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

    const itemsByCategory = groupItemsByCategory(sampleData);
    Object.keys(itemsByCategory).forEach(category => {
        const section = document.getElementById(category);
        if (section) {
            renderMenuSection(section, itemsByCategory[category]);
            section.style.display = 'block';
        }
    });
}

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

function escapeHtml(unsafe) {
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

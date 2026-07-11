/**
 * Gestione Tavoli - Frontend Logic
 * Sistema di gestione tavoli e comande per camerieri
 */

const TABLES_API_URL = '/api/tables';
const ORDERS_API_URL = '/api/orders';
const MENU_API_URL = '/api/menu';

let currentTable = null;
let currentOrder = null;
let allMenuItems = [];
let allCategories = [];

// API helper function
async function fetchData(url, options = {}) {
    try {
        const token = localStorage.getItem('adminToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Errore nella richiesta');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication check
document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    loadTables();
    loadMenu();
    setupEventListeners();
});

// Load tables
async function loadTables() {
    try {
        const data = await fetchData(TABLES_API_URL);
        const tables = data.data || [];
        renderTables(tables);
    } catch (error) {
        console.error('Errore nel caricamento dei tavoli:', error);
        showNotification('Errore nel caricamento dei tavoli', 'error');
    }
}

// Render tables grid
function renderTables(tables) {
    const grid = document.getElementById('tablesGrid');
    grid.innerHTML = '';
    
    if (tables.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-chair" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Nessun tavolo creato</p>
                <p>Clicca su "Crea Tavolo" per iniziare</p>
            </div>
        `;
        return;
    }
    
    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = `table-card status-${table.status}`;
        card.innerHTML = `
            <div class="table-header">
                <div class="table-name">${table.name}</div>
                <div class="table-status ${table.status}">${formatStatus(table.status)}</div>
            </div>
            <div class="table-info">
                <i class="fas fa-users"></i> ${table.capacity} coperti
            </div>
            <div class="table-actions">
                <button class="btn btn-primary" onclick="openTableDetail('${table._id}')">
                    <i class="fas fa-utensils"></i> Apri
                </button>
                <button class="btn btn-danger" onclick="deleteTable('${table._id}', '${table.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Format status
function formatStatus(status) {
    const statusMap = {
        'libero': 'Libero',
        'occupato': 'Occupato',
        'in_corso': 'In corso'
    };
    return statusMap[status] || status;
}

// Open table detail
async function openTableDetail(tableId) {
    try {
        const data = await fetchData(`${TABLES_API_URL}/${tableId}`);
        currentTable = data.data;
        
        // Load order if exists
        if (currentTable.currentOrderId) {
            const orderData = await fetchData(`${ORDERS_API_URL}/${currentTable.currentOrderId}`);
            currentOrder = orderData.data;
        } else {
            currentOrder = null;
        }
        
        renderTableDetail();
        
        document.getElementById('tablesView').style.display = 'none';
        document.getElementById('tableDetailView').classList.add('active');
    } catch (error) {
        console.error('Errore nel caricamento del tavolo:', error);
        showNotification('Errore nel caricamento del tavolo', 'error');
    }
}

// Render table detail
function renderTableDetail() {
    document.getElementById('detailTableName').textContent = currentTable.name;
    document.getElementById('detailTableCapacity').textContent = `${currentTable.capacity} persone`;
    document.getElementById('detailTableStatus').textContent = formatStatus(currentTable.status);
    
    renderOrderItems();
    renderMenuItems();
}

// Render order items
function renderOrderItems() {
    const container = document.getElementById('orderItemsList');
    container.innerHTML = '';
    
    if (!currentOrder || currentOrder.items.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">Nessun ordine</p>';
        document.getElementById('orderTotal').textContent = '€ 0.00';
        return;
    }
    
    currentOrder.items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <div class="order-item-header">
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">€ ${item.price.toFixed(2)}</div>
                </div>
                <div class="order-item-quantity">
                    <button class="quantity-btn" onclick="updateItemQuantity(${index}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateItemQuantity(${index}, ${item.quantity + 1})">+</button>
                </div>
            </div>
            <div class="order-item-notes">
                <input type="text" 
                       placeholder="Note (es. Ben cotto, Senza cipolla)" 
                       value="${item.notes || ''}" 
                       onchange="updateItemNotes(${index}, this.value)">
            </div>
        `;
        container.appendChild(div);
    });
    
    document.getElementById('orderTotal').textContent = `€ ${currentOrder.total.toFixed(2)}`;
}

// Render menu items
function renderMenuItems() {
    const container = document.getElementById('menuItemsContainer');
    container.innerHTML = '';
    
    // Group by category
    const grouped = {};
    allMenuItems.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    // Define category order
    const categoryOrder = ['bevande', 'antipasti', 'primi', 'secondi', 'contorni', 'pizze', 'dessert', 'vini', 'birre'];
    
    // Sort categories according to the defined order, with unknown categories at the end
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    
    sortedCategories.forEach(category => {
        const section = document.createElement('div');
        section.className = 'menu-section';
        section.innerHTML = `
            <h3>${formatCategory(category)}</h3>
            <div class="menu-items-grid"></div>
        `;
        
        const grid = section.querySelector('.menu-items-grid');
        grouped[category].forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'menu-item-btn';
            btn.innerHTML = `
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">€ ${item.price.toFixed(2)}</div>
            `;
            btn.onclick = () => addItemToOrder(item);
            grid.appendChild(btn);
        });
        
        container.appendChild(section);
    });
}

// Format category
function formatCategory(category) {
    const categoryMap = {
        'antipasti': 'Antipasti',
        'primi': 'Primi Piatti',
        'secondi': 'Secondi Piatti',
        'contorni': 'Contorni',
        'pizze': 'Pizze',
        'dessert': 'Dessert',
        'bevande': 'Bevande',
        'vini': 'Vini',
        'birre': 'Birre'
    };
    return categoryMap[category] || category;
}

// Load menu
async function loadMenu() {
    try {
        const data = await fetchData(MENU_API_URL);
        allMenuItems = data.data || [];
    } catch (error) {
        console.error('Errore nel caricamento del menu:', error);
    }
}

// Add item to order
async function addItemToOrder(menuItem) {
    try {
        // Create order if doesn't exist
        if (!currentOrder) {
            const orderData = await fetchData(ORDERS_API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    tableId: currentTable._id,
                    items: []
                })
            });
            currentOrder = orderData.data;

            // Update table status
            await fetchData(`${TABLES_API_URL}/${currentTable._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'in_corso',
                    currentOrderId: currentOrder._id
                })
            });
        }

        // Add item to order
        const itemData = await fetchData(`${ORDERS_API_URL}/${currentOrder._id}/items`, {
            method: 'POST',
            body: JSON.stringify({
                menuItemId: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: 1,
                isCustom: false
            })
        });

        currentOrder = itemData.data;
        renderOrderItems();
        showNotification(`${menuItem.name} aggiunto all'ordine`, 'success');
    } catch (error) {
        console.error('Errore nell\'aggiunta dell\'item:', error);
        showNotification('Errore nell\'aggiunta dell\'item', 'error');
    }
}

// Add custom dish to order
async function addCustomDish(e) {
    e.preventDefault();
    
    const name = document.getElementById('customDishName').value;
    const price = parseFloat(document.getElementById('customDishPrice').value);
    const quantity = parseInt(document.getElementById('customDishQuantity').value) || 1;
    
    try {
        // Create order if doesn't exist
        if (!currentOrder) {
            const orderData = await fetchData(ORDERS_API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    tableId: currentTable._id,
                    items: []
                })
            });
            currentOrder = orderData.data;
            
            // Update table status
            await fetchData(`${TABLES_API_URL}/${currentTable._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'in_corso',
                    currentOrderId: currentOrder._id
                })
            });
        }
        
        // Add custom dish to order
        const itemData = await fetchData(`${ORDERS_API_URL}/${currentOrder._id}/items`, {
            method: 'POST',
            body: JSON.stringify({
                menuItemId: null,
                name: name,
                price: price,
                quantity: quantity,
                isCustom: true
            })
        });
        
        currentOrder = itemData.data;
        renderOrderItems();
        showNotification(`${name} aggiunto all'ordine`, 'success');
        
        // Close modal and reset form
        document.getElementById('customDishModal').classList.remove('active');
        document.getElementById('customDishForm').reset();
    } catch (error) {
        console.error('Errore nell\'aggiunta del piatto personalizzato:', error);
        showNotification('Errore nell\'aggiunta del piatto personalizzato', 'error');
    }
}

// Update item quantity
async function updateItemQuantity(itemIndex, newQuantity) {
    try {
        const item = currentOrder.items[itemIndex];
        if (!item) {
            showNotification('Item non trovato', 'error');
            return;
        }

        let itemData;
        if (newQuantity <= 0) {
            // Remove item
            itemData = await fetchData(`${ORDERS_API_URL}/${currentOrder._id}/items/${item._id}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: 0 })
            });
        } else {
            // Update quantity
            itemData = await fetchData(`${ORDERS_API_URL}/${currentOrder._id}/items/${item._id}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: newQuantity })
            });
        }
        
        if (itemData && itemData.data) {
            currentOrder = itemData.data;
            renderOrderItems();
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento della quantità:', error);
        showNotification('Errore nell\'aggiornamento della quantità', 'error');
    }
}

// Update item notes
async function updateItemNotes(itemIndex, notes) {
    try {
        const item = currentOrder.items[itemIndex];
        if (!item) {
            showNotification('Item non trovato', 'error');
            return;
        }

        const itemData = await fetchData(`${ORDERS_API_URL}/${currentOrder._id}/items/${item._id}`, {
            method: 'PUT',
            body: JSON.stringify({ notes: notes })
        });
        
        if (itemData && itemData.data) {
            currentOrder = itemData.data;
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento delle note:', error);
        showNotification('Errore nell\'aggiornamento delle note', 'error');
    }
}

// Print receipt
function printReceipt() {
    if (!currentOrder || currentOrder.items.length === 0) {
        showNotification('Nessun ordine da stampare', 'error');
        return;
    }
    
    const receiptContent = document.getElementById('receiptContent');
    document.getElementById('receiptCapacity').textContent = currentTable.capacity;
    document.getElementById('receiptDate').textContent = new Date().toLocaleString('it-IT');
    
    const receiptItems = document.getElementById('receiptItems');
    receiptItems.innerHTML = '';
    
    // Add cover charge FIRST (without bold)
    const coverChargeTotal = currentTable.coverCharge * currentTable.capacity;
    if (coverChargeTotal > 0) {
        const coverDiv = document.createElement('div');
        coverDiv.className = 'receipt-item';
        coverDiv.innerHTML = `
            <span>Coperto x${currentTable.capacity}</span>
            <span>€ ${coverChargeTotal.toFixed(2)}</span>
        `;
        receiptItems.appendChild(coverDiv);
    }
    
    // Add order items
    currentOrder.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'receipt-item';
        let itemName = `${item.quantity}x ${item.name}`;
        if (item.notes) {
            itemName += ` (${item.notes})`;
        }
        div.innerHTML = `
            <span>${itemName}</span>
            <span>€ ${(item.price * item.quantity).toFixed(2)}</span>
        `;
        receiptItems.appendChild(div);
    });
    
    // Calculate total with cover charge
    const totalWithCover = currentOrder.total + coverChargeTotal;
    document.getElementById('receiptTotal').textContent = `€ ${totalWithCover.toFixed(2)}`;
    
    receiptContent.classList.add('active');
    document.getElementById('receiptModal').classList.add('active');
}

// Close table
async function closeTable() {
    if (!currentOrder) {
        showNotification('Nessun ordine attivo', 'error');
        return;
    }
    
    if (!confirm('Sei sicuro di voler chiudere il tavolo?')) {
        return;
    }
    
    try {
        await fetchData(`${ORDERS_API_URL}/${currentOrder._id}/close`, {
            method: 'PUT'
        });
        
        showNotification('Tavolo chiuso con successo', 'success');
        currentOrder = null;
        currentTable = null;
        
        document.getElementById('tableDetailView').classList.remove('active');
        document.getElementById('tablesView').style.display = 'block';
        
        loadTables();
    } catch (error) {
        console.error('Errore nella chiusura del tavolo:', error);
        showNotification('Errore nella chiusura del tavolo', 'error');
    }
}

// Create table
async function createTable(e) {
    e.preventDefault();
    
    const name = document.getElementById('tableName').value;
    const capacity = parseInt(document.getElementById('tableCapacity').value);
    
    try {
        await fetchData(TABLES_API_URL, {
            method: 'POST',
            body: JSON.stringify({ name, capacity })
        });
        
        showNotification('Tavolo creato con successo', 'success');
        document.getElementById('createTableModal').classList.remove('active');
        document.getElementById('createTableForm').reset();
        loadTables();
    } catch (error) {
        console.error('Errore nella creazione del tavolo:', error);
        showNotification('Errore nella creazione del tavolo', 'error');
    }
}

// Delete table
async function deleteTable(tableId, tableName) {
    if (!confirm(`Sei sicuro di voler eliminare il tavolo "${tableName}"?`)) {
        return;
    }
    
    try {
        await fetchData(`${TABLES_API_URL}/${tableId}`, {
            method: 'DELETE'
        });
        
        showNotification('Tavolo eliminato con successo', 'success');
        loadTables();
    } catch (error) {
        console.error('Errore nell\'eliminazione del tavolo:', error);
        showNotification('Errore nell\'eliminazione del tavolo', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Create table modal
    document.getElementById('createTableBtn').addEventListener('click', () => {
        document.getElementById('createTableModal').classList.add('active');
    });
    
    document.getElementById('closeCreateModal').addEventListener('click', () => {
        document.getElementById('createTableModal').classList.remove('active');
    });
    
    document.getElementById('cancelCreateTable').addEventListener('click', () => {
        document.getElementById('createTableModal').classList.remove('active');
    });
    
    document.getElementById('createTableForm').addEventListener('submit', createTable);
    
    // Back to tables
    document.getElementById('backToTablesBtn').addEventListener('click', () => {
        currentTable = null;
        currentOrder = null;
        document.getElementById('tableDetailView').classList.remove('active');
        document.getElementById('tablesView').style.display = 'block';
    });
    
    // Back to dashboard
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Print receipt
    document.getElementById('printReceiptBtn').addEventListener('click', printReceipt);
    
    // Receipt modal
    document.getElementById('closeReceiptModal').addEventListener('click', () => {
        document.getElementById('receiptModal').classList.remove('active');
        document.getElementById('receiptContent').classList.remove('active');
    });
    
    document.getElementById('cancelReceipt').addEventListener('click', () => {
        document.getElementById('receiptModal').classList.remove('active');
        document.getElementById('receiptContent').classList.remove('active');
    });
    
    document.getElementById('confirmPrint').addEventListener('click', () => {
        window.print();
    });
    
    // Close table
    document.getElementById('closeTableBtn').addEventListener('click', closeTable);
    
    // Custom dish modal
    document.getElementById('addCustomDishBtn').addEventListener('click', () => {
        document.getElementById('customDishModal').classList.add('active');
    });
    
    document.getElementById('closeCustomDishModal').addEventListener('click', () => {
        document.getElementById('customDishModal').classList.remove('active');
    });
    
    document.getElementById('cancelCustomDish').addEventListener('click', () => {
        document.getElementById('customDishModal').classList.remove('active');
    });
    
    document.getElementById('customDishForm').addEventListener('submit', addCustomDish);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
            document.getElementById('receiptContent').classList.remove('active');
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #4caf50;' : ''}
        ${type === 'error' ? 'background: #f44336;' : ''}
        ${type === 'info' ? 'background: #2196f3;' : ''}
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

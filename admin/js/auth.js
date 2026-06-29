/**
 * Gestione dell'autenticazione e del menu per il pannello di amministrazione
 */

class Auth {
    // Verifica se l'utente è autenticato
    static isAuthenticated() {
        const token = localStorage.getItem('adminToken');
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp;
            if (!exp) return false;
            return exp * 1000 > Date.now();
        } catch (e) {
            return false;
        }
    }

    // Reindirizza alla pagina di login se non autenticato
    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    static async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw {
                success: false,
                message: data.message || 'Credenziali non valide. Riprova.',
            };
        }

        localStorage.setItem('adminToken', data.token);

        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 'dashboard.html';
        sessionStorage.removeItem('redirectAfterLogin');

        return {
            success: true,
            token: data.token,
            user: data.user,
            redirectTo,
        };
    }

    // Esegui il logout
    static logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }

    // Ottieni il token
    static getToken() {
        return localStorage.getItem('adminToken');
    }

    // Ottieni i dati dell'utente dal token
    static getUserData() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                email: payload.email,
                role: payload.role,
                exp: new Date(payload.exp)
            };
        } catch (e) {
            return null;
        }
    }

    // Verifica se l'utente è un amministratore
    static isAdmin() {
        const user = this.getUserData();
        return user && user.role === 'admin';
    }

    // Inizializza il menu con dati di esempio se non esiste
    static initializeMenu() {
        if (!localStorage.getItem('menuItems')) {
            const defaultMenu = [
                {
                    id: 1,
                    name: 'Bruschetta al Pomodoro',
                    category: 'antipasti',
                    price: 5.50,
                    description: 'Pane tostato con pomodoro fresco, aglio e basilico',
                    image: '../piatto.jpg',
                    isAvailable: true,
                    order: 1
                },
                {
                    id: 2,
                    name: 'Spaghetti Carbonara',
                    category: 'primi',
                    price: 12.00,
                    description: 'Spaghetti con uova, guanciale, pecorino e pepe nero',
                    image: '../piatto.jpg',
                    isAvailable: true,
                    order: 1
                },
                {
                    id: 3,
                    name: 'Tiramisù',
                    category: 'dessert',
                    price: 6.50,
                    description: 'Dolce al cucchiaio con savoiardi, caffè, mascarpone e cacao',
                    image: '../piatto.jpg',
                    isAvailable: true,
                    order: 1
                }
            ];
            
            localStorage.setItem('menuItems', JSON.stringify(defaultMenu));
        }
    }

    // Gestione del menu
    static getMenuItems() {
        const items = localStorage.getItem('menuItems');
        return items ? JSON.parse(items) : [];
    }

    static saveMenuItems(items) {
        localStorage.setItem('menuItems', JSON.stringify(items));
    }

    static addMenuItem(item) {
        const items = this.getMenuItems();
        const newItem = {
            ...item,
            id: Date.now(),
            isAvailable: true,
            order: items.length + 1
        };
        items.push(newItem);
        this.saveMenuItems(items);
        return newItem;
    }

    static updateMenuItem(id, updates) {
        const items = this.getMenuItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.saveMenuItems(items);
            return items[index];
        }
        return null;
    }

    static deleteMenuItem(id) {
        const items = this.getMenuItems();
        const filteredItems = items.filter(item => item.id !== id);
        this.saveMenuItems(filteredItems);
        return filteredItems.length !== items.length;
    }
}

// Aggiungi l'evento di logout a tutti i pulsanti con id="logout"
document.addEventListener('DOMContentLoaded', function() {
    // Gestione del logout
    const logoutButtons = document.querySelectorAll('#logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            Auth.logout();
        });
    });

    // Controlla se siamo nella pagina di login
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const isAuthenticated = Auth.isAuthenticated();

    // Se siamo nella pagina di login ma siamo già autenticati, reindirizziamo alla dashboard
    if (isLoginPage && isAuthenticated) {
        // Usiamo replace invece di href per evitare di inserire la pagina di login nella cronologia
        window.location.replace('dashboard.html');
    } 
    // Se non siamo nella pagina di login e non siamo autenticati, reindirizziamo al login
    else if (!isLoginPage && !isAuthenticated) {
        // Salviamo la pagina corrente per il reindirizzamento dopo il login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.replace('login.html');
    }
    // Se siamo nella dashboard e non c'è un token valido, reindirizziamo al login
    else if (window.location.pathname.endsWith('dashboard.html') && !isAuthenticated) {
        window.location.replace('login.html');
    }
    // Se siamo autenticati e stiamo cercando di accedere alla pagina di login, reindirizziamo alla dashboard
    else if (isLoginPage && isAuthenticated) {
        window.location.replace('dashboard.html');
    }
});

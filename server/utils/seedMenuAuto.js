const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

const defaultCategories = [
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

const sampleDishes = [
    {
        name: 'Bruschetta al Pomodoro',
        description: 'Pane tostato con pomodoro fresco, aglio e basilico',
        price: 5.50,
        category: 'antipasti',
        order: 1
    },
    {
        name: 'Spaghetti Carbonara',
        description: 'Pasta con uova, guanciale, pecorino e pepe nero',
        price: 12.00,
        category: 'primi',
        order: 1
    },
    {
        name: 'Tiramisù',
        description: 'Dolce al cucchiaio con savoiardi, caffè e mascarpone',
        price: 6.00,
        category: 'dessert',
        order: 1
    }
];

const seedMenuAuto = async () => {
    try {
        // Controlla e crea categorie se non esistono
        const existingCategories = await Category.countDocuments();
        if (existingCategories === 0) {
            await Category.create(defaultCategories);
            console.log('Categorie di default create con successo');
        }

        // Controlla se ci sono già piatti nel database
        const existingDishes = await MenuItem.countDocuments();
        if (existingDishes > 0) {
            console.log('Menu già presente nel database, skip seeding piatti');
            return;
        }

        // Aggiungi i piatti di esempio
        await MenuItem.create(sampleDishes);
        console.log('Menu di esempio creato con successo');
    } catch (error) {
        console.error('Errore durante il seeding automatico del menu:', error);
    }
};

module.exports = seedMenuAuto;

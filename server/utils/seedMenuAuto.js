const MenuItem = require('../models/MenuItem');

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
        // Controlla se ci sono già piatti nel database
        const existingDishes = await MenuItem.countDocuments();
        if (existingDishes > 0) {
            console.log('Menu già presente nel database, skip seeding');
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

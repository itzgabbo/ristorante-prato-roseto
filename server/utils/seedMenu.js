const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../config/config.env') });
dotenv.config();

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
    name: 'Cotoletta alla Milanese',
    description: 'Cotoletta di vitello impanata con patate al forno',
    price: 15.00,
    category: 'secondi',
    order: 1
  },
  {
    name: 'Insalata Mista',
    description: 'Misto di verdure fresche di stagione',
    price: 4.50,
    category: 'contorni',
    order: 1
  },
  {
    name: 'Margherita',
    description: 'Pomodoro, mozzarella, basilico fresco',
    price: 8.00,
    category: 'pizze',
    order: 1
  },
  {
    name: 'Tiramisù',
    description: 'Dolce al cucchiaio con savoiardi, caffè e mascarpone',
    price: 6.00,
    category: 'dessert',
    order: 1
  },
  {
    name: 'Acqua Naturale',
    description: 'Bottiglia da 1L',
    price: 2.00,
    category: 'bevande',
    order: 1
  },
  {
    name: 'Chianti Classico',
    description: 'Vino rosso toscano, bicchiere',
    price: 5.00,
    category: 'vini',
    order: 1
  },
  {
    name: 'Birra alla Spina',
    description: 'Birra chiara, media 40cl',
    price: 4.50,
    category: 'birre',
    order: 1
  }
];

const seedMenu = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ristorante';
    await mongoose.connect(mongoURI);
    console.log('Connesso a MongoDB');

    // Rimuovi piatti esistenti
    await MenuItem.deleteMany({});
    console.log('Piatti esistenti rimossi');

    // Aggiungi piatti di esempio
    const createdDishes = await MenuItem.create(sampleDishes);
    console.log('Piatti di esempio aggiunti con successo:', createdDishes.length);

    process.exit(0);
  } catch (error) {
    console.error('Errore durante il seeding del menu:', error);
    process.exit(1);
  }
};

seedMenu();

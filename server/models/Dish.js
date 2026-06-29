const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Inserisci il nome del piatto'],
    trim: true,
    maxlength: [100, 'Il nome non può superare i 100 caratteri']
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [500, 'La descrizione non può superare i 500 caratteri']
  },
  price: {
    type: Number,
    required: [true, 'Inserisci il prezzo del piatto'],
    min: [0, 'Il prezzo non può essere negativo']
  },
  category: {
    type: String,
    required: [true, 'Seleziona una categoria'],
    enum: {
      values: [
        'antipasti',
        'primi',
        'secondi',
        'contorni',
        'pizze',
        'dessert',
        'bevande',
        'vini',
        'birre'
      ],
      message: 'Seleziona una categoria valida'
    }
  },
  isDailySpecial: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: 'default-dish.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Crea un indice per le ricerche testuali
// dishSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Dish', dishSchema);

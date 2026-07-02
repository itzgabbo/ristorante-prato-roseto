const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Inserisci il nome del piatto'],
        trim: true,
        maxlength: [100, 'Il nome non può superare i 100 caratteri']
    },
    description: {
        type: String,
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
        required: [true, 'Seleziona una categoria per il piatto'],
        trim: true
    },
    image: {
        type: String,
        default: 'piatto.jpg'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    showImage: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Aggiungi indici per migliorare le prestazioni delle query
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);

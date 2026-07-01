const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Inserisci il nome della categoria'],
        trim: true,
        unique: true,
        maxlength: [50, 'Il nome della categoria non può superare i 50 caratteri']
    },
    displayName: {
        type: String,
        required: [true, 'Inserisci il nome visualizzato della categoria'],
        trim: true,
        maxlength: [50, 'Il nome visualizzato non può superare i 50 caratteri']
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

// Aggiungi indice per ordinamento
categorySchema.index({ order: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);

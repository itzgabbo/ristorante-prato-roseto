const mongoose = require('mongoose');

const subheadingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Inserisci il nome del divisore'],
        trim: true,
        maxlength: [100, 'Il nome non può superare i 100 caratteri']
    },
    category: {
        type: String,
        required: [true, 'Seleziona una categoria per il divisore'],
        trim: true
    },
    order: {
        type: Number,
        required: [true, 'Inserisci il valore di ordinamento'],
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indici per query veloci
subheadingSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('Subheading', subheadingSchema);

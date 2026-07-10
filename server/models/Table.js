const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Inserisci il nome del tavolo'],
        trim: true,
        maxlength: [50, 'Il nome non può superare i 50 caratteri']
    },
    capacity: {
        type: Number,
        required: [true, 'Inserisci il numero di coperti'],
        min: [1, 'Il numero di coperti deve essere almeno 1'],
        max: [50, 'Il numero di coperti non può superare 50']
    },
    status: {
        type: String,
        enum: ['libero', 'occupato', 'in_corso'],
        default: 'libero'
    },
    currentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
tableSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Table', tableSchema);

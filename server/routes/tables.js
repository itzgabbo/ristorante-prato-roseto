const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Table = require('../models/Table');
const Order = require('../models/Order');

// @desc    Ottieni tutti i tavoli
// @route   GET /api/tables
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const tables = await Table.find().sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            count: tables.length,
            data: tables
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero dei tavoli',
            error: err.message
        });
    }
});

// @desc    Ottieni un singolo tavolo
// @route   GET /api/tables/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const table = await Table.findById(req.params.id).populate('currentOrderId');
        
        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Tavolo non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: table
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero del tavolo'
        });
    }
});

// @desc    Crea un nuovo tavolo
// @route   POST /api/tables
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, capacity } = req.body;
        
        const table = await Table.create({
            name,
            capacity
        });
        
        res.status(201).json({
            success: true,
            data: table
        });
    } catch (err) {
        console.error(err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Errore di validazione',
                errors: messages
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Errore del server durante la creazione del tavolo'
        });
    }
});

// @desc    Aggiorna un tavolo
// @route   PUT /api/tables/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, capacity, status, currentOrderId } = req.body;
        
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            { name, capacity, status, currentOrderId },
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Tavolo non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: table
        });
    } catch (err) {
        console.error(err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Errore di validazione',
                errors: messages
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'aggiornamento del tavolo'
        });
    }
});

// @desc    Elimina un tavolo
// @route   DELETE /api/tables/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);
        
        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Tavolo non trovato'
            });
        }
        
        // Elimina anche l'ordine associato se esiste
        if (table.currentOrderId) {
            await Order.findByIdAndDelete(table.currentOrderId);
        }
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'eliminazione del tavolo'
        });
    }
});

module.exports = router;

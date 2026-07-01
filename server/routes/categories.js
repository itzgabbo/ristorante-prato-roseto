const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// @desc    Ottieni tutte le categorie
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1, name: 1 });
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero delle categorie',
            error: err.message
        });
    }
});

// @desc    Crea una nuova categoria
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({
            success: true,
            data: category
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
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Categoria già esistente!'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Errore del server durante la creazione della categoria'
        });
    }
});

// @desc    Aggiorna una categoria
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoria non trovata'
            });
        }
        res.status(200).json({
            success: true,
            data: category
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
            message: 'Errore del server durante l\'aggiornamento della categoria'
        });
    }
});

// @desc    Elimina una categoria
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoria non trovata'
            });
        }
        
        // Sposta i piatti in questa categoria a "nessuna" o li eliminiamo?
        // Per sicurezza, chiediamo conferma ma per adesso, non eliminiamo i piatti
        res.status(200).json({
            success: true,
            data: {
                message: 'Categoria eliminata con successo',
                affectedDishes: await MenuItem.countDocuments({ category: category.name })
            }
        });
        
        // Poi eliminiamo la categoria
        await Category.findByIdAndDelete(req.params.id);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'eliminazione della categoria'
        });
    }
});

module.exports = router;

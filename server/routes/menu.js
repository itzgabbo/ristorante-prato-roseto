const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');

// @desc    Ottieni tutti i piatti del menu
// @route   GET /api/menu
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, search, available } = req.query;
        
        // Filtri di base
        const query = {};
        
        // Filtro per categoria
        if (category) {
            query.category = category;
        }
        
        // Filtro per disponibilità
        if (available === 'true') {
            query.isAvailable = true;
        }
        
        // Ricerca testuale
        if (search) {
            query.$text = { $search: search };
        }
        
        // Esegui la query
        const menuItems = await MenuItem.find(query)
            .sort({ order: 1, name: 1 });
            
        res.status(200).json({
            success: true,
            count: menuItems.length,
            data: menuItems
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero del menu'
        });
    }
});

// @desc    Ottieni un singolo piatto
// @route   GET /api/menu/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Piatto non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: menuItem
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero del piatto'
        });
    }
});

// @desc    Crea un nuovo piatto
// @route   POST /api/menu
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const menuItem = await MenuItem.create(req.body);
        
        res.status(201).json({
            success: true,
            data: menuItem
        });
    } catch (err) {
        console.error(err);
        
        // Gestisci errori di validazione
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
            message: 'Errore del server durante la creazione del piatto'
        });
    }
});

// @desc    Aggiorna un piatto esistente
// @route   PUT /api/menu/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Piatto non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: menuItem
        });
    } catch (err) {
        console.error(err);
        
        // Gestisci errori di validazione
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
            message: 'Errore del server durante l\'aggiornamento del piatto'
        });
    }
});

// @desc    Elimina un piatto
// @route   DELETE /api/menu/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Piatto non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'eliminazione del piatto'
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Subheading = require('../models/Subheading');
const MenuItem = require('../models/MenuItem');

// @desc    Ottieni tutti i divisori (per categoria)
// @route   GET /api/subheadings
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        
        const query = {};
        if (category) {
            query.category = category;
        }
        
        const subheadings = await Subheading.find(query).sort({ order: 1 });
        
        res.status(200).json({
            success: true,
            count: subheadings.length,
            data: subheadings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero dei divisori',
            error: err.message
        });
    }
});

// @desc    Ottieni un singolo divisore
// @route   GET /api/subheadings/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const subheading = await Subheading.findById(req.params.id);
        
        if (!subheading) {
            return res.status(404).json({
                success: false,
                message: 'Divisore non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: subheading
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero del divisore'
        });
    }
});

// @desc    Crea un nuovo divisore
// @route   POST /api/subheadings
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, category, afterItemId, beforeItemId } = req.body;
        
        // Ottieni tutti i piatti ordinati per la categoria selezionata
        const menuItems = await MenuItem.find({ category }).sort({ order: 1, name: 1 });
        
        // Calcola il valore di order per il nuovo divisore
        let newOrder = 0;
        
        if (menuItems.length === 0) {
            // Nessun piatto: inizia da 0
            newOrder = 0;
        } else if (afterItemId) {
            // Inserisci dopo un piatto specifico
            const afterItem = menuItems.find(item => item._id.toString() === afterItemId);
            if (afterItem) {
                // Trova l'indice per trovare il prossimo piatto
                const afterIndex = menuItems.findIndex(item => item._id.toString() === afterItemId);
                if (afterIndex < menuItems.length - 1) {
                    const nextItem = menuItems[afterIndex + 1];
                    newOrder = (afterItem.order + nextItem.order) / 2; // Valore decimale in mezzo
                } else {
                    newOrder = afterItem.order + 1;
                }
            }
        } else if (beforeItemId) {
            // Inserisci prima di un piatto specifico
            const beforeItem = menuItems.find(item => item._id.toString() === beforeItemId);
            if (beforeItem) {
                const beforeIndex = menuItems.findIndex(item => item._id.toString() === beforeItemId);
                if (beforeIndex > 0) {
                    const prevItem = menuItems[beforeIndex - 1];
                    newOrder = (prevItem.order + beforeItem.order) / 2;
                } else {
                    newOrder = beforeItem.order - 1;
                }
            }
        } else {
            // Se non sono specificati, aggiungi alla fine
            newOrder = menuItems.length > 0 ? menuItems[menuItems.length - 1].order + 1 : 0;
        }
        
        const subheading = await Subheading.create({
            name,
            category,
            order: newOrder
        });
        
        res.status(201).json({
            success: true,
            data: subheading
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
            message: 'Errore del server durante la creazione del divisore'
        });
    }
});

// @desc    Aggiorna un divisore esistente
// @route   PUT /api/subheadings/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, category, afterItemId, beforeItemId } = req.body;
        let updateData = { name };
        
        if (category) {
            updateData.category = category;
        }
        
        // Se sono cambiati afterItemId o beforeItemId, ricalcola order
        if (afterItemId || beforeItemId) {
            const categoryToUse = category || (await Subheading.findById(req.params.id)).category;
            const menuItems = await MenuItem.find({ category: categoryToUse }).sort({ order: 1, name: 1 });
            
            let newOrder = 0;
            
            if (menuItems.length === 0) {
                newOrder = 0;
            } else if (afterItemId) {
                const afterItem = menuItems.find(item => item._id.toString() === afterItemId);
                if (afterItem) {
                    const afterIndex = menuItems.findIndex(item => item._id.toString() === afterItemId);
                    if (afterIndex < menuItems.length - 1) {
                        const nextItem = menuItems[afterIndex + 1];
                        newOrder = (afterItem.order + nextItem.order) / 2;
                    } else {
                        newOrder = afterItem.order + 1;
                    }
                }
            } else if (beforeItemId) {
                const beforeItem = menuItems.find(item => item._id.toString() === beforeItemId);
                if (beforeItem) {
                    const beforeIndex = menuItems.findIndex(item => item._id.toString() === beforeItemId);
                    if (beforeIndex > 0) {
                        const prevItem = menuItems[beforeIndex - 1];
                        newOrder = (prevItem.order + beforeItem.order) / 2;
                    } else {
                        newOrder = beforeItem.order - 1;
                    }
                }
            }
            
            updateData.order = newOrder;
        }
        
        const subheading = await Subheading.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!subheading) {
            return res.status(404).json({
                success: false,
                message: 'Divisore non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: subheading
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
            message: 'Errore del server durante l\'aggiornamento del divisore'
        });
    }
});

// @desc    Elimina un divisore
// @route   DELETE /api/subheadings/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const subheading = await Subheading.findByIdAndDelete(req.params.id);
        
        if (!subheading) {
            return res.status(404).json({
                success: false,
                message: 'Divisore non trovato'
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
            message: 'Errore del server durante l\'eliminazione del divisore'
        });
    }
});

module.exports = router;

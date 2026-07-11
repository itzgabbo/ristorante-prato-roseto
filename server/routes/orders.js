const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Table = require('../models/Table');

// @desc    Ottieni tutti gli ordini
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { tableId } = req.query;
        const query = {};
        if (tableId) {
            query.tableId = tableId;
        }
        
        const orders = await Order.find(query).sort({ createdAt: -1 }).populate('tableId');
        
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero degli ordini',
            error: err.message
        });
    }
});

// @desc    Ottieni un singolo ordine
// @route   GET /api/orders/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('tableId');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante il recupero dell\'ordine'
        });
    }
});

// @desc    Crea un nuovo ordine
// @route   POST /api/orders
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { tableId, items } = req.body;
        
        const order = await Order.create({
            tableId,
            items: items || []
        });
        
        // Aggiorna il tavolo con l'ID dell'ordine
        await Table.findByIdAndUpdate(tableId, {
            currentOrderId: order._id,
            status: 'occupato'
        });
        
        res.status(201).json({
            success: true,
            data: order
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
            message: 'Errore del server durante la creazione dell\'ordine'
        });
    }
});

// @desc    Aggiorna un ordine
// @route   PUT /api/orders/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { items, status } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { items, status },
            {
                new: true,
                runValidators: true
            }
        ).populate('tableId');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }
        
        res.status(200).json({
            success: true,
            data: order
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
            message: 'Errore del server durante l\'aggiornamento dell\'ordine'
        });
    }
});

// @desc    Aggiungi un item all'ordine
// @route   POST /api/orders/:id/items
// @access  Private/Admin
router.post('/:id/items', protect, authorize('admin'), async (req, res) => {
    try {
        const { menuItemId, name, price, quantity, notes, isCustom } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }
        
        // Controlla se l'item esiste già (solo per non-custom items)
        if (!isCustom && menuItemId) {
            const existingItemIndex = order.items.findIndex(
                item => item.menuItemId && item.menuItemId.toString() === menuItemId
            );
            
            if (existingItemIndex > -1) {
                // Aggiorna la quantità
                order.items[existingItemIndex].quantity += quantity || 1;
                order.status = 'in_corso';
                await order.save();
                return res.status(200).json({
                    success: true,
                    data: order
                });
            }
        }
        
        // Aggiungi nuovo item
        order.items.push({
            menuItemId: menuItemId || null,
            name,
            price,
            quantity: quantity || 1,
            notes: notes || '',
            isCustom: isCustom || false
        });
        
        order.status = 'in_corso';
        await order.save();
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'aggiunta dell\'item'
        });
    }
});

// @desc    Rimuovi o aggiorna un item dell'ordine
// @route   PUT /api/orders/:id/items/:itemId
// @access  Private/Admin
router.put('/:id/items/:itemId', protect, authorize('admin'), async (req, res) => {
    try {
        const { quantity, notes } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }
        
        const itemIndex = order.items.findIndex(
            item => item._id.toString() === itemId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item non trovato'
            });
        }
        
        if (quantity <= 0) {
            // Rimuovi l'item
            order.items.splice(itemIndex, 1);
        } else {
            // Aggiorna la quantità e le note
            order.items[itemIndex].quantity = quantity;
            if (notes !== undefined) {
                order.items[itemIndex].notes = notes;
            }
        }
        
        await order.save();
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'aggiornamento dell\'item'
        });
    }
});

// @desc    Chiudi un ordine
// @route   PUT /api/orders/:id/close
// @access  Private/Admin
router.put('/:id/close', protect, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: 'chiuso',
                closedAt: Date.now()
            },
            { new: true }
        ).populate('tableId');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }
        
        // Libera il tavolo
        await Table.findByIdAndUpdate(order.tableId._id, {
            status: 'libero',
            currentOrderId: null
        });
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante la chiusura dell\'ordine'
        });
    }
});

// @desc    Elimina un ordine
// @route   DELETE /api/orders/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }
        
        // Libera il tavolo associato
        await Table.findByIdAndUpdate(order.tableId, {
            status: 'libero',
            currentOrderId: null
        });
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'eliminazione dell\'ordine'
        });
    }
});

module.exports = router;

const Dish = require('../models/Dish');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Ottieni tutti i piatti
// @route   GET /api/v1/dishes
// @access  Pubblico
exports.getDishes = async (req, res, next) => {
  try {
    // Filtri di ricerca
  const { category, isDailySpecial, isAvailable, search } = req.query;
  const query = {};

  // Filtro per categoria
  if (category) {
    query.category = category;
  }

  // Filtro per piatto del giorno
  if (isDailySpecial) {
    query.isDailySpecial = isDailySpecial === 'true';
  }

  // Filtro per disponibilità
  if (isAvailable) {
    query.isAvailable = isAvailable === 'true';
  }

  // Ricerca testuale
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const dishes = await Dish.find(query).sort({ category: 1, name: 1 });
  
  res.status(200).json({
    success: true,
    count: dishes.length,
    data: dishes
  });
  } catch (err) {
    next(err);
  }
};

// @desc    Ottieni un singolo piatto
// @route   GET /api/v1/dishes/:id
// @access  Pubblico
exports.getDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return next(
        new ErrorResponse(`Piatto non trovato con id ${req.params.id}`, 404)
      );
    }
    
    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Crea un nuovo piatto
// @route   POST /api/v1/dishes
// @access  Privato/Admin
exports.createDish = async (req, res, next) => {
  try {
    // Aggiungi l'utente che ha creato il piatto
    req.body.user = req.user.id;
    
    const dish = await Dish.create(req.body);
    
    res.status(201).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Aggiorna un piatto
// @route   PUT /api/v1/dishes/:id
// @access  Privato/Admin
exports.updateDish = async (req, res, next) => {
  try {
    let dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return next(
        new ErrorResponse(`Piatto non trovato con id ${req.params.id}`, 404)
      );
    }
    
    // Verifica che l'utente sia il proprietario o un admin
    if (dish.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`Non autorizzato ad aggiornare questo piatto`, 401)
      );
    }
    
    dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Elimina un piatto
// @route   DELETE /api/v1/dishes/:id
// @access  Privato/Admin
exports.deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return next(
        new ErrorResponse(`Piatto non trovato con id ${req.params.id}`, 404)
      );
    }
    
    // Verifica che l'utente sia il proprietario o un admin
    if (dish.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(`Non autorizzato a eliminare questo piatto`, 401)
      );
    }
    
    await dish.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Imposta un piatto come piatto del giorno
// @route   PUT /api/v1/dishes/:id/set-daily-special
// @access  Privato/Admin
exports.setDailySpecial = async (req, res, next) => {
  try {
    // Rimuovi lo stato di piatto del giorno da tutti i piatti
    await Dish.updateMany(
      { isDailySpecial: true },
      { $set: { isDailySpecial: false } }
    );
    
    // Imposta il piatto specificato come piatto del giorno
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      { isDailySpecial: true },
      { new: true, runValidators: true }
    );
    
    if (!dish) {
      return next(
        new ErrorResponse(`Piatto non trovato con id ${req.params.id}`, 404)
      );
    }
    
    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

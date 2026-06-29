const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Imposta il token dal Bearer token nell'header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Altrimenti controlla i cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Assicurati che il token esista
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorizzato: effettua il login per accedere a questa risorsa',
    });
  }

  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Aggiungi l'utente alla richiesta
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: 'Non autorizzato: token non valido o scaduto',
    });
  }
};

// Autorizzazione in base al ruolo
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `L'utente con ruolo ${req.user.role} non è autorizzato ad accedere a questa risorsa`,
      });
    }
    next();
  };
};

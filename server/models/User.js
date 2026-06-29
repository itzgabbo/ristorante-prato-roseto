const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Inserisci un nome utente'],
    unique: true,
    trim: true,
    minlength: [3, 'Il nome utente deve contenere almeno 3 caratteri'],
    maxlength: [30, 'Il nome utente non può superare i 30 caratteri']
  },
  email: {
    type: String,
    required: [true, 'Inserisci un indirizzo email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
      'Inserisci un indirizzo email valido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Inserisci una password'],
    minlength: [8, 'La password deve contenere almeno 8 caratteri'],
    select: false // Non restituire mai la password nelle query
  },
  role: {
    type: String,
    enum: ['admin', 'editor'],
    default: 'editor'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Crittografa la password prima di salvarla
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Confronta la password in chiaro con quella crittografata
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

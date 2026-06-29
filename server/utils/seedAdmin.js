const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../config/config.env') });
dotenv.config();

const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('Utente amministratore già presente nel database');
      return;
    }

    const admin = await User.create({
      username: 'admin',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@ristorantepratoroseto.it',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin12345',
      role: 'admin',
    });

    console.log('Utente amministratore creato:', admin.email);
  } catch (error) {
    console.error('Errore durante la creazione dell\'utente amministratore:', error.message);
  }
};

module.exports = createDefaultAdmin;

if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB()
    .then(() => createDefaultAdmin())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

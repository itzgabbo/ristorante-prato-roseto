const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const multer = require('multer');
const compression = require('compression');

const envPath = path.join(__dirname, 'config', 'config.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error && !process.env.MONGO_URI) {
  dotenv.config();
}

if (envResult.error && process.env.NODE_ENV !== 'production') {
  console.warn('Avviso: config/config.env non trovato. Uso variabili di ambiente di sistema.');
}

const connectDB = require('./server/config/db');
const createDefaultAdmin = require('./server/utils/seedAdmin');
const seedMenuAuto = require('./server/utils/seedMenuAuto');
const { protect } = require('./server/middleware/auth');

connectDB().then(async () => {
  if (process.env.SEED_ADMIN !== 'false') {
    await createDefaultAdmin();
  }
  await seedMenuAuto();
});

const app = express();

const menuRoutes = require('./server/routes/menu');
const authRoutes = require('./server/routes/auth');
const categoryRoutes = require('./server/routes/categories');
const subheadingRoutes = require('./server/routes/subheadings');
const { createBackup, restoreBackup, listBackups } = require('./server/utils/backup');

// Configurazione multer per upload immagini
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'piatto-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sono ammessi solo file immagine (JPEG, JPG, PNG, GIF, WEBP)!'));
        }
    }
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiter - configurabile tramite variabili d'ambiente
const enableRateLimit = process.env.ENABLE_RATE_LIMIT === 'true';
if (enableRateLimit) {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000), // 15 minuti
    max: parseInt(process.env.RATE_LIMIT_MAX) || 500, // 500 richieste per finestra
    message: {
      success: false,
      error: 'Troppe richieste, riprova più tardi.'
    }
  });
  app.use(limiter);
  console.log('Rate limiter attivato');
} else {
  console.log('Rate limiter disattivato');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));
app.use('/uploads', express.static(uploadsDir, {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
}));

// Rotta per upload immagine piatto
app.post('/api/upload-image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Nessun file caricato!'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                imageUrl: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Errore durante l\'upload immagine:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante l\'upload dell\'immagine!'
        });
    }
});

const PORT = process.env.PORT || 3000;

function requireTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const restaurantWhatsAppNumber = process.env.RESTAURANT_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !twilioWhatsAppNumber || !restaurantWhatsAppNumber) {
    return null;
  }

  return {
    client: require('twilio')(accountSid, authToken),
    twilioWhatsAppNumber,
    restaurantWhatsAppNumber,
  };
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/menu.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'menu.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subheadings', subheadingRoutes);

// Rotte per il backup
app.get('/api/backup/create', protect, async (req, res) => {
    try {
        const backupPath = await createBackup();
        const fileName = path.basename(backupPath);
        res.download(backupPath, fileName, (err) => {
            if (err) console.error('Errore durante il download:', err);
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Errore durante la creazione del backup!' });
    }
});

app.get('/api/backup/list', protect, (req, res) => {
    try {
        const backups = listBackups();
        res.json({ success: true, data: backups });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Errore durante il recupero dei backup!' });
    }
});

app.get('/admin/dashboard.html', protect, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const twilioConfig = requireTwilioConfig();
    if (!twilioConfig) {
      return res.status(503).json({
        success: false,
        error: 'Servizio WhatsApp non configurato',
      });
    }

    const { name, phone, message, reservationDate, reservationTime, guests } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Nome, telefono e messaggio sono obbligatori',
      });
    }

    let formattedMessage = `🍽️ *Nuovo messaggio da ${name}*\n\n`;
    formattedMessage += `📱 *Telefono:* ${phone}\n`;
    formattedMessage += `💬 *Messaggio:* ${message}\n`;

    if (reservationDate && reservationTime && guests) {
      formattedMessage += `\n📅 *Prenotazione richiesta:*\n`;
      formattedMessage += `📆 Data: ${reservationDate}\n`;
      formattedMessage += `🕐 Ora: ${reservationTime}\n`;
      formattedMessage += `👥 Persone: ${guests}\n`;
    }

    formattedMessage += `\n_Messaggio inviato dal sito web del Ristorante Prato Roseto_`;

    const messageResponse = await twilioConfig.client.messages.create({
      body: formattedMessage,
      from: twilioConfig.twilioWhatsAppNumber,
      to: twilioConfig.restaurantWhatsAppNumber,
    });

    res.json({
      success: true,
      message: 'Messaggio inviato con successo! Ti risponderemo presto su WhatsApp.',
      messageSid: messageResponse.sid,
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    let errorMessage = "Errore nell'invio del messaggio. Riprova più tardi.";

    if (error.code === 20003) {
      errorMessage = 'Errore di autenticazione Twilio. Controlla le credenziali.';
    } else if (error.code === 21211) {
      errorMessage = 'Numero WhatsApp non valido.';
    } else if (error.code === 21408) {
      errorMessage = 'Numero WhatsApp non autorizzato per questo account Twilio.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

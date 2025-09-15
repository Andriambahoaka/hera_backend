// app.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Sécurité / utilitaires
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Routes
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const userTypeRoutes = require('./routes/userType');
const packRoutes = require('./routes/pack');
const notificationRoutes = require('./routes/notification');
const activityRoutes = require('./routes/activity');

// Messages centralisés
const { APP, ERRORS } = require('./utils/messages');

// =============================
// Config / ENV
// =============================
const {
  NODE_ENV = 'development',
  PORT = 4200,
  MONGO_URI,
  APP_DOMAIN = 'https://hera-backend-kes8.onrender.com',
  CORS_ORIGINS // ex: "https://monapp.com,https://staging.monapp.com"
} = process.env;

// =============================
// App
// =============================
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// =============================
// Sécurité, CORS, logs, parsers
// =============================
app.use(helmet());

// CORS: autoriser origine(s) depuis l’ENV (ou * en dev)
const allowedOrigins = (CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true, // true => reflète la requête; en prod, mieux vaut lister
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content', 'Accept', 'Content-Type', 'Authorization'],
  credentials: false,
};
app.use(cors(corsOptions));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =============================
// Dossier uploads (ensure exists)
// =============================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =============================
// Statics
// =============================
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Asset Links pour App Links
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// =============================
// Rate limiting (auth sensible)
// =============================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // ajuste selon tes besoins
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// =============================
// Routes API
// =============================
app.use('/api/auth', authRoutes);
app.use('/api/userType', userTypeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// =============================
// Healthcheck
// =============================
app.get('/healthz', (req, res) => {
  res.status(200).send(APP.HEALTH_OK);
});

// =============================
// Deeplink sécurisé (allowlist)
// =============================
// On évite les open redirects: on n'autorise que certaines cibles
const DEEPLINK_ALLOWED = new Set(['update-password']);

app.get('/deeplink', (req, res) => {
  const { to, token } = req.query;

  if (!to) {
    return res.status(400).send('Paramètre "to" manquant.');
  }

  // Ton domaine configuré pour app_links
  const appDomain = "https://hera-backend-kes8.onrender.com"; 

  // Construit l’URL universelle
  const deepLink = token
    ? `${appDomain}/${to}?token=${encodeURIComponent(token)}`
    : `${appDomain}/${to}`;

  console.log("Redirecting to:", deepLink);

  res.redirect(deepLink);
});


// =============================
// Connexion Mongo + start server
// =============================
async function start() {
  try {
    if (!MONGO_URI) {
      // eslint-disable-next-line no-console
      console.error('[CONFIG] MONGO_URI manquant dans .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI, {
      // options possibles si besoin
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // autoIndex: NODE_ENV !== 'production',
    });

    // eslint-disable-next-line no-console
    console.log(APP.MONGO_CONNECTED);

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`${APP.SERVER_READY} ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(APP.MONGO_CONNECTION_ERROR, err.message);
    process.exit(1);
  }
}

start();

module.exports = app;

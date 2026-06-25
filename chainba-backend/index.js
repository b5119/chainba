require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// --- Startup safety checks: refuse to run with a weak/default JWT secret ---
const JWT_SECRET = process.env.JWT_SECRET;
const WEAK_SECRETS = new Set([
  undefined,
  '',
  'secret',
  'changeme',
  'chainba_secret_key_2026_chain_keepers', // previously hardcoded default
]);
if (WEAK_SECRETS.has(JWT_SECRET) || (JWT_SECRET && JWT_SECRET.length < 32)) {
  console.error(
    'FATAL: JWT_SECRET is missing, too short (<32 chars), or set to a known default. ' +
    'Generate a strong secret, e.g.  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}

const app = express();

// Trust proxy so rate limiting keys on the real client IP behind a reverse proxy.
app.set('trust proxy', 1);

// Disable framework fingerprinting.
app.disable('x-powered-by');

// --- Minimal security headers (no extra dependency) ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  next();
});

// --- CORS (origins configurable via env, sensible localhost defaults) ---
const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']);
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// --- Body parsing with a hard size cap (mitigates large-payload DoS) ---
app.use(express.json({ limit: '16kb' }));

// --- Rate limiting ---
// Global limiter for the whole API.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
// Strict limiter for auth (brute-force protection on login/register).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/complaints'));

app.get('/', (req, res) => {
  res.json({ message: 'ChainBa Backend Running', status: 'ok' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log('ChainBa backend running on port ' + process.env.PORT);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
  });

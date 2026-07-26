/**
 * SmartApply KZ — Express Application
 * AI-powered resume parser and job form autofill API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

const parseRoutes = require('./routes/parse');
const healthRoutes = require('./routes/health');
const scoreRoutes = require('./routes/score');
const coverLetterRoutes = require('./routes/cover-letter');
const sitesRoutes = require('./routes/sites');
const matchRoutes = require('./routes/match');

const app = express();
const PORT = process.env.PORT || 3200;

// ── Security & Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ── Rate Limiting ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', apiLimiter);

// ── Static (for extension auto-update, if needed later) ──
app.use('/static', express.static(path.join(__dirname, '../extension')));

// ── Routes ──
app.use('/api/health', healthRoutes);
app.use('/api/parse', parseRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/match', matchRoutes);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      'GET  /api/health',
      'POST /api/parse/upload',
      'POST /api/parse/text',
      'POST /api/score',
      'POST /api/cover-letter',
    ],
  });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum 5MB.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Start ──
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║     SmartApply KZ — Server Running    ║`);
    console.log(`  ╠══════════════════════════════════════╣`);
    console.log(`  ║  Port:     ${PORT.toString().padEnd(27)}║`);
    console.log(`  ║  Health:   http://localhost:${PORT}/api/health`);
    console.log(`  ║  Parse:    POST /api/parse/upload     ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
  });
}

module.exports = app;

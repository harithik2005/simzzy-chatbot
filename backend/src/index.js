/**
 * Simzzy eSIM Chatbot — Express Server
 * Entry point for the chatbot backend API.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const chatRouter = require('./routes/chat');

const app = express();
app.set('trust proxy', 1); 


// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: "*",
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting — prevent abuse
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,                   // 30 requests per minute per IP
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/chat', chatLimiter, chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'simzzy-esim-chatbot', timestamp: new Date().toISOString() });
});

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Simzzy eSIM Chatbot API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

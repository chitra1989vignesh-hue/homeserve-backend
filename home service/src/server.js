require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initFirebase } = require('./firebase');
const { ensureHeaders } = require('./services/googleSheets');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Init Firebase ─────────────────────────────────────────────────────
initFirebase();
ensureHeaders().catch(e => console.error('Sheets header err:', e.message));

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.FRONTEND_URL || '*', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  methods: ['GET','POST','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users',    require('./routes/users'));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'HomeServe API v2 — Firebase' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 HomeServe API running on port ${PORT}`);
});

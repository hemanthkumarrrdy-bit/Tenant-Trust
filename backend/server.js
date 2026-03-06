// ============================================================
// backend/server.js — Tenant Trust REST API
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({
    origin: '*',   // Allow all origins (for local dev with file:// pages)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/landlords', require('./routes/landlords'));
app.use('/api/buildings', require('./routes/buildings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/search', require('./routes/search'));
app.use('/api/rent-trends', require('./routes/trends'));

// ── Serve static frontend ──
app.use(express.static(path.join(__dirname, '..')));

// ── 404 handler ──
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start ──
app.listen(PORT, () => {
    console.log(`\n🏠 Tenant Trust API running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Landlords:    http://localhost:${PORT}/api/landlords`);
    console.log(`   Buildings:    http://localhost:${PORT}/api/buildings`);
    console.log(`   Search:       http://localhost:${PORT}/api/search?q=Mumbai`);
    console.log(`   Rent Trends:  http://localhost:${PORT}/api/rent-trends\n`);
});

// ============================================================
// backend/middleware/auth.js — JWT verification middleware
// ============================================================
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDb();
        const user = db.users.find(u => u.id === payload.userId);
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.slice(7);
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            const db = getDb();
            const u = db.users.find(u => u.id === payload.userId);
            if (u) req.user = { id: u.id, name: u.name, email: u.email, role: u.role };
        } catch (_) { /* ignore */ }
    }
    next();
}

module.exports = { requireAuth, optionalAuth };

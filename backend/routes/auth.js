// ============================================================
// backend/routes/auth.js — Signup, Signin, Me
// ============================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

function makeToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (!['renter', 'owner'].includes(role)) {
        return res.status(400).json({ error: "role must be 'renter' or 'owner'" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email === email.toLowerCase().trim());
    if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const id = 'U' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
    const user = { id, name: name.trim(), email: email.toLowerCase().trim(), password_hash: hash, role, created_at: new Date().toISOString() };
    db.users.insert(user);

    const token = makeToken(id);
    res.status(201).json({ token, user: { id, name: user.name, email: user.email, role } });
});

// POST /api/auth/signin
router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = makeToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/auth/me (protected)
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;

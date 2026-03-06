// ============================================================
// backend/routes/landlords.js
// ============================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/landlords
router.get('/', (req, res) => {
    const { city, verified, minRating, q } = req.query;
    const db = getDb();

    let results = db.landlords.filter(l => {
        if (city && l.city.toLowerCase() !== city.toLowerCase()) return false;
        if (verified !== undefined) {
            const want = verified === 'true';
            if (!!l.verified !== want) return false;
        }
        if (minRating && l.rating < parseFloat(minRating)) return false;
        if (q) {
            const lower = q.toLowerCase();
            const areas = Array.isArray(l.areas) ? l.areas.join(' ') : (l.areas || '');
            if (!l.name.toLowerCase().includes(lower) &&
                !l.city.toLowerCase().includes(lower) &&
                !areas.toLowerCase().includes(lower)) return false;
        }
        return true;
    });

    results.sort((a, b) => b.rating - a.rating);
    res.json(results);
});

// GET /api/landlords/:id
router.get('/:id', (req, res) => {
    const db = getDb();
    const landlord = db.landlords.find(l => l.id === req.params.id);
    if (!landlord) return res.status(404).json({ error: 'Landlord not found' });

    // Attach reviews
    const reviews = db.reviews.filter(r => r.landlordId === landlord.id)
        .sort((a, b) => (b.date > a.date ? 1 : -1));

    res.json({ ...landlord, reviews });
});

module.exports = router;

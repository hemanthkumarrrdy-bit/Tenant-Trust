// ============================================================
// backend/routes/reviews.js
// ============================================================
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/reviews (renter only)
router.post('/', requireAuth, (req, res) => {
    if (req.user.role !== 'renter') {
        return res.status(403).json({ error: 'Only renters can submit reviews' });
    }

    const {
        landlordId, rating, text, title, anonymous,
        ratingResponsiveness, ratingMaintenance, ratingFairness, ratingCommunication,
        bhk, rent, city, area, tags, recommendation
    } = req.body;

    if (!landlordId || !rating || !text) {
        return res.status(400).json({ error: 'landlordId, rating, and text are required' });
    }
    if (text.trim().length < 30) {
        return res.status(400).json({ error: 'Review text must be at least 30 characters' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const db = getDb();
    const landlord = db.landlords.find(l => l.id === landlordId);
    if (!landlord) return res.status(404).json({ error: 'Landlord not found' });

    const id = 'R' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
    const author = anonymous ? 'Anonymous' : req.user.name;
    const date = new Date().toISOString().slice(0, 10);

    const review = {
        id, landlordId, user_id: req.user.id, author, rating, text: text.trim(),
        date, anonymous: !!anonymous, upvotes: 0, title: title || '',
        ratingResponsiveness: ratingResponsiveness || null,
        ratingMaintenance: ratingMaintenance || null,
        ratingFairness: ratingFairness || null,
        ratingCommunication: ratingCommunication || null,
        bhk: bhk || null, rent: rent || null, city: city || null, area: area || null,
        tags: tags || [], recommendation: recommendation || null,
    };
    db.reviews.insert(review);

    // Recalculate landlord aggregate rating
    const allRatings = db.reviews.filter(r => r.landlordId === landlordId);
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    db.landlords.update(
        l => l.id === landlordId,
        () => ({ rating: parseFloat(avg.toFixed(2)), totalReviews: allRatings.length })
    );

    res.status(201).json({ id, success: true, message: 'Review submitted successfully' });
});

// POST /api/reviews/:id/upvote
router.post('/:id/upvote', (req, res) => {
    const db = getDb();
    const review = db.reviews.find(r => r.id === req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    let newUpvotes;
    db.reviews.update(r => r.id === req.params.id, r => {
        newUpvotes = (r.upvotes || 0) + 1;
        return { upvotes: newUpvotes };
    });
    res.json({ upvotes: newUpvotes });
});

module.exports = router;

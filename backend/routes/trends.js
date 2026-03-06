// ============================================================
// backend/routes/trends.js — Rent trend data
// ============================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/rent-trends?city=Mumbai
router.get('/', (req, res) => {
    const { city } = req.query;
    const db = getDb();

    // rent_trends is stored as [{cities:{...}, trendMonths:[...]}]
    const stored = db.rent_trends.all();
    if (!stored.length) return res.json({ cities: {}, trendMonths: [] });

    const trendData = stored[0];

    // If a specific city is requested, filter to only that city
    if (city) {
        const cityData = trendData.cities?.[city];
        if (!cityData) return res.json({ cities: {}, trendMonths: trendData.trendMonths || [] });
        return res.json({
            cities: { [city]: cityData },
            trendMonths: trendData.trendMonths || []
        });
    }

    // Return full structure — same shape as the original JSON file
    res.json(trendData);
});

module.exports = router;

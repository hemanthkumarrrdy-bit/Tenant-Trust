// ============================================================
// backend/routes/buildings.js
// ============================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/buildings
router.get('/', (req, res) => {
    const { landlordId, q } = req.query;
    const db = getDb();

    let results = db.buildings.filter(b => {
        if (landlordId && b.landlordId !== landlordId) return false;
        if (q) {
            const lower = q.toLowerCase();
            if (!b.name.toLowerCase().includes(lower) && !b.address.toLowerCase().includes(lower)) return false;
        }
        return true;
    });

    results.sort((a, b) => (b.maintenanceScore || 0) - (a.maintenanceScore || 0));

    // Attach complaints + basic landlord info
    results = results.map(b => enrichBuilding(db, b));
    res.json(results);
});

// GET /api/buildings/:id
router.get('/:id', (req, res) => {
    const db = getDb();
    const building = db.buildings.find(b => b.id === req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json(enrichBuilding(db, building, true));
});

function enrichBuilding(db, b, includeComplaints = true) {
    const landlord = b.landlordId
        ? db.landlords.find(l => l.id === b.landlordId)
        : null;

    const complaints = db.complaints.filter(c => c.buildingId === b.id)
        .sort((a, b) => (b.date > a.date ? 1 : -1));

    const landlordInfo = landlord
        ? { id: landlord.id, name: landlord.name, city: landlord.city, rating: landlord.rating, verified: !!landlord.verified }
        : null;

    return { ...b, complaints, landlord: landlordInfo };
}

module.exports = router;

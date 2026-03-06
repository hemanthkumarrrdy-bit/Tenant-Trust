// ============================================================
// backend/routes/search.js — Unified search
// ============================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/search?q=query&type=landlords|buildings
router.get('/', (req, res) => {
  const { q = '', type } = req.query;
  if (!q.trim()) return res.json({ landlords: [], buildings: [], total: 0 });

  const db = getDb();
  const lower = q.toLowerCase();

  let landlords = [];
  let buildings = [];

  if (!type || type === 'landlords') {
    landlords = db.landlords.filter(l => {
      const areas = Array.isArray(l.areas) ? l.areas.join(' ') : (l.areas || '');
      return l.name.toLowerCase().includes(lower) ||
        l.city.toLowerCase().includes(lower) ||
        areas.toLowerCase().includes(lower);
    }).sort((a, b) => b.rating - a.rating).slice(0, 20)
      .map(l => ({ ...l, type: 'landlord' }));
  }

  if (!type || type === 'buildings') {
    buildings = db.buildings.filter(b => {
      const landlord = b.landlordId ? db.landlords.find(l => l.id === b.landlordId) : null;
      return b.name.toLowerCase().includes(lower) ||
        b.address.toLowerCase().includes(lower) ||
        (landlord && landlord.city.toLowerCase().includes(lower));
    }).sort((a, b) => (b.maintenanceScore || 0) - (a.maintenanceScore || 0)).slice(0, 20)
      .map(b => {
        const landlord = b.landlordId ? db.landlords.find(l => l.id === b.landlordId) : null;
        return { ...b, type: 'building', landlord_name: landlord?.name, landlord_id: landlord?.id };
      });
  }

  res.json({ landlords, buildings, total: landlords.length + buildings.length });
});

module.exports = router;

// ============================================================
// backend/db/seed.js — Seed JSON store from existing data files
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const STORE_DIR = path.join(__dirname, 'store');
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure store dir exists
if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });

function writeStore(name, data) {
  fs.writeFileSync(path.join(STORE_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`✅ ${name}: ${data.length} records`);
}

// ── Users ──
const salt = bcrypt.genSaltSync(10);
writeStore('users', [
  { id: 'U001', name: 'Ravi Mehta', email: 'renter@test.com', password_hash: bcrypt.hashSync('password123', salt), role: 'renter', created_at: new Date().toISOString() },
  { id: 'U002', name: 'Sunita Property', email: 'owner@test.com', password_hash: bcrypt.hashSync('password123', salt), role: 'owner', created_at: new Date().toISOString() },
]);

// ── Landlords ──
const landlords = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'landlords.json'), 'utf8'));
writeStore('landlords', landlords);

// ── Buildings ──
const buildingsRaw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'buildings.json'), 'utf8'));
const buildings = buildingsRaw.map(b => ({ ...b, complaints: undefined }));
writeStore('buildings', buildings);

// ── Complaints ──
const complaints = [];
for (const b of buildingsRaw) {
  for (const c of (b.complaints || [])) {
    complaints.push({ ...c, buildingId: b.id });
  }
}
writeStore('complaints', complaints);

// ── Reviews ── (extracted from landlords JSON)
const reviews = [];
for (const l of landlords) {
  for (const r of (l.reviews || [])) {
    reviews.push({ ...r, landlordId: l.id });
  }
}
writeStore('reviews', reviews);

// ── Rent Trends ──
const trends = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rent-trends.json'), 'utf8'));
writeStore('rent_trends', [trends]); // store the whole structure as one record

console.log('\n🎉 Database seeded at:', STORE_DIR);
console.log('   Test users: renter@test.com / password123');
console.log('              owner@test.com  / password123');

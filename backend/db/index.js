// ============================================================
// backend/db/index.js — JSON file-based datastore (no native deps)
// ============================================================
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'store');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const COLLECTIONS = ['users', 'landlords', 'buildings', 'complaints', 'reviews', 'rent_trends'];

class Store {
    constructor(name) {
        this.file = path.join(DB_DIR, `${name}.json`);
        this._data = null;
    }

    _load() {
        if (this._data !== null) return;
        try {
            this._data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        } catch {
            this._data = [];
        }
    }

    _save() {
        fs.writeFileSync(this.file, JSON.stringify(this._data, null, 2));
    }

    all() {
        this._load();
        return [...this._data];
    }

    find(predicate) {
        this._load();
        return this._data.find(predicate) || null;
    }

    filter(predicate) {
        this._load();
        return this._data.filter(predicate);
    }

    insert(record) {
        this._load();
        this._data.push(record);
        this._save();
        return record;
    }

    update(predicate, updater) {
        this._load();
        let updated = 0;
        this._data = this._data.map(item => {
            if (predicate(item)) { updated++; return { ...item, ...updater(item) }; }
            return item;
        });
        if (updated) this._save();
        return updated;
    }

    remove(predicate) {
        this._load();
        const before = this._data.length;
        this._data = this._data.filter(item => !predicate(item));
        if (this._data.length !== before) this._save();
    }

    // Invalidate in-memory cache (called after seed writes files)
    reload() { this._data = null; }
}

const db = {};
for (const name of COLLECTIONS) {
    db[name] = new Store(name);
}

// Helper: get fresh store (auto-reload)
function getDb() { return db; }

module.exports = { getDb };

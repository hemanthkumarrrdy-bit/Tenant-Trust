-- ============================================================
-- Tenant Trust — SQLite Schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL CHECK(role IN ('renter','owner')),
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Landlords
CREATE TABLE IF NOT EXISTS landlords (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  avatar              TEXT NOT NULL,
  verified            INTEGER NOT NULL DEFAULT 0,
  city                TEXT NOT NULL,
  areas               TEXT NOT NULL,        -- JSON array string
  properties_managed  INTEGER NOT NULL DEFAULT 0,
  response_time       TEXT,
  rating              REAL NOT NULL DEFAULT 0,
  total_reviews       INTEGER NOT NULL DEFAULT 0,
  fair_rent_score     INTEGER NOT NULL DEFAULT 50,
  red_flags           TEXT NOT NULL DEFAULT '[]', -- JSON array string
  created_at          TEXT DEFAULT (datetime('now'))
);

-- Landlord rating breakdown
CREATE TABLE IF NOT EXISTS landlord_ratings (
  landlord_id       TEXT NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  responsiveness    REAL NOT NULL DEFAULT 0,
  maintenance       REAL NOT NULL DEFAULT 0,
  fairness          REAL NOT NULL DEFAULT 0,
  communication     REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (landlord_id)
);

-- Landlord properties list
CREATE TABLE IF NOT EXISTS landlord_properties (
  id          TEXT PRIMARY KEY,
  landlord_id TEXT NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  address     TEXT NOT NULL,
  bhk         INTEGER NOT NULL,
  rent        INTEGER NOT NULL
);

-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  address           TEXT NOT NULL,
  landlord_id       TEXT REFERENCES landlords(id),
  built             INTEGER,
  units             INTEGER,
  maintenance_score INTEGER NOT NULL DEFAULT 50,
  created_at        TEXT DEFAULT (datetime('now'))
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id          TEXT PRIMARY KEY,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  description TEXT NOT NULL,
  date        TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK(severity IN ('Critical','High','Medium','Low')),
  status      TEXT NOT NULL CHECK(status IN ('Pending','Resolved','In Progress')),
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  landlord_id TEXT NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id),
  author      TEXT NOT NULL,
  rating      REAL NOT NULL,
  text        TEXT NOT NULL,
  date        TEXT NOT NULL,
  anonymous   INTEGER NOT NULL DEFAULT 0,
  upvotes     INTEGER NOT NULL DEFAULT 0,
  -- Category ratings
  rating_responsiveness  REAL,
  rating_maintenance     REAL,
  rating_fairness        REAL,
  rating_communication   REAL,
  -- Extra fields
  bhk         TEXT,
  rent        INTEGER,
  city        TEXT,
  area        TEXT,
  tags        TEXT,   -- JSON array string
  recommendation TEXT,
  title       TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Rent Trends
CREATE TABLE IF NOT EXISTS rent_trends (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  city      TEXT NOT NULL,
  month     TEXT NOT NULL,
  avg_rent  INTEGER NOT NULL,
  listings  INTEGER NOT NULL DEFAULT 0
);

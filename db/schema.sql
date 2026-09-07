-- NestPick database schema
-- Mirrors the shapes defined in types/hunting.ts and the mock data in
-- mock-data/condos.ts, so the seed script can load one-to-one into these
-- tables.

CREATE TABLE IF NOT EXISTS property_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pipeline_statuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  badge_class TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS center_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL REFERENCES property_types (id),
  size_sqm NUMERIC NOT NULL,
  floor INTEGER NOT NULL,
  view TEXT,
  source_url TEXT,
  contact_phone TEXT,
  contact_line TEXT,
  status TEXT NOT NULL REFERENCES pipeline_statuses (id),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  amenities JSONB NOT NULL DEFAULT '{}'::jsonb,
  photos TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  rent NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL,
  advance NUMERIC NOT NULL,
  common_fee NUMERIC NOT NULL DEFAULT 0,
  parking_fee NUMERIC NOT NULL DEFAULT 0,
  internet_fee NUMERIC NOT NULL DEFAULT 0,
  water_type TEXT NOT NULL,
  water_rate TEXT,
  electric_type TEXT NOT NULL,
  electric_rate TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL UNIQUE REFERENCES listings (id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  deposit_refund_terms TEXT,
  pet_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  smoking_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  guest_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  early_termination_penalty TEXT,
  contract_file_url TEXT
);

CREATE TABLE IF NOT EXISTS viewing_logs (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  rating NUMERIC(2, 1),
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_price_history_listing_id ON price_history (listing_id);
CREATE INDEX IF NOT EXISTS idx_viewing_logs_listing_id ON viewing_logs (listing_id);

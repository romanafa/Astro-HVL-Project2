-- =========
-- 1) Create database and connect
-- =========
-- Run this from a superuser (e.g., in psql):
-- CREATE ROLE rocket_owner LOGIN PASSWORD 'change-me';
-- Adjust owner as you like.
CREATE DATABASE rocketdb WITH TEMPLATE=template1 ENCODING='UTF8';
\c rocketdb

-- Optional: make a dedicated schema and set search_path
CREATE SCHEMA IF NOT EXISTS "Rocket";
ALTER DATABASE rocketdb SET search_path TO "Rocket", public;

-- =========
-- 2) Core lookup tables (future-proof)
-- =========
CREATE TABLE IF NOT EXISTS "Rocket".vehicles (
  vehicle_id   BIGSERIAL PRIMARY KEY,
  serial       TEXT UNIQUE,
  model        TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Rocket".missions (
  mission_id   BIGSERIAL PRIMARY KEY,
  name         TEXT UNIQUE NOT NULL,
  vehicle_id   BIGINT REFERENCES "Rocket".vehicles(vehicle_id),
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- =========
-- 3) Wide flight table (your columns), upgraded
-- =========
CREATE TABLE IF NOT EXISTS "Rocket".flight (
  measurement_id BIGSERIAL PRIMARY KEY,

  -- Orientation / kinematics
  pitch          DOUBLE PRECISION,  -- deg
  yaw            DOUBLE PRECISION,  -- deg
  roll           DOUBLE PRECISION,  -- deg
  velocity       DOUBLE PRECISION,  -- m/s
  altitude       DOUBLE PRECISION,  -- m
  temperature    DOUBLE PRECISION,  -- °C
  pressure       DOUBLE PRECISION,  -- (set your real unit)

  -- Time
  time_ms        BIGINT NOT NULL,            -- epoch milliseconds (UTC)
  ts             TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(time_ms / 1000.0)) STORED,

  -- Relations & metadata
  mission_id     BIGINT REFERENCES "Rocket".missions(mission_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),

  -- Basic data quality checks (tweak as needed)
  CONSTRAINT chk_velocity_nonneg   CHECK (velocity  >= 0),
  CONSTRAINT chk_pressure_nonneg   CHECK (pressure  >= 0),
  CONSTRAINT chk_altitude_min      CHECK (altitude  > -500),
  CONSTRAINT chk_temp_reasonable   CHECK (temperature > -100 AND temperature < 200)
);

COMMENT ON TABLE  "Rocket".flight IS 'Wide flight telemetry for a single row per timestamp';
COMMENT ON COLUMN "Rocket".flight.time_ms IS 'Epoch milliseconds (UTC)';
COMMENT ON COLUMN "Rocket".flight.ts      IS 'Derived UTC timestamp from time_ms';

-- =========
-- 4) Indexes for fast time-range and mission queries
-- =========
-- Good general index:
CREATE INDEX IF NOT EXISTS flight_mission_ts_idx ON "Rocket".flight (mission_id, ts);

-- Efficient for append-only time data on large tables:
CREATE INDEX IF NOT EXISTS flight_ts_brin ON "Rocket".flight USING BRIN (ts);

-- Optional: if you often query by altitude/time
-- CREATE INDEX IF NOT EXISTS flight_altitude_ts_idx ON "Rocket".flight (ts, altitude);

-- =========
-- 5) Seed a first mission (optional)
-- =========
INSERT INTO "Rocket".missions (name, started_at)
VALUES ('Launch-001', now())
ON CONFLICT (name) DO NOTHING;

-- Attach existing/future rows to the mission by default (optional helper trigger)
-- If you prefer explicit updates, skip this and just run an UPDATE after import.
CREATE OR REPLACE FUNCTION "Rocket".default_mission_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.mission_id IS NULL THEN
    SELECT mission_id INTO NEW.mission_id
    FROM "Rocket".missions
    WHERE name = 'Launch-001';
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS flight_default_mission ON "Rocket".flight;
CREATE TRIGGER flight_default_mission
BEFORE INSERT ON "Rocket".flight
FOR EACH ROW EXECUTE FUNCTION "Rocket".default_mission_id();

-- =========
-- 6) Fast CSV import (from client machine with psql)
-- =========
-- Ensure your CSV has headers: pitch,yaw,roll,velocity,altitude,temperature,pressure,time_ms
-- Then run in psql from the same directory as the CSV:
-- \copy "Rocket".flight (pitch,yaw,roll,velocity,altitude,temperature,pressure,time_ms)
-- FROM 'decrypted.csv' WITH (FORMAT csv, HEADER true)

-- If importing from a server-side path (superuser):
-- COPY "Rocket".flight (pitch,yaw,roll,velocity,altitude,temperature,pressure,time_ms)
-- FROM '/absolute/path/decrypted.csv' WITH (FORMAT csv, HEADER true);

-- =========
-- 7) Handy queries
-- =========
-- Time window of Launch-001 (first 10 seconds after start)
-- Replace timestamps as needed.
-- SELECT ts, pitch, yaw, roll, velocity, altitude
-- FROM "Rocket".flight
-- WHERE mission_id = (SELECT mission_id FROM "Rocket".missions WHERE name='Launch-001')
--   AND ts BETWEEN '2025-09-28T12:00:00Z' AND '2025-09-28T12:00:10Z'
-- ORDER BY ts;

-- Last sample
-- SELECT * FROM "Rocket".flight ORDER BY ts DESC LIMIT 1;

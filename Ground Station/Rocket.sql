CREATE SCHEMA IF NOT EXISTS Rocket;

CREATE TABLE IF NOT EXISTS Rocket.flight (
    measurement_id SERIAL PRIMARY KEY,
    pitch          DOUBLE PRECISION NOT NULL,
    yaw            DOUBLE PRECISION NOT NULL,
    roll           DOUBLE PRECISION NOT NULL,
    velocity       DOUBLE PRECISION NOT NULL,
    altitude       DOUBLE PRECISION NOT NULL,
    temperature    DOUBLE PRECISION NOT NULL,
    pressure       DOUBLE PRECISION NOT NULL,
    time_ms        INTEGER NOT NULL,         -- or BIGINT if long flights
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- More generic schema for any rocket telemetry CSV

SET search_path TO Rocket;

-- Optional: single row describing the launch
CREATE TABLE missions (
  mission_id  BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ
);

-- Catalog for columns/sensors in your CSV (nice-to-have for clarity)
CREATE TABLE sensors (
  sensor_id   BIGSERIAL PRIMARY KEY,
  sensor_key  TEXT UNIQUE NOT NULL,  -- e.g. "imu_ax", "tank_pressure"
  units       TEXT,
  notes       TEXT
);

-- Long/narrow time-series table (works for any CSV columns)
CREATE TABLE telemetry (
  telem_id    BIGSERIAL PRIMARY KEY,
  mission_id  BIGINT NOT NULL REFERENCES missions(mission_id) ON DELETE CASCADE,
  ts          TIMESTAMPTZ NOT NULL,
  sensor_id   BIGINT NOT NULL REFERENCES sensors(sensor_id),
  value_num   DOUBLE PRECISION,      -- for numeric scalars
  value_text  TEXT,                  -- if some CSV fields are strings/enums
  src_row     BIGINT,                -- original CSV line number (optional)
  UNIQUE(mission_id, ts, sensor_id)  -- idempotent re-imports
);

-- Indexes for fast time-range reads
CREATE INDEX ON telemetry (mission_id, ts);
CREATE INDEX ON telemetry (sensor_id, ts);


-- =========================================
-- SMART PARKING MANAGEMENT SYSTEM
-- DATABASE SCHEMA
-- =========================================

-- Enable range exclusion support
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- =========================================
-- 1. USERS
-- =========================================

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================
-- 2. VEHICLES
-- =========================================

CREATE TABLE vehicles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL
        CHECK (vehicle_type IN ('CAR', 'BIKE', 'SUV', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================
-- 3. PARKING LOTS
-- =========================================

CREATE TABLE parking_lots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_spaces INTEGER NOT NULL DEFAULT 0
        CHECK (total_spaces >= 0),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================
-- 4. PARKING SPACES
-- =========================================

CREATE TABLE parking_spaces (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lot_id BIGINT NOT NULL REFERENCES parking_lots(id),
    space_number VARCHAR(20) NOT NULL,
    space_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR'
        CHECK (space_type IN ('REGULAR', 'EV', 'HANDICAPPED')),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'MAINTENANCE')),
    floor_number INTEGER DEFAULT 0,
    UNIQUE (lot_id, space_number)
);


-- =========================================
-- 5. RESERVATIONS
-- =========================================

CREATE TABLE reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(id),
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
    space_id BIGINT NOT NULL REFERENCES parking_spaces(id),

    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    during TSTZRANGE GENERATED ALWAYS AS (
        tstzrange(starts_at, ends_at, '[)')
    ) STORED,

    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
        CHECK (
            status IN (
                'CONFIRMED',
                'CHECKED_IN',
                'CANCELLED',
                'EXPIRED',
                'COMPLETED'
            )
        ),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (ends_at > starts_at),

    UNIQUE (id, space_id),

    CONSTRAINT no_overlapping_reservations
    EXCLUDE USING gist (
        space_id WITH =,
        during WITH &&
    )
    WHERE (status IN ('CONFIRMED', 'CHECKED_IN'))
);


-- =========================================
-- 6. PARKING SESSIONS
-- =========================================

CREATE TABLE parking_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    reservation_id BIGINT NOT NULL UNIQUE,
    space_id BIGINT NOT NULL,

    check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out TIMESTAMPTZ,

    additional_charge NUMERIC(10,2) DEFAULT 0
        CHECK (additional_charge >= 0),

    FOREIGN KEY (reservation_id, space_id)
        REFERENCES reservations(id, space_id),

    CHECK (check_out IS NULL OR check_out >= check_in)
);


-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_vehicles_user
ON vehicles(user_id);

CREATE INDEX idx_spaces_lot
ON parking_spaces(lot_id);

CREATE INDEX idx_reservations_user
ON reservations(user_id);

CREATE INDEX idx_reservations_space
ON reservations(space_id);

CREATE INDEX idx_reservations_start
ON reservations(starts_at);

CREATE INDEX idx_sessions_reservation
ON parking_sessions(reservation_id);

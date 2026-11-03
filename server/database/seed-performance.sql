
-- 1. Create users
INSERT INTO users (name, email, password_hash, role)
VALUES
('Performance Admin', 'perfadmin@test.com', 'dummy_hash', 'ADMIN');

INSERT INTO users (name, email, password_hash, role)
SELECT
    'Performance User ' || n,
    'perfuser' || n || '@test.com',
    'dummy_hash',
    'USER'
FROM generate_series(1, 10) AS n;


-- 2. Create vehicles
INSERT INTO vehicles (user_id, registration_number, vehicle_type)
SELECT
    2 + ((n - 1) % 10),
    'PERF' || LPAD(n::TEXT, 4, '0'),
    'CAR'
FROM generate_series(1, 20) AS n;


-- 3. Create parking lots
INSERT INTO parking_lots (name, address, city, total_spaces, created_by)
SELECT
    'Performance Lot ' || n,
    'Test Address ' || n,
    'Gurugram',
    20,
    1
FROM generate_series(1, 5) AS n;


-- 4. Create parking spaces
INSERT INTO parking_spaces (lot_id, space_number, space_type)
SELECT
    lot_id,
    'P' || LPAD(space_number::TEXT, 3, '0'),
    'REGULAR'
FROM generate_series(1, 5) AS lot_id
CROSS JOIN generate_series(1, 20) AS space_number;


-- 5. Create 5,000 non-overlapping reservations
INSERT INTO reservations (
    user_id,
    vehicle_id,
    space_id,
    starts_at,
    ends_at,
    status
)
SELECT
    2 + ((n - 1) % 10),
    1 + ((n - 1) % 20),
    1 + ((n - 1) % 100),
    TIMESTAMPTZ '2030-01-01 00:00:00+00'
        + ((n - 1) / 100) * INTERVAL '2 hours',
    TIMESTAMPTZ '2030-01-01 00:00:00+00'
        + ((n - 1) / 100) * INTERVAL '2 hours'
        + INTERVAL '1 hour',
    'CONFIRMED'
FROM generate_series(1, 5000) AS n;

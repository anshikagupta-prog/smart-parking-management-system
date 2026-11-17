# Smart Parking Management System

A full-stack parking management application built with **React + Vite**, **Node.js + Express**, and **PostgreSQL**.

The application supports user registration/login, vehicle management, parking-lot and parking-space management, time-based reservations, availability checking, reservation cancellation, check-in/check-out, role-based administration and dashboard analytics.

## 1. Features

### User
- Register and log in.
- Manage registered vehicles.
- Browse parking lots and their spaces.
- Check parking-space availability for a selected time interval.
- Create time-based reservations.
- View reservation history.
- Cancel eligible upcoming reservations.
- Check in and check out of reservations.

### Administrator
- Access a role-protected admin dashboard.
- Create, update and delete parking lots.
- Create, update and delete parking spaces.
- View dashboard statistics.

### Database integrity
- PostgreSQL foreign keys, unique constraints and check constraints.
- A generated `tstzrange` column represents reservation intervals.
- A GiST exclusion constraint named `no_overlapping_reservations` prevents overlapping reservations for the same space when the status is `CONFIRMED` or `CHECKED_IN`.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Axios |
| Frontend tooling | Vite |
| Backend | Node.js, Express |
| Authentication | JWT, bcrypt |
| Database | PostgreSQL (`btree_gist` extension) |
| API testing | Thunder Client |

## 3. Prerequisites

Install the following before starting:

1. **Node.js (LTS)** and npm: https://nodejs.org/
2. **PostgreSQL**: https://www.postgresql.org/download/
3. **Git**: https://git-scm.com/downloads (only required if cloning)
4. A terminal or Visual Studio Code.

Check that the tools are available:

```powershell
node -v
npm -v
psql --version
git --version
```

PostgreSQL must be running as a service. Installing `psql` alone is not sufficient.

## 4. Download the repository

### Option A — Clone with Git (recommended)

```powershell
git clone https://github.com/anshikagupta-prog/smart-parking-management-system.git
cd smart-parking-management-system
```

### Option B — Download ZIP

1. Open the GitHub repository.
2. Select **Code → Download ZIP**.
3. Extract the ZIP.
4. Open the extracted `smart-parking-management-system-main` folder in VS Code.

The project contains two applications:
- `server/` — Express API and database access.
- `client/` — React frontend.

## 5. Create the PostgreSQL database

Open **SQL Shell (psql)** or a terminal with `psql` available. Connect using your local PostgreSQL superuser (often `postgres`):

```powershell
psql -U postgres
```

Enter your PostgreSQL password when prompted. Then create the database:

```sql
CREATE DATABASE smart_parking;
```

Exit psql:

```sql
\q
```

> If the database already exists, do not create it again. You can connect to it and continue with the schema step. For a completely clean setup, use a new empty database.

## 6. Create the database schema

From the project root, run:

```powershell
psql -U postgres -d smart_parking -f server/database/schema.sql
```

This script creates:
- `users`
- `vehicles`
- `parking_lots`
- `parking_spaces`
- `reservations`
- `parking_sessions`

It also enables the PostgreSQL `btree_gist` extension and creates the keys, checks, indexes and reservation exclusion constraint.

The database user must have permission to create the extension. If PostgreSQL reports a permission error for `btree_gist`, connect as the PostgreSQL administrator and enable it:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Then rerun the schema script against a **fresh empty database**.

### Verify the schema

```powershell
psql -U postgres -d smart_parking
```

Inside psql:

```sql
\dt
\d reservations
```

Confirm that the `no_overlapping_reservations` exclusion constraint appears in the reservation table definition. Exit with `\q`.

## 7. Configure the backend

Open a terminal at the project root:

```powershell
cd server
Copy-Item .env.example .env
```

Open `server/.env` and update the PostgreSQL password and JWT secret:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_parking
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password

JWT_SECRET=replace_with_a_long_random_secret
OVERSTAY_RATE_PER_HOUR=20
```

Important:
- Replace `DB_PASSWORD` with the password for your local PostgreSQL user.
- Replace `JWT_SECRET` with a long, random value.
- Do not commit `.env` to GitHub.
- `server/.env.example` is a template and contains no real credentials.

## 8. Install backend dependencies and seed sample data

While still inside `server/`, run:

```powershell
npm install
npm run seed
```

The seed command inserts a small demonstration dataset:
- One admin account.
- One regular user account.
- One sample vehicle.
- One sample parking lot with six spaces.
- One upcoming confirmed reservation.
- One checked-in reservation with an active parking session.
- One completed reservation with a sample additional charge.

The seed script uses bcrypt to hash the demo passwords. It can be run again without repeatedly adding the same demo lot, spaces and sample records. It resets the passwords and roles of the two named demo accounts to the documented demo credentials.

### Demo login credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartparking.local` | `Admin@123` |
| User | `user@smartparking.local` | `User@123` |

Sample vehicle registration: `DL01AB1234`

> These credentials are for local demonstration only. Do not use them for a publicly accessible deployment. Change or remove demo accounts before deploying the application.

## 9. Start the backend server

From the `server/` directory:

```powershell
npm run dev
```

The API should start at:

```text
http://localhost:5000
```

Check the health endpoint in a browser:

- http://localhost:5000/ — confirms that the API server is running.
- http://localhost:5000/api/test-db — checks the PostgreSQL connection.

Expected root response:

```text
Smart Parking API is running!
```

Keep this terminal open.

## 10. Configure and start the frontend

Open a **second terminal** at the project root:

```powershell
cd client
Copy-Item .env.example .env
npm install
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

Open that URL in your browser.

The frontend API URL defaults to `http://localhost:5000/api`. To use a different local API address, update `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart the Vite server after changing frontend environment variables.

## 11. Try the application

Keep PostgreSQL, the backend and the frontend running.

1. Open http://localhost:5173.
2. Log in using the **User** demo credentials.
3. Open the vehicle section and confirm that the demo vehicle is listed.
4. Browse parking lots and open **SAU Demo Parking Lot**.
5. Inspect the six sample parking spaces.
6. Check availability and create a reservation for an available space and a future time.
7. Open reservation history and inspect the reservation.
8. Log out.
9. Log in using the **Admin** credentials.
10. Open the admin dashboard and inspect the analytics.
11. Try the lot and space management pages.

The checked-in and completed demo records are included to demonstrate session and analytics data. The sample upcoming reservation is created relative to the time when the seed script runs.

## 12. Run a production frontend build

From the `client/` directory:

```powershell
npm run build
```

Vite creates the production frontend files in `client/dist/`.

To preview the production build locally:

```powershell
npm run preview
```

The Express backend must still be running and connected to PostgreSQL for application features that require API/database access.

## 13. Common problems and fixes

### `password authentication failed for user`

- Check `DB_USER` and `DB_PASSWORD` in `server/.env`.
- Confirm that the PostgreSQL service is running.
- Try connecting with the same credentials using `psql`.

### `database "smart_parking" does not exist`

Create it using:

```sql
CREATE DATABASE smart_parking;
```

Then rerun the schema and seed steps.

### `relation "users" does not exist`

The schema has not been applied to the database. Run:

```powershell
psql -U postgres -d smart_parking -f server/database/schema.sql
```

### `extension "btree_gist" is not available` or permission error

Ensure the PostgreSQL installation includes the extension files and enable it using a PostgreSQL administrator account:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Then rerun the schema against an empty database.

### Frontend cannot connect to backend

- Confirm the backend is running on port 5000.
- Confirm `VITE_API_URL` is `http://localhost:5000/api` or unset.
- Confirm the browser is using `http://localhost:5173`.
- Check the backend terminal for errors.

### CORS error

The backend allows the frontend origin configured by `FRONTEND_URL`. For the default local setup, use:

```env
FRONTEND_URL=http://localhost:5173
```

Restart the backend after changing `.env`.

### `npm` command not found

Install Node.js LTS and reopen the terminal. Confirm `node -v` and `npm -v` work.

### Demo login fails

Run the seed command again from the `server/` directory:

```powershell
npm run seed
```

The seed command resets the passwords for the documented demo accounts.

## 14. Project structure

```text
smart-parking-management-system/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed-demo.js
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── README.md
```

## 15. API route groups

| Base path | Purpose |
|---|---|
| `/api/auth` | Registration and login |
| `/api/vehicles` | Vehicle management |
| `/api/parking-lots` | Parking-lot operations |
| `/api/parking-spaces` | Parking-space operations |
| `/api/reservations` | Reservation, cancellation, check-in and check-out |
| `/api/availability` | Availability search |
| `/api/analytics` | Admin dashboard analytics |

Protected endpoints require a valid JWT. Administrative endpoints additionally require the `ADMIN` role.

## 16. Notes on sample data and analytics

- The sample data is intended for local development and demonstration.
- The demo completed session has an additional charge of ₹250 so the revenue aggregate is non-zero.
- The active demo session has a null `check_out`.
- The current occupancy calculation is `total_spaces - available_spaces`. Since the schema permits `AVAILABLE` and `MAINTENANCE`, this formula treats maintenance spaces as occupied. This is a known limitation of the current analytics implementation; do not interpret the demo percentage as a sensor-verified count of parked vehicles.
- The reservation exclusion constraint is the final database-level protection against overlapping active bookings for the same space.

## 17. Concurrency experiment

The repository contains the concurrency test scripts and result notes under `server/` and `server/database/`. These are experimental tools, separate from the normal application startup. Read the corresponding result files before running the tests, and use a disposable test database because concurrency scripts can insert test records.

## 18. Security and deployment note

This repository is configured for local development. Before exposing it publicly:
- Replace demo credentials.
- Use strong secrets and HTTPS.
- Restrict CORS to the deployed frontend origin.
- Use a dedicated PostgreSQL application user with only the required permissions.
- Configure backups, logging and production environment variables.
- Review authentication, rate limiting and deployment settings.

---

**Developed as a full-stack academic project.**

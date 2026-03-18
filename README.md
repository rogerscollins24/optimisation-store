# Optimize Admin Panel

Frontend: React + Vite (port 4173)

Backend: FastAPI (port 9000)

Database: PostgreSQL in Docker (host port 5433)

## Major Changes Implemented

### 1) Full Backend Migration

- Replaced previous backend stack with FastAPI + SQLAlchemy + PostgreSQL.
- Removed legacy Gemini-related backend integration.
- Moved data persistence to Dockerized Postgres.

### 2) Infrastructure and Ports

- Frontend runs on port `4173`.
- Backend API runs on port `9000`.
- Postgres is exposed on host port `5433`.
- Added Docker Compose workflow for backend and database.

### 3) Functional Admin Coverage

- Implemented live API-backed functionality across all core admin sections.
- Replaced placeholder pages with working CRUD/actions and CSV export where relevant.
- Added notifications management section and wiring in navigation/routes.

### 4) Combo System Upgrade

- Combo creation/update now enforces exactly 2 distinct products.
- Supports per-product custom price and commission in combo items.

### 5) User and Product Data Expansion

- Expanded user schema and forms with additional operational fields:
	login/withdraw passwords, gender, commission values, invite/referral fields, set/task counters, exchange, wallet, and more.
- Added product `description` support in backend + UI forms.

### 6) Training Account + Referral Commission Flow

- Added top toolbar **Add User** flow for creating a training account.
- Training account is linked by `referred_by` invite code.
- On training-account earnings (balance add), inviter is automatically credited commission.
- Default training commission rate is `25%`.
- Added API endpoint: `/api/users/training-account`.

### 7) Activity/Transaction Improvements

- Important admin actions are logged to activity logs.
- Training referral payouts appear in transactions as `Training Commission Credit`.

## Prerequisites

- Node.js 18+
- npm
- Docker Desktop (or Docker Engine + Compose)

## Port Defaults

- Frontend: `http://localhost:4173`
- Backend API: `http://localhost:9000`
- Postgres: `localhost:5433`

## Quick Start

1. Install frontend dependencies:

```bash
npm install
```

2. Start backend + database with Docker:

```bash
npm run docker:up
```

3. Start frontend dev server:

```bash
npm run dev
```

4. Open the app:

```text
http://localhost:4173
```

## Backend Environment

Backend settings live in `.env.backend` (optional for local overrides).

You can copy defaults from `.env.backend.example`.

Important values:

- `APP_PORT=9000`
- `DATABASE_URL=postgresql+psycopg://admin:admin@localhost:5433/adminpanel`
- `CORS_ORIGINS=http://localhost:4173,http://127.0.0.1:4173`

## Docker Commands

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

## Database Schema Note

When model fields change, recreate local Docker volume to apply a fresh schema:

```bash
docker compose down -v
npm run docker:up
```

## Functional Coverage

The admin UI is wired to live API data and actions across core sections:

- Users: list, search/filter, create, edit, lock/unlock, delete, CSV export
- Users (top toolbar): create linked training account via referral code
- Products: list, search/filter, create, edit, delete, CSV export, description field
- Tasks: list, search/filter, create, edit, delete, CSV export
- Combos: list, search/filter, create, edit, delete, CSV export, 2-product enforcement
- Withdrawals: moderation controls and status updates
- Transactions: API-backed list with filtering and CSV export
- Tracked Clicks: API-backed list and CSV export
- VIP Levels: user VIP editing and CSV export
- Activity Logs: filtered log table and CSV export
- Notifications: create/edit/delete, activate/deactivate, filtering, CSV export
- Settings: full settings form persisted through bulk save endpoint

## API Routes

FastAPI serves the `/api/*` contract used by the frontend:

- `/api/users` (GET, POST)
- `/api/users/{id}` (PUT, DELETE)
- `/api/users/{id}/lock` (POST)
- `/api/users/{id}/balance` (POST)
- `/api/users/training-account` (POST)
- `/api/products` (GET, POST)
- `/api/products/{id}` (PUT, DELETE)
- `/api/tasks` (GET, POST)
- `/api/tasks/{id}` (PUT, DELETE)
- `/api/tasks/start` (POST)
- `/api/combos` (GET, POST)
- `/api/combos/{id}` (PUT, DELETE)
- `/api/notifications` (GET, POST)
- `/api/notifications/{id}` (PUT, DELETE)
- `/api/withdrawals` (GET)
- `/api/withdrawals/{id}/approve` (POST)
- `/api/withdrawals/{id}/reject` (POST)
- `/api/settings` (GET, POST)
- `/api/settings/bulk` (POST)
- `/api/logs` (GET)
- `/api/transactions` (GET)
- `/api/tracked-clicks` (GET)
- `/api/stats` (GET)

Health endpoint:

- `/health`

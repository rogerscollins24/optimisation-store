# Optimize Admin Panel

Frontend: React + Vite (port 4173)

Backend: FastAPI (port 9000)

Database: PostgreSQL in Docker (host port 5433)

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

## Functional Coverage

The admin UI is wired to live API data and actions across core sections:

- Users: list, search/filter, create, edit, lock/unlock, delete, CSV export
- Products: list, search/filter, create, edit, delete, CSV export
- Tasks: list, search/filter, create, edit, delete, CSV export
- Combos: list, search/filter, create, edit, delete, CSV export
- Withdrawals: moderation controls and status updates
- Transactions: API-backed list with filtering and CSV export
- Tracked Clicks: API-backed list and CSV export
- VIP Levels: user VIP editing and CSV export
- Activity Logs: filtered log table and CSV export
- Settings: full settings form persisted through bulk save endpoint

## API Routes

FastAPI serves the `/api/*` contract used by the frontend:

- `/api/users` (GET, POST)
- `/api/users/{id}` (PUT, DELETE)
- `/api/products` (GET, POST)
- `/api/products/{id}` (PUT, DELETE)
- `/api/tasks` (GET, POST)
- `/api/tasks/{id}` (PUT, DELETE)
- `/api/combos` (GET, POST)
- `/api/combos/{id}` (PUT, DELETE)
- `/api/withdrawals` (GET)
- `/api/withdrawals/{id}` (POST)
- `/api/settings` (GET, POST)
- `/api/settings/bulk` (POST)
- `/api/logs` (GET)
- `/api/transactions` (GET)
- `/api/tracked-clicks` (GET)
- `/api/stats` (GET)

Health endpoint:

- `/health`

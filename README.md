# Optimize Admin Panel

Admin frontend, consumer frontend, and API/backend for task optimization and referral-based commission workflows.

## Stack and Ports

- Admin frontend: React + Vite on `http://localhost:4173`
- Consumer frontend: React + Vite on `http://localhost:3000`
- Backend API: FastAPI on `http://localhost:9000`
- Database: PostgreSQL in Docker on `localhost:5433`

## Major Changes and Updates

### 1) Backend Migration and Architecture

- Replaced legacy backend flow with FastAPI + SQLAlchemy + PostgreSQL.
- Removed prior Gemini backend dependencies.
- Added Docker Compose lifecycle for API and database services.

### 2) Full Admin Coverage

- Replaced placeholder admin pages with API-backed sections.
- Implemented CRUD, filtering, status actions, and CSV export across key modules.
- Added complete Settings bulk-save support.

### 3) Data Model Expansion

- Expanded user model with operational fields (auth credentials, referral fields, set/task counters, wallet/exchange, training-account flags).
- Added product `description` and `image_url` support.
- Added dedicated `user_tasks` table for consumer task records.

### 4) Combo and Task Logic Improvements

- Combo creation/editing now enforces exactly 2 distinct products.
- Combo items support per-item custom price and commission.
- Added unified task modal flow for all client tasks (combo and non-combo).
- Tasks are created as `pending` on start and only become `completed` after explicit submit.
- Pending tasks block starting new tasks until submission.
- Added negative-balance guard flow: if task amount exceeds balance, the task moves to `pending_debited`, user is blocked, and deposit + support/chat guidance is returned.
- Pending tasks remain indefinitely until submitted by user or reset by admin.
- Added commission logic by VIP level for consumer task completion:
	- VIP1: 40 tasks/set, 0.5%
	- VIP2: 45 tasks/set, 1.0%
	- VIP3: 50 tasks/set, 1.5%
	- VIP4: 55 tasks/set, 2.0%
	- VIP5+: 60 tasks/set, 2.5%

### 5) Training Account + Referral Commission Flow

- Added toolbar flow to create training accounts from admin.
- Training accounts are linked through referral/invite code.
- Balance-add events on training accounts automatically credit inviter commission (default `25%`).
- Referral commission credits are visible in transactions/activity logs.

### 6) Consumer App Integration (`optimization-front`)

- Added protected login flow (`username` + `login_password`) with local persistence.
- Added authenticated routing and user refresh endpoints.
- Wired Starting screen to task start + submit lifecycle with pending-task resume behavior.
- Added deposit prompt and clickable support/chat link when balance is insufficient.
- Wired Records to backend task history including combo item details and pending states.
- Wired Profile, Deposit, Withdraw to live user state and backend balance updates.
- Added local proxy (`/api -> http://localhost:9000`) in consumer app Vite config.

### 7) New Client-Facing API Endpoints

- `POST /api/auth/login`
- `GET /api/users/{id}/overview`
- `GET /api/users/{id}/pending-tasks`
- `POST /api/users/{id}/submit-task`
- `GET /api/users/{id}/task-records`
- `POST /api/tasks/start`

## Prerequisites

- Node.js 18+
- npm
- Docker Desktop (or Docker Engine with Compose)

## Quick Start (Admin + Backend)

1. Install dependencies:

```bash
npm install
```

2. Start backend + Postgres:

```bash
npm run docker:up
```

3. Start admin frontend:

```bash
npm run dev
```

4. Open:

- Admin: `http://localhost:4173`
- API health: `http://localhost:9000/health`

## Quick Start (Consumer App)

1. Install consumer frontend dependencies:

```bash
cd optimization-front
npm install
```

2. Start consumer frontend:

```bash
npm run dev
```

3. Open:

- Consumer app: `http://localhost:3000`

## Development Notes

- Backend env values can be overridden via `.env.backend`.
- If model/schema fields change, reset Docker volume for clean schema recreation:

```bash
docker compose down -v
npm run docker:up
```

## Admin Functional Coverage

- Users: list, search/filter, create, update, lock/unlock, delete, CSV export
- Users (toolbar): training-account creation via referral code
- Products: list, search/filter, create, update, delete, CSV export, description
- Tasks: list, search/filter, create, update, delete, CSV export
- Combos: list, search/filter, create, update, delete, CSV export, 2-product enforcement
- Combos: admin reset action to clear blocked pending combo tasks
- Withdrawals: moderation and status updates
- Transactions: API-backed list, filtering, CSV export
- Tracked Clicks: API-backed list, CSV export
- VIP Levels: update flow + CSV export
- Activity Logs: API-backed, filterable, CSV export
- Notifications: CRUD, status toggles, filtering, CSV export
- Settings: persisted bulk-save form

## API Route Coverage

FastAPI serves all routes under `/api`.

- Users: `/users`, `/users/{id}`, `/users/{id}/lock`, `/users/{id}/balance`, `/users/training-account`, `/users/{id}/overview`, `/users/{id}/pending-tasks`, `/users/{id}/submit-task`, `/users/{id}/task-records`
- Auth: `/auth/login`
- Products: `/products`, `/products/{id}`
- Tasks: `/tasks`, `/tasks/{id}`, `/tasks/start`
- Combos: `/combos`, `/combos/{id}`, `/combos/{id}/reset`
- Notifications: `/notifications`, `/notifications/{id}`
- Withdrawals: `/withdrawals`, `/withdrawals/{id}/approve`, `/withdrawals/{id}/reject`
- Settings: `/settings`, `/settings/bulk`
- Reporting: `/logs`, `/transactions`, `/tracked-clicks`, `/stats`

Health route:

- `/health`

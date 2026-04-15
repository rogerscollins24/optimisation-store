# Shopping Optimized Platform

Admin frontend, consumer frontend, and FastAPI backend for task optimization, support workflows, account management, and referral-based commissions.

## Stack and Ports

- Admin frontend: React + Vite on `http://localhost:4173`
- Consumer frontend: React + Vite on `http://localhost:3000`
- Backend API: FastAPI on `http://localhost:9000`
- Database: PostgreSQL in Docker on `localhost:5544` (container `5432`)

Admin login route: `/login` on the admin frontend host.

If the default frontend ports are busy, Vite automatically selects the next free port.

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
- Default commission for non-combo tasks is now fixed at `9%`.
- Non-combo product assignment now only selects active products with `price < user balance`.
- Random non-combo selection uses a balance-based price band so higher balances skew toward higher-priced products.
- Combo tasks remain an explicit override and keep their configured custom prices/commissions.

### 5) Training Account + Referral Commission Flow

- Added toolbar flow to create training accounts from admin.
- Training accounts are linked through referral/invite code.
- Balance-add events on training accounts automatically credit inviter commission (default `25%`).
- Referral commission credits are visible in transactions/activity logs.

### 6) Consumer App Integration (`optimization-front`)

- Added protected login flow (`username` + `login_password`) with local persistence.
- Added authenticated routing and user refresh endpoints.
- Wired Starting screen to task start + submit lifecycle with pending-task resume behavior.
- Reworked the Starting screen for desktop and mobile with a full-width responsive shell.
- Starting screen now renders a centered fixed 3x3 product grid with the Start action in the middle.
- Added a short 3–6 second reveal/spin delay before the selected product task appears.
- Moved Task Progress into the same top stats row as balance and commission for a tighter mobile layout.
- Added a paint/canvas textured background treatment for the refreshed client views.
- Refreshed the Home page with an autoplay banner, darker quick-action menu, and richer VIP tier cards.
- Redesigned the Support page so `New Chat` opens in the main panel with a cleaner ticket/chat layout.
- Support access is now routed through the account/profile area while the floating chat shortcut remains available.
- Added a visible Pending section beneath the Starting grid so blocked tasks are surfaced outside the modal flow.
- Pending views now treat both `pending` and `pending_debited` as active blocked tasks in the client UI.
- Added deposit prompt and clickable support/chat link when balance is insufficient.
- Wired Records to backend task history including combo item details and pending states.
- Wired Profile, Deposit, and Withdraw to live user state and backend balance updates.
- Deposit and withdrawal submissions now automatically create support tickets and redirect the client into chat.
- Added account pages for Personal Information, Wallet Binding, and client Notifications.
- Added unread badges for support replies and admin notifications across the client experience.
- Profile now highlights remaining tasks, wallet details, and color-coded balance/commission cards.
- Rebranded the client app to **Shopping Optimized** with custom home/wheel icons and a tighter VIP card layout.
- Added a looping local banner video on the Home page using a bundled MP4 asset.
- Implemented a dedicated FAQ page and wired the Home quick-action tile to open it.
- Added a persistent client language selector with multi-language UI text for Home, navigation, and FAQs.
- Added local proxy (`/api -> http://localhost:9000`) in consumer app Vite config.

### 7) New Client-Facing API Endpoints

- `POST /api/auth/login`
- `GET /api/users/{id}/overview`
- `GET /api/users/{id}/pending-tasks`
- `POST /api/users/{id}/submit-task`
- `GET /api/users/{id}/task-records`
- `PUT /api/users/{id}/profile`
- `PUT /api/users/{id}/support-assignment`
- `POST /api/tasks/start`

### 8) Full Support Chat System (Client + Admin + Realtime)

- Added full support ticketing + messaging backend with JWT-protected access.
- Added role-aware visibility:
	- Merchants can access only their own tickets.
	- `super_admin` can access all tickets.
	- `sub_admin` can access tickets from users they created, clients assigned to them as support owner, plus tickets explicitly assigned to them.
- Added realtime chat transport via WebSocket endpoint per ticket.
- Added unread-message workflow for support staff:
	- unread count endpoint
	- mark-all-read endpoint
	- admin unread badge polling in layout
- Added unread-message workflow for clients:
	- `GET /support/client-unread-count`
	- `POST /support/tickets/{ticket_id}/mark-read`
	- floating chat badge + in-page auto-read handling
- Added support status workflow (`open`, `in_progress`, `resolved`, `closed`).
- Added super-admin ticket assignment endpoint and UI (`PUT /support/tickets/{ticket_id}/assignment`).
- Added single admin login session for all admin pages, including Support (no second login in Support).
- Added client support UI:
	- `optimization-front/src/pages/Support.tsx`
	- `optimization-front/src/components/ChatModal.tsx`
- Added explicit `New Chat` action in client Support page and Chat modal.
- Added admin support desk UI:
	- `src/pages/SupportDesk.tsx`
	- support API + socket helpers in both frontends
- Added WebSocket proxy support in both Vite configs (`ws: true` on `/api` proxy).

### 9) Admin Role and Account Management

- Added `sub_admin` role in backend and frontend role handling.
- Admin account creation policy:
	- `super_admin` can create `super_admin`, `sub_admin`, and `merchant` users.
	- `sub_admin` can create `sub_admin` and `merchant` users.
- User ownership (`created_by_admin_id`), support ownership (`managed_by_admin_id`), and ticket assignment (`assigned_to_admin_id`) are persisted and enforced in support visibility rules.
- Super admins can now assign a sub-admin as the ongoing support owner for any client from both the admin `Users` table and the `SupportDesk` workflow.

### 10) Daily Reset + Client Branding Refresh

- Added GMT/UTC-aware daily reset logic for `commission_today` and `task_count_today`.
- Client overview responses now include `remaining_tasks` and `tasks_per_set` for the account page.
- The consumer-facing brand is now **Shopping Optimized**, including updated app title, metadata, toolbar icons, refreshed home/profile presentation, a local looping banner video, and a FAQ help page.

### 11) Client Language Switching

- Added a top-right language selector with flag icons and persistent local storage.
- Supported languages: English, Français, Español, Italiano, Polski, Русский, Deutsch, Nederlands, Türkçe, and Português.
- Home labels, VIP descriptions, navigation labels, and FAQ content now respond to the selected language.

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

- Admin login: `http://localhost:4173/login`
- API health: `http://localhost:9000/health`

If port `4173` is in use, Vite will pick another port automatically (example: `4174`).

Default seeded admin login:

- Username: `jane_smith`
- Password: `pass456`

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

> The Home page now includes a local looping banner video from `public/videos/banner-dodplZ4U.mp4`, the FAQ tile opens `/faqs`, and the language dropdown persists the selected language in local storage.

3. Open:

- Consumer app: `http://localhost:3000`

If port `3000` is already in use, Vite will select the next free port automatically (example: `3002`).

## Development Notes

- Backend env values can be overridden via `.env.backend`.
- The consumer Starting page depends on `/api/products`, `/api/tasks/start`, `/api/users/{id}/pending-tasks`, and `/api/users/{id}/submit-task` for the rotating product grid and pending-task resume flow.
- If model/schema fields change, reset Docker volume for clean schema recreation:

```bash
docker compose down -v
npm run docker:up
```

## One-Time Product Import (from seo-main)

Use this when you need to replace this app's product catalog with rows from the seo-main `products` table.

1. Ensure destination API is running (`http://localhost:9000`) and source DB is reachable.
2. Dry-run first (no writes):

```bash
python backend/scripts/import_products_from_seo_main.py --dry-run --replace-all
```

3. Run live import (deletes all destination products, then recreates from source):

```bash
python backend/scripts/import_products_from_seo_main.py --replace-all
```

For safe repeat syncs without deleting destination rows first, use the idempotent upsert mode:

```bash
python backend/scripts/import_products_from_seo_main.py --upsert-by-name
```

This updates destination products by matching `name` and only creates entries that are missing.

Defaults:

- Source DB URL: `postgresql://techload:techload@localhost:5433/techload`
- Target API base: `http://localhost:9000/api`
- Imported defaults: `commission_rate=1.0`, `stock=100`

Optional overrides:

```bash
python backend/scripts/import_products_from_seo_main.py \
	--source-db-url "postgresql://user:pass@host:5432/db" \
	--target-api-base "http://localhost:9000/api" \
	--commission-rate 1.2 \
	--stock 80 \
	--replace-all
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

- Users: `/users`, `/users/{id}`, `/users/{id}/lock`, `/users/{id}/balance`, `/users/training-account`, `/users/{id}/overview`, `/users/{id}/pending-tasks`, `/users/{id}/submit-task`, `/users/{id}/task-records`, `/users/{id}/profile`, `/users/{id}/support-assignment`
- Auth: `/auth/login`
- Products: `/products`, `/products/{id}`
- Tasks: `/tasks`, `/tasks/{id}`, `/tasks/start`
- Combos: `/combos`, `/combos/{id}`, `/combos/{id}/reset`
- Notifications: `/notifications`, `/notifications/{id}`
- Withdrawals: `/withdrawals`, `/withdrawals/{id}/approve`, `/withdrawals/{id}/reject`
- Settings: `/settings`, `/settings/bulk`
- Reporting: `/logs`, `/transactions`, `/tracked-clicks`, `/stats`
- Support:
	- `POST /support/tickets`
	- `GET /support/tickets`
	- `GET /support/tickets/{ticket_id}`
	- `POST /support/tickets/{ticket_id}/messages`
	- `POST /support/tickets/{ticket_id}/mark-read`
	- `PUT /support/tickets/{ticket_id}/status`
	- `PUT /support/tickets/{ticket_id}/assignment`
	- `GET /support/unread-count`
	- `POST /support/mark-all-read`
	- `GET /support/client-unread-count`
	- `WS /support/ws?ticket_id={id}&token={jwt}`

Health route:

- `/health`

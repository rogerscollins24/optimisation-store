# Optimization Front (Consumer Client)

Consumer-facing React app for task optimization flow, connected to the FastAPI backend in the root project.

## What This Client Includes

- Login flow with username/password against `/api/auth/login`
- Protected routes with local user session persistence
- Starting page connected to live products and task completion endpoint
- Records page connected to user task history endpoint
- Profile page with live user balances and referral info
- Deposit and Withdraw pages tied to live backend user state

## Runtime Ports

- Consumer app: `http://localhost:3000`
- Backend API target: `http://localhost:9000`

The dev proxy is configured so calls to `/api/*` are forwarded to the backend.

## Prerequisites

- Node.js 18+
- Backend API running from the root workspace

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open in browser:

```text
http://localhost:3000
```

## Build and Typecheck

```bash
npm run lint
npm run build
```

## Login Test Users

Seeded backend users (if using fresh Docker seed data):

- `john_doe` / `pass123`
- `jane_smith` / `pass456`

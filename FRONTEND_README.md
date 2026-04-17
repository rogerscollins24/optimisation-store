# Frontend Documentation — Optimisation Store

A full-stack product-optimisation task platform with two separate React/TypeScript frontends and a FastAPI backend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Client Frontend (`optimization-front/`)](#client-frontend-optimization-front)
   - [Tech Stack](#tech-stack)
   - [Project Structure](#project-structure)
   - [Routing](#routing)
   - [State Management](#state-management)
   - [Context Providers](#context-providers)
   - [Pages](#pages)
   - [Components](#components)
   - [Hooks](#hooks)
   - [Libraries (`lib/`)](#libraries-lib)
   - [Internationalisation (i18n)](#internationalisation-i18n)
   - [Real-time Messaging (WebSocket)](#real-time-messaging-websocket)
   - [API Communication](#api-communication)
   - [Environment Variables](#environment-variables)
   - [Running the Client Frontend](#running-the-client-frontend)
3. [Admin Frontend (`src/`)](#admin-frontend-src)
   - [Tech Stack (Admin)](#tech-stack-admin)
   - [Admin Pages](#admin-pages)
   - [Admin Auth](#admin-auth)
   - [Running the Admin Frontend](#running-the-admin-frontend)
4. [Shared Backend API](#shared-backend-api)
5. [Key Data Models](#key-data-models)
6. [User Journey / Flow](#user-journey--flow)
7. [Known Improvement Areas](#known-improvement-areas)

---

## Architecture Overview

```
optimisation-store/
├── optimization-front/   ← Client-facing SPA (port 3000)
├── src/                  ← Admin dashboard SPA (port 4173)
└── backend/              ← FastAPI REST + WebSocket server (port 9000)
```

Both frontends are served separately and proxy all `/api/*` requests to the same FastAPI backend. In production, all three are containerised via `docker-compose.yml`.

---

## Client Frontend (`optimization-front/`)

### Tech Stack

| Dependency | Purpose |
|---|---|
| React 19 | UI framework |
| React Router 7 | Client-side routing |
| TypeScript 5.8 | Static typing |
| Vite 6 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first CSS |
| i18next + react-i18next | Localisation |
| lucide-react | Icon library |
| motion | Animations |
| clsx + tailwind-merge | Class composition utilities |

### Project Structure

```
optimization-front/src/
├── App.tsx                    ← Root component; route declarations
├── main.tsx                   ← Application entry point
├── store.tsx                  ← Global task state (UserContext)
├── index.css                  ← Global styles
│
├── context/
│   ├── AuthContext.tsx        ← Auth state, user session, badge counts
│   └── LanguageContext.tsx    ← Language selection + i18n bootstrap
│
├── hooks/
│   └── useDynamicTranslations.ts  ← Runtime translation of dynamic strings
│
├── lib/
│   ├── socket.ts              ← WebSocket client for live support chat
│   ├── supportApi.ts          ← Support ticket REST API helpers
│   ├── translationApi.ts      ← Batch translation REST API helper
│   └── vipApi.ts              ← VIP level config fetching & defaults
│
├── components/
│   ├── Layout.tsx             ← Shell layout with bottom nav bar
│   ├── BrandIcons.tsx         ← SVG icon components (BrandHomeIcon, ShipWheelIcon)
│   └── ChatModal.tsx          ← Floating in-page support chat modal
│
└── pages/
    ├── Login.tsx              ← Login + sign-up page
    ├── Home.tsx               ← Dashboard / landing page
    ├── Starting.tsx           ← Task optimisation workflow
    ├── Records.tsx            ← Task history list
    ├── Profile.tsx            ← User profile overview
    ├── PersonalInformation.tsx← Edit email / phone / gender
    ├── WalletBinding.tsx      ← Bind USDT wallet address
    ├── Deposit.tsx            ← Deposit request flow
    ├── Withdraw.tsx           ← Withdrawal request flow
    ├── Support.tsx            ← Full support ticket inbox
    ├── Notifications.tsx      ← Platform notifications
    └── Faqs.tsx               ← FAQ page
```

---

### Routing

Routes are declared in [optimization-front/src/App.tsx](optimization-front/src/App.tsx). All routes except `/login` are wrapped in a `RequireAuth` guard that redirects unauthenticated users.

| Path | Component | Auth Required |
|---|---|---|
| `/login` | `Login` | No |
| `/` | `Home` | Yes |
| `/starting` | `Starting` | Yes |
| `/records` | `Records` | Yes |
| `/profile` | `Profile` | Yes |
| `/profile/personal` | `PersonalInformation` | Yes |
| `/profile/wallet` | `WalletBinding` | Yes |
| `/notifications` | `Notifications` | Yes |
| `/faqs` | `Faqs` | Yes |
| `/deposit` | `Deposit` | Yes |
| `/withdraw` | `Withdraw` | Yes |
| `/support` | `Support` | Yes |

---

### State Management

State is distributed across React Context (no external state library):

| Store | File | Scope |
|---|---|---|
| Auth / User session | `AuthContext.tsx` | Global |
| Task records | `store.tsx` (`UserContext`) | Global |
| Language / translations | `LanguageContext.tsx` | Global |

There is no Redux, Zustand, or other external store.

---

### Context Providers

#### `AuthContext` ([optimization-front/src/context/AuthContext.tsx](optimization-front/src/context/AuthContext.tsx))

The most critical context. Wraps the entire app. Provides:

| Export | Type | Description |
|---|---|---|
| `user` | `AuthUser \| null` | Currently authenticated user (persisted in localStorage under `optimization-front-user`) |
| `loading` | `boolean` | True while hydrating user from localStorage on first load |
| `supportUnreadCount` | `number` | Unread support message badge count, polled on auth |
| `notificationCount` | `number` | Count of unread active notifications |
| `login()` | async fn | Authenticates with username + password + math captcha |
| `signup()` | async fn | Creates a new account; returns a success message string |
| `logout()` | fn | Clears user from state and localStorage |
| `refreshUser()` | async fn | Re-fetches latest user data from `/api/users/me` |
| `refreshBadges()` | async fn | Refreshes both support unread count and notification count |
| `markNotificationsRead()` | fn | Saves read notification IDs to localStorage |
| `setUser` | dispatch | Direct state setter (used by `Starting` page after task completion) |

**`AuthUser` shape:**

```ts
{
  id: number;
  username: string;
  status?: string;          // 'Active' = enabled account
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  balance: number;           // USDT balance
  commission?: number;
  commission_today: number;
  vip_level: number;         // 1–4
  invite_code?: string | null;
  credit_score?: number;
  tasks_completed_in_set: number;
  task_count_today: number;
  current_set?: number;
  remaining_tasks?: number;
  tasks_per_set?: number;
  withdraw_password?: string | null;
  exchange?: string | null;
  wallet_address?: string | null;
  role?: string;
  access_token?: string;
}
```

#### `LanguageContext` ([optimization-front/src/context/LanguageContext.tsx](optimization-front/src/context/LanguageContext.tsx))

Initialises i18next and exposes:

| Export | Description |
|---|---|
| `language` | Active language code (`en`, `fr`, `es`, `it`, `pl`, `ru`, `de`, `nl`, `tr`, `pt`) |
| `languages` | Full list of supported language options with flag, short code, and label |
| `setLanguage()` | Updates active language (persisted under `shopping-optimized-language`) |

The default translations for all 10 languages are defined as static key-value maps directly in this file. Dynamic content (product names, support messages) is translated at runtime via `useDynamicTranslations`.

#### `UserContext` — `store.tsx` ([optimization-front/src/store.tsx](optimization-front/src/store.tsx))

Manages the in-session task record list:

| Export | Description |
|---|---|
| `records` | Array of `Task` objects for the current session |
| `setRecords()` | Bulk-replace all records (used on page load) |
| `addTask()` | Prepend a new task to the top of the list |
| `completeTask()` | Mark a task as `completed` by ID |

---

### Pages

#### `Login` ([optimization-front/src/pages/Login.tsx](optimization-front/src/pages/Login.tsx))

Dual-mode page supporting both sign-in and account creation.

**Sign-in fields:** username/email, password, math captcha (e.g. "3 + 5 = ?")  
**Sign-up fields:** email, optional referral code, password, math captcha  
**Captcha:** Two random single-digit numbers are generated client-side. The user must enter the correct sum. A wrong answer refreshes the captcha.

After successful login the user is navigated to `/`.

---

#### `Home` ([optimization-front/src/pages/Home.tsx](optimization-front/src/pages/Home.tsx))

Main dashboard / landing page after login.

**Features:**
- Welcome greeting with avatar (generated by DiceBear avataaars API seeded with username)
- Notification bell with unread badge count linking to `/notifications`
- Language selector dropdown (10 languages, with flag icons)
- Autoplay banner video
- Quick-action menu grid: Service, Event, Withdrawal, Deposit, T&C, Certificate, FAQs
- VIP Level cards — dynamically fetched from `/api/vip-levels`, showing tasks per set, commission rate, combo profit, and activation amount for each level (VIP 1–4)

---

#### `Starting` ([optimization-front/src/pages/Starting.tsx](optimization-front/src/pages/Starting.tsx))

The core task-optimisation workflow page. This is the most complex page in the frontend.

**Behaviour flow:**
1. On load, fetches the product list from `/api/products` and displays 8 random products in a shuffled grid (refreshes every 8 seconds when idle).
2. Checks for any unresolved pending tasks via `/api/users/{id}/pending-tasks`. If found, the pending task is displayed and the page is "blocked" until it is resolved.
3. When the user clicks **Start**, a POST request is sent to `/api/tasks/start` with the user ID and current task number. A random delay (3–6 seconds) is applied to simulate processing, shown by an animated optimisation UI.
4. The returned task is displayed: product image, name, price (USDT), commission earned.
5. If the task is a **combo** (multiple products bundled), all product sub-items are shown.
6. The user clicks **Submit** to confirm the task via `/api/tasks/{taskCode}/submit`.
7. On success: balance and task counts are updated; the user can start the next task.
8. If the user's balance is negative (deducted combo task), a deposit prompt is shown with a pre-filled amount and a support chat modal opens automatically.

**Key state:**
| State | Description |
|---|---|
| `currentTask` | The task currently presented to the user |
| `pendingTasks` | Unresolved tasks loaded on mount |
| `pendingTaskBlocked` | True when a pending task must be resolved before starting new ones |
| `isOptimizing` | True during the fake optimisation animation |
| `isSubmitting` | True while awaiting submit API response |
| `requiredDeposit` | Amount the user must deposit to unlock a `pending_debited` task |
| `chatSignal` | Incremented to trigger the `ChatModal` to open |

---

#### `Records` ([optimization-front/src/pages/Records.tsx](optimization-front/src/pages/Records.tsx))

Displays the user's task history. Fetches from `/api/users/{id}/task-records` on mount and populates the global `UserContext` records store.

**Tabs:** All | Pending | Completed  
**Per record:** task code, status badge, product image & name (dynamically translated), timestamp, amount (USDT), commission, and a "Resume Task" link for incomplete tasks.  
Combo tasks show a sub-list of all products with individual prices.

---

#### `Profile` ([optimization-front/src/pages/Profile.tsx](optimization-front/src/pages/Profile.tsx))

User profile overview page.

**Hero card (gradient blue):**
- Avatar, username, VIP badge, invitation code
- Email, phone, wallet address
- Credit score progress bar
- Balance, today's commission, and remaining tasks — all in USDT

**Menu sections:**

| Section | Items |
|---|---|
| My Financial | Deposit, Withdrawal |
| My Details | Personal Information, Bind Wallet Address |
| Other | Contact Us (Support), Notifications, Logout |

Badge counts are shown on Contact Us and Notifications items.

---

#### `PersonalInformation` ([optimization-front/src/pages/PersonalInformation.tsx](optimization-front/src/pages/PersonalInformation.tsx))

Editable form for the user's email, phone number, and gender. Username is shown but read-only.

Saves via `PUT /api/users/{id}/profile` with Bearer token auth. Calls `refreshUser()` on success and navigates back to `/profile`.

---

#### `WalletBinding` ([optimization-front/src/pages/WalletBinding.tsx](optimization-front/src/pages/WalletBinding.tsx))

Form to bind a USDT withdrawal wallet. Fields: exchange/network name + wallet address (textarea for full address paste).

Saves via `PUT /api/users/{id}/profile`. Validates that wallet address is not empty before saving.

---

#### `Deposit` ([optimization-front/src/pages/Deposit.tsx](optimization-front/src/pages/Deposit.tsx))

**Tabs:** Deposit | History  
On the Deposit tab: user enters a USDT amount and clicks **Submit Deposit Request**. This creates a support ticket via `POST /api/support/tickets` with a pre-filled subject and message, then navigates the user to `/support?ticket={id}` so they can follow up directly with an agent.

The History tab currently shows a static "unavailable" message.

Inactive accounts are shown a warning banner and redirected to support on action.

---

#### `Withdraw` ([optimization-front/src/pages/Withdraw.tsx](optimization-front/src/pages/Withdraw.tsx))

Fields: withdrawal amount, withdrawal password.

**Validation:**
- Amount must be positive and not exceed current balance
- Withdrawal password must match `user.withdraw_password` (compared client-side — improvement area)

On success: deducts balance via `POST /api/users/{id}/balance`, then creates a support ticket with wallet & exchange details, and navigates to the ticket.

Also shows withdrawal rules (minimum amount, processing time, wallet binding requirement).

---

#### `Support` ([optimization-front/src/pages/Support.tsx](optimization-front/src/pages/Support.tsx))

Full-featured support inbox page with real-time chat.

**Features:**
- Ticket list sidebar (polled every 6 seconds)
- Active ticket message thread
- WebSocket live messaging — messages appear instantly without polling
- New chat creation (subject + optional first message)
- Automatic scroll to bottom on new messages
- Unread badge refresh on message receipt
- Deep-link via `?ticket={id}` query param (used by Deposit/Withdraw redirects)
- All message content is dynamically translated into the active language

---

#### `Notifications` ([optimization-front/src/pages/Notifications.tsx](optimization-front/src/pages/Notifications.tsx))

Fetches all active notifications from `/api/notifications` (no auth required). Displays title, timestamp, recipients, and body. Marks all fetched notifications as read on load by saving IDs to localStorage.

Dynamic translation is applied to notification text.

---

#### `Faqs` ([optimization-front/src/pages/Faqs.tsx](optimization-front/src/pages/Faqs.tsx))

Static FAQ page. Content is loaded from i18n translation keys `faqP1`, `faqP2`, `faqP3`.

---

### Components

#### `Layout` ([optimization-front/src/components/Layout.tsx](optimization-front/src/components/Layout.tsx))

Outer shell component rendered for all authenticated routes. Contains:
- A scrollable content area with `<Outlet />` for child routes
- A fixed bottom navigation bar with three tabs: **Home**, **Starting** (elevated centre button with `ShipWheelIcon`), **Records**
- An account-not-activated warning banner shown when `user.status !== 'Active'`

#### `ChatModal` ([optimization-front/src/components/ChatModal.tsx](optimization-front/src/components/ChatModal.tsx))

Floating support chat bubble / modal. Used on the `Starting` page to allow users to contact support without leaving the task flow.

Props:
| Prop | Type | Description |
|---|---|---|
| `token` | `string \| null` | Auth token for API calls |
| `presetMessage` | `string \| null` | Pre-fills the message input |
| `presetSubject` | `string \| null` | Pre-fills the subject field |
| `openSignal` | `number` | Incrementing signal to programmatically open the modal |

Behaviour: on open, fetches the most recent support ticket. If a ticket exists, opens it and connects via WebSocket. Otherwise, shows a "new ticket" form. Messages are dynamically translated.

#### `BrandIcons` ([optimization-front/src/components/BrandIcons.tsx](optimization-front/src/components/BrandIcons.tsx))

Two inline SVG components:
- `BrandHomeIcon` — house/home silhouette with door opening, used for branding throughout the app
- `ShipWheelIcon` — nautical wheel used as the central "Starting" nav button icon

---

### Hooks

#### `useDynamicTranslations` ([optimization-front/src/hooks/useDynamicTranslations.ts](optimization-front/src/hooks/useDynamicTranslations.ts))

Translates an array of dynamic strings (e.g. product names from the database) into the active language at runtime.

**Caching strategy (two layers):**
1. **In-memory cache** (`Map<language, Map<original, translated>>`) — fast lookups within the session
2. **localStorage persistence** (keyed by `dynamic-translation-cache-v1:{lang}`) — survives page refreshes

Only strings not found in either cache are sent to the `/api/translate` batch endpoint. Returns a `translateText(original)` helper function for use in JSX.

When the active language is `en`, strings are returned as-is without any API call.

---

### Libraries (`lib/`)

#### `supportApi.ts` ([optimization-front/src/lib/supportApi.ts](optimization-front/src/lib/supportApi.ts))

REST helpers for the support ticket system. All functions accept an auth token and return typed objects.

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `createSupportTicket` | POST | `/api/support/tickets` | Create a new ticket |
| `listSupportTickets` | GET | `/api/support/tickets` | List all tickets for current user |
| `getSupportTicket` | GET | `/api/support/tickets/{id}` | Fetch a single ticket with messages |
| `postSupportMessage` | POST | `/api/support/tickets/{id}/messages` | Send a message on a ticket |
| `getClientSupportUnreadCount` | GET | `/api/support/client-unread-count` | Get unread message count |
| `markSupportTicketRead` | POST | `/api/support/tickets/{id}/mark-read` | Mark ticket messages as read |

#### `socket.ts` ([optimization-front/src/lib/socket.ts](optimization-front/src/lib/socket.ts))

`SupportSocket` class wrapping the browser `WebSocket` API.

**Connection:** `wss://{host}/api/support/ws?ticket_id={id}&token={jwt}`

**Features:**
- Auto-reconnect (up to 5 attempts, 3-second delay between attempts)
- Intentional disconnect flag to suppress reconnect on logout
- `onMessage(handler)` / `onConnect(handler)` — returns an unsubscribe function
- `send(content)` — sends JSON `{ content }` if socket is open
- `isConnected()` — returns true when `readyState === OPEN`
- Resolves the correct `wss://` or `ws://` protocol from `VITE_API_URL` env var or `window.location`

#### `translationApi.ts` ([optimization-front/src/lib/translationApi.ts](optimization-front/src/lib/translationApi.ts))

`translateBatch(texts, targetLanguage, sourceLanguage?)` — sends a batch of strings to `POST /api/translate` and returns translated strings in the same order. Falls back to original strings on API failure. English target skips the API call entirely.

`normalizeLanguageCode(language)` — normalises locale strings (e.g. `en-US` → `en`) to supported codes.

#### `vipApi.ts` ([optimization-front/src/lib/vipApi.ts](optimization-front/src/lib/vipApi.ts))

| Function | Description |
|---|---|
| `fetchVipLevels()` | GET `/api/vip-levels` — returns sorted VIP configs, falls back to defaults on error |
| `getDefaultVipLevels()` | Returns hardcoded default VIP 1–4 configuration |
| `findVipLevelConfig(level, allLevels)` | Finds the config for a specific VIP level |

**Default VIP levels:**

| Level | Activation | Tasks/Set | Commission | Combo Rate |
|---|---|---|---|---|
| VIP 1 | 100 USDT | 40 | 2% | 9% |
| VIP 2 | 200 USDT | 45 | 3% | 12% |
| VIP 3 | 500 USDT | 50 | 5% | 15% |
| VIP 4 | 1000 USDT | 55 | 8% | 18% |

---

### Internationalisation (i18n)

The app supports 10 languages: English, French, Spanish, Italian, Polish, Russian, German, Dutch, Turkish, Portuguese.

**Static translations** for all UI strings are declared as key-value maps directly in `LanguageContext.tsx`. These cover all labels, buttons, error messages, and template strings (using `{{variable}}` syntax).

**Dynamic translations** (database content like product names and support messages) are handled at runtime by `useDynamicTranslations` + `translationApi.ts` which call the backend translation endpoint.

Language preference is persisted in localStorage under the key `shopping-optimized-language`.

---

### Real-time Messaging (WebSocket)

The `Support` page and `ChatModal` component both connect to a WebSocket endpoint for live chat:

```
wss://{host}/api/support/ws?ticket_id={id}&token={jwt}
```

Messages received follow the `SupportMessage` shape. Outgoing messages are sent as `{ content: string }` JSON. The socket auto-reconnects up to 5 times on unexpected disconnection.

---

### API Communication

All API calls use relative paths (`/api/*`) which are proxied by Vite's dev server to `http://localhost:9000`. In production, the reverse proxy (nginx or Render) handles the forwarding.

Authentication uses Bearer tokens: `Authorization: Bearer {access_token}`. The token is stored inside the user object in localStorage.

---

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Full base URL of the backend API | Falls back to same-host `/api` |

---

### Running the Client Frontend

```bash
cd optimization-front
npm install
npm run dev        # starts on http://localhost:3000
```

Build for production:

```bash
npm run build
npm run preview    # preview built output
```

---

## Admin Frontend (`src/`)

A separate React SPA for platform administrators, running on port **4173**.

### Tech Stack (Admin)

Same core stack as the client frontend plus **Recharts** for data visualisation charts on the dashboard.

### Admin Auth

Handled by `AdminAuthContext` ([src/context/AdminAuthContext.tsx](src/context/AdminAuthContext.tsx)), which stores admin credentials independently from the client auth.

### Admin Pages

| Route | Page | Description |
|---|---|---|
| `/dashboard` | `Dashboard` | Platform statistics and charts |
| `/users` | `Users` | User management (view, edit, activate/deactivate) |
| `/products` | `Products` | Product catalogue management |
| `/combos` | `Combos` | Combo task bundle management |
| `/tasks` | `Tasks` | View all task records |
| `/transactions` | `Transactions` | Balance transaction history |
| `/withdrawals` | `Withdrawals` | Withdrawal request management |
| `/notifications` | `Notifications` | Send platform-wide notifications |
| `/activity-logs` | `ActivityLogs` | Audit trail of admin actions |
| `/vip-levels` | `VIPLevels` | Configure VIP tier parameters |
| `/balance-adder` | `BalanceAdder` | Manually add/subtract user balances |
| `/tracked-clicks` | `TrackedClicks` | Track referral link clicks |
| `/settings` | `Settings` | Platform configuration |
| `/support` | `SupportDesk` | Admin support ticket inbox |

### Running the Admin Frontend

```bash
# from repo root
npm install
npm run dev        # starts on http://localhost:4173
```

---

## Shared Backend API

The FastAPI backend exposes all endpoints under `/api/`. Key endpoint groups:

| Prefix | Description |
|---|---|
| `/api/auth/login` | User login (returns JWT) |
| `/api/auth/signup` | User registration |
| `/api/users/me` | Get current user |
| `/api/users/{id}/profile` | Update user profile |
| `/api/users/{id}/balance` | Adjust user balance |
| `/api/users/{id}/pending-tasks` | Get unresolved tasks |
| `/api/users/{id}/task-records` | Get task history |
| `/api/tasks/start` | Start a new optimisation task |
| `/api/tasks/{code}/submit` | Submit a completed task |
| `/api/products` | List products |
| `/api/vip-levels` | Get VIP tier configuration |
| `/api/notifications` | Get active notifications |
| `/api/support/tickets` | CRUD for support tickets |
| `/api/support/tickets/{id}/messages` | Post support messages |
| `/api/support/ws` | WebSocket for live support chat |
| `/api/translate` | Batch text translation |

---

## Key Data Models

### `Task`
```ts
{
  id: string;
  title: string;             // product name
  image: string;             // image URL
  price: number;             // task amount in USDT
  commission: number;        // earned commission in USDT
  status: 'pending' | 'pending_debited' | 'completed';
  createdAt: string;
  taskCode: string;          // unique reference code
  isCombo?: boolean;         // true for multi-product combo tasks
  comboId?: number | null;
  products?: Array<{         // only for combo tasks
    product_id: number;
    product_name: string;
    price: number;
    commission: number;
  }>;
}
```

### `SupportTicket`
```ts
{
  id: number;
  subject: string;
  status: string;            // 'open' | 'closed' | 'resolved' | 'in_progress' | 'pending'
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
}
```

### `VipLevelConfig`
```ts
{
  level: number;
  commission_rate: number;   // % commission per task
  combo_rate: number;        // % commission for combo tasks
  activation_amount: number; // USDT required to activate this VIP tier
  tasks_per_set: number;     // tasks in a daily set
}
```

---

## User Journey / Flow

```
Login
  └─► Home (dashboard, VIP info, quick links)
        ├─► Starting (start → optimise → submit task, repeat up to tasks_per_set)
        │     └─► If balance negative → Deposit prompt / ChatModal
        ├─► Records (view completed and pending tasks)
        ├─► Profile
        │     ├─► Personal Information (edit email/phone/gender)
        │     ├─► Wallet Binding (bind USDT address)
        │     ├─► Deposit (create deposit support ticket)
        │     ├─► Withdraw (deduct balance + create withdrawal ticket)
        │     ├─► Support (live support chat inbox)
        │     └─► Notifications (platform announcements)
        └─► FAQs
```

---

## Known Improvement Areas

The following areas have been identified as candidates for improvement:

1. **Client-side withdrawal password comparison** — `Withdraw.tsx` compares the withdrawal password against `user.withdraw_password` stored in client state. This should be validated server-side only.

2. **No pagination on Records page** — All task records are fetched in a single request. This will not scale for users with many tasks. Implement cursor or page-based pagination.

3. **Deposit history tab is a stub** — The History tab in `Deposit.tsx` shows a static "unavailable" message. A real transaction history endpoint and UI are needed.

4. **i18n strings embedded in `LanguageContext`** — All static translations live in one large file. As the app grows, these should be split into per-language JSON files loaded asynchronously.

5. **FAQs are fully static** — The `Faqs.tsx` page renders three hard-coded translation keys. A dynamic FAQ management system via the admin dashboard would allow content updates without code changes.

6. **No loading skeletons** — Most pages show a blank state while data loads. Skeleton loaders would improve perceived performance.

7. **Hardcoded fallback image** — `https://picsum.photos/seed/fallback/300/300` is used as the fallback product image. Replace with a branded placeholder served from your own CDN.

8. **`ChatModal` only opens the most recent ticket** — It fetches only `limit: 1`. Users with multiple tickets cannot switch tickets from the modal. Link directly to the full Support page instead, or allow ticket selection.

9. **No error boundaries** — Unhandled component errors will crash the app. Add React Error Boundaries around page-level components.

10. **Notification read state is localStorage only** — Read notification IDs are stored in localStorage. They do not sync across devices or browsers.

11. **Combo tasks require a negative balance** — The UX around `pending_debited` tasks (where the user's balance goes negative and they must top up) is confusing. Consider improving the messaging and guidance here.

12. **No unit or integration tests** — There are no test files in either frontend. Add tests for auth flows, task submission, and API helper functions at minimum.

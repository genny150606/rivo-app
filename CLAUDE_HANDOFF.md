# RIVO — AI Agent Handoff Document

> **Last updated:** 2026-09-15  
> **Last commit:** `initial-planning` (see below)  
> **Project status:** Planning complete. Implementation not yet started.

---

## Project Objective

RIVO is a **B2B SaaS platform** for local businesses. It provides physical NFC + QR devices that redirect customers through RIVO's platform to configurable digital destinations (primarily Google Reviews).

**Core value proposition:** The NFC/QR chip contains a permanent RIVO URL. The actual destination is managed in the RIVO dashboard. This means the business owner can change the destination (e.g., a new Google Review link) without reprogramming any physical device.

**Tracking flow:**
```
NFC tap / QR scan → RIVO server (/t/DEVICE_CODE) → log interaction → redirect to destination_url
```

The platform includes:
- Multi-tenant organization management
- Location and device management
- Real-time interaction tracking and analytics
- Admin dashboard (RIVO internal) and Client dashboard (per business)
- Role-based access control enforced at the database level via RLS

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Icons | Lucide React |
| ID generation | nanoid (for device codes) |
| Deployment | Vercel |
| Font | Inter (via next/font/google) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Next.js App Router                  │   │
│  │                                                  │   │
│  │  /t/[code]        → Public tracking redirect     │   │
│  │  /(auth)/*        → Login, password setup        │   │
│  │  /(dashboard)/*   → Client dashboard (role: client) │
│  │  /admin/*         → Admin dashboard (role: admin)│   │
│  │                                                  │   │
│  │  middleware.ts     → Auth + role-based routing    │   │
│  └──────────────┬───────────────────────────────────┘   │
│                 │                                       │
└─────────────────┼───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL   │  │  Auth        │  │  Storage     │  │
│  │  (7 tables)   │  │  (users)     │  │  (logos)     │  │
│  │  + RLS        │  │  + roles     │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Multi-tenant hierarchy:**
```
RIVO (platform)
  └── Organization (e.g., "Bar Centrale")
        └── Location (e.g., "Napoli Centro")
              └── Device (e.g., "Tavolo 3")
                    └── Interactions (tracked taps/scans)
```

---

## Planned Folder Structure

```
f:\rivo-dashboard\
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, password setup pages
│   │   │   ├── login/
│   │   │   └── setup-password/
│   │   ├── (dashboard)/         # Client dashboard (protected: role=client)
│   │   │   ├── layout.tsx       # Sidebar + header
│   │   │   ├── page.tsx         # Overview
│   │   │   ├── analytics/
│   │   │   ├── devices/
│   │   │   ├── locations/
│   │   │   ├── reviews/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── admin/               # Admin dashboard (protected: role=admin)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Admin overview
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx     # Orgs table
│   │   │   │   ├── new/         # Multi-step wizard
│   │   │   │   └── [id]/        # Org detail + edit
│   │   │   └── devices/
│   │   ├── t/
│   │   │   └── [code]/
│   │   │       └── route.ts     # Public tracking redirect (Route Handler)
│   │   ├── layout.tsx
│   │   └── page.tsx             # Root redirect
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card, Table, Dialog, Toast, etc.
│   │   ├── dashboard/           # Client dashboard components
│   │   └── admin/               # Admin dashboard components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   ├── server.ts        # Server Supabase client (cookies-based)
│   │   │   └── admin.ts         # Service role client (server-only)
│   │   ├── utils.ts
│   │   └── types.ts             # TypeScript types for all entities
│   └── middleware.ts            # Auth check + role routing
├── public/
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.local                   # Local env vars (gitignored)
├── .gitignore
└── CLAUDE_HANDOFF.md
```

---

## Database Schema (Supabase / PostgreSQL)

> **Status:** NOT YET CREATED. The Supabase project does not exist yet. It must be created via the Supabase MCP.

### Table: `plans`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| price | numeric(10,2) | NOT NULL, default 0 |
| billing_period | text | NOT NULL, default 'monthly' |
| limits | jsonb | default '{}' |
| created_at | timestamptz | NOT NULL, default now() |

Seed with: Free ($0), Starter ($29), Pro ($79)

### Table: `organizations`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| logo_url | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| website | text | nullable |
| status | text | NOT NULL, default 'active', CHECK IN ('active', 'suspended', 'inactive') |
| plan_id | uuid | FK → plans(id) |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### Table: `profiles`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| auth_user_id | uuid | NOT NULL, UNIQUE, FK → auth.users(id) ON DELETE CASCADE |
| organization_id | uuid | FK → organizations(id), nullable for admins |
| role | text | NOT NULL, CHECK IN ('admin', 'client') |
| first_name | text | nullable |
| last_name | text | nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### Table: `locations`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | uuid | NOT NULL, FK → organizations(id) ON DELETE CASCADE |
| name | text | NOT NULL |
| address | text | nullable |
| city | text | nullable |
| postal_code | text | nullable |
| country | text | default 'IT' |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### Table: `devices`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | uuid | NOT NULL, FK → organizations(id) ON DELETE CASCADE |
| location_id | uuid | NOT NULL, FK → locations(id) ON DELETE CASCADE |
| name | text | NOT NULL |
| type | text | NOT NULL, default 'both', CHECK IN ('nfc', 'qr', 'both') |
| unique_code | text | NOT NULL, UNIQUE |
| destination_url | text | NOT NULL |
| status | text | NOT NULL, default 'active', CHECK IN ('active', 'inactive') |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

**Device code format:** `RIVO-` + 6 uppercase alphanumeric chars (e.g., `RIVO-8F29KD`)

### Table: `interactions`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | uuid | NOT NULL, FK → organizations(id) |
| location_id | uuid | NOT NULL, FK → locations(id) |
| device_id | uuid | NOT NULL, FK → devices(id) |
| interaction_type | text | NOT NULL, CHECK IN ('nfc', 'qr', 'unknown') |
| timestamp | timestamptz | NOT NULL, default now() |
| user_agent | text | nullable |
| referrer | text | nullable |
| anonymous_session_id | text | nullable |

### Table: `subscriptions`

| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | uuid | NOT NULL, FK → organizations(id) ON DELETE CASCADE |
| plan_id | uuid | NOT NULL, FK → plans(id) |
| status | text | NOT NULL, default 'active', CHECK IN ('active', 'past_due', 'canceled', 'trialing') |
| start_date | timestamptz | NOT NULL, default now() |
| end_date | timestamptz | nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

### Indexes

| Table | Index | Columns |
|-------|-------|---------|
| interactions | idx_interactions_org_ts | (organization_id, timestamp) |
| interactions | idx_interactions_device_ts | (device_id, timestamp) |
| interactions | idx_interactions_location_ts | (location_id, timestamp) |
| devices | idx_devices_unique_code | unique_code (UNIQUE) |
| devices | idx_devices_org | organization_id |
| organizations | idx_organizations_slug | slug (UNIQUE) |
| profiles | idx_profiles_auth_user | auth_user_id (UNIQUE) |
| profiles | idx_profiles_org | organization_id |

### Entity Relationships

```
plans 1──────* organizations
organizations 1──────* locations
organizations 1──────* devices
organizations 1──────* profiles
organizations 1──────* subscriptions
organizations 1──────* interactions
locations 1──────* devices
locations 1──────* interactions
devices 1──────* interactions
plans 1──────* subscriptions
auth.users 1──────1 profiles
```

---

## Row Level Security & Policies

> **Status:** NOT YET CREATED.

### Strategy

- RLS enabled on ALL tables
- Security enforced at database level, NOT frontend
- Helper function: `get_user_role()` returns the role from `profiles` for `auth.uid()`
- Helper function: `get_user_org_id()` returns the `organization_id` from `profiles` for `auth.uid()`

### Policy Summary

| Table | Admin | Client | Public (anon) |
|-------|-------|--------|--------------|
| plans | full CRUD | SELECT | — |
| organizations | full CRUD | SELECT own org | — |
| profiles | full CRUD | SELECT/UPDATE own | — |
| locations | full CRUD | SELECT own org | — |
| devices | full CRUD | SELECT own org | SELECT by unique_code (for tracking) |
| interactions | full CRUD | SELECT own org | INSERT (for tracking endpoint*) |
| subscriptions | full CRUD | SELECT own org | — |

> *Note: The tracking endpoint (`/t/[code]`) uses the **Supabase service role key** server-side for inserts, so the public INSERT policy on `interactions` may not be needed. Decision: use service role for tracking to maximize speed and avoid RLS overhead on the hot path.

---

## Roles

### ADMIN (RIVO internal)

- Can: create/edit/suspend organizations, create/invite users, manage all locations/devices, view global analytics, manage plans, regenerate device codes
- Access: `/admin/*`
- Identified by: `profiles.role = 'admin'`

### CLIENT (business owner)

- Can: view own dashboard/analytics/devices/locations, edit own profile/business info, change password
- Cannot: see other organizations, access admin, create organizations/users
- Access: `/(dashboard)/*`
- Identified by: `profiles.role = 'client'`

### Account creation flow

1. Admin creates organization via wizard
2. Supabase Auth `admin.createUser()` creates the user with an invite email
3. Client receives email → sets password via `/setup-password`
4. No public registration exists

---

## Authentication

- **Provider:** Supabase Auth (email/password)
- **Session management:** Supabase SSR helpers with cookies
- **Middleware:** `middleware.ts` checks auth on every request, redirects unauthenticated users to `/login`, checks role for `/admin/*` access
- **No public signup** — only admin-created accounts

---

## Admin Dashboard — Status: NOT STARTED

**Planned pages:**
- `/admin` — Overview with KPI cards (total orgs, active devices, total interactions)
- `/admin/organizations` — Table of all organizations with status, plan, stats
- `/admin/organizations/new` — Multi-step wizard (6 steps: business info → location → owner → plan → devices → review)
- `/admin/organizations/[id]` — Organization detail with edit, locations, devices, analytics

---

## Client Dashboard — Status: NOT STARTED

**Planned pages:**
- `/` — Overview with KPI cards + interaction trend chart
- `/analytics` — Full analytics (time series, device performance, location breakdown)
- `/devices` — Device list with status, tracking URL, interaction count
- `/locations` — Location list
- `/reviews` — Google integration placeholder ("coming soon")
- `/profile` — Edit business info
- `/settings` — Account settings

---

## Organizations — Status: NOT STARTED

- Created by Admin only (via wizard)
- Each org has: name, slug, contact info, plan, status
- Multi-tenant isolation via `organization_id` on all data tables + RLS

---

## Locations — Status: NOT STARTED

- Belong to an organization
- Have: name, address, city, postal code, country
- Devices are assigned to locations

---

## Devices — Status: NOT STARTED

- Belong to an organization + location
- Have a `unique_code` (format: `RIVO-XXXXXX`) and `destination_url`
- Can be activated/deactivated
- Destination URL is editable without changing the NFC chip

---

## NFC/QR Tracking

### Tracking URL format
```
https://[DOMAIN]/t/[DEVICE_CODE]?source=nfc|qr
```

Example: `https://rivo.vercel.app/t/RIVO-8F29KD?source=nfc`

### Flow
1. Customer taps NFC or scans QR → browser opens `/t/RIVO-8F29KD?source=nfc`
2. Next.js Route Handler (`/t/[code]/route.ts`):
   - Queries `devices` table by `unique_code`
   - Verifies device `status = 'active'`
   - Determines `interaction_type` from `?source=` param (nfc/qr/unknown)
   - Inserts row into `interactions` (using service role key, server-side)
   - Returns `308 Permanent Redirect` to `destination_url`
3. Customer sees Google Reviews page (or configured destination)

### Performance priority
- Route Handler with edge runtime consideration
- No intermediate page, no loading screen
- Perceived as: TAP → Google (instant)

---

## Redirect Endpoint — Status: NOT STARTED

**Route:** `GET /t/[code]`

**Implementation:** Next.js Route Handler (`route.ts`), NOT a page component.

**Query params:**
- `?source=nfc` → `interaction_type = 'nfc'`
- `?source=qr` → `interaction_type = 'qr'`
- missing/other → `interaction_type = 'unknown'`

**Response:** `308 Permanent Redirect` with `Location: destination_url`

**Error handling:**
- Device not found → 404 page
- Device inactive → appropriate error page

---

## RIVO URL Structure

| Route | Access | Purpose |
|-------|--------|---------|
| `/login` | Public | Login page |
| `/setup-password` | Public (with token) | First-time password setup |
| `/` | Client (authenticated) | Client overview dashboard |
| `/analytics` | Client | Analytics page |
| `/devices` | Client | Device management |
| `/locations` | Client | Location management |
| `/reviews` | Client | Google Reviews section |
| `/profile` | Client | Business profile |
| `/settings` | Client | Account settings |
| `/admin` | Admin | Admin overview |
| `/admin/organizations` | Admin | Organizations table |
| `/admin/organizations/new` | Admin | Create organization wizard |
| `/admin/organizations/[id]` | Admin | Organization detail |
| `/t/[code]` | Public | Tracking redirect (no UI) |

---

## Analytics — Status: NOT STARTED

**Planned metrics (all from real `interactions` table):**
- Total interactions (filtered by date range)
- NFC count, QR count, ratio
- Interactions per day (time series chart)
- Interactions per device (ranked table)
- Interactions per location
- Day-of-week distribution
- Growth % vs previous equal-length period
- Most active device
- Last interaction timestamp

**Filters:** 7d, 30d, 90d, 12m, custom range

**Charts library:** Recharts

---

## Vercel Configuration — Status: NOT STARTED

- Deploy via Vercel CLI (`npx vercel --prod`)
- Auto-generated `.vercel.app` domain initially
- Architecture ready for custom domain (`rivo.it`) later

---

## Environment Variables

> **DO NOT put actual values here. These are the variable names only.**

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + .env.local | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + .env.local | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + .env.local | Supabase service role (server-only, NEVER exposed to client) |

---

## What Is Completely Functional

**Nothing.** The project is in planning phase only. No code, no database, no deployment exists.

---

## What Is Partially Implemented

**Nothing.** Only the implementation plan has been created and approved conceptually.

---

## What Is Missing (Everything)

- [ ] Next.js project initialization
- [ ] Supabase project creation (via MCP: org `kpcdeekcriljtscaulyg`, region `eu-central-1`, free tier $0/mo)
- [ ] Database schema (7 tables + indexes + FK)
- [ ] RLS policies + helper functions
- [ ] Supabase Auth configuration
- [ ] Admin account creation
- [ ] Design system + Tailwind config (RIVO brand: near-black, neutral grays, lime accent)
- [ ] UI components (Button, Input, Card, Table, Dialog, Toast, Sidebar, etc.)
- [ ] Middleware (auth + role routing)
- [ ] Supabase client helpers (browser, server, admin)
- [ ] Auth pages (login, setup-password)
- [ ] Admin dashboard (overview, organizations table, create wizard, org detail)
- [ ] Client dashboard (overview, analytics, devices, locations, reviews, profile, settings)
- [ ] Tracking redirect endpoint (`/t/[code]`)
- [ ] Responsive design
- [ ] Empty states, loading states, error states, toasts
- [ ] Vercel deployment
- [ ] End-to-end testing
- [ ] Production verification

---

## Known Bugs

None — no code exists yet.

---

## Recommended Next Tasks (In Order)

1. **Create Supabase project** via MCP (`create_project`, org: `kpcdeekcriljtscaulyg`, region: `eu-central-1`)
2. **Initialize Next.js project** (`npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-import-alias`)
3. **Install dependencies** (`@supabase/supabase-js @supabase/ssr recharts lucide-react nanoid`)
4. **Apply database migrations** via MCP (all 7 tables + indexes + FKs)
5. **Apply RLS policies** via MCP
6. **Get Supabase credentials** via MCP (`get_project_url`, `get_publishable_keys`) and create `.env.local`
7. **Build design system** (Tailwind config + base UI components)
8. **Build middleware** (auth + role routing)
9. **Build Supabase client helpers**
10. **Build auth pages** (login, setup-password)
11. **Build admin dashboard** (overview → org table → create wizard → org detail)
12. **Build tracking endpoint** (`/t/[code]`)
13. **Build client dashboard** (overview → analytics → devices → locations → reviews → profile → settings)
14. **Responsive design pass**
15. **Build & lint verification**
16. **Vercel deployment**
17. **End-to-end production test**

---

## Architectural Decisions

1. **Dark mode default** — Aligns with premium B2B positioning. Light mode can be added later.
2. **Service role key for tracking inserts** — The `/t/[code]` endpoint uses server-side service role key for DB inserts (not exposed to client). This avoids RLS overhead on the performance-critical hot path.
3. **No public registration** — Accounts are admin-created only, using Supabase Auth admin API (`auth.admin.createUser`).
4. **Route Handler for tracking** — `/t/[code]/route.ts` is a Route Handler (not a page), returning a redirect with no HTML rendering.
5. **Server Components for dashboard** — SSR data fetching to avoid client-side waterfalls.
6. **nanoid for device codes** — Custom alphabet (uppercase alphanumeric), prefixed with `RIVO-`.
7. **Recharts for analytics** — Lightweight, React-native, composable.
8. **Multi-tenant isolation** — Enforced at database level via RLS using `organization_id`. Frontend role checks are convenience, not security.
9. **Slug-based organization identification** — Organizations have unique slugs for potential future subdomain/URL usage.

---

## Supabase MCP Reference

The Supabase MCP server is available with these key tools:
- `create_project` — requires `confirm_cost` first (cost is $0/mo for free tier)
- `apply_migration` — for DDL (CREATE TABLE, etc.)
- `execute_sql` — for DML (INSERT, SELECT, etc.)
- `get_project_url` — get API URL
- `get_publishable_keys` — get anon key
- Organization ID: `kpcdeekcriljtscaulyg`

Flow to create project:
1. `get_cost` (done: $0/month)
2. `confirm_cost` (type: "project", recurrence: "monthly", amount: 0)
3. `create_project` (name: "rivo", region: "eu-central-1", organization_id: "kpcdeekcriljtscaulyg", confirm_cost_id from step 2)
4. Wait for project to be ACTIVE (`get_project` to poll status)
5. `get_project_url` + `get_publishable_keys` for env vars

---

## Vercel CLI Reference

Vercel CLI v59.17.0 is installed. Deploy with:
```bash
npx vercel --prod
```

Environment variables must be set in Vercel project settings or via CLI:
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## NEXT ACTION

**Create the Supabase project and initialize the Next.js codebase.**

Specifically:

1. Run `confirm_cost` via Supabase MCP (type: "project", recurrence: "monthly", amount: 0)
2. Run `create_project` via Supabase MCP (name: "rivo", region: "eu-central-1", organization_id: "kpcdeekcriljtscaulyg")
3. Poll `get_project` until status is `ACTIVE_HEALTHY`
4. Run `get_project_url` and `get_publishable_keys` to get credentials
5. Initialize Next.js project in `f:\rivo-dashboard` with: `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-import-alias`
6. Install additional dependencies: `npm install @supabase/supabase-js @supabase/ssr recharts lucide-react nanoid`
7. Create `.env.local` with Supabase credentials
8. Apply all database migrations (7 tables) via `apply_migration`
9. Apply RLS policies via `apply_migration`
10. Configure Tailwind with RIVO design tokens
11. Build base UI components

After this, the project will have a real database, real credentials, and a buildable codebase — ready for feature development starting with the Admin dashboard.

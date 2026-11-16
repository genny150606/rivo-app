# RIVO — INITIAL REPOSITORY INTELLIGENCE & VISUAL AUDIT

**Audit Date:** 2026-11-15  
**Repository:** `f:\rivo-dashboard` (Git commit `ff186eb`, branch `main`)  
**Auditor:** CTO / Creative Director / Engineering Manager (Autonomous Design Revolution)

---

## 1. Executive Summary

RIVO possesses a solid multi-vertical technical backbone (Next.js 16 App Router, React 19, Tailwind CSS v4, Supabase SSR + RLS, physical NFC/QR hardware routing at `/t/[code]`, and vertical-gated modules for `food_hospitality` and `retail_store`). However, its **frontend visual execution is severely fragmented** across three competing dark palettes, broken Light/Dark theme support across >15 dashboard subpages, missing shared UI primitives, mobile navigation overflow bugs, and generic AI-generated SaaS clichés on the public landing page.

---

## 2. Actual Repository & Architecture Inventory

### 2.1 Core Technology Stack (`package.json`)
- **Framework:** Next.js `16.3.5` (dev) / `16.1.6` (package spec) App Router (`src/app`)
- **UI Runtime:** React `19.2.3`, Tailwind CSS v4 (`@tailwindcss/postcss`, `@import "tailwindcss";`)
- **Animation:** `framer-motion` (also `canvas-confetti` currently installed for simulator click fireworks)
- **Data Visualization:** `recharts`
- **Icons:** `lucide-react`
- **Theming:** `next-themes` (`ThemeProvider` in `src/components/theme-provider.tsx`, `ThemeToggle` in `src/components/theme-toggle.tsx`)
- **Backend / Auth:** `@supabase/supabase-js`, `@supabase/ssr`
- **Testing & Build:** `vitest` (`npm test` — baseline verified: **12 test files, 83 tests passing**), `next build`

### 2.2 Platform & Routing Architecture
- **Middleware (`src/middleware.ts`):** Handles Supabase session validation, protects `/dashboard/*` and `/admin/*`, redirects unauthenticated dashboard visitors to `/login`, and rewrites custom domains to `/hub/[code]`.
- **Vertical & Module System:**
  - `src/platform/verticals/registry.ts` — Defines `food_hospitality` and `retail_store` verticals.
  - `src/platform/modules/registry.ts` — Defines feature capabilities & module permissions.
  - `src/platform/navigation/sidebar.ts` — Computes sidebar structure (`buildSidebar`) per tenant vertical & active modules.
- **Public & Demo Routes:**
  - `/` (`src/app/page.tsx`) — Public B2B marketing landing page composed of `LandingNavbar`, `LandingAmbientCanvas`, `LandingHeroSimulator`, `LandingDualVertical`, `LandingBentoGrid`, `LandingArchitectureFlow`, `LandingCostComparison`, `LandingLeadCapture`, `LandingFooter`.
  - `/login` (`src/app/login/page.tsx`) — Split-screen merchant authentication.
  - `/demo/retail` (`src/app/demo/retail/page.tsx`) — Interactive public live retail showcase (`Borrelli Calzature`) with Standard Dark UI and "Modalità Semplice ERP" retro light mode.
- **Physical NFC/QR Hardware Touchpoints (`/t/[code]` -> customer apps):**
  - `/hub/[code]`, `/review/[code]`, `/wheel/[code]`, `/loyalty/[code]`, `/wifi/[code]`, `/ai-sommelier/[code]`, `/call/[code]`.
- **Merchant Workspace (`/dashboard/*`):**
  - Overview (`page.tsx`, `RetailDashboardOverview.tsx`, `SimpleRetailERPView.tsx`), Hardware & Hubs (`devices`, `custom-hub`, `analytics`), Growth (`reviews`, `loyalty`, `coupons`, `leads`), Hospitality (`tables`, `service`, `waiter`, `menu`, `bookings`), Retail ERP (`products`, `sales`, `inventory`, `stock-check`, `suppliers`, `scanner`, `import`), Settings (`staff`, `locations`, `profile`, `settings`).
- **Superadmin Console (`/admin/*`):**
  - Overview (`page.tsx`), `organizations`, `devices`, `outreach`.

---

## 3. Baseline Browser Inspection & Visual Findings

Live browser inspection was conducted against `http://localhost:3000` at Desktop (`1440×900`) and Mobile (`390×844`).

Baseline screenshots preserved in `docs/design-revolution/screenshots/before/`:
- `landing-desktop-before.png`
- `landing-mobile-before.png`
- `login-before.png`
- `demo-retail-before.png`
- `demo-retail-simple-before.png`

### Critical Defects Observed

#### Defect 1 — Severe Mobile Navigation Overflow on `/` (`390×844`)
- Desktop navigation links inside `LandingNavbar` fail to stay cleanly isolated at mobile widths, causing a **317px horizontal overflow** (`x = 707px` on a `390px` viewport) and collision with background scroll elements.
- Sticky navbar uses heavy translucent dark blur (`backdrop-blur-md bg-black/60`) where scrolled white headings bleed awkwardly into nav text.

#### Defect 2 — Generic AI-SaaS Clichés & Brand Dilution on `/` and `/login`
- Multi-color rainbow gradient text (`from-emerald-400 via-teal-300 to-indigo-400`) on the hero headline (`Fisico-Digitale`).
- `LandingAmbientCanvas` renders floating colorful constellation dots across the background.
- `Sparkles` icons attached to enterprise CTA buttons (`Live Demo`, `Esplora Demo Retail Live`).
- `canvas-confetti` fireworks triggered inside the simulator when switching product tabs.
- Random competing semantic colors in the hero KPI row (emerald, white, amber `#F59E0B`) with no unified RIVO Volt (`#BFFF00`) + Deep Graphite brand authority.
- `/login` places muted `ACCESSO RISERVATO` indigo pills, low-contrast email/password placeholders, and mismatched pure-black `#000` right panel next to a teal radial glow left panel.

#### Defect 3 — Light/Dark Mode Schism Across `/dashboard/*`
- `DashboardLayout` exposes `ThemeToggle` (`next-themes`) and sets `bg-[#F8FAFC] dark:bg-[#050507]`.
- Over 15 module subpages (`devices`, `loyalty`, `coupons`, `locations`, `settings`, `stock-check`, `profile`, `service`, `tables`, `staff`, `products`, `inventory`, `sales`, `suppliers`) hardcode dark-only backgrounds (`bg-[#121214]`, `bg-[#18181B]`), dark borders (`border-[#27272A]`), and unprefixed `text-white` headings.
- When Light Mode is toggled on, `text-white` titles become invisible on `#F8FAFC`, and dark containers appear as disjointed black slabs inside a light shell.

#### Defect 4 — Three Competing Dark Palettes & Inconsistent Radii
- Shell (`dashboard/layout.tsx`) uses `#050507` / `#0B0C10` + `slate-*`.
- Retail ERP & modules use `#09090B` / `#121214` / `#18181B` + `zinc-*`.
- Admin console uses `#060608` / `#0A0A0E`.
- Card border radii fluctuate unpredictably between `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[24px]`, and `rounded-[32px]`.

#### Defect 5 — Missing Shared UI Component Library & Render-Blocking Fonts
- `src/components/ui/` contains only `CopyTrackingButtons.tsx`. KPI cards, page headers, status pills, empty states, and tables are copy-pasted across pages.
- `src/app/layout.tsx` loads 7 Google Fonts (`Cinzel`, `DM Sans`, `Outfit`, `Playfair Display`, `Plus Jakarta Sans`, `Space Grotesk`, `Syne`) via a single blocking stylesheet link without semantic CSS font variables (`--font-display`, `--font-mono`).

#### Defect 6 — Console & Layout Bugs in `/demo/retail` and `/dashboard`
- **Broken Link:** `src/app/dashboard/page.tsx` links to `/dashboard/hub-studio` instead of `/dashboard/custom-hub` (404).
- **Floating Toast Collision (`/demo/retail`):** The fixed bottom callout banner (`Pronto per Borrelli Calzature`) overlaps left-column interactive cards at `1440×900`.
- **Console Errors (`/demo/retail`):** SSR hydration attribute mismatch warning and unguarded `navigator.vibrate()` browser permission block error observed during baseline browser testing.
- **Redundant Component Folders:** `src/components/` retains unused `home/`, `homepage/`, and `universe/` directories alongside the active `landing/` directory.

---

## 4. Strategic Opportunities

1. **Establish a Singular Brand Signature:** Deep Carbon (`#09090B`), Crisp Alabaster (`#F6F7F9` / `#FFFFFF`), and **RIVO Volt (`#BFFF00`)** paired with `Plus Jakarta Sans`, `Inter`, and tabular `JetBrains Mono`.
2. **Dual-Mode Architecture by Purpose:** Dark mode crafted for executive control, hardware telemetry, and landing infrastructure; crisp high-contrast Light mode crafted for daytime retail POS and dense ERP inventory tables — with shared CSS token variables guaranteeing zero contrast failures on every page.
3. **Enterprise Shared Component Layer:** Introduce reusable primitives (`PageHeader`, `KpiCard`, `SurfaceCard`, `StatusBadge`, `SegmentedControl`, `EmptyState`, `CommandPalette`) inside `src/components/ui/`.
4. **Hardware-First Ergonomics:** Mobile bottom operational dock (`<1024px`), `⌘K` instant command jump, and sub-200ms purposeful transitions respecting `prefers-reduced-motion`.

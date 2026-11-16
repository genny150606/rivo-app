# RIVO UX & INFORMATION ARCHITECTURE SPECIFICATION

**Document Owner:** Agent B — UI/UX Architect (synthesized by CTO)  
**Date:** 2026-11-15  
**Scope:** Multi-vertical Navigation Hierarchy, Dual-Mode Ergonomics, Desktop Command Bar (`⌘K`), Mobile Bottom Dock & Command Sheet, Responsive Tables, and Streamlined Core Flows

---

## 1. Audited UX & Technical Friction

### 1.1 Broken Navigation, Orphaned Routes & Icon Lookup Bugs
1. **404 Link in Hospitality Dashboard:** `src/app/dashboard/page.tsx` links to `/dashboard/hub-studio` instead of `/dashboard/custom-hub`.
2. **Orphaned Implemented Route (`/dashboard/import`):** Registered in `src/platform/modules/registry.ts` and implemented at `src/app/dashboard/import/page.tsx`, yet omitted from `src/platform/navigation/sidebar.ts`.
3. **Broken `ICON_MAP` Entry (`ScanLine`):** `src/platform/navigation/sidebar.ts` imports `ScanLine` and assigns it to `inventory_scanner`, yet omits `'ScanLine': ScanLine` from `ICON_MAP`.
4. **Over-Fragmented Sidebar:** `resolveSidebarNavigation()` emits up to 11 micro-groups (including single-item sections) and buries Hardware Touchpoints (`/dashboard/devices`) near the bottom instead of elevating RIVO's physical NFC/QR fleet.
5. **Silent `shoe_store` Fallback:** `src/app/dashboard/layout.tsx` falls back to `'shoe_store'` when category lookup fails, risking retail vocabulary leaking into non-retail workspaces.
6. **Accessibility & Theme Bugs:** `src/app/layout.tsx` sets `maximumScale: 1` (blocking pinch-zoom) and hardcodes `themeColor: '#09090B'`. Over 15 `/dashboard/*` subpages (`devices`, `loyalty`, `coupons`, `locations`, `settings`, `stock-check`, `profile`, `scanner`, `custom-hub`, `bookings`, `waiter`, `reviews`, `analytics`) lock dark hex colors (`bg-[#121214]`, `bg-[#18181B]`, `text-white`), breaking Light Mode contrast completely.
7. **Antipattern Popups & Visual Spam:** Blocking `window.alert()`/`confirm()` in `sales`, `reviews`, and `demo/retail`; `canvas-confetti` in `scanner` and `LandingHeroSimulator`; `Sparkles` icons on operational B2B controls; fixed `bottom-4` cheat-sheet overlay colliding with content in `/demo/retail`.

---

## 2. Streamlined 5-Pillar Information Architecture

To preserve 100% backward compatibility with `src/platform/navigation/sidebar.ts` and existing unit tests (`resolveSidebarNavigation` / registry tests), the underlying `resolveSidebarNavigation` contract stays intact (while fixing `'ScanLine': ScanLine` in `ICON_MAP` and exposing `/dashboard/import`), and a deterministic `projectNavigationPillars()` view layer organizes UI presentation cleanly into **5 Pillars**:

| Pillar ID | Pillar Label | Retail Persona (`retail_store`) | Hospitality & Service (`food_hospitality`) |
|---|---|---|---|
| `overview` | **Control Center** | Panoramica (`/dashboard`) | Panoramica (`/dashboard`) |
| `touchpoints` | **Touchpoints & Hardware** | Hardware NFC/QR (`/dashboard/devices`), Custom Hub (`/dashboard/custom-hub`) | Hardware NFC/QR (`/dashboard/devices`), Custom Hub (`/dashboard/custom-hub`), Menu Digitale (`/dashboard/menu`), Console Cameriere (`/dashboard/waiter`), Gestione Tavoli (`/dashboard/tables`) |
| `operations` | **Operazioni** | Cassa POS & Vendite (`/dashboard/sales`), Catalogo (`/dashboard/products`), Magazzino (`/dashboard/inventory`), Verifica Stock (`/dashboard/stock-check`), Scanner AI (`/dashboard/scanner`), Import/Export (`/dashboard/import`), Fornitori (`/dashboard/suppliers`) | Prenotazioni (`/dashboard/bookings`), Ordini & Comande (`/dashboard/service`) |
| `growth` | **Crescita & Clienti** | Review Guard (`/dashboard/reviews`), Clienti & Lead (`/dashboard/leads`), Fidelity (`/dashboard/loyalty`), Coupon (`/dashboard/coupons`), Analytics (`/dashboard/analytics`) | Review Guard (`/dashboard/reviews`), Clienti & Lead (`/dashboard/leads`), Fidelity (`/dashboard/loyalty`), Coupon (`/dashboard/coupons`), Analytics (`/dashboard/analytics`) |
| `workspace` | **Workspace & Sistema** | Team (`/dashboard/staff`), Sedi (`/dashboard/locations`), Smart Routing (`/dashboard/profile`), Impostazioni (`/dashboard/settings`) | Team (`/dashboard/staff`), Sedi (`/dashboard/locations`), Smart Routing (`/dashboard/profile`), Impostazioni (`/dashboard/settings`) |

---

## 3. Desktop Command Header (`>= 1024px`)

A sticky `h-14` (`56px`) command bar anchors workspace speed across all modules:
1. **Module Context Breadcrumb:** Dynamic active pillar & route label (`font-mono` eyebrow / workspace status).
2. **Interactive `⌘K` Command Palette (`src/components/ui/CommandPalette.tsx`):** Replaces the non-functional static `⌘K` pill in `dashboard/layout.tsx`. Supports `Cmd+K` / `Ctrl+K` global shortcut, arrow/Enter keyboard navigation, role/module-gated route search, quick actions (`Cambia Tema`, `Nuova Vendita`, `Provisiona Nodo`, etc.), and Escape dismiss.
3. **Hardware Readiness Status Pill:** Honest live device count / telemetry badge linking to `/dashboard/devices`.
4. **Accessible `ThemeToggle` & Retail-Only `SimpleModeToggle`:** Explicit theme switcher (`aria-label`, visible current state) synced with `<meta name="theme-color">`. `SimpleModeToggle` appears **only** when `dashboardType === 'retail'`.

---

## 4. Mobile-First Architecture (`< 1024px`)

### 4.1 Mobile Bottom Navigation Dock (`<= 5` Destinations)
Fixed bottom navigation bar on mobile/tablet (`lg:hidden`) with `env(safe-area-inset-bottom)` clearance, `>= 44px × 44px` tap targets, and `aria-current="page"`:
- **Retail Persona:** `Home` (`/dashboard`) · `Cassa` (`/dashboard/sales`) · `Scanner` (`/dashboard/scanner`) · `Stock` (`/dashboard/inventory`) · `Menu` (opens Command Drawer)
- **Hospitality Persona:** `Sala` (`/dashboard`) · `Tavoli` (`/dashboard/tables`) · `Chiamate` (`/dashboard/waiter`) · `Review` (`/dashboard/reviews`) · `Menu` (opens Command Drawer)
- **Waiter Role:** `Chiamate` (`/dashboard/waiter`) · `Tavoli` (`/dashboard/tables`) · `Comande` (`/dashboard/service`) · `Menu` (`/dashboard/menu`) · `Altro` (opens Command Drawer)

*Collision Fix:* `RetailAICopilot` floating launcher (`src/components/dashboard/RetailAICopilot.tsx`) lifts above the mobile bottom dock (`bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6`) so controls never overlap.

### 4.2 Mobile Command Sheet Drawer
Replaces cramped mobile drawer rows with `min-h-[44px]` navigation buttons, inline quick search, `ThemeToggle`, and vertical badge clarity.

### 4.3 Responsive Table -> Card Stack Pattern
Dense multi-column tables (`products`, `inventory`, `sales`, `leads`, `suppliers`, `staff`, `devices`) render clean `<table>` grids on desktop (`md:block` / `lg:block`) and clean stacked mobile cards (`md:hidden` / `lg:hidden`) with:
- Title + `<StatusBadge />` header
- 2-column `JetBrains Mono` `tabular-nums` metadata grid
- Full-width `min-h-[44px]` primary action buttons

---

## 5. Priority User Flow Upgrades

1. **Main Overview Asymmetric 8/4 Cockpit (`/dashboard`):**
   - Replace broken `/dashboard/hub-studio` banner and repetitive 4-card rows with:
     - Operational Command Header + quick actions
     - 4 compact `KpiCard` telemetry tiles (max 3 data tiers each)
     - **Asymmetric 8/4 Split:** 8-col channel telemetry & momentum analytics (`Recharts` Area/Bar chart or channel breakdown) + 4-col operational readiness & triage queue (`Low Stock` / `Unresolved Alerts` / `Quick Modules`)
     - Live Hardware Interaction Stream ledger (`>= 48px` rows, tabular timestamps)
2. **Hardware Provisioning & Fleet Control (`/dashboard/devices`):**
   - Full dual-mode refactor, inline device preview/copy links (no `alert()`), status pills, scan metrics in tabular mono, and clear destination routing controls.
3. **Review Guard Triage (`/dashboard/reviews`):**
   - Unify dark-locked header/skeletons with dual-mode tokens, replace `alert()` with non-blocking toast banners, label all icon buttons (`min-h-[44px]`), strip `Sparkles`, and add priority rating/status filter clarity.
4. **Retail POS & Public Demo (`/dashboard/sales` & `/demo/retail`):**
   - Remove floating bottom cheat-sheet collision on `/demo/retail`, eliminate off-brand `#00FF66` + `alert()` + `Sparkles` + `rounded-3xl`, unify Light/Dark POS checkout & size lookup under RIVO Control geometry.

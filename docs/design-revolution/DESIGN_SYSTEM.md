# RIVO DESIGN SYSTEM SPECIFICATION (v1.0)

**Document Owner:** Agent C — Design System Engineer (synthesized by CTO)  
**Date:** 2026-11-15  
**Visual Authority:** `.agents/skills/rivo-visual-identity/SKILL.md`  
**Stack:** Next.js 16 App Router • React 19 • Tailwind CSS v4 (`@tailwindcss/postcss`) • `lucide-react` • `recharts`

---

## 1. Architectural Foundations

### 1.1 Dual-Mode Semantic Token Contract (`src/app/globals.css`)
Rather than hardcoding hex colors per component, every surface, hairline border, text layer, focus ring, and chart series binds to semantic CSS custom properties resolved in `:root` (Light Operational Mode) and `.dark` (Dark Control Mode), mapped into Tailwind v4 via `@theme` (fonts) and `@theme inline` (dynamic CSS custom properties).

| Token Group | Light Mode (`:root`) | Dark Mode (`.dark`) | Purpose |
|---|---|---|---|
| `--bg-canvas` | `#F6F7F9` | `#09090B` | Main application canvas |
| `--bg-surface` | `#FFFFFF` | `#111215` | Cards, sidebar, modals, panels |
| `--bg-elevated` | `#F0F2F5` | `#18191E` | Recessed wells, hover rows, nested blocks |
| `--bg-subtle` | `#E8EBEF` | `#1F2128` | Micro tracks, chips, keycaps |
| `--border-subtle` | `#E4E6EB` | `#22242A` | Structural `1px` hairlines |
| `--border-strong` | `#CFD4DC` | `#32353E` | Inputs, interactive hover borders |
| `--text-primary` | `#09090B` | `#F4F4F6` | Headings, primary data, actions |
| `--text-secondary` | `#4B5563` | `#A1A1AA` | Descriptions, body, table copy (`>= 4.5:1`) |
| `--text-muted` | `#6B7280` | `#71717A` | Micro-labels (`>= 11px`), timestamps, ticks |
| `--rivo-volt` | `#BFFF00` | `#BFFF00` | Signature brand CTA/LED fill |
| `--rivo-volt-ink` | `#09090B` | `#09090B` | Mandatory dark ink on `#BFFF00` fills |
| `--rivo-volt-text` | `#15803D` | `#BFFF00` | Accessible WCAG accent typography |
| `--focus-ring` | `#09090B` | `#BFFF00` | Keyboard `:focus-visible` outline |

Semantic status tokens include companion `-text`, `-bg`, and `-border` variants (`--accent-operational`, `--accent-warning`, `--accent-critical`, `--accent-telemetry`) guaranteeing `>= 4.5:1` badge and alert contrast across both themes.

---

## 2. Typography & Route-Scoped Font Architecture

### 2.1 Primary Platform Fonts (`src/app/layout.tsx`)
Loaded via `next/font/google` on `<html>`:
- **`Plus Jakarta Sans` (`--font-plus-jakarta` -> `--font-display`):** Display titles and hero typography (`-0.025em` dashboard, `-0.035em` landing hero).
- **`Inter` (`--font-inter` -> `--font-sans`):** Primary UI copy (`14px–15px` workspace, `16px–18px` marketing).
- **`JetBrains Mono` (`--font-jetbrains-mono` -> `--font-mono`):** Hardware IDs (`RIVO-FMT1GW`), SKUs/EANs, timestamps, currency, margins, percentages — strictly paired with `font-variant-numeric: tabular-nums`.

### 2.2 Secondary Customer Hub Fonts (`src/lib/hub-fonts.ts`)
- Removes the render-blocking `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` from `src/app/layout.tsx`.
- Isolates optional boutique fonts (`Cinzel`, `DM Sans`, `Outfit`, `Playfair Display`, `Space Grotesk`, `Syne`) via `next/font/google` with `preload: false` imported **only** on customer `/hub/*` and Hub Studio preview routes (`HUB_FONT_CLASSES`).

---

## 3. Concentric Radius & Spacing Discipline

- **Grid:** `4px` base spacing system (`p-4`/`p-5`/`p-6`, `gap-4`/`gap-6`).
- **Concentric Corner Scale:**
  - Buttons, Inputs, Badges, Tooltips: `8px` (`rounded-lg`) or `rounded-full` (micro status pills)
  - Standard Cards, KPI Tiles, Dropdowns: `12px` (`rounded-xl`)
  - Major Analytical Panels, Modals, Simulator Containers: `16px` (`rounded-2xl`)
- **Prohibited Radii:** `rounded-[28px]`, `rounded-[32px]`, and `rounded-[48px]` blobs are eliminated across B2B views.

---

## 4. Shared UI Primitives (`src/components/ui/`)

Zero-dependency class composition utility `src/lib/cn.ts` (`cn(...)`) powers a unified component kit exported from `src/components/ui/index.ts`:

1. **`PageHeader`:** Bottom hairline divider, optional mono eyebrow (`volt` | `muted`), `Plus Jakarta Sans` title, description, breadcrumbs/back link, live status badge, and right-aligned action cluster (`loading` skeleton supported).
2. **`SurfaceCard`:** `rounded-xl` / `rounded-2xl` structural card supporting `default`, `elevated`, `subtle`, `interactive`, `warning`, and `critical` variants, semantic tag/button/link rendering, loading skeleton, and inline error state with retry callback.
3. **`KpiCard`:** Strict 3-tier metric block (`label + icon`, `tabular-nums` value, `delta` or context subline) with accessible `tone` mapping (`neutral`, `volt`, `operational`, `warning`, `critical`, `telemetry`).
4. **`StatusBadge`:** Semantic pill/tag component with `hardware` variant (Carbon badge + `#BFFF00` LED dot ensuring high WCAG contrast in Light Mode) and optional telemetry pulse honoring `prefers-reduced-motion`.
5. **`SegmentedControl`:** Accessible `role="tablist"` switcher with keyboard arrow traversal (`ArrowLeft`/`ArrowRight`/`Home`/`End`) and `>= 44px` coarse-pointer tap height.
6. **`EmptyState`:** Dashed structural container with framed icon, clear guidance, primary Volt CTA, and optional secondary action.
7. **`CommandPalette` & `CommandPaletteTrigger`:** Working `⌘K` / `Ctrl+K` modal with ARIA combobox/listbox semantics, Escape focus restoration, keyboard navigation, and group-filtered quick actions/routes.

---

## 5. Data Visualization Conventions (`Recharts` + `ChartTooltip`)

Shared helper `src/lib/chart-theme.ts` and `src/components/ui/ChartTooltip.tsx`:
- **Gridlines:** Horizontal dashed `1px` strokes using `var(--chart-grid)`; zero vertical clutter.
- **Axes:** `11px` `var(--font-mono)` in `var(--chart-axis)` with `axisLine={false}` and `tickLine={false}`.
- **Adaptive Series Palette:**
  - Primary Series: `var(--chart-series-primary)` (`#16A34A` Light / `#BFFF00` Dark) — never invisible `#BFFF00` lines on white!
  - Secondary Series: `var(--chart-series-secondary)` (`#2563EB` Light / `#3B82F6` Dark)
  - Operational: `var(--chart-series-operational)` (`#059669` Light / `#10B981` Dark)
- **Gradient IDs:** Always scoped per chart via React `useId()`.
- **Tooltip:** Custom `<ChartTooltip />` styled on `var(--bg-surface)` + `var(--border-strong)` with `tabular-nums` currency/numeric formatting.

---

## 6. Interactive Component State Contract

Every control across RIVO enforces six uniform states (`default`, `hover`, `focus-visible` `2px` `--focus-ring`, `disabled`, `loading` with width stability, `error` with adjacent accessible message), explicit CSS transition properties (`duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]` — never `transition-all`), and `@media (prefers-reduced-motion: reduce)` guards.

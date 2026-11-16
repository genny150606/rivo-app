---
name: rivo-visual-identity
description: Permanent visual identity, design token authority, component specification, and anti-AI-slop rules for the RIVO B2B physical-digital operating platform.
---

# RIVO VISUAL IDENTITY AUTHORITY

This skill is the permanent design and engineering authority for **RIVO**. Every page, module, component, modal, chart, and customer touchpoint in the RIVO codebase MUST comply with these rules.

---

## 1. Brand Identity & Visual Personality

- **Brand:** **RIVO** (`RIVO OS`)
- **Positioning:** A premium B2B physical-digital operating platform connecting hospitality venues and retail stores to intelligent cloud experiences via encrypted NFC/QR hardware, POS/ERP telemetry, and automated reputation engines.
- **Personality:** Confident • Technological • Sophisticated • Precise • Modern • Recognizable • Professional.
- **Aesthetic Anchor:** *Industrial Hardware Precision meets Executive Software Clarity.* Imagine the mechanical exactness of Apple/Teenage Engineering hardware paired with the monochromatic discipline of Linear and the sharp volt-accented financial clarity of Ramp.

---

## 2. Adaptive Color Architecture (Dual-Mode by Purpose)

**Do NOT blindly force every screen into pitch-black.** Choose polarity according to interface purpose while maintaining an unbroken semantic token contract (`src/app/globals.css`):

- **Dark Mode (`Control Telemetry & Marketing`)**: Optimal for the Marketing Landing Page (`/`), Hardware Fleet Control (`/dashboard/devices`), Superadmin Control (`/admin/*`), Night-shift Hospitality Service (`/dashboard/service`, `/waiter`), and Authentication (`/login`).
- **Light Mode (`Operational & Financial ERP`)**: Supported seamlessly across the entire Dashboard so daytime retail cashiers, inventory managers, and hospitality directors can inspect dense SKUs, accounting margins, and customer ledgers without eye strain.

### Semantic CSS Token Contract

| Token | Light Mode Value | Dark Mode Value | Purpose |
|---|---|---|---|
| `--bg-canvas` | `#F6F7F9` | `#09090B` | Main application backdrop |
| `--bg-surface` | `#FFFFFF` | `#111215` | Primary cards, panels, modals, sidebar |
| `--bg-elevated` | `#F0F2F5` | `#18191E` | Secondary wells, hovered rows, nested blocks |
| `--bg-subtle` | `#E8EBEF` | `#1F2128` | Subtle pills, track backgrounds |
| `--border-subtle` | `#E4E6EB` | `#22242A` | 1px structural card and grid hairlines |
| `--border-strong` | `#CFD4DC` | `#32353E` | Interactive inputs, focused borders, dividers |
| `--text-primary` | `#09090B` | `#F4F4F6` | Headings, primary data, key labels |
| `--text-secondary` | `#4B5563` | `#A1A1AA` | Descriptions, subtitles, table body text |
| `--text-muted` | `#6B7280` | `#71717A` | Micro-labels, timestamps, placeholders |
| `--rivo-volt` | `#BFFF00` | `#BFFF00` | Signature RIVO fluorescent accent surface |
| `--rivo-volt-hover` | `#AEEC00` | `#CEFF33` | Hover state for Volt interactive elements |
| `--rivo-volt-ink` | `#09090B` | `#09090B` | Mandatory dark ink on `#BFFF00` surfaces |
| `--rivo-volt-text` | `#15803D` | `#BFFF00` | High-contrast accessible text accent on background |
| `--accent-operational` | `#10B981` | `#10B981` | Active hardware, positive delta, 5-star review |
| `--accent-warning` | `#D97706` | `#F59E0B` | Low stock, pending verification, queue alert |
| `--accent-critical` | `#DC2626` | `#EF4444` | Offline node, negative delta, shielded feedback |
| `--accent-telemetry` | `#2563EB` | `#3B82F6` | Sync telemetry, system info, informational state |

**WCAG Volt Rule:** Raw `#BFFF00` text on white (`#FFFFFF`) or light gray (`#F6F7F9`) is **FORBIDDEN** (contrast fails WCAG AA). In Light Mode, `#BFFF00` is used exclusively as a high-contrast surface fill with `#09090B` ink (`--rivo-volt-ink`), or as a status LED dot inside a `#09090B` badge. Use `--rivo-volt-text` (`#15803D` light / `#BFFF00` dark) for colored accent typography.

---

## 3. Typography Rules

Three intentional type families loaded via `next/font/google`:

1. **Display (`--font-display` — `Plus Jakarta Sans`):**
   - Page titles, modal headings, landing headlines, KPI section headers.
   - Weights: `600`, `700`, `800`.
   - Tracking: `-0.025em` (`tracking-tight`) on dashboard headings; `-0.035em` on hero headlines.
2. **UI & Body (`--font-sans` — `Inter`):**
   - Navigation labels, paragraphs, table content, form controls, tooltips.
   - Base size `14px`–`15px` for dense operational UI, `16px`–`18px` for marketing copy.
3. **Telemetry & Hardware Mono (`--font-mono` — `JetBrains Mono`):**
   - Mandatory for: hardware codes (`RIVO-TAVOLO1`), SKUs/EANs, timestamps (`14:22:08`), latencies (`14ms`), currency values, margins, percentages, and category eyebrows (`01 // HARDWARE`).
   - Always pair numerical values with `tabular-nums` (`font-variant-numeric: tabular-nums`) so numbers never jitter during updates.

---

## 4. Spacing, Radius & Structural Geometry

- **Spacing Scale:** Strictly based on `4px` increments (`p-4` = 16px, `p-5` = 20px, `p-6` = 24px, `gap-4` = 16px, `gap-6` = 24px).
- **Border Radius Discipline:**
  - Buttons, Inputs, Badges, Tooltips: `8px` (`rounded-lg`) or pill (`rounded-full` strictly for micro status tags).
  - Standard Cards, KPI Tiles, Dropdowns: `12px` (`rounded-xl`).
  - Major Panels, Modals, Device Frames: `16px` (`rounded-2xl`).
  - **NEVER** use puffy `rounded-[28px]`, `rounded-[32px]`, or `rounded-[40px]` blobs for standard enterprise containers.
- **Structural Borders:** Prefer `1px solid var(--border-subtle)` hairline construction over blurry drop shadows. Subtle elevation is achieved through controlled tonal surface shifts (`--bg-canvas` -> `--bg-surface` -> `--bg-elevated`).

---

## 5. Component & Domain Rules

1. **Components (`src/components/ui/*`):** Build upon `PageHeader`, `KpiCard`, `SurfaceCard`, `StatusBadge`, `SegmentedControl`, `EmptyState`, `CommandPalette`. Never inline ad-hoc card wrappers when a design system primitive fits.
2. **Navigation:**
   - Desktop (`>= 1024px`): Fixed `256px` left command sidebar with grouped sections (`font-mono uppercase text-[10px] tracking-[0.14em]`), active left/surface indicator, plus `56px` sticky top command bar housing `⌘K` Quick Jump, system status, and `ThemeToggle`.
   - Mobile (`< 1024px`): Dedicated bottom dock (`<= 5` primary destinations) + slide-over command drawer. Never allow horizontal overflow on mobile.
3. **Data Visualization (`Recharts`):**
   - Grid lines: horizontal dashed `1px` `var(--border-subtle)`, zero vertical clutter.
   - Axes: `11px` `JetBrains Mono` in `var(--text-muted)`, no heavy axis lines.
   - Palette: Primary series in `#BFFF00` (Dark) / `#16A34A` (Light), Secondary in `#3B82F6`, Tertiary in `#A1A1AA`.
   - Tooltips: Solid `--bg-surface` container with `1px solid var(--border-strong)`, tabular values, crisp padding.
   - Never render fake hardcoded decorative SVG waveforms pretending to be live data.
4. **Motion:**
   - Fast, tactile transitions (`150ms–220ms`, easing `cubic-bezier(0.22, 1, 0.36, 1)`).
   - Animate GPU-composited properties only (`transform`, `opacity`).
   - Strictly honor `@media (prefers-reduced-motion: reduce)`.
5. **Responsive Behavior:**
   - Test across `1440px`, `1280px`, `768px`, `390px`. Zero horizontal overflow (`scrollWidth <= clientWidth`). All mobile interactive tap targets `>= 44px`.
6. **Accessibility:**
   - WCAG AA text contrast (`>= 4.5:1` body, `>= 3:1` large text/UI icons).
   - Visible `:focus-visible` ring (`2px` `--rivo-volt` or `--text-primary`) on every interactive element.
   - Every icon-only button requires `aria-label`.
7. **Empty States:** Never show a blank white box or bare "No data". Use `EmptyState` with geometric icon framing, exact contextual explanation, and a clear next-action button.
8. **Loading States:** Use structural skeleton blocks matching final layout proportions (`animate-pulse` on `--bg-elevated`) to keep CLS near zero.
9. **Error States:** Clear semantic border (`--accent-critical`), concise actionable copy directly beside the affected control or banner, never raw technical stack traces.
10. **Form Design:** Explicit visible labels above inputs (never placeholder-only labels), `44px` minimum input height on touch screens, clear focus border, inline validation feedback.
11. **Tables:** Clean horizontal scroll wrapper on small viewports, sticky or crisp uppercase mono headers (`11px`), right-aligned tabular numerals for quantities/prices/totals, subtle hover state (`--bg-elevated`), row height `>= 48px`.
12. **Modals:** Focused width (`max-w-lg` or `max-w-2xl`), solid `--bg-surface` backdrop-dimmed overlay (`bg-black/65 backdrop-blur-sm`), `Escape` key & backdrop close support, clear primary/secondary action alignment.
13. **Cards:** Consistent `p-5` (`20px`) or `p-6` (`24px`) internal padding, strict max 3 data tiers per card (Eyebrow/Label, Primary Value, Context/Action).
14. **Dashboards:** Intentional asymmetry — lead with priority status & command header, combine 4 concise KPI telemetry tiles with an asymmetric 8/4 analytical/action split and a real-time ledger table below. Never stack 3 identical 4-card rows.

---

## 6. NON-NEGOTIABLE PROHIBITIONS (Zero Tolerance)

The following anti-patterns are **STRICTLY FORBIDDEN** anywhere in RIVO:

1. **NO Generic AI SaaS Templates:** Do NOT reproduce floating glassmorphic hero cards with purple/blue/cyan gradient headings (`bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400`).
2. **NO Unnecessary Gradients or Glow Soup:** Do NOT layer blurred indigo, emerald, and pink ambient blobs behind cards or logins.
3. **NO Excessive Rounded Cards:** Do NOT apply `rounded-[28px]` / `rounded-[32px]` corners to business dashboards or tables.
4. **NO Random Glassmorphism:** Do NOT apply `backdrop-blur` to opaque content cards where text scrolls behind headers causing legibility collisions.
5. **NO Decorative Animations Without Purpose:** **FORBIDDEN:** `canvas-confetti` fireworks on button/tab clicks, floating multi-color particle constellation canvases, idle bouncing badges, and `Sparkles` icons on B2B controls.
6. **NO Inconsistent Iconography:** Use `lucide-react` uniformly at consistent stroke weight (`1.75` or `2`). Never mix emoji (`🚀`, `✨`, `🔥`) with UI chrome icons in enterprise workflows (except where strictly representing user-selectable customer stars/ratings or product emojis in a customizer).
7. **NO Arbitrary Font Combinations:** Stick exclusively to `Plus Jakarta Sans`, `Inter`, and `JetBrains Mono` across B2B views (reserved custom theme fonts apply *only* inside customer-editable `/hub/[code]` previews).
8. **NO Repetitive Dashboard Layouts:** Break monotonous identical card grids with hierarchical scale, asymmetric splits, and crisp tables.
9. **NO Fake Metrics & Decorative Charts:** Every sparkline, progress bar, and percentage in the platform dashboard must connect to real state, real props, or explicitly labeled sandbox data in `/demo/*`.
10. **NO Hardcoded Single-Theme Hexes Inside Multi-Theme Views:** Never write bare `bg-[#121214]`, `bg-[#18181B]`, `border-[#27272A]`, or unprefixed `text-white` on `/dashboard/*` surfaces that switch between Light and Dark mode. Always use semantic tokens (`bg-[var(--bg-surface)]`, `border-[var(--border-subtle)]`, `text-[var(--text-primary)]`).

*Every visual element must have a reason to exist.*

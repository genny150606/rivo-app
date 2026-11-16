# SKILL ACQUISITION & INSTALLATION REPORT

**Report Date:** 2026-11-15  
**Target Directory:** `.agents/skills/` (Project-scoped Antigravity workspace skills)  
**Discovery Standard:** Antigravity Workspace Customization System (`.agents/skills/<skill-name>/SKILL.md`)

---

## 1. Candidate Evaluation Summary

Five open-source frontend/UX Agent Skills were independently researched, verified against GitHub repositories, inspected for security/license/dependency footprint, and evaluated for RIVO compatibility.

| Candidate Skill | Repository | License | Decision | Rationale |
|---|---|---|---|---|
| **Anthropic Frontend Design** | `anthropics/skills/tree/main/skills/frontend-design` | Anthropic Source-Available | **INSTALLED** | Lightweight pure-markdown instructions focusing on typography craft, bold cohesive aesthetics, and anti-AI-slop enforcement with zero external scripts or dependencies. |
| **Vercel Web Design Guidelines** | `vercel-labs/agent-skills/tree/main/skills/web-design-guidelines` | MIT | **INSTALLED** | Authoritative React/Next.js accessibility, focus management, form UX, animation, and responsive web interface audit checklist (`references/command.md` bundled locally for offline reliability). |
| **UI/UX Pro Max** | `nextlevelbuilder/ui-ux-pro-max-skill` | MIT | **INSTALLED (Adapted)** | High-value UX priority matrix (accessibility, >=44px touch targets, performance, charts, typography) and structured rule references (`references/quick-reference.md`, `references/pro-rules.md`). Adapted without global Python CLI scripts. |
| **Impeccable** | `pbakaus/impeccable` | Apache-2.0 | **SKIPPED** | Requires downloading/executing an external compiled platform binary (`scripts/impeccable` / `impeccable.cmd`). Violates minimal dependency policy and overlaps heavily with `frontend-design` + RIVO's custom identity skill. |
| **Taste Skill** | `Leonxlnx/taste-skill` | MIT | **SKIPPED** | Configures Claude-specific Stop hooks (`gate.mjs`) and headless browser shell scripts incompatible with Antigravity's native subagent verification workflow. Its high-craft anti-slop rules are absorbed directly into `rivo-visual-identity`. |
| **RIVO Visual Identity** | *Created in-house* | Proprietary | **CREATED** | Permanent RIVO visual authority defining tokens, light/dark operational polarity, typography, component architecture, data visualization rules, and NON-NEGOTIABLE prohibitions. |

---

## 2. Installed Workspace Skills

### 2.1 `frontend-design`
- **Path:** `.agents/skills/frontend-design/SKILL.md`
- **Source:** `https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md`
- **Security / Dependencies:** Pure Markdown (`9,390` bytes). Zero executable scripts, zero package installs.
- **Role in RIVO:** Guides bold editorial/industrial composition, forbids default Inter-on-white or purple-gradient SaaS clones, and enforces distinctive font pairing and spatial depth.

### 2.2 `web-design-guidelines`
- **Path:** `.agents/skills/web-design-guidelines/SKILL.md`
- **Bundled Reference:** `.agents/skills/web-design-guidelines/references/command.md`
- **Source:** `https://github.com/vercel-labs/agent-skills` + `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- **Security / Dependencies:** Pure Markdown (`1,231` bytes + `8,055` bytes reference). Updated to reference the bundled local `references/command.md` instead of requiring external fetches during audits.
- **Role in RIVO:** Used by Agent F (QA & Design Critic) to audit WCAG contrast, keyboard accessibility (`:focus-visible`), semantic HTML, form ergonomics, image sizing, and `prefers-reduced-motion`.

### 2.3 `ui-ux-pro-max`
- **Path:** `.agents/skills/ui-ux-pro-max/SKILL.md`
- **Bundled References:**
  - `.agents/skills/ui-ux-pro-max/references/quick-reference.md` (`24,773` bytes)
  - `.agents/skills/ui-ux-pro-max/references/pro-rules.md` (`10,909` bytes)
- **Source:** `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- **Adaptation Note:** Python `search.py` CLI references were cleanly replaced with direct local reference guidance (`references/quick-reference.md` and `references/pro-rules.md`) so agents consume all 120 UX guidelines without installing external Python environments or copying plugin scripts.
- **Role in RIVO:** Enforces priority checklists for touch targets (`>= 44px`), table ergonomics, chart accessibility, and CLS `< 0.1`.

### 2.4 `rivo-visual-identity` (Proprietary Permanent Authority)
- **Path:** `.agents/skills/rivo-visual-identity/SKILL.md`
- **Role in RIVO:** The single source of truth governing RIVO's visual DNA (`#09090B` Carbon, `#F6F7F9`/`#FFFFFF` Alabaster, `#BFFF00` RIVO Volt), typography hierarchy (`Plus Jakarta Sans` / `Inter` / `JetBrains Mono`), adaptive Dark/Light usage, component architecture, and strict anti-slop guardrails.

---

## 3. Skipped Candidates — Detailed Justification

1. **`pbakaus/impeccable` (Skipped):** Relies on external compiled Rust binaries (`impeccable` / `impeccable.cmd`) bundled inside scripts directories for contrast/color-math utilities. Running uninspected prebuilt binaries is unnecessary when standard Tailwind CSS v4 tokens and Chrome/browser computed style verification cover color contrast cleanly. Core aesthetic principles overlap completely with `frontend-design` + `rivo-visual-identity`.
2. **`Leonxlnx/taste-skill` (Skipped):** Built primarily as a Claude Code harness hook (`gate.mjs` Stop hook enforcing shell verification). Antigravity provides dedicated browser subagents (`browser`) and specialized QA agents (`rivo-qa-critic`), rendering external Stop-hook scripts redundant and incompatible.

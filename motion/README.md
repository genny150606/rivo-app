# RIVO — Motion Design Ad

Premium 30-second RIVO brand film built with Remotion + React + TypeScript.

## Output

- Main: 1080×1920, 30 FPS, 30 seconds, vertical 9:16
- Alternate compositions: 1920×1080 and 1080×1080
- Concept: **ONE TAP. EVERYTHING CONNECTED.**
- Visual direction: Apple × Stripe × Linear × Vercel
- RIVO accent: #B4F02A, matching the production dashboard palette.

## Scenes

1. 0:00–0:03 — Every table is an opportunity.
2. 0:03–0:06 — NFC device + smartphone tap.
3. 0:06–0:10 — Tap expands into connected experiences.
4. 0:10–0:15 — RIVO Control Room / KPIs / graph.
5. 0:15–0:19 — Review Shield routing.
6. 0:18–0:24 — Connected ecosystem.
7. 0:23–0:27 — RIVO logo reveal.
8. 0:26–0:30 — Final CTA.

## Brand integration

The film uses the existing production RIVO logo from:
`public/brand/rivo-logo-full.png`

The dashboard visual language is based on the existing RIVO production codebase:
- dark #09090b / #0d0d0f surfaces
- lime #B4F02A accent
- compact uppercase metadata
- thin borders
- restrained shadows
- Inter/SF Pro-style typography

## Run

From the repository root:

```bash
cd motion
npm install
npm run dev
```

Render vertical:

```bash
npm run render
```

Render landscape:

```bash
npm run render:16x9
```

Render square:

```bash
npm run render:1x1
```

## Adaptation

All scene timing is frame-based in `src/Video.tsx`. The 1080×1920 composition is treated as the design canvas and automatically letterbox/scales into the alternate compositions. For a production campaign, the same components can be reframed independently for 16:9 and 1:1.

## Assets

No external stock footage is required. The physical NFC device, smartphone, dashboard, cards, graph, network and logo reveal are generated procedurally as vector/DOM elements. The existing RIVO logo is loaded from the repository's brand asset.

## Sound

The visual project is intentionally structured so a sound layer can be added without changing scene timing. Recommended sound map:
- NFC tap: ~0:04
- low impact: ~0:06
- UI clicks: 0:07–0:15
- notification: ~0:16
- rising electronic bed: 0:10–0:25
- bass hit/logo: ~0:24
- clean CTA tail: 0:26–0:30

For a final commercial delivery, pair the render with licensed/procedural audio rather than bundling an unlicensed music track.

## Important

The repository's production application is untouched. The ad lives under `/motion` and is independently renderable.

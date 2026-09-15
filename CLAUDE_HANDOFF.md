# RIVO — AI Agent Handoff Document

> **Last updated:** 2026-09-15  
> **Production URL:** [https://rivo-app-ten.vercel.app](https://rivo-app-ten.vercel.app)  
> **Supabase Project:** `wnhdgrjxbtycocxdbudv` (`https://wnhdgrjxbtycocxdbudv.supabase.co`)  
> **Status:** FULL MVP IN PRODUZIONE — Vercel Deploy Live + Supabase Database Reale + RLS + Autenticazione + Tracking NFC/QR con redirect verificato end-to-end.

---

## 1. Obiettivo del Progetto RIVO

RIVO è una piattaforma SaaS B2B per attività commerciali locali (ristoranti, bar, hotel, negozi).
Fornisce dispositivi fisici **NFC + QR** che permettono ai clienti dell'attività di raggiungere rapidamente una destinazione digitale configurabile (Google Reviews, menu, social, landing page).
Il chip contiene un URL RIVO permanente (`https://rivo-app-ten.vercel.app/t/[CODE]`). La destinazione reale è salvata e modificabile su database in qualsiasi istante senza riprogrammare il chip fisico.

**Flusso di interazione verificato in produzione:**
```
NFC Tap / QR Scan ➔ /t/[CODE]?source=nfc|qr ➔ Supabase (log su 'interactions') ➔ HTTP 307 Redirect istantaneo a Google Reviews
```

---

## 2. Stack Utilizzato

- **Framework:** Next.js 16.3.5 (App Router, Turbopack)
- **Runtime & Language:** Node.js v24.14.0, TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4, Lucide React icons
- **Database & Auth:** Supabase PostgreSQL 17 + Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- **Analytics & Grafici:** Recharts (AreaChart, trend settimanale, fasce orarie)
- **Hosting & CI/CD:** Vercel (Production Deployment Live su CDN globale)

---

## 3. Architettura Generale e Cartelle

```
f:\rivo-dashboard\ (e mirror f:\rivo-app\ collegato a Vercel)
├── src/
│   ├── app/
│   │   ├── login/page.tsx             # Login con routing per ruolo (admin vs client)
│   │   ├── dashboard/                 # Client Dashboard (Overview, Devices, Analytics, Profile, Reviews)
│   │   │   ├── layout.tsx             # Sidebar interattiva, Live network status
│   │   │   ├── page.tsx               # Overview: KPI reali dal DB, ratio NFC/QR, recent interactions
│   │   │   ├── devices/page.tsx       # Lista dispositivi assegnati alla sede
│   │   │   ├── analytics/page.tsx     # Grafici Recharts (trend, canali NFC vs QR, fasce orarie)
│   │   │   ├── reviews/page.tsx       # Google Reviews Hub (architettura predisposta per API)
│   │   │   └── profile/page.tsx       # Configurazione profilo e link Google Review principale
│   │   ├── admin/                     # Admin Dashboard (RIVO Command Center)
│   │   │   ├── layout.tsx             # Sidebar Admin con badge Master Admin
│   │   │   ├── page.tsx               # Metriche globali (organizzazioni, dispositivi, traffico totale)
│   │   │   ├── organizations/         # Lista aziende clienti con sedi e conteggi dispositivi
│   │   │   └── organizations/new/     # Wizard a 4 step per onboarding nuova attività
│   │   ├── t/[code]/route.ts          # Public redirect endpoint ultrarapido con log asincrono
│   │   ├── globals.css                # RIVO Design System (dark #09090b, lime #BFFF00 accents)
│   │   ├── layout.tsx                 # Root layout con font Inter
│   │   └── page.tsx                   # Redirect automatico a /dashboard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client (@supabase/ssr)
│   │   │   └── server.ts              # Server Component client (@supabase/ssr con cookies)
│   │   └── types.ts                   # Definizioni TypeScript esaustive
│   └── middleware.ts                  # Autenticazione e protezione route tramite Supabase Auth
└── CLAUDE_HANDOFF.md                  # Questo documento
```

---

## 4. Schema Database Supabase (Progetto Reale Attivo)

- **Supabase Project ID:** `wnhdgrjxbtycocxdbudv`
- **Region:** `eu-central-1` (Frankfurt)
- **URL:** `https://wnhdgrjxbtycocxdbudv.supabase.co`

### Tabelle Configurate:
1. **`plans`**: Piani (`Free`, `Starter`, `Pro`) con limiti JSONB.
2. **`organizations`**: Aziende clienti (`id`, `name`, `slug`, `status`, `plan_id`).
3. **`profiles`**: Utenti collegati ad `auth.users` con ruoli (`admin` | `client`) e FK `organization_id`.
4. **`locations`**: Sedi fisiche collegate a `organizations`.
5. **`devices`**: Chip NFC / QR univoci (`unique_code`, `destination_url`, `status`, FK `organization_id`, FK `location_id`).
6. **`interactions`**: Log tap/scan (`organization_id`, `location_id`, `device_id`, `interaction_type`, `user_agent`, `referrer`, `timestamp`).
7. **`subscriptions`**: Stato abbonamenti.

### Row Level Security (RLS) e Policy:
- Helper functions: `public.get_user_role()` e `public.get_user_org_id()` (`SECURITY DEFINER`).
- **Admin**: CRUD completo globale.
- **Client**: Accesso isolato rigidamente via policy `organization_id = public.get_user_org_id()`.
- **Anon/Pubblico**: `devices` legge solo per codice univoco; `interactions` consente inserimento log tap/scan.

---

## 5. Account Creati per Testing

- **Master Admin RIVO:** `admin@rivo.it` (ruolo: `admin`)
- **Organizzazione di Test:** `Bar Centrale` (Sede: `Napoli Centro`, Dispositivi: `RIVO-TAVOLO1`, `RIVO-TAVOLO2`, `RIVO-CASSA01`)

---

## 6. Verifica Live in Produzione

- **URL Produzione:** [https://rivo-app-ten.vercel.app](https://rivo-app-ten.vercel.app)
- **Test Endpoint NFC:** `https://rivo-app-ten.vercel.app/t/RIVO-TAVOLO1?source=nfc`
  - Risultato: **HTTP 307 Redirect** istantaneo verso Google Reviews.
  - Record inserito in tempo reale nella tabella `interactions` di Supabase (`interaction_type: 'nfc'`, timestamp, device `Tavolo 1`, org `Bar Centrale`).

---

## NEXT ACTION

Per estendere ulteriormente la piattaforma:
1. Collegare l'endpoint di reset/invito password di Supabase per inviare email automatiche di benvenuto ai nuovi titolari creati dal wizard.
2. Integrare OAuth per Google Business Profile nella sezione Reviews per visualizzare il rating medio e sincronizzare le recensioni direttamente da Google API.

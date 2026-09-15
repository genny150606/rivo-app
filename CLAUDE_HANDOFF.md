# RIVO — AI Agent Handoff Document

> **Last updated:** 2026-09-15  
> **Last commit:** `235097c feat: complete MVP architecture with Next.js, Supabase, RLS, Auth, tracking and Admin/Client dashboards`  
> **Project status:** Supabase Project Live & Configured, Database Schemas & RLS Active, Next.js 16 + Turbopack Production Build Verified Clean, Core Tracking & Dashboards Functional.

---

## 1. Obiettivo del Progetto RIVO

RIVO è una piattaforma SaaS B2B per attività commerciali locali.
Fornisce dispositivi fisici **NFC + QR** che permettono ai clienti dell'attività di raggiungere rapidamente una destinazione digitale configurabile (principalmente Google Reviews).
Il chip contiene un URL RIVO permanente (`https://[DOMAIN]/t/[CODE]`). La destinazione reale è salvata e modificabile su database in qualsiasi istante senza riprogrammare il chip.

**Flusso di interazione:**
```
NFC Tap / QR Scan ➔ /t/[CODE]?source=nfc|qr ➔ Supabase (log su 'interactions') ➔ 307 Redirect istantaneo a destination_url
```

---

## 2. Stack Utilizzato

- **Framework:** Next.js 16.3.5 (App Router, Turbopack)
- **Runtime & Language:** Node.js v24.14.0, TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4, Lucide React icons
- **Database & Auth:** Supabase PostgreSQL 17 + Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- **Analytics & Grafici:** Recharts
- **Hosting & CI/CD:** Vercel

---

## 3. Architettura Generale e Cartelle

```
f:\rivo-dashboard\
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx      # Login con routing automatico per ruolo (admin vs client)
│   │   ├── dashboard/                 # Client Dashboard (Overview, Devices, Analytics)
│   │   │   ├── layout.tsx             # Sidebar interattiva, Live status indicator
│   │   │   ├── page.tsx               # Overview: KPI reali dal DB, ratio NFC/QR, recent interactions
│   │   │   └── devices/page.tsx       # Lista dispositivi assegnati alla sede del cliente
│   │   ├── admin/                     # Admin Dashboard (RIVO Command Center)
│   │   │   ├── layout.tsx             # Sidebar Admin, Badge di sicurezza
│   │   │   └── page.tsx               # Metriche globali (organizzazioni, dispositivi, traffico)
│   │   ├── t/[code]/route.ts          # Public redirect endpoint ultrarapido con tracking asincrono
│   │   ├── globals.css                # RIVO Design System (dark #09090b, lime #BFFF00 accents)
│   │   ├── layout.tsx                 # Root layout con font Inter
│   │   └── page.tsx                   # Redirect automatico a /dashboard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client (@supabase/ssr)
│   │   │   └── server.ts              # Server Component client (@supabase/ssr con gestione cookies)
│   │   └── types.ts                   # Definizioni TypeScript esaustive (Organization, Device, ecc.)
│   └── middleware.ts                  # Autenticazione e protezione route tramite Supabase Auth
├── .env.local                         # Credenziali Supabase di produzione
└── CLAUDE_HANDOFF.md                  # Questo documento
```

---

## 4. Schema Database Supabase (Progetto Reale Attivo)

- **Supabase Project ID:** `wnhdgrjxbtycocxdbudv`
- **Region:** `eu-central-1` (Frankfurt)
- **URL:** `https://wnhdgrjxbtycocxdbudv.supabase.co`

### Tabelle Create e Configurate:
1. **`plans`**: Piani di abbonamento (`Free`, `Starter`, `Pro`) con limiti JSONB.
2. **`organizations`**: Aziende clienti (`id`, `name`, `slug`, `status`, `plan_id`).
3. **`profiles`**: Utenti collegati ad `auth.users` con ruoli (`admin` | `client`) e FK a `organizations`.
4. **`locations`**: Sedi fisiche collegate a `organizations`.
5. **`devices`**: Chip NFC / QR univoci (`unique_code`, `destination_url`, `status`, FK `organization_id`, FK `location_id`).
6. **`interactions`**: Log di ogni tap/scan (`organization_id`, `location_id`, `device_id`, `interaction_type`, `user_agent`, `referrer`, `timestamp`).
7. **`subscriptions`**: Stato sottoscrizioni.

### Indici e Prestazioni:
- Indice univoco su `organizations(slug)`
- Indice univoco su `devices(unique_code)`
- Indici compositi ottimizzati su `interactions(organization_id, timestamp)`, `interactions(device_id, timestamp)`, `interactions(location_id, timestamp)`.

### Row Level Security (RLS) e Policy:
- Funzioni di supporto `public.get_user_role()` e `public.get_user_org_id()` impostate con `SECURITY DEFINER`.
- RLS abilitato su tutte le tabelle:
  - **Admin:** CRUD completo su tutte le tabelle.
  - **Client:** Accesso isolato via policy `organization_id = public.get_user_org_id()`.
  - **Anon/Pubblico:** `devices` può leggere solo i dispositivi attivi per codice univoco; `interactions` consente l'inserimento anonimo di log.

---

## 5. Stato Attuale delle Funzionalità

### Già Completamente Funzionante:
- Progetto Next.js 16 compilato e verificato con build di produzione pulita (`npm run build` passa con successo).
- Database Supabase reale attivo in Francoforte con tutte le 7 tabelle, indici e RLS.
- Endpoint di tracking `/t/[code]` funzionante: interroga il codice dispositivo, legge lo stato, registra l'interazione con tipo (`nfc` | `qr` | `unknown`), ed esegue il redirect HTTP 307.
- Dashboard Client (`/dashboard` e `/dashboard/devices`) configurata per mostrare dati reali calcolati da Supabase.
- Dashboard Admin (`/admin`) con statistiche aggregate su tutte le organizzazioni.
- Autenticazione Supabase configurata con middleware e pagina di login (`/login`).

### Cosa Manca / Prossimi Step:
- Creazione utente Admin iniziale in Supabase Auth (es. `admin@rivo.it`).
- Wizard interattivo per Admin `/admin/organizations/new` (Step: dati business, sede, owner account, piano, dispositivi iniziali).
- Form di modifica per il profilo cliente (`/dashboard/profile`).
- Sezione Google Reviews (`/dashboard/reviews`) con placeholder professionale per integrazione Google Business API.
- Collegamento finale con Vercel CLI (`vercel --prod`) per ottenere il dominio pubblico live.

---

## 6. Environment Variables

Le seguenti variabili sono configurate in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://wnhdgrjxbtycocxdbudv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
```

---

## NEXT ACTION

Il prossimo task per proseguire direttamente lo sviluppo è:

1. **Creare l'utente Master Admin**: Registrare un account Admin (tramite Supabase Auth o query SQL con trigger profilo `role = 'admin'`) per poter testare il flusso completo di login e visualizzazione.
2. **Implementare il wizard `/admin/organizations/new`**: Creare la pagina per consentire all'Admin di registrare una nuova azienda (es. "Bar Centrale"), generare la sede "Napoli Centro", e associare i primi codici dispositivo (es. `RIVO-TAVOLO1`).
3. **Eseguire il deploy su Vercel**: Eseguire `npx vercel --prod` passando le environment variables per avere il dominio live e verificare il tap NFC da smartphone reale.

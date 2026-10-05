# RIVO Platform Architecture Report
**Versione:** 1.0 — Ottobre 2026  
**Stato:** Produzione / Operativo  
**Autore:** Antigravity Architect Subagent & Lead Engineering  

---

## 1. Visione Architetturale & Paradigma Modulare

RIVO è evoluto da una piattaforma prettamente legata all'hospitality e all'hardware NFC/QR a un **SaaS multi-tenant verticale modulare** ad alte prestazioni, con supporto nativo per il verticale **Retail (calzature, borse, abbigliamento, accessori)** a partire dal caso reale del cliente pilota **Borrelli**.

### 1.1 Diagramma ad Alto Livello

```
┌────────────────────────────────────────────────────────────────────────┐
│                              RIVO PLATFORM                             │
├────────────────────────────────────────────────────────────────────────┤
│                           CORE PLATFORM LAYER                          │
│  - Supabase Auth (Multi-Tenant Session Cookie SSR)                     │
│  - Organizations & Locations Hierarchy (Tenant Isolation)             │
│  - Staff RBAC (owner, manager, employee, waiter, admin)                │
│  - Module & Vertical Registry (Single Source of Truth)                 │
│  - Dynamic Navigation Engine (Sidebar & Context Resolver)              │
├───────────────────────────────┬────────────────────────────────────────┤
│        VERTICAL LAYER         │             SHARED MODULES             │
│  - Retail & Footwear OS       │  - Universal Hub & Custom Hub          │
│    * Catalog (Variants/Sizes) │  - NFC Physical Taps & Dynamic QR      │
│    * Inventory (Atomic RPC)   │  - CRM & Leads Management              │
│    * POS Register & Sales     │  - Fidelity Pass (Wallet Apple/Google) │
│    * Suppliers & POs          │  - Coupon Engine & Scratch Wheels      │
│    * Migration Import Engine  │  - Review Shield & Sommelier AI        │
│  - Restaurant & Hospitality   │  - Analytics & Margin Intelligence     │
│    * Menu & Sommelier AI      │                                        │
│    * Tables & Service Calls   │                                        │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. Componenti Chiave del Core Platform

### 2.1 Single Source of Truth: Registry Centralizzati
1. **Module Registry (`src/platform/modules/registry.ts`)**:
   - Definisce i 13 moduli del sistema (`products`, `inventory`, `sales`, `suppliers`, `crm`, `analytics`, `loyalty`, `coupons`, `review_shield`, `universal_hub`, `nfc_qr`, `tables`, `menu`).
   - Gestisce categorie (`core`, `vertical`, `shared`), dipendenze logiche tra moduli (es. `sales -> products`, `purchase_orders -> suppliers + inventory`), permessi RBAC e rotte associate.
2. **Vertical Registry (`src/platform/verticals/registry.ts`)**:
   - Mappa le tipologie di business (`retail`, `shoe_store`, `restaurant`, `bar`, `pizzeria`, `hotel`, `bb`, `gym`, `medical_studio`, `other`).
   - Mappa la terminologia verticalizzata (es. *Scarpe/Articoli* nel retail vs *Piatti/Menu* nella ristorazione) e il tipo di dashboard (`retail` vs `restaurant`).

### 2.2 Dynamic Navigation Engine (`src/platform/navigation/sidebar.ts`)
- Risolve a runtime i moduli abilitati per l'organizzazione corrente.
- Applica i filtri RBAC (es. cameriere visualizza solo modalità sala rapida; cassiere visualizza solo cassa, catalogo e anagrafica clienti).
- Renderizza badge distintivi verticali (`Footwear OS`, `Retail OS`, `Hospitality OS`).

---

## 3. Isolamento Multi-Tenant & Sicurezza
- Ogni tabella include `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
- Tutte le tabelle di movimentazione e scorte includono `location_id UUID REFERENCES locations(id)`.
- Nessun dato cross-tenant accessibile: Row Level Security (RLS) attiva al 100% su tutte le 25+ tabelle Supabase.
- Funzioni PostgreSQL `SECURITY DEFINER` con rigido controllo `auth.uid()` e verifica su `profiles.organization_id`.

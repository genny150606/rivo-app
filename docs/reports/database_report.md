# RIVO Database & Data Layer Report
**Versione:** 1.0 — Ottobre 2026  
**Database:** PostgreSQL 15+ (Supabase)  
**Progetto ID:** `wnhdgrjxbtycocxdbudv`  

---

## 1. Schema Relazionale Dettagliato

### 1.1 Nuove Tabelle Create per il Verticale Retail

| Tabella | Scopo & Note | Chiavi Primarie & Esterne |
|---|---|---|
| `product_categories` | Albero gerarchico categorie (scarpe, borse, cinture) | PK `id`, FK `organization_id`, FK `parent_id` (self-referencing tree) |
| `brands` | Marchi gestiti a catalogo (Nike, Borrelli, NeroGiardini) | PK `id`, FK `organization_id` |
| `suppliers` | Anagrafica fornitori con P.IVA, referente e condizioni | PK `id`, FK `organization_id` |
| `customers` | Anagrafica clienti con storico spesa e fidelity points | PK `id`, FK `organization_id` |
| `sales` | Testata vendite scontrino con IVA, sconto, margine lordo | PK `id`, FK `organization_id`, FK `customer_id`, FK `location_id` |
| `sale_items` | Righe vendita con snapshot prezzi costo/vendita e sconti | PK `id`, FK `sale_id`, FK `variant_id`, FK `organization_id` |
| `sale_payments` | Pagamenti registrati (POS, contanti, bonifico, buono) | PK `id`, FK `sale_id`, FK `organization_id` |
| `sale_returns` | Testata resi e note di credito | PK `id`, FK `sale_id`, FK `organization_id` |
| `sale_return_items` | Righe reso con flag restock a magazzino | PK `id`, FK `return_id`, FK `variant_id`, FK `organization_id` |
| `purchase_orders` | Ordini d'acquisto fornitore (draft, ordered, received) | PK `id`, FK `supplier_id`, FK `organization_id` |
| `purchase_order_items` | Righe ordine con quantitativi ordinati vs ricevuti | PK `id`, FK `purchase_order_id`, FK `variant_id` |
| `inventory_counts` | Sessioni di inventario periodico fisico | PK `id`, FK `organization_id`, FK `location_id` |
| `inventory_count_items` | Righe contate con colonna discrepanza calcolata | PK `id`, FK `count_id`, FK `variant_id`, discrepancy GENERATED |

### 1.2 Estensioni a Tabelle Esistenti

- `products`: aggiunti `category_id`, `brand_id`, `supplier_id`, `barcode`, `cost_price`, `sale_price`, `tax_rate`, `status`, `image_url`, `attribute_keys TEXT[]`.
- `product_variants`: aggiunti `attributes JSONB` (taglia, colore, materiale), `cost_price`, `sale_price`, `minimum_stock`, `reorder_threshold`, `status`.
- `inventory_movements`: aggiunti `quantity_after`, `unit_cost`, `reference_id`, `reference_type`, ed espanso il vincolo CHECK `type` per supportare `purchase`, `sale`, `return`, `damaged`, `transfer`, `inventory_count`.
- `organizations`: aggiunta colonna `business_type VARCHAR(50) DEFAULT 'restaurant'` sincronizzata con `category`.

---

## 2. Stored Procedures Atomiche (PostgreSQL RPC)

Tutte le operazioni critiche di business passano attraverso funzioni PL/pgSQL transazionali con `SECURITY DEFINER` e blocco di riga `FOR UPDATE`:

1. `rpc_record_inventory_movement`:
   - Esegue `SELECT ... FOR UPDATE` su `inventory_balances` per la combinazione `variant_id` + `location_id`.
   - Verifica la capienza del magazzino (impedisce giacenze negative per vendite e scarichi).
   - Aggiorna il saldo e inserisce la riga di audit in `inventory_movements` con `quantity_after` garantito.
2. `rpc_complete_sale`:
   - Genera numero progressivo scontrino giornaliero (`VND-YYYYMMDD-XXXX`).
   - Calcola subtotale, imposte IVA 22%, costi e margine lordo.
   - Inserisce testata e righe, scarica atomicamente le giacenze tramite movimento `sale` su ciascuna variante.
   - Registra il pagamento e aggiorna `customers.total_spent` e `customers.purchases_count`.
3. `rpc_process_return`:
   - Registra il reso (`RES-YYYYMMDD-XXXX`), incrementa `returned_quantity` sulle righe di vendita.
   - Se `restock = true`, riaccredita a magazzino i pezzi con movimento `return`.
   - Ricalcola lo stato della vendita (`refunded` o `partial_refund`) e storna lo speso cliente.
4. `rpc_receive_purchase_order`:
   - Verifica i pezzi arrivati vs ordinati, accredita atomicamente a magazzino con movimento `purchase`.
   - Aggiorna lo stato dell'ordine fornitore a `partially_received` o `received`.
5. `rpc_apply_inventory_count`:
   - Prende le discrepanze (`discrepancy != 0`) della sessione di inventario periodico e genera rettifiche automatiche `inventory_count` a magazzino, chiudendo la sessione come `completed`.

---

## 3. Indici di Performance B-Tree
- `idx_products_org_sku`, `idx_products_org_barcode`, `idx_products_org_brand`, `idx_products_org_category`
- `idx_variants_org_product`, `idx_variants_sku`, `idx_variants_barcode`
- `idx_sales_org_date`, `idx_sales_org_number`, `idx_sales_customer`
- `idx_inv_movements_org_variant`, `idx_inv_balances_org_var`
- `idx_purchase_orders_org_supplier`, `idx_po_items_po`

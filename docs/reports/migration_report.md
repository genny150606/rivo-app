# RIVO Retail — Piano & Guida di Migrazione Pilota (Borrelli)

**Documento:** Playbook Operativo di Migrazione Dati  
**Cliente Pilota:** Borrelli (Calzature, Borse & Accessori Moda)  
**Versione:** 1.0  
**Data:** Ottobre 2026  
**Status:** Approvato per l'Esecuzione

---

## 1. Executive Summary & Obiettivi

Il presente documento definisce la procedura tecnica e operativa per la migrazione del catalogo e delle giacenze del cliente pilota **Borrelli** dal gestionale legacy verso **RIVO Retail**.

### Obiettivi Chiave:
1. **Zero Disruption Operativa:** Nessuna interruzione delle vendite in negozio durante la fase di switch-off del vecchio sistema.
2. **Integrità Referenziale delle Varianti:** Mappatura automatica e raggruppamento di codici a barre/SKU singoli in prodotti genitore con matrice Taglia/Colore (es. Scarpe con range taglie 35-46).
3. **Audit Trail Completo delle Giacenze Iniziali:** Ogni quantità caricata genera un movimento tracciato di tipo `initial` con timestamp, operatore e costo di carico.
4. **Flessibilità dei Formati:** Supporto sia di file Excel moderni (`.xlsx`), legacy (`.xls`) che `.csv` delimitati da virgola o punto e virgola con rilevamento automatico delle intestazioni italiane.

---

## 2. Struttura del File di Import & Mapping Campi

L'engine di importazione di RIVO (`/dashboard/import` e API `/api/import/catalog`) supporta nativamente le nomenclature standard dei gestionali retail italiani:

| Intestazione Riconosciuta | Campo Destinazione DB | Tipo Dato | Note / Validazione |
|---|---|---|---|
| `codice_prodotto`, `sku_padre`, `product_code` | `products.sku` | Stringa | Raggruppa le varianti sotto lo stesso prodotto |
| `nome`, `prodotto`, `descrizione_prodotto` | `products.name` | Stringa (obbligatorio) | Nome commerciale dell'articolo |
| `categoria`, `reparto`, `settore` | `product_categories.name` | Stringa | Se non esiste, viene creata automaticamente |
| `brand`, `marca` | `brands.name` | Stringa | Se non esiste, viene creata automaticamente |
| `fornitore`, `supplier` | `suppliers.name` | Stringa (opzionale) | Collegamento fornitore primario |
| `sku_variante`, `codice_variante` | `product_variants.sku` | Stringa | SKU specifico della combinazione taglia/colore |
| `barcode`, `ean`, `codice_a_barre` | `product_variants.barcode` | Stringa (univoco) | EAN-13 o codice a barre per lettore ottico |
| `taglia`, `misura`, `size` | `product_variants.attributes.size` | Stringa (es. 39, 42, L) | Taglia calzatura o abbigliamento |
| `colore`, `color` | `product_variants.attributes.color` | Stringa (es. Nero, Cognac) | Variante cromatica |
| `prezzo_vendita`, `prezzo_ivato`, `listino` | `selling_price` | Numerico (decimal) | Prezzo al pubblico IVA inclusa |
| `prezzo_costo`, `costo_acquisto` | `cost_price` | Numerico (decimal) | Valore di carico per calcolo margini |
| `iva`, `aliquota_iva` | `tax_rate` | Numerico (default: 22) | Aliquota IVA applicata |
| `quantita`, `giacenza`, `stock` | `product_variants.quantity` | Intero positivo/nullo | Giacenza fisica al momento del cut-over |
| `scorta_minima`, `punto_riordino` | `product_variants.min_stock_level`| Intero (default: 2) | Soglia per alert sottoscorta |

---

## 3. Template di Esempio (Borrelli Fashion & Shoes)

Un file CSV di test pre-configurato è scaricabile direttamente dall'interfaccia di RIVO (`/dashboard/import` -> *Scarica Template CSV*). Esempio di righe reali per calzature Borrelli:

```csv
codice_prodotto,nome,categoria,brand,sku_variante,barcode,taglia,colore,prezzo_vendita,prezzo_costo,iva,quantita,scorta_minima
BOR-MOC-01,Mocassino Artigianale Pelle,Calzature,Borrelli,BOR-MOC-01-40-BLU,8051234567012,40,Blu Notte,149.00,65.00,22,3,1
BOR-MOC-01,Mocassino Artigianale Pelle,Calzature,Borrelli,BOR-MOC-01-41-BLU,8051234567029,41,Blu Notte,149.00,65.00,22,5,2
BOR-MOC-01,Mocassino Artigianale Pelle,Calzature,Borrelli,BOR-MOC-01-42-BLU,8051234567036,42,Blu Notte,149.00,65.00,22,4,2
BOR-SNK-02,Sneaker Running Soft Urban,Sneakers,Borrelli,BOR-SNK-02-42-WH,8051234567104,42,Bianco,119.00,48.00,22,6,2
BOR-BOR-10,Borsa a Spalla Cuoio Pieno Fiore,Borse,Borrelli,BOR-BOR-10-UNI-COG,8051234567203,TU,Cognac,210.00,90.00,22,2,1
BOR-CIN-05,Cintura Pelle Reversibile,Accessori,Borrelli,BOR-CIN-05-105-BK,8051234567302,105,Nero,45.00,16.00,22,8,2
```

---

## 4. Procedura di Esecuzione Step-by-Step

### Fase 1: Estrazione dal Vecchio Gestionale (T-1)
1. Eseguire l'export anagrafica articoli e giacenze di chiusura cassa in formato Excel o CSV dal gestionale precedente di Borrelli.
2. Verificare l'assenza di righe duplicate con identico EAN o codici a barre non leggibili.
3. Effettuare una pulizia rapida su eventuali spazi extra nei campi taglia (es. uniformare `" 42 "` a `"42"`).

### Fase 2: Configurazione Iniziale RIVO (T - 2 ore)
1. Accedere al pannello RIVO come `owner` / `admin`.
2. Selezionare l'organizzazione `Borrelli Group` e verificare che il verticale sia impostato su `retail` (o `shoe_store`).
3. In `/dashboard/settings`, verificare la sede/location predefinita (es. `Negozio Napoli`).

### Fase 3: Validazione & Anteprima (T - 30 min)
1. Navigare su `/dashboard/import`.
2. Trascinare il file esportato nell'area di upload.
3. RIVO esegue la validazione client/server immediata (`/api/import/catalog` con `mode: 'preview'`):
   - Rilevamento automatico delle colonne.
   - Conteggio prodotti totali e varianti raggruppate.
   - Identificazione di categorie e brand nuovi che verranno auto-creati.
   - Segnalazione di eventuali errori o warning (es. barcode duplicati, prezzi mancanti).
4. Esaminare l'anteprima a video con statistiche di import.

### Fase 4: Commit e Inizializzazione Giacenze (T - 0 Cut-Over)
1. Cliccare su **"Conferma ed Importa nel Catalogo"**.
2. L'API effettua l'inserimento transazionale:
   - Creazione o aggancio di `product_categories` e `brands`.
   - Inserimento record master in `products`.
   - Inserimento record in `product_variants` con attributi JSON (`size`, `color`).
   - Generazione dei record di carico iniziale in `inventory_movements` (tipo: `initial`).
   - Calcolo e inserimento dei saldi iniziali in `inventory_balances`.
3. Notifica di successo con riepilogo: numero articoli caricati e valore di carico totale.

### Fase 5: Verifica del Negozio (T + 15 min)
1. **Verifica POS Cassa (`/dashboard/sales`):**
   - Scansionare con il barcode scanner 3 articoli a campione (es. Mocassino taglia 41, Sneaker 42, Borsa Cognac).
   - Accertarsi che il prezzo al pubblico, l'IVA e la disponibilità a magazzino siano istantaneamente corretti.
2. **Verifica Magazzino (`/dashboard/inventory`):**
   - Verificare che il totale pezzi e il valore totale di magazzino coincidano con l'inventario del gestionale precedente.
3. **Esecuzione prima transazione di prova:**
   - Emettere uno scontrino test da 1€ su articolo fittizio o vendita reale di primo mattino, verificando lo scarico immediato da 5 a 4 pezzi.

---

## 5. Gestione Errori e Casi Limite (Edge Cases)

* **Barcode già presente nel database:**
  L'importatore segnala la riga specifica ed evita la duplicazione. È possibile aggiornare la giacenza esistente o scartare la riga singola senza interrompere l'intero lotto.
* **Prezzi con virgola italiana (es. `149,00`):**
  Il parser converte automaticamente le virgole decimali in punti standard ANSI prima della validazione Zod.
* **Taglie non numeriche (es. `S, M, L`, `Taglia Unica`, `TU`):**
  Supportate al 100% come attributi testuali elastici nel JSONB di variante.
* **Articoli senza barcode fisico:**
  L'importatore genera automaticamente uno SKU univoco e opzionalmente un codice identificativo interno stampabile.

---

## 6. Piano di Rollback & Sicurezza

In caso di anomalia critica durante il cut-over:
1. L'operazione di import avviene con tracciamento temporale preciso (`created_at`).
2. Tramite audit log (`audit_logs`) è possibile identificare esattamente l'operazione eseguita dall'utente e il batch generato.
3. Qualora fosse necessario ripristinare lo stato pre-migrazione prima dell'apertura del negozio, è disponibile una procedura pulita di de-allocazione dei prodotti importati con batch ID senza toccare le tabelle globali.

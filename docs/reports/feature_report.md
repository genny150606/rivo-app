# RIVO Feature & Capability Report
**Versione:** 1.0 — Ottobre 2026  
**Modulo Principale:** RIVO Retail + Vertical Modular Platform  
**Target di Riferimento:** Borrelli Shoes & Fashion / Retail Stores  

---

## 1. Modulo Catalogo Prodotti (`/dashboard/products`)
- **Gestione Completa Scarpe & Accessori:** Supporto per gerarchia Prodotto Madre -> Varianti (Taglia, Colore, Materiale).
- **Preset Taglie Rapidi:** Generazione con un clic di taglie scarpe uomo (39–46) e scarpe donna (35–41).
- **Controllo Margini in Tempo Reale:** Calcolo automatico margine assoluto (€) e ricarico percentuale (%) durante l'inserimento prezzi.
- **Brand & Categorie Gerarchiche:** Creazione modale inline di marchi e categorie merceologiche.
- **Ricerca & Filtri Multi-Parametro:** Ricerca istantanea per nome modello, brand, SKU, codice a barre EAN e stato di giacenza.

---

## 2. Modulo Magazzino & Scorte (`/dashboard/inventory`)
- **Giacenze per Variante:** Visualizzazione chiara con evidenziazione grafica sottoscorta (ambra) ed esaurito (rosso).
- **Storico Movimenti Dettagliato (Audit Trail):** Tracciamento data, tipo (`purchase`, `sale`, `return`, `adjustment`, `damaged`, `inventory_count`), delta (+/-), giacenza risultante `quantity_after`, costo e causale.
- **Export Riordino Fornitori:** Generazione ed esportazione automatica file CSV con la lista articoli sottoscorta e quantità consigliata.
- **Procedura Inventario Fisico Periodico (PRD §21):** Avvio sessione di inventario, inserimento conteggi fisici, evidenziazione discrepanze teoriche e riconciliazione automatica con un clic tramite `rpc_apply_inventory_count`.

---

## 3. Modulo Check Rapido Taglie In-Store (`/dashboard/stock-check`)
- Schermata mobile-first ottimizzata per gli addetti vendita in negozio.
- Scansione barcode da fotocamera o digitazione rapida modello per verificare in 2 secondi se il numero 42 o 43 è disponibile a magazzino.

---

## 4. Modulo Punto Cassa & Vendite POS (`/dashboard/sales`)
- **Punto Cassa Veloce:**
  - Ricerca barcode / nome prodotto con griglia taglie disponibili.
  - Carrello dinamico con modificatori quantità, sconto a valore o percentuale.
  - Scorporo IVA 22% automatico.
  - Selezione metodo di pagamento: POS / Carta, Contanti, Bonifico, Buono Spesa.
  - Calcolatore resto contanti con pulsanti taglio rapido (€10, €20, €50, €100, Esatto).
  - Collegamento profilo cliente con accumulo punti fidelity.
- **Ricevuta / Scontrino di Cortesia Stampabile:** Visualizzazione modale con formattazione scontrino ed emissione immediata.
- **Gestione Resi & Rimborsi:** Ricerca vendita originale, selezione articoli e quantità da rendere, scelta se rimandare la merce a magazzino (restock), causale reso e metodo rimborso (contanti, carta, buono).
- **Storico Vendite:** Registro scontrini con filtri temporali e ristampa rapida.

---

## 5. Modulo Fornitori & Ordini d'Acquisto (`/dashboard/suppliers`)
- **Anagrafica Fornitori:** Ragione sociale, referente, contatti, Partita IVA, condizioni di pagamento concordate.
- **Workflow Ordini d'Acquisto:** Creazione ordine da catalogo, calcolo importo totale a costo concordato, stato `Bozza` -> `Inviato` -> `Parzialmente Ricevuto` -> `Ricevuto`.
- **Ricezione Merce con Carico Atomico:** Modale ricezione merce per registrare i colli arrivati e caricarli a magazzino istantaneamente tramite `rpc_receive_purchase_order`.

---

## 6. Modulo Clienti & CRM (`/dashboard/leads`)
- **Anagrafica Clienti Completa:** Nome, cognome, telefono, email, codice fiscale, data di nascita, note e preferenze taglie.
- **Scheda Cliente con Storico Spesa:** Dettaglio di tutti gli acquisti passati, scontrino per scontrino, totale speso cumulato e saldo punti fidelity.
- **Hub Contatti Acquisiti:** Gestione unificata dei lead provenienti da Wi-Fi captive portal, ruota della fortuna e tag NFC, con pulsante "Converti in Cliente".

---

## 7. Motore di Migrazione & Import Catalogo (`/dashboard/import`)
- Wizard in 4 passaggi per migrare da gestionali precedenti (es. Zucchetti, Danea):
  1. Caricamento file `.xlsx`, `.xls` o `.csv`.
  2. Mappatura colonne automatica e manuale.
  3. Validazione e anteprima errori riga per riga.
  4. Inserimento batch atomico con auto-creazione brand/categorie e carico giacenze iniziali.
- Template CSV Borrelli scaricabile direttamente dall'interfaccia.

---

## 8. Dashboard Esecutiva Retail (`/dashboard` & `/dashboard/analytics`)
- Riconoscimento automatico del verticale del tenant: carica la dashboard Retail se l'attività è Retail/Footwear, altrimenti mantiene la Control Room della ristorazione.
- KPI Fatturato, Margine Lordo (€ e %), Scontrino Medio, Varianti Sotto Scorta, Giacenze totali.
- Grafico interattivo dell'andamento vendite (Recharts AreaChart).
- Widget Top 5 articoli più venduti e Alert riordino magazzino.

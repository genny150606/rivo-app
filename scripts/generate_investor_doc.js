const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} = require('docx');

async function buildInvestorDocument() {
  console.log('Generating RIVO Investor Memorandum (.docx)...');

  const primaryColor = '008080'; // Deep Teal / Tech Cyan
  const accentGold = 'D97706'; // Warm Amber
  const darkNavy = '0F172A'; // Slate 900
  const lightGray = 'F8FAFC';
  const borderGray = 'E2E8F0';

  // Helper for Section Headings
  const makeH1 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 180 },
      children: [
        new TextRun({
          text: text,
          bold: true,
          size: 32, // 16pt
          color: darkNavy,
          font: 'Arial',
        }),
      ],
    });

  const makeH2 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      children: [
        new TextRun({
          text: text,
          bold: true,
          size: 26, // 13pt
          color: primaryColor,
          font: 'Arial',
        }),
      ],
    });

  const makeH3 = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: text,
          bold: true,
          size: 22, // 11pt
          color: '334155',
          font: 'Arial',
        }),
      ],
    });

  const makeP = (text, boldPrefix = '') =>
    new Paragraph({
      spacing: { before: 60, after: 100, line: 276 },
      children: [
        boldPrefix
          ? new TextRun({
              text: boldPrefix + ' ',
              bold: true,
              size: 21,
              color: darkNavy,
              font: 'Calibri',
            })
          : null,
        new TextRun({
          text: text,
          size: 21,
          color: '334155',
          font: 'Calibri',
        }),
      ].filter(Boolean),
    });

  const makeBullet = (boldPrefix, text) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 40, after: 60, line: 260 },
      children: [
        new TextRun({
          text: boldPrefix ? boldPrefix + ': ' : '',
          bold: true,
          size: 21,
          color: darkNavy,
          font: 'Calibri',
        }),
        new TextRun({
          text: text,
          size: 21,
          color: '334155',
          font: 'Calibri',
        }),
      ],
    });

  const makeCallout = (title, text) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
              margins: { top: 140, bottom: 140, left: 200, right: 200 },
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: '10B981' },
                top: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: title,
                      bold: true,
                      size: 22,
                      color: '065F46',
                      font: 'Arial',
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 60 },
                  children: [
                    new TextRun({
                      text: text,
                      size: 20,
                      color: '1E293B',
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const doc = new Document({
    creator: 'RIVO Technologies Team',
    title: 'RIVO - Investor Memorandum & Product Whitepaper 2026',
    description: 'Executive Document for Investors: Complete platform overview, market opportunity, killer features, business model and unit economics.',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'RIVO — Autonomous Hospitality OS | Confidential Investor Deck',
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Pagina ',
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' di ',
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ==================== COVER / TITLE ====================
          new Paragraph({
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'RIVO TECHNOLOGIES',
                bold: true,
                size: 48, // 24pt
                color: darkNavy,
                font: 'Arial Black',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({
                text: 'The Phygital Autonomous Hospitality Operating System',
                bold: true,
                size: 26,
                color: primaryColor,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({
                text: 'DOCUMENTO RISERVATO PER INVESTITORI • SERIE PRE-SEED / SEED 2026',
                size: 18,
                bold: true,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          }),

          makeCallout(
            'HIGHLIGHT ESECUTIVO',
            'RIVO trasforma ogni tavolo della ristorazione in un micro-hub phygital intelligente attivato via NFC senza download di app. Elimina la carenza di personale, azzera le code alla cassa, protegge al 100% la reputazione su Google con il filtro salvavita "Review Shield", e automatizza la Fattura Elettronica e lo Split Bill ("alla romana") con acquisizione istantanea via QR Agenzia delle Entrate.'
          ),

          // ==================== SEZIONE 1 ====================
          makeH1('1. EXECUTIVE SUMMARY & VISION AZIENDALE'),
          makeP(
            'Nel settore Ho.Re.Ca. (Hotel, Restaurant, Café) globale e in particolare in Italia, il modello operativo di sala è rimasto identico da oltre cinquant’anni: comande cartacee o palmari proprietari lenti e costosi, camerieri oberati che corrono tra i tavoli, clienti che sventolano le braccia per chiedere il conto, e recensioni negative su Google lasciate da ospiti delusi che non hanno avuto modo di esprimere il proprio malcontento prima di pagare.'
          ),
          makeP(
            'RIVO nasce per ridefinire l’esperienza d’accoglienza al tavolo attraverso una tecnologia definita "Phygital Autonoma": un chip NFC fisico integrato in eleganti supporti da tavolo che, con un semplice tap dello smartphone (senza scaricare alcuna applicazione né registrarsi), apre in 200 millisecondi un Hub di servizi dinamico, ultra-veloce e personalizzato.'
          ),
          makeP('I numeri chiave generati da RIVO per il ristorante partner:'),
          makeBullet('+28% di Scontrino Medio', 'grazie al motore di upselling predittivo, descrizioni gourmet generate da AI e Sommelier intelligente.'),
          makeBullet('-40% di Tempi Morti in Sala', 'chiamata cameriere precisa per motivo (tavolo, cassa, pos) e comande digitali dirette.'),
          makeBullet('Zero Code per la Fattura Elettronica', 'acquisizione autonoma dei dati fiscali aziendali da QR Code ufficiale Agenzia delle Entrate o XML.'),
          makeBullet('Reputazione Google Blindata (In-Dining Review Shield)', 'intercettazione del 100% dei clienti scontenti mentre sono ancora seduti, trasformando potenziali 1-stella su Google in opportunità di riconciliazione immediata.'),

          // ==================== SEZIONE 2 ====================
          makeH1('2. IL MERCATO E I PAIN POINT DELLA RISTORAZIONE'),
          makeP(
            'La ristorazione in Italia e in Europa sta affrontando la crisi strutturale più severa dell’ultimo decennio, determinata da quattro criticità insormontabili:'
          ),
          makeH2('2.1 Carenza Cronica di Personale di Sala'),
          makeP(
            'Solo in Italia mancano oltre 35.000 figure di sala (stime FIPE/Confcommercio). I ristoratori non riescono a trovare camerieri qualificati e sono costretti a ridurre i coperti o a prolungare i tempi di attesa, compromettendo la redditività del locale.'
          ),
          makeH2('2.2 Il Disastro delle Recensioni su Google Maps & TripAdvisor'),
          makeP(
            'L’88% dei consumatori legge le recensioni prima di scegliere un ristorante. Una perdita di appena 0,5 stelle su Google Maps si traduce in un calo stimato del 19% del fatturato. Il problema tragico per l’esercente è che il 92% dei clienti che riceve un piatto freddo, una carne troppo cotta o un servizio lento non lo dice in sala per imbarazzo, ma si sfoga su Google una volta arrivato a casa, causando un danno d’immagine permanente.'
          ),
          makeH2('2.3 L’Imbuto del Conto e della Fattura Elettronica B2B'),
          makeP(
            'In Italia la fatturazione elettronica è obbligatoria per legge. Al momento del conto, quando un tavolo aziendale o un professionista chiede la fattura, il cassiere o il cameriere è costretto a trascrivere a mano su un foglietto o sullo scontrino Partita IVA, Ragione Sociale, Codice SDI e PEC. Questo processo impiega dai 4 agli 8 minuti a tavolo, genera errori di battitura catastrofici (SDI errati, fatture scartate dall’AdE) e crea file interminabili alla cassa nelle ore di punta.'
          ),
          makeH2('2.4 Costi e Complessità dei Sistemi Tradizionali'),
          makeP(
            'I sistemi di comanda tradizionali (palmari Orderman, licenze Zucchetti, registratori proprietari) richiedono investimenti iniziali tra i 3.000€ e gli 8.000€, canoni mensili pesanti e settimane di formazione per il personale.'
          ),

          // ==================== SEZIONE 3 ====================
          makeH1('3. LA SOLUZIONE RIVO: ARCHITETTURA E COMPONENTI'),
          makeP(
            'RIVO elimina radicalmente ogni frizione hardware e software, combinando un asset fisico a bassissimo costo (il chip NFC da tavolo) con un software cloud intelligente a tecnologia serverless.'
          ),

          makeH2('3.1 L’Esperienza Ospite (Zero-App Phygital Hub)'),
          makeP(
            'L’ospite siede al tavolo, avvicina il proprio smartphone (Apple iPhone o Android) all’elegante supporto NFC RIVO e in un istante accede alla WebApp dedicata al tavolo senza dover scaricare nulla dall’App Store né compilare moduli.'
          ),
          makeBullet('Motore Sensoriale Aptico (Haptic Engine)', 'Ogni interazione tattile, tap di categoria o aggiunta al carrello produce un micro-impulso vibrante nativo sul telefono, riproducendo il feeling di un’applicazione nativa iOS da milioni di euro.'),
          makeBullet('Layout Bento Dinamico & Personalizzabile', 'L’esercente può scegliere colori, font d’autore, sfondi animati, disposizione a moduli o griglie bento ad alta densità in totale autonomia.'),
          makeBullet('Traduzione Multilingue Istantanea', 'I turisti stranieri visualizzano automaticamente il menù, gli ingredienti e le allergie nella loro lingua nativa.'),

          makeH2('3.2 Canva Menu Studio & Gestione Visiva Piatti'),
          makeP(
            'Il rivoluzionario sistema di gestione menù ispirato all’intuitività di Canva:'
          ),
          makeBullet('Editing Visuale in Tempo Reale', 'Aggiornamento istantaneo di prezzi, disponibilità piatti, foto in alta definizione e categorie con anteprima live split-screen.'),
          makeBullet('Badges Gourmet & Riconoscimento Dietetico', 'Assegnazione immediata di etichette come Gluten Free, Vegan, Senza Lattosio, Best Seller, Novità dello Chef.'),
          makeBullet('AI Allergen Detector', 'L’intelligenza artificiale analizza la lista ingredienti e segnala automaticamente i 14 allergeni obbligatori secondo il regolamento europeo FIC.'),

          makeH2('3.3 L’AI Hospitality Suite Proprietaria'),
          makeP(
            'RIVO integra una suite di 5 moduli di intelligenza artificiale verticalizzata sul food & beverage:'
          ),
          makeBullet('1. AI Sommelier & Wine Pairing', 'Interroga la carta dei vini del locale e suggerisce al commensale l’abbinamento ideale (al calice o in bottiglia) spiegando le note organolettiche e la temperatura di servizio.'),
          makeBullet('2. AI Food Copywriter & Gourmet Tone', 'Trasforma descrizioni povere come "pasta pomodoro" in testi gastronomici suadenti ed emozionali capaci di raddoppiare l’appetibilità del piatto.'),
          makeBullet('3. AI Menu Scanner (Vision OCR)', 'Permette al ristoratore di caricare una foto del suo vecchio menù cartaceo: in 10 secondi l’AI estrae piatti, categorie, prezzi e descrizioni, compilando l’intero database senza digitare una riga.'),
          makeBullet('4. AI Voice-to-Cart Ordering', 'Consente al cliente di ordinare a voce premendo l’icona microfono ("Vorrei due margherite senza basilico e una birra media"), inserendo istantaneamente i piatti nel carrello.'),
          makeBullet('5. AI Upselling Engine', 'Suggerisce in modo discreto dessert, amari o contorni correlati non appena il cliente aggiunge una portata principale, aumentando il ticket medio del 18-28%.'),

          makeH2('3.4 In-Dining Review Shield (Il Filtro Anti-1 Stella Google)'),
          makeP(
            'Una delle innovazioni più remunerative e apprezzate dai ristoratori:'
          ),
          makeBullet('Se il cliente seleziona 4 o 5 stelle', 'Viene reindirizzato con 1-click alla scheda Google Maps del locale per pubblicare la recensione positiva, scalando il ranking locale.'),
          makeBullet('Se il cliente seleziona 1, 2 o 3 stelle', 'RIVO blocca il reindirizzamento a Google e apre una modale di conciliazione interna ("Ci dispiace molto! Dicci cosa non è andato: risolviamo subito al tuo tavolo").'),
          makeBullet('Alert Immediato alla Cassa & Maître', 'Il monitor di sala riceve un allarme visivo pulsante in rosso con la segnalazione del cliente. Il personale può così intervenire al tavolo prima del conto, scusarsi o offrire il caffè, disinnescando la recensione negativa alla radice!'),

          makeH2('3.5 Conto Smart, Split Bill & Fattura Elettronica (Novità Killer)'),
          makeP(
            'La funzionalità che azzera le file e abbatte i tempi di cassa da 8 minuti a 15 secondi:'
          ),
          makeBullet('Calcolatore "Alla Romana" Interattivo', 'I commensali selezionano il numero di persone (da 1 a 20) e visualizzano istantaneamente la quota esatta per persona, eliminando calcoli a mente o imbarazzi.'),
          makeBullet('Scansione QR Agenzia delle Entrate', 'Il cliente può inquadrare o caricare la foto del QR Code ufficiale dell’Agenzia delle Entrate o incollare il codice XML: RIVO compila in 1 secondo Ragione Sociale, Partita IVA, Codice SDI, PEC e Indirizzo.'),
          makeBullet('1-Click "Copia Dati per Registratore"', 'Sul monitor cassa del ristoratore compare la scheda con tutti i dati fiscali aziendali e un pulsante che copia l’intero blocco formattato negli appunti: il cassiere deve solo incollarlo nel software di fatturazione o sul Registratore Telematico.'),

          makeH2('3.6 Monitor Cassa & Sala Realtime (Zero-Refresh)'),
          makeP(
            'Un’interfaccia live basata su WebSocket Supabase a latenza zero:'
          ),
          makeBullet('Notifiche Visive e Acustiche', 'Campanello di sala personalizzabile con 5 profili acustici (Bistrot Bell, Fine Dining Chime, Lounge Modern, Zen Crystal, Sci-Fi Pulse).'),
          makeBullet('Integrazione Bot Telegram', 'Possibilità di inviare le chiamate dei tavoli e le comande direttamente su smartphone o smartwatch del personale in sala.'),

          makeH2('3.7 Fidelizzazione & Gamification (Wheel & Loyalty)'),
          makeBullet('Ruota della Fortuna (Lucky Wheel)', 'Offre un giro di ruota per vincere un caffè, un dolce o uno sconto, raccogliendo l’email o il numero del cliente per campagne marketing.'),
          makeBullet('Loyalty Card Digitale a Timbri', 'Tessera fedeltà a 10 timbri memorizzata sul dispositivo dell’ospite senza tessere fisiche di plastica.'),

          makeH2('3.8 Generatore Vettoriale di Stand & Cavalieri da Tavolo'),
          makeP(
            'Modulo di impaginazione e stampa PDF per creare cavalieri da tavolo 10x15 cm o adesivi compatti con logo del locale, colori del brand e QR code dinamico ad alta definizione.'
          ),

          // ==================== SEZIONE 4 ====================
          makeH1('4. BUSINESS MODEL & MONETIZZAZIONE'),
          makeP(
            'RIVO adotta un modello ibrido ad alto rendimento e rapido flusso di cassa:'
          ),
          makeH2('4.1 Canoni SaaS in Abbonamento Ricorrente (ARR)'),
          makeBullet('Piano Basic (49€ / mese per locale)', 'Hub digitale, Menù illimitato, Chiamata cameriere, Review Shield.'),
          makeBullet('Piano Pro (89€ / mese per locale)', 'Include Canva Menu Studio, AI Sommelier, Split Bill e Fattura Elettronica B2B, Monitor Realtime con suoni e Telegram.'),
          makeBullet('Piano Enterprise (149€ / mese)', 'Tutte le funzioni AI illimitate (OCR Scanner, Voice-to-cart), multi-sede e supporto prioritario.'),

          makeH2('4.2 Margine Diretto su Hardware NFC & Merchandising'),
          makeP(
            'I cavalieri e i chip NFC da tavolo in legno massello, acrilico o alluminio vengono venduti in kit d’avviamento (kit 20 tavoli a 199€, kit 50 tavoli a 399€) con un margine industriale superiore al 72%.'
          ),

          makeH2('4.3 Take-Rate Transazionale su Pagamenti al Tavolo (Prospettiva 2026-2027)'),
          makeP(
            'Abilitando il pagamento diretto in-app con Apple Pay e Google Pay su circuito Stripe Connect, RIVO trattiene un take-rate dello 0,8% - 1,2% su ogni transazione pagata al tavolo.'
          ),

          // ==================== SEZIONE 5 ====================
          makeH1('5. ANALISI COMPETITIVA & VANTAGGIO STRATEGICO'),
          makeP(
            'Mentre i player tradizionali si concentrano su singoli aspetti frammentati, RIVO è l’unica piattaforma all-in-one phygital:'
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: darkNavy, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Caratteristica', bold: true, color: 'FFFFFF', size: 18 })] })],
                  }),
                  new TableCell({
                    shading: { fill: darkNavy, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'RIVO', bold: true, color: 'BFFF00', size: 18 })] })],
                  }),
                  new TableCell({
                    shading: { fill: darkNavy, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Plateform', bold: true, color: 'FFFFFF', size: 18 })] })],
                  }),
                  new TableCell({
                    shading: { fill: darkNavy, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Zucchetti', bold: true, color: 'FFFFFF', size: 18 })] })],
                  }),
                  new TableCell({
                    shading: { fill: darkNavy, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Leggimenu / QR Base', bold: true, color: 'FFFFFF', size: 18 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Hardware NFC Phygital', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sì (Incluso)', bold: true, color: '059669', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No (Solo link/QR)', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Palmari da 3.000€', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Solo QR PDF', size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fattura Elettronica & AdE QR', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sì (Istantaneo)', bold: true, color: '059669', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Manuale a Cassa', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'In-Dining Review Shield', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sì (Realtime al Tavolo)', bold: true, color: '059669', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Solo post-visita (SMS)', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'AI Suite (Sommelier & Voice)', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sì (5 Motori AI)', bold: true, color: '059669', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Split Bill "Alla Romana"', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sì (1-Click)', bold: true, color: '059669', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Complicato su POS', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', size: 18 })] })] }),
                ],
              }),
            ],
          }),

          // ==================== SEZIONE 6 ====================
          makeH1('6. ARCHITETTURA TECNICA & AFFIDABILITÀ'),
          makeP(
            'L’infrastruttura di RIVO è concepita per sostenere migliaia di locali con tempi di risposta inferiori a 150ms e zero costi fissi per server inattivi:'
          ),
          makeBullet('Frontend & Edge Computing', 'Next.js 16 con React 19 e Tailwind CSS v4. Deploy distribuito su rete globale Vercel Edge con caching geolocalizzato.'),
          makeBullet('Database & Realtime WebSocket', 'Supabase (PostgreSQL 16) con Row Level Security (RLS) avanzata per garantire la totale segregazione dei dati tra organizzazioni.'),
          makeBullet('PWA Nativa & Haptic API', 'Progressive Web App con Service Workers e supporto completo per navigator.vibrate() per il feedback tattile aptico.'),
          makeBullet('Sicurezza e Privacy GDPR', 'Pieno rispetto dei regolamenti europei: nessun dato sensibile memorizzato senza consenso, crittografia end-to-end.'),

          // ==================== SEZIONE 7 ====================
          makeH1('7. ROADMAP E OPPORTUNITÀ D’INVESTIMENTO'),
          makeP(
            'La piattaforma RIVO è attualmente operativa al 100%, con tutte le funzionalità chiave testate, verificate e in produzione.'
          ),
          makeH2('Obiettivi del Round Pre-Seed / Seed (250.000€ - 500.000€):'),
          makeBullet('60% Sales & Field Acquisition', 'Creazione della forza vendita diretta (Field Sales) sui primi cluster ad altissima densità (Napoli, Roma, Milano, costiera e riviera turistica).'),
          makeBullet('25% Produzione Hardware NFC & Logistica', 'Stoccaggio massivo di supporti NFC di pregio (legno massello, alluminio anodizzato) per ridurre il costo unitario di oltre il 40%.'),
          makeBullet('15% Integrazioni Dirette API Cassa', 'Sviluppo di connettori plug-and-play certificati con i principali registratori di cassa telematici (Epson, Custom, Ditron, Zucchetti).'),

          makeCallout(
            'CONTATTI PER INVESTITORI',
            'RIVO Technologies S.r.l. (in costituzione) • Email: founder@rivo.app • Web: https://rivo-app-ten.vercel.app • Documento riservato. Vietata la riproduzione o divulgazione senza autorizzazione.'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), 'RIVO_Investor_Memorandum_2026.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document saved successfully to: ${outputPath} (${buffer.length} bytes)`);
}

buildInvestorDocument().catch((err) => {
  console.error('Error generating document:', err);
  process.exit(1);
});

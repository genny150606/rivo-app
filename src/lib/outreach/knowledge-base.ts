/**
 * RIVO OUTREACH — Product Knowledge Base for AI Intelligence & Personalized Sales Agent
 * Editable by RIVO Superadmins via `outreach_settings` (`setting_key = 'rivo_knowledge_base'`).
 */

export interface RivoModuleKnowledge {
  slug: string;
  name: string;
  targetCategories: string[];
  problemSolved: string;
  howItWorks: string;
  commercialBenefit: string;
}

export interface RivoProductKnowledgeBase {
  version: string;
  productName: string;
  positioningSummary: string;
  hardwareHowItWorks: string;
  supportedCategories: string[];
  availableModules: RivoModuleKnowledge[];
  strictGuardrails: string[];
  customAdminInstructions: string;
}

export const DEFAULT_RIVO_KNOWLEDGE_BASE: RivoProductKnowledgeBase = {
  version: '1.0.0',
  productName: 'RIVO',
  positioningSummary:
    'RIVO è la piattaforma italiana di prossimità intelligente (NFC + QR Code) che trasforma il punto fisico — tavolo, poltrona, bancone o camera d’hotel — in un Digital Hub interattivo istantaneo senza richiedere il download di alcuna app.',
  hardwareHowItWorks:
    'Ogni postazione fisica (tavolo del ristorante, specchio/poltrona del barbiere o parrucchiere, reception dell’hotel, cassa del locale) è dotata di un dispositivo RIVO con chip NFC 13.56 MHz e QR Code univoco. Avvicinando lo smartphone si apre in meno di un secondo l’Hub personalizzato dell’attività.',
  supportedCategories: [
    'restaurant',
    'pizzeria',
    'bar',
    'gelateria',
    'pasticceria',
    'salon',
    'barber',
    'beauty',
    'nail_salon',
    'hotel',
    'bnb',
    'hospitality_other',
    'retail',
  ],
  availableModules: [
    {
      slug: 'menu',
      name: 'Digital Hub & Menù / Listino Interattivo',
      targetCategories: ['restaurant', 'pizzeria', 'bar', 'gelateria', 'pasticceria', 'hotel'],
      problemSolved: 'PDF statici illeggibili da smartphone, listini non aggiornati e assenza di filtri allergeni o multilingua.',
      howItWorks: 'Menù digitale interattivo con traduzione istantanea per turisti, filtro intolleranze e Carrello Condiviso del Tavolo con conferma dei commensali.',
      commercialBenefit: 'Aumenta lo scontrino medio e riduce i tempi di attesa per ordinare.',
    },
    {
      slug: 'service',
      name: 'Chiamata Rapida Sala & Smart Bill al Tavolo',
      targetCategories: ['restaurant', 'pizzeria', 'bar', 'hotel'],
      problemSolved: 'Clienti che cercano lo sguardo del cameriere per ordinare o chiedere il conto diviso.',
      howItWorks: 'Con 1 tap dal tavolo il cliente chiama il cameriere o richiede il conto specificando POS, contanti o divisione alla romana.',
      commercialBenefit: 'Maggiore rotazione dei tavoli e servizio più fluido nelle ore di punta.',
    },
    {
      slug: 'bookings',
      name: 'Gestore Prenotazioni, Poltrone & Staff Live',
      targetCategories: ['salon', 'barber', 'beauty', 'nail_salon'],
      problemSolved: 'Interruzioni telefoniche continue durante i tagli o i trattamenti e gestione manuale degli orari dei collaboratori.',
      howItWorks: 'Il cliente sceglie il trattamento, vede quali barbieri o parrucchieri sono disponibili (o seleziona il primo libero) e prenota lo slot orario calcolato sulla durata reale del servizio.',
      commercialBenefit: 'Agenda poltrone sempre ordinata, meno telefonate in cassa e promemoria WhatsApp immediati.',
    },
    {
      slug: 'reviews',
      name: 'Google Review Shield & Raccolta Feedback',
      targetCategories: [
        'restaurant',
        'pizzeria',
        'bar',
        'gelateria',
        'pasticceria',
        'salon',
        'barber',
        'beauty',
        'nail_salon',
        'hotel',
        'bnb',
      ],
      problemSolved: 'Poche recensioni spontanee dai clienti soddisfatti e critiche pubbliche per disservizi risolvibili sul momento.',
      howItWorks: 'Al tocco sul tag NFC/QR invita i clienti soddisfatti a lasciare una recensione Google e apre un canale di feedback privato diretto con il titolare per segnalazioni interne.',
      commercialBenefit: 'Crescita costante della reputazione online e ascolto diretto della clientela.',
    },
    {
      slug: 'loyalty',
      name: 'Fidelity Card Digitale & Pass Wallet',
      targetCategories: [
        'restaurant',
        'pizzeria',
        'bar',
        'gelateria',
        'pasticceria',
        'salon',
        'barber',
        'beauty',
        'nail_salon',
      ],
      problemSolved: 'Tessere cartacee smarrite e difficoltà nel far tornare con regolarità i clienti occasionali.',
      howItWorks: 'Raccolta timbri e punti digitale accessibile dal telefono con salvataggio su Apple Wallet / Google Wallet.',
      commercialBenefit: 'Incrementa la frequenza di ritorno dei clienti abituali.',
    },
    {
      slug: 'wifi',
      name: 'Ponte Wi-Fi Ospiti 1-Tap & Lead Capture',
      targetCategories: ['restaurant', 'pizzeria', 'bar', 'salon', 'barber', 'hotel', 'bnb'],
      problemSolved: 'Richieste continue della password Wi-Fi al personale.',
      howItWorks: 'Accesso rapido alla rete ospite tramite QR/NFC direttamente dall’Hub.',
      commercialBenefit: 'Migliora l’accoglienza in sala, in salone o nelle camere.',
    },
    {
      slug: 'wheel',
      name: 'Ruota Premi & Gamification In-Store',
      targetCategories: ['restaurant', 'pizzeria', 'bar', 'gelateria', 'salon', 'barber'],
      problemSolved: 'Basso coinvolgimento digitale dei clienti presenti nel locale.',
      howItWorks: 'Ruota interattiva con premi configurabili dal titolare (es. caffè, dolce, sconto prossimo trattamento) riscattabili in cassa.',
      commercialBenefit: 'Genera passaparola e incentiva una seconda visita.',
    },
    {
      slug: 'sommelier',
      name: 'AI Sommelier & Abbinamento Vini',
      targetCategories: ['restaurant', 'pizzeria', 'bar', 'hotel'],
      problemSolved: 'Clienti indecisi sulla carta dei vini quando in sala non è presente un sommelier dedicato.',
      howItWorks: 'Assistente integrato nel menù che suggerisce l’etichetta più adatta ai piatti scelti.',
      commercialBenefit: 'Valorizza la cantina del locale e favorisce la vendita di calici e bottiglie.',
    },
    {
      slug: 'guide',
      name: 'Welcome Concierge & City Guide Digitale',
      targetCategories: ['hotel', 'bnb', 'hospitality_other'],
      problemSolved: 'Ospiti che chiedono ripetutamente orari di check-out, Wi-Fi e consigli sui dintorni.',
      howItWorks: 'Guida digitale in camera attivabile via NFC con informazioni struttura, contatti rapidi WhatsApp e consigli locali.',
      commercialBenefit: 'Esperienza ospite curata 24/7 con meno carico operativo per l’host.',
    },
    {
      slug: 'analytics',
      name: 'Dashboard Analytics & CRM Contatti',
      targetCategories: [
        'restaurant',
        'pizzeria',
        'bar',
        'salon',
        'barber',
        'beauty',
        'hotel',
        'bnb',
      ],
      problemSolved: 'Mancanza di dati misurabili sulle interazioni fisiche in sede.',
      howItWorks: 'Tracciamento in tempo reale delle scansioni per singolo dispositivo, orari di picco e contatti raccolti.',
      commercialBenefit: 'Controllo chiaro del ritorno sull’investimento.',
    },
  ],
  strictGuardrails: [
    'Non promettere mai aumenti garantiti di fatturato o percentuali economiche non dimostrabili.',
    'Non affermare mai di aver visitato fisicamente il locale o di aver provato i suoi prodotti/servizi.',
    'Non dichiarare che un’attività è priva di uno strumento solo perché non è stato rilevato online; usa formulazioni rispettose e basate solo su quanto osservabile.',
    'Non inventare funzionalità RIVO al di fuori dei moduli ufficiali elencati nella Knowledge Base.',
    'Non simulare conversazioni pregresse o conoscenze personali non esistenti.',
  ],
  customAdminInstructions:
    'Mantieni sempre uno stile sobrio, concreto e rispettoso del lavoro dell’imprenditore locale.',
};

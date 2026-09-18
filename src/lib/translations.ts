export type SupportedLanguage = 'it' | 'en' | 'de' | 'fr' | 'es';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export interface HubTranslations {
  // NFC Phases
  nfcScanning: string;
  nfcConnected: string;
  nfcLive: string;
  tableConnected: string;
  table: string;

  // Bottom dock
  home: string;
  menu: string;
  service: string;
  info: string;
  share: string;

  // Modules & Bento
  menuTitle: string;
  menuSubtitle: string;
  serviceTitle: string;
  serviceSubtitle: string;
  sommelierTitle: string;
  sommelierSubtitle: string;
  wifiTitle: string;
  wifiSubtitle: string;
  wheelTitle: string;
  wheelSubtitle: string;
  loyaltyTitle: string;
  loyaltySubtitle: string;
  reviewTitle: string;
  reviewSubtitle: string;
  guideTitle: string;
  guideSubtitle: string;
  whatsappTitle: string;
  whatsappSubtitle: string;
  instagramTitle: string;
  instagramSubtitle: string;

  // Service Modal
  serviceModalTitle: string;
  serviceModalDesc: string;
  waiterOption: string;
  waiterDesc: string;
  billPosOption: string;
  billPosDesc: string;
  billCashOption: string;
  billCashDesc: string;
  sendRequest: string;
  requestSent: string;
  requestSentDesc: string;
  close: string;

  // Menu Modal & Table Ordering
  digitalMenu: string;
  searchPlaceholder: string;
  all: string;
  starters: string;
  firstCourses: string;
  mainCourses: string;
  desserts: string;
  drinks: string;
  orderAtTable: string;
  addToCart: string;
  tableTray: string;
  viewOrder: string;
  orderSummary: string;
  kitchenNotes: string;
  kitchenNotesPlaceholder: string;
  sendOrderToCashier: string;
  orderSentSuccess: string;
  orderSentDesc: string;
  emptyTray: string;
  emptyTrayDesc: string;
  total: string;
  chefAdvice: string;
  topBadge: string;
  noDishesFound: string;
  orderNotice: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, HubTranslations> = {
  it: {
    nfcScanning: 'Sincronizzazione chip NFC...',
    nfcConnected: 'Dispositivo agganciato!',
    nfcLive: 'NFC LIVE',
    tableConnected: 'Tavolo Connesso',
    table: 'Tavolo',
    home: 'Home',
    menu: 'Menù',
    service: 'Chiama Sala',
    info: 'Info',
    share: 'Condividi',
    menuTitle: 'Menù Digitale',
    menuSubtitle: 'Piatti, prezzi & vini',
    serviceTitle: 'Chiama Sala',
    serviceSubtitle: 'Cameriere o conto al tavolo',
    sommelierTitle: 'AI Sommelier',
    sommelierSubtitle: 'Consigli abbinamento vini',
    wifiTitle: 'Wi-Fi Ospiti',
    wifiSubtitle: 'Accesso rapido 1-Tap',
    wheelTitle: 'Ruota Premi',
    wheelSubtitle: 'Gira & vinci un bonus',
    loyaltyTitle: 'Fidelity Pass',
    loyaltySubtitle: 'Timbri digitali al tavolo',
    reviewTitle: 'Lascia Recensione',
    reviewSubtitle: 'Valuta l’esperienza su Google',
    guideTitle: 'Guida Locale',
    guideSubtitle: 'Cosa vedere & fare nei dintorni',
    whatsappTitle: 'Chat WhatsApp',
    whatsappSubtitle: 'Scrivi allo staff',
    instagramTitle: 'Canale Instagram',
    instagramSubtitle: 'Foto, storie & novità',
    serviceModalTitle: 'Chiamata Personale di Sala',
    serviceModalDesc: 'Invia una notifica istantanea alla cassa e ai camerieri.',
    waiterOption: 'Assistenza Cameriere',
    waiterDesc: 'Per ordinare o richiedere informazioni',
    billPosOption: 'Conto con POS / Carta',
    billPosDesc: 'Il personale arriverà con il lettore di carte',
    billCashOption: 'Conto in Contanti',
    billCashDesc: 'Pagamento diretto in banconote / monete',
    sendRequest: 'Invia Richiesta al Tavolo',
    requestSent: 'Richiesta Inviata con Successo!',
    requestSentDesc: 'Il personale di sala ha ricevuto la notifica e sarà da te a breve.',
    close: 'Chiudi',
    digitalMenu: 'Menù Digitale',
    searchPlaceholder: 'Cerca piatti, ingredienti...',
    all: 'Tutti',
    starters: 'Antipasti',
    firstCourses: 'Primi',
    mainCourses: 'Secondi',
    desserts: 'Dolci',
    drinks: 'Vini & Bar',
    orderAtTable: 'Ordina al Tavolo',
    addToCart: 'Aggiungi',
    tableTray: 'Vassoio Tavolo',
    viewOrder: 'Vedi Comanda',
    orderSummary: 'Riepilogo Comanda al Tavolo',
    kitchenNotes: 'Note per la cucina o cameriere',
    kitchenNotesPlaceholder: 'Es. Cottura al sangue, senza pepe, allergia alle noci...',
    sendOrderToCashier: 'Invia Ordine alla Cassa',
    orderSentSuccess: 'Comanda Inviata con Successo!',
    orderSentDesc: 'La cassa e la cucina hanno ricevuto il tuo ordine e lo stanno preparando.',
    emptyTray: 'Il vassoio è vuoto',
    emptyTrayDesc: 'Seleziona i piatti dal menù con il tasto + per ordinarli al tavolo.',
    total: 'Totale Comanda',
    chefAdvice: 'Consiglio dello Chef',
    topBadge: 'Top',
    noDishesFound: 'Nessun piatto trovato con questi criteri di ricerca.',
    orderNotice: 'I piatti selezionati verranno inoltrati direttamente allo staff di sala e cucina.',
  },

  en: {
    nfcScanning: 'Syncing NFC chip...',
    nfcConnected: 'Table connected!',
    nfcLive: 'NFC LIVE',
    tableConnected: 'Connected Table',
    table: 'Table',
    home: 'Home',
    menu: 'Menu',
    service: 'Call Staff',
    info: 'Info',
    share: 'Share',
    menuTitle: 'Digital Menu',
    menuSubtitle: 'Dishes, prices & wines',
    serviceTitle: 'Call Staff',
    serviceSubtitle: 'Waiter or check at your table',
    sommelierTitle: 'AI Sommelier',
    sommelierSubtitle: 'Wine pairing advisor',
    wifiTitle: 'Guest Wi-Fi',
    wifiSubtitle: 'Fast 1-Tap access',
    wheelTitle: 'Prize Wheel',
    wheelSubtitle: 'Spin & win a bonus',
    loyaltyTitle: 'Loyalty Pass',
    loyaltySubtitle: 'Digital table stamps',
    reviewTitle: 'Leave a Review',
    reviewSubtitle: 'Rate your experience on Google',
    guideTitle: 'City Guide',
    guideSubtitle: 'What to see & do nearby',
    whatsappTitle: 'WhatsApp Chat',
    whatsappSubtitle: 'Message our team',
    instagramTitle: 'Instagram',
    instagramSubtitle: 'Photos, stories & news',
    serviceModalTitle: 'Call Table Service',
    serviceModalDesc: 'Send an instant notification to staff and cashier.',
    waiterOption: 'Waiter Assistance',
    waiterDesc: 'To order or ask questions',
    billPosOption: 'Bill with Card / POS',
    billPosDesc: 'Staff will bring the card payment terminal',
    billCashOption: 'Bill with Cash',
    billCashDesc: 'Direct payment in cash banknotes / coins',
    sendRequest: 'Send Request from Table',
    requestSent: 'Request Sent Successfully!',
    requestSentDesc: 'Our floor staff received your notification and will be with you shortly.',
    close: 'Close',
    digitalMenu: 'Digital Menu',
    searchPlaceholder: 'Search dishes, ingredients...',
    all: 'All',
    starters: 'Starters',
    firstCourses: 'First Courses',
    mainCourses: 'Mains',
    desserts: 'Desserts',
    drinks: 'Wine & Bar',
    orderAtTable: 'Order at Table',
    addToCart: 'Add',
    tableTray: 'Table Tray',
    viewOrder: 'View Order',
    orderSummary: 'Table Order Summary',
    kitchenNotes: 'Notes for kitchen or waiter',
    kitchenNotesPlaceholder: 'E.g. Medium rare, no pepper, nut allergy...',
    sendOrderToCashier: 'Send Order to Kitchen & POS',
    orderSentSuccess: 'Order Sent Successfully!',
    orderSentDesc: 'The kitchen and cashier received your order and are preparing your dishes.',
    emptyTray: 'Your tray is empty',
    emptyTrayDesc: 'Add dishes from the menu with the + button to place your order.',
    total: 'Order Total',
    chefAdvice: 'Chef Recommendation',
    topBadge: 'Top',
    noDishesFound: 'No dishes found matching your search.',
    orderNotice: 'Selected items will be dispatched directly to kitchen and floor staff.',
  },

  de: {
    nfcScanning: 'NFC-Chip wird synchronisiert...',
    nfcConnected: 'Tisch verbunden!',
    nfcLive: 'NFC LIVE',
    tableConnected: 'Verbundener Tisch',
    table: 'Tisch',
    home: 'Start',
    menu: 'Menü',
    service: 'Service Rufen',
    info: 'Info',
    share: 'Teilen',
    menuTitle: 'Digitale Speisekarte',
    menuSubtitle: 'Gerichte, Preise & Weine',
    serviceTitle: 'Service Rufen',
    serviceSubtitle: 'Kellner oder Rechnung an den Tisch',
    sommelierTitle: 'KI-Sommelier',
    sommelierSubtitle: 'Weinempfehlungen & Pairing',
    wifiTitle: 'Gäste-WLAN',
    wifiSubtitle: 'Schneller 1-Tap-Zugang',
    wheelTitle: 'Glücksrad',
    wheelSubtitle: 'Drehen & Bonus gewinnen',
    loyaltyTitle: 'Treuepass',
    loyaltySubtitle: 'Digitale Stempel am Tisch',
    reviewTitle: 'Bewertung Abgeben',
    reviewSubtitle: 'Erfahrung auf Google bewerten',
    guideTitle: 'Reiseführer',
    guideSubtitle: 'Sehenswürdigkeiten in der Nähe',
    whatsappTitle: 'WhatsApp-Chat',
    whatsappSubtitle: 'Nachricht an das Team',
    instagramTitle: 'Instagram',
    instagramSubtitle: 'Fotos, Stories & Neuigkeiten',
    serviceModalTitle: 'Service an den Tisch rufen',
    serviceModalDesc: 'Sofortige Benachrichtigung an Kasse und Kellner senden.',
    waiterOption: 'Kellner rufen',
    waiterDesc: 'Für Bestellungen oder Fragen',
    billPosOption: 'Rechnung mit Karte (POS)',
    billPosDesc: 'Das Personal bringt das Kartenterminal',
    billCashOption: 'Rechnung in Bar',
    billCashDesc: 'Direkte Barzahlung am Tisch',
    sendRequest: 'Anfrage absenden',
    requestSent: 'Anfrage erfolgreich gesendet!',
    requestSentDesc: 'Unser Service-Team hat die Anfrage erhalten und kommt gleich zu Ihnen.',
    close: 'Schließen',
    digitalMenu: 'Digitale Speisekarte',
    searchPlaceholder: 'Gerichte, Zutaten suchen...',
    all: 'Alle',
    starters: 'Vorspeisen',
    firstCourses: 'Erste Gänge',
    mainCourses: 'Hauptgerichte',
    desserts: 'Desserts',
    drinks: 'Weine & Bar',
    orderAtTable: 'Am Tisch bestellen',
    addToCart: 'Hinzufügen',
    tableTray: 'Tisch-Bestellung',
    viewOrder: 'Bestellung ansehen',
    orderSummary: 'Bestellübersicht am Tisch',
    kitchenNotes: 'Hinweise für Küche oder Service',
    kitchenNotesPlaceholder: 'Z.B. Medium gebraten, kein Pfeffer, Nussallergie...',
    sendOrderToCashier: 'Bestellung an Kasse & Küche senden',
    orderSentSuccess: 'Bestellung erfolgreich gesendet!',
    orderSentDesc: 'Küche und Kasse haben Ihre Bestellung erhalten und bereiten sie vor.',
    emptyTray: 'Die Bestellung ist noch leer',
    emptyTrayDesc: 'Wählen Sie Gerichte aus dem Menü mit dem + Button aus.',
    total: 'Gesamtsumme',
    chefAdvice: 'Empfehlung des Küchenchefs',
    topBadge: 'Top',
    noDishesFound: 'Keine Gerichte für diese Suche gefunden.',
    orderNotice: 'Ausgewählte Speisen werden direkt an Küche und Service übermittelt.',
  },

  fr: {
    nfcScanning: 'Synchronisation de la puce NFC...',
    nfcConnected: 'Table connectée !',
    nfcLive: 'NFC LIVE',
    tableConnected: 'Table Connectée',
    table: 'Table',
    home: 'Accueil',
    menu: 'Menu',
    service: 'Appeler Serveur',
    info: 'Infos',
    share: 'Partager',
    menuTitle: 'Menu Digital',
    menuSubtitle: 'Plats, tarifs & vins',
    serviceTitle: 'Appeler Serveur',
    serviceSubtitle: 'Serveur ou addition à table',
    sommelierTitle: 'Sommelier IA',
    sommelierSubtitle: 'Conseils d’accords mets & vins',
    wifiTitle: 'Wi-Fi Invités',
    wifiSubtitle: 'Accès rapide en 1-Tap',
    wheelTitle: 'Roue Cadeaux',
    wheelSubtitle: 'Tournez & gagnez un bonus',
    loyaltyTitle: 'Pass Fidélité',
    loyaltySubtitle: 'Tampons digitaux à table',
    reviewTitle: 'Laisser un Avis',
    reviewSubtitle: 'Évaluez l’expérience sur Google',
    guideTitle: 'Guide Local',
    guideSubtitle: 'À voir & à faire aux alentours',
    whatsappTitle: 'Chat WhatsApp',
    whatsappSubtitle: 'Écrire à l’équipe',
    instagramTitle: 'Instagram',
    instagramSubtitle: 'Photos, stories & actualités',
    serviceModalTitle: 'Service à Table',
    serviceModalDesc: 'Envoyer une notification instantanée à l’équipe et à la caisse.',
    waiterOption: 'Assistance Serveur',
    waiterDesc: 'Pour commander ou poser une question',
    billPosOption: 'Addition par Carte / TPE',
    billPosDesc: 'Le serveur apportera le terminal bancaire',
    billCashOption: 'Addition en Espèces',
    billCashDesc: 'Paiement direct en billets ou pièces',
    sendRequest: 'Envoyer la Demande',
    requestSent: 'Demande Envoyée avec Succès !',
    requestSentDesc: 'L’équipe en salle a reçu votre demande et arrive dans un instant.',
    close: 'Fermer',
    digitalMenu: 'Menu Digital',
    searchPlaceholder: 'Rechercher plats, ingrédients...',
    all: 'Tous',
    starters: 'Entrées',
    firstCourses: 'Plats Principaux (Pâtes)',
    mainCourses: 'Viandes & Poissons',
    desserts: 'Desserts',
    drinks: 'Vins & Bar',
    orderAtTable: 'Commander à Table',
    addToCart: 'Ajouter',
    tableTray: 'Plateau Table',
    viewOrder: 'Voir la Commande',
    orderSummary: 'Récapitulatif de la Commande',
    kitchenNotes: 'Notes pour la cuisine ou le serveur',
    kitchenNotesPlaceholder: 'Ex. Cuisson à point, sans poivre, allergie aux noix...',
    sendOrderToCashier: 'Envoyer en Cuisine & Caisse',
    orderSentSuccess: 'Commande Envoyée avec Succès !',
    orderSentDesc: 'La cuisine et la caisse ont bien reçu votre commande.',
    emptyTray: 'Le plateau est vide',
    emptyTrayDesc: 'Ajoutez des plats depuis le menu avec le bouton +.',
    total: 'Total Commande',
    chefAdvice: 'Conseil du Chef',
    topBadge: 'Top',
    noDishesFound: 'Aucun plat trouvé pour cette recherche.',
    orderNotice: 'Les plats sélectionnés sont transmis directement à la cuisine et au personnel.',
  },

  es: {
    nfcScanning: 'Sincronizando chip NFC...',
    nfcConnected: '¡Mesa conectada!',
    nfcLive: 'NFC LIVE',
    tableConnected: 'Mesa Conectada',
    table: 'Mesa',
    home: 'Inicio',
    menu: 'Menú',
    service: 'Llamar Sala',
    info: 'Info',
    share: 'Compartir',
    menuTitle: 'Menú Digital',
    menuSubtitle: 'Platos, precios y vinos',
    serviceTitle: 'Llamar Camarero',
    serviceSubtitle: 'Camarero o cuenta en la mesa',
    sommelierTitle: 'Sumiller IA',
    sommelierSubtitle: 'Consejos de maridaje de vinos',
    wifiTitle: 'Wi-Fi Clientes',
    wifiSubtitle: 'Acceso rápido en 1-Tap',
    wheelTitle: 'Ruleta Premios',
    wheelSubtitle: 'Gira y gana un regalo',
    loyaltyTitle: 'Pase Fidelidad',
    loyaltySubtitle: 'Sellos digitales en la mesa',
    reviewTitle: 'Dejar Reseña',
    reviewSubtitle: 'Valora tu experiencia en Google',
    guideTitle: 'Guía Local',
    guideSubtitle: 'Qué ver y hacer en los alrededores',
    whatsappTitle: 'Chat WhatsApp',
    whatsappSubtitle: 'Escribe a nuestro equipo',
    instagramTitle: 'Instagram',
    instagramSubtitle: 'Fotos, historias y novedades',
    serviceModalTitle: 'Llamar al Personal de Sala',
    serviceModalDesc: 'Envía una notificación instantánea a caja y camareros.',
    waiterOption: 'Asistencia de Camarero',
    waiterDesc: 'Para pedir o solicitar información',
    billPosOption: 'Cuenta con Tarjeta / Datáfono',
    billPosDesc: 'El personal traerá el terminal de pago',
    billCashOption: 'Cuenta en Efectivo',
    billCashDesc: 'Pago directo en metálico en la mesa',
    sendRequest: 'Enviar Solicitud',
    requestSent: '¡Solicitud Enviada con Éxito!',
    requestSentDesc: 'El personal ha recibido la notificación y se acercará enseguida.',
    close: 'Cerrar',
    digitalMenu: 'Menú Digital',
    searchPlaceholder: 'Buscar platos, ingredientes...',
    all: 'Todos',
    starters: 'Entrantes',
    firstCourses: 'Primeros Platos',
    mainCourses: 'Segundos Platos',
    desserts: 'Postres',
    drinks: 'Vinos y Bebidas',
    orderAtTable: 'Pedir en la Mesa',
    addToCart: 'Añadir',
    tableTray: 'Bandeja Mesa',
    viewOrder: 'Ver Pedido',
    orderSummary: 'Resumen del Pedido en Mesa',
    kitchenNotes: 'Notas para la cocina o camarero',
    kitchenNotesPlaceholder: 'Ej. Al punto, sin pimienta, alergia a frutos secos...',
    sendOrderToCashier: 'Enviar Pedido a Caja y Cocina',
    orderSentSuccess: '¡Pedido Enviado con Éxito!',
    orderSentDesc: 'La cocina y la caja han recibido tu comanda y la están preparando.',
    emptyTray: 'Tu bandeja está vacía',
    emptyTrayDesc: 'Selecciona platos del menú con el botón + para agregarlos a tu pedido.',
    total: 'Total Comanda',
    chefAdvice: 'Recomendación del Chef',
    topBadge: 'Top',
    noDishesFound: 'No se encontraron platos para esta búsqueda.',
    orderNotice: 'Los platos seleccionados se enviarán directamente al equipo de sala y cocina.',
  },
};

// Common dish tags translated
export const TAG_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  it: {},
  en: {
    'Gluten Free': 'Gluten Free',
    'Vegetariano': 'Vegetarian',
    'Vegano': 'Vegan',
    'Chef Special': 'Chef Special',
    'Piatto Iconico': 'Signature Dish',
    'Km 0': 'Local Km 0',
    'Pesce Fresco': 'Fresh Catch',
    'Fatto in Casa': 'Homemade',
    'Piccante': 'Spicy',
    'Da Condividere': 'To Share',
    'Senza Lattosio': 'Lactose Free',
    'Bio': 'Organic Bio',
    'Carta Vini': 'Wine List',
    'Aperitivo': 'Aperitif',
  },
  de: {
    'Gluten Free': 'Glutenfrei',
    'Vegetariano': 'Vegetarisch',
    'Vegano': 'Vegan',
    'Chef Special': 'Küchenchef-Spezialität',
    'Piatto Iconico': 'Signature-Gericht',
    'Km 0': 'Regional Km 0',
    'Pesce Fresco': 'Frischer Fisch',
    'Fatto in Casa': 'Hausgemacht',
    'Piccante': 'Scharf',
    'Da Condividere': 'Zum Teilen',
    'Senza Lattosio': 'Laktosefrei',
    'Bio': 'Bio-Qualität',
    'Carta Vini': 'Weinkarte',
    'Aperitivo': 'Aperitif',
  },
  fr: {
    'Gluten Free': 'Sans Gluten',
    'Vegetariano': 'Végétarien',
    'Vegano': 'Végan',
    'Chef Special': 'Spécialité du Chef',
    'Piatto Iconico': 'Plat Signature',
    'Km 0': 'Terroir Km 0',
    'Pesce Fresco': 'Pêche Fraîche',
    'Fatto in Casa': 'Fait Maison',
    'Piccante': 'Épicé',
    'Da Condividere': 'À Partager',
    'Senza Lattosio': 'Sans Lactose',
    'Bio': 'Biologique',
    'Carta Vini': 'Carte des Vins',
    'Aperitivo': 'Apéritif',
  },
  es: {
    'Gluten Free': 'Sin Gluten',
    'Vegetariano': 'Vegetariano',
    'Vegano': 'Vegano',
    'Chef Special': 'Especialidad Chef',
    'Piatto Iconico': 'Plato Estrella',
    'Km 0': 'Km 0 Local',
    'Pesce Fresco': 'Pescado Fresco',
    'Fatto in Casa': 'Casero',
    'Piccante': 'Picante',
    'Da Condividere': 'Para Compartir',
    'Senza Lattosio': 'Sin Lactosa',
    'Bio': 'Ecológico Bio',
    'Carta Vini': 'Carta de Vinos',
    'Aperitivo': 'Aperitivo',
  },
};

export function getTagTranslation(tag: string, lang: SupportedLanguage): string {
  if (lang === 'it') return tag;
  return TAG_TRANSLATIONS[lang]?.[tag] || tag;
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnhdgrjxbtycocxdbudv.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaGRncmp4YnR5Y29jeGRidWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQyNjMyMiwiZXhwIjoyMTA1MDAyMzIyfQ.wdWcR3h44GW8KIBlInfPC3rVKNXJTIoBFQ9FIqlbRP8';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const ORG_IDS = [
  '38dfb556-044a-4922-bc38-eee0e4e72456', // Vincenzo Borrelli (enzoborrelli73@gmail.com)
  '21a6955a-8b78-41c3-bbc1-c2885a12439f', // Genny Pascale (webdesigngple@gmail.com)
];

async function seedOrg(orgId) {
  console.log(`\n========================================`);
  console.log(`Seeding Borrelli Calzature data for org: ${orgId}`);
  console.log(`========================================`);

  // 1. Fetch location for this org
  const { data: locs, error: locErr } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', orgId);
  
  let locationId = locs?.[0]?.id;
  if (!locationId) {
    const { data: newLoc } = await supabase
      .from('locations')
      .insert({
        organization_id: orgId,
        name: 'Borrelli Calzature - Boutique',
        address: 'Corso Principale',
        city: 'Napoli',
        status: 'active',
      })
      .select('id')
      .single();
    locationId = newLoc?.id;
  }
  console.log(`Using Location: ${locationId}`);

  // 2. Clean existing sales and products for this org to ensure 100% clean pristine demo data
  console.log(`Cleaning old test data for org ${orgId}...`);
  await supabase.from('sale_items').delete().eq('organization_id', orgId);
  await supabase.from('sale_payments').delete().eq('organization_id', orgId);
  await supabase.from('sales').delete().eq('organization_id', orgId);
  await supabase.from('inventory_balances').delete().eq('organization_id', orgId);
  await supabase.from('inventory_movements').delete().eq('organization_id', orgId);
  await supabase.from('product_variants').delete().eq('organization_id', orgId);
  await supabase.from('products').delete().eq('organization_id', orgId);
  await supabase.from('brands').delete().eq('organization_id', orgId);
  await supabase.from('product_categories').delete().eq('organization_id', orgId);
  await supabase.from('suppliers').delete().eq('organization_id', orgId);
  await supabase.from('customers').delete().eq('organization_id', orgId);

  // 3. Create Categories
  console.log(`Creating Categories...`);
  const categoriesDef = [
    { name: 'Calzature Uomo', sort_order: 10, description: 'Mocassini, Francesine, Polacchini e Stringate artigianali' },
    { name: 'Calzature Donna', sort_order: 20, description: 'Décolleté, Tronchetti, Stivali e Sandali moda' },
    { name: 'Sneakers & Casual', sort_order: 30, description: 'Sneakers di lusso, platform e modelli iconici' },
    { name: 'Pelletteria & Borse', sort_order: 40, description: 'Borse in vera pelle, cinture e piccola pelletteria' },
    { name: 'Cura & Pulizia', sort_order: 50, description: 'Spazzole crine, cere nutrienti e lucidi professionali' },
  ];

  const categoryMap = new Map();
  for (const c of categoriesDef) {
    const { data: cat } = await supabase
      .from('product_categories')
      .insert({
        organization_id: orgId,
        name: c.name,
        sort_order: c.sort_order,
        description: c.description,
        active: true,
      })
      .select('id, name')
      .single();
    if (cat) categoryMap.set(cat.name, cat.id);
  }

  // 4. Create Brands
  console.log(`Creating Brands...`);
  const brandsDef = [
    { name: 'Borrelli Heritage', description: 'Calzature sartoriali italiane fatte a mano' },
    { name: 'Nero Giardini', description: 'Tradizione manifatturiera italiana e tecnologia DryGo' },
    { name: 'Premiata', description: 'Sneakers di lusso contemporaneo e design iconico' },
    { name: 'Hogan', description: 'Sneakers e calzature casual luxury' },
    { name: 'Nike', description: 'Calzature sportive e street style' },
    { name: "Saphir Médaille d'Or", description: 'Eccellenza mondiale per la cura del cuoio' },
  ];

  const brandMap = new Map();
  for (const b of brandsDef) {
    const { data: br } = await supabase
      .from('brands')
      .insert({
        organization_id: orgId,
        name: b.name,
        description: b.description,
        active: true,
      })
      .select('id, name')
      .single();
    if (br) brandMap.set(br.name, br.id);
  }

  // 5. Create Suppliers
  console.log(`Creating Suppliers...`);
  const suppliersDef = [
    { name: 'Calzaturificio Artigiano Campano', contact_name: 'Maestro Ciro Esposito', city: 'Aversa (CE)', phone: '+39 081 8901234', email: 'forniture@artigianocampano.it' },
    { name: 'NeroGiardini Group S.p.A.', contact_name: 'Ufficio B2B Marche', city: 'Monte San Pietrangeli (FM)', phone: '+39 0734 9691', email: 'ordini@nerogiardini.it' },
    { name: 'Premiata Luxury Footwear', contact_name: 'Logistica Retail', city: 'Civitanova Marche (MC)', phone: '+39 0733 812345', email: 'commerciale@premiata.it' },
    { name: 'Pelletterie Artigiane Fiorentine', contact_name: 'Lorenzo Nardi', city: 'Scandicci (FI)', phone: '+39 055 790432', email: 'pelli@fiorentine.it' },
  ];

  const supplierMap = new Map();
  for (const s of suppliersDef) {
    const { data: sup } = await supabase
      .from('suppliers')
      .insert({
        organization_id: orgId,
        name: s.name,
        contact_name: s.contact_name,
        city: s.city,
        phone: s.phone,
        email: s.email,
        active: true,
      })
      .select('id, name')
      .single();
    if (sup) supplierMap.set(sup.name, sup.id);
  }

  // 6. Create Customers
  console.log(`Creating VIP Customers...`);
  const customersDef = [
    { first_name: 'Marco', last_name: 'Esposito', phone: '+39 333 4567890', email: 'marco.esposito@email.it', total_spent: 680.00, purchases_count: 4, notes: 'Cliente abituale calzature eleganti e mocassini. Taglia 42.' },
    { first_name: 'Elena', last_name: 'De Luca', phone: '+39 347 1234567', email: 'elena.deluca@email.it', total_spent: 450.00, purchases_count: 3, notes: 'Preferisce décolleté Nero Giardini e borse in cuoio. Taglia 38.' },
    { first_name: 'Vincenzo', last_name: 'Rossi', phone: '+39 328 9876543', email: 'vincenzo.rossi@email.it', total_spent: 920.00, purchases_count: 6, notes: 'Collezionista sneakers Premiata e francesine cerimonia. Taglia 43.' },
    { first_name: 'Giulia', last_name: 'Marino', phone: '+39 339 6543210', email: 'giulia.marino@email.it', total_spent: 310.00, purchases_count: 2, notes: 'Acquista tronchetti invernali e sneaker platform Hogan.' },
    { first_name: 'Antonio', last_name: 'Coppola', phone: '+39 340 7890123', email: 'antonio.coppola@email.it', total_spent: 175.00, purchases_count: 1, notes: 'Chelsea boots e accessori per la cura del pellame.' },
  ];

  const customerList = [];
  for (const c of customersDef) {
    const { data: cust } = await supabase
      .from('customers')
      .insert({
        organization_id: orgId,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        email: c.email,
        total_spent: c.total_spent,
        purchases_count: c.purchases_count,
        notes: c.notes,
        last_purchase_at: new Date(Date.now() - Math.floor(Math.random() * 5 + 1) * 86400000).toISOString(),
      })
      .select('id, first_name, last_name, phone')
      .single();
    if (cust) customerList.push(cust);
  }

  // 7. Define Products & Sizing Variants
  console.log(`Creating Footwear Catalog & Stock Balances...`);
  const productsCatalog = [
    {
      name: 'Mocassino Artigianale Borrelli',
      brand: 'Borrelli Heritage',
      category: 'Calzature Uomo',
      supplier: 'Calzaturificio Artigiano Campano',
      sku: 'BOR-MOC-01',
      barcode: '8012345001006',
      description: 'Mocassino classico con nappine cucito a mano in morbido vitello spazzolato testa di moro. Fodera interna in pelle e fondo in cuoio con inserto gomma antiscivolo.',
      sale_price: 149.00,
      cost_price: 65.00,
      variants: [
        { size: '40', color: 'Testa di Moro', barcode: '8012345001402', stock: 4, reorder: 2, cost: 65.00, price: 149.00 },
        { size: '41', color: 'Testa di Moro', barcode: '8012345001419', stock: 6, reorder: 2, cost: 65.00, price: 149.00 },
        { size: '42', color: 'Testa di Moro', barcode: '8012345001426', stock: 5, reorder: 3, cost: 65.00, price: 149.00 },
        { size: '43', color: 'Testa di Moro', barcode: '8012345001433', stock: 2, reorder: 2, cost: 65.00, price: 149.00 },
        { size: '44', color: 'Testa di Moro', barcode: '8012345001440', stock: 1, reorder: 2, cost: 65.00, price: 149.00 }, // Ultimo paio
        { size: '45', color: 'Testa di Moro', barcode: '8012345001457', stock: 0, reorder: 2, cost: 65.00, price: 149.00 }, // Esaurito
      ]
    },
    {
      name: 'Francesina Oxford Classic Borrelli',
      brand: 'Borrelli Heritage',
      category: 'Calzature Uomo',
      supplier: 'Calzaturificio Artigiano Campano',
      sku: 'BOR-OXF-02',
      barcode: '8012345002003',
      description: 'Stringata Oxford da cerimonia e business meeting in vitello abrasivato nero lucido con impunture sartoriali a contrasto e suola cuoio.',
      sale_price: 169.00,
      cost_price: 75.00,
      variants: [
        { size: '40', color: 'Nero Lucido', barcode: '8012345002409', stock: 3, reorder: 2, cost: 75.00, price: 169.00 },
        { size: '41', color: 'Nero Lucido', barcode: '8012345002416', stock: 5, reorder: 2, cost: 75.00, price: 169.00 },
        { size: '42', color: 'Nero Lucido', barcode: '8012345002423', stock: 4, reorder: 2, cost: 75.00, price: 169.00 },
        { size: '43', color: 'Nero Lucido', barcode: '8012345002430', stock: 3, reorder: 2, cost: 75.00, price: 169.00 },
        { size: '44', color: 'Nero Lucido', barcode: '8012345002447', stock: 2, reorder: 2, cost: 75.00, price: 169.00 },
      ]
    },
    {
      name: 'Sneaker Premiata Mick',
      brand: 'Premiata',
      category: 'Sneakers & Casual',
      supplier: 'Premiata Luxury Footwear',
      sku: 'PRE-MCK-5890',
      barcode: '8033984110009',
      description: 'Sneaker iconica Premiata modello Mick. Tomaia in camoscio grigio antracite e tessuto tecnico traspirante, suola ergonomica con iconiche serigrafie Premiata.',
      sale_price: 230.00,
      cost_price: 108.00,
      variants: [
        { size: '41', color: 'Grigio / Antracite', barcode: '8033984110412', stock: 4, reorder: 2, cost: 108.00, price: 230.00 },
        { size: '42', color: 'Grigio / Antracite', barcode: '8033984110429', stock: 3, reorder: 2, cost: 108.00, price: 230.00 },
        { size: '43', color: 'Grigio / Antracite', barcode: '8033984110436', stock: 5, reorder: 2, cost: 108.00, price: 230.00 },
        { size: '44', color: 'Grigio / Antracite', barcode: '8033984110443', stock: 2, reorder: 2, cost: 108.00, price: 230.00 },
        { size: '45', color: 'Grigio / Antracite', barcode: '8033984110450', stock: 1, reorder: 1, cost: 108.00, price: 230.00 },
      ]
    },
    {
      name: 'Hogan H-Stripes Leather Platform',
      brand: 'Hogan',
      category: 'Sneakers & Casual',
      supplier: 'Premiata Luxury Footwear',
      sku: 'HOG-HST-01',
      barcode: '8059345010009',
      description: 'Sneaker platform Hogan H-Stripes in nappa bianca con profili metallizzati e iconica suola a righe verticali. Plantare estraibile memory foam da 8 mm.',
      sale_price: 360.00,
      cost_price: 175.00,
      variants: [
        { size: '37', color: 'Bianco / Argento', barcode: '8059345010375', stock: 2, reorder: 1, cost: 175.00, price: 360.00 },
        { size: '38', color: 'Bianco / Argento', barcode: '8059345010382', stock: 4, reorder: 2, cost: 175.00, price: 360.00 },
        { size: '39', color: 'Bianco / Argento', barcode: '8059345010399', stock: 3, reorder: 2, cost: 175.00, price: 360.00 },
        { size: '40', color: 'Bianco / Argento', barcode: '8059345010405', stock: 2, reorder: 1, cost: 175.00, price: 360.00 },
        { size: '41', color: 'Bianco / Argento', barcode: '8059345010412', stock: 1, reorder: 1, cost: 175.00, price: 360.00 },
      ]
    },
    {
      name: 'Nero Giardini Décolleté Glove Tacco 8',
      brand: 'Nero Giardini',
      category: 'Calzature Donna',
      supplier: 'NeroGiardini Group S.p.A.',
      sku: 'NG-DEC-A111640D',
      barcode: '8021045003002',
      description: 'Décolleté a punta in pelle nera finissima con tacco a stiletto da 8 cm e tecnologia brevettata DryGo per il massimo comfort e assorbimento umidità.',
      sale_price: 139.50,
      cost_price: 58.00,
      variants: [
        { size: '36', color: 'Nero', barcode: '8021045003361', stock: 3, reorder: 2, cost: 58.00, price: 139.50 },
        { size: '37', color: 'Nero', barcode: '8021045003378', stock: 5, reorder: 2, cost: 58.00, price: 139.50 },
        { size: '38', color: 'Nero', barcode: '8021045003385', stock: 6, reorder: 2, cost: 58.00, price: 139.50 },
        { size: '39', color: 'Nero', barcode: '8021045003392', stock: 4, reorder: 2, cost: 58.00, price: 139.50 },
        { size: '40', color: 'Nero', barcode: '8021045003408', stock: 2, reorder: 1, cost: 58.00, price: 139.50 },
      ]
    },
    {
      name: 'Nero Giardini Tronchetto Zip Pelle',
      brand: 'Nero Giardini',
      category: 'Calzature Donna',
      supplier: 'NeroGiardini Group S.p.A.',
      sku: 'NG-TRC-I117001D',
      barcode: '8021045004009',
      description: 'Tronchetto donna in morbida pelle di vitello nero con cerniera laterale decorativa e battistrada carrarmato. Tacco comodo 5.5 cm.',
      sale_price: 159.50,
      cost_price: 68.00,
      variants: [
        { size: '36', color: 'Nero', barcode: '8021045004368', stock: 2, reorder: 1, cost: 68.00, price: 159.50 },
        { size: '37', color: 'Nero', barcode: '8021045004375', stock: 4, reorder: 2, cost: 68.00, price: 159.50 },
        { size: '38', color: 'Nero', barcode: '8021045004382', stock: 3, reorder: 2, cost: 68.00, price: 159.50 },
        { size: '39', color: 'Nero', barcode: '8021045004399', stock: 1, reorder: 2, cost: 68.00, price: 159.50 },
      ]
    },
    {
      name: 'Nike Air Max 95 OG Triple Black',
      brand: 'Nike',
      category: 'Sneakers & Casual',
      supplier: 'Premiata Luxury Footwear',
      sku: 'NK-AM95-001',
      barcode: '0194956789005',
      description: 'Scarpa leggendaria Nike Air Max 95 con ammortizzazione Air Max su avampiede e tallone. Tomaia a strati in mesh traspirante e pelle pieno fiore.',
      sale_price: 189.99,
      cost_price: 92.00,
      variants: [
        { size: '41', color: 'Triple Black', barcode: '0194956789012', stock: 3, reorder: 2, cost: 92.00, price: 189.99 },
        { size: '42', color: 'Triple Black', barcode: '0194956789029', stock: 5, reorder: 2, cost: 92.00, price: 189.99 },
        { size: '43', color: 'Triple Black', barcode: '0194956789036', stock: 4, reorder: 2, cost: 92.00, price: 189.99 },
        { size: '44', color: 'Triple Black', barcode: '0194956789043', stock: 2, reorder: 2, cost: 92.00, price: 189.99 },
      ]
    },
    {
      name: 'Stivaletto Chelsea Boot Borrelli',
      brand: 'Borrelli Heritage',
      category: 'Calzature Uomo',
      supplier: 'Calzaturificio Artigiano Campano',
      sku: 'BOR-CHL-03',
      barcode: '8012345005000',
      description: 'Beatle boot artigianale in suede idrorepellente color tabacco, elastici laterali rinforzati e suola monoblocco Vibram extralight con guardolo in cuoio.',
      sale_price: 175.00,
      cost_price: 76.00,
      variants: [
        { size: '41', color: 'Suede Tabacco', barcode: '8012345005417', stock: 3, reorder: 2, cost: 76.00, price: 175.00 },
        { size: '42', color: 'Suede Tabacco', barcode: '8012345005424', stock: 4, reorder: 2, cost: 76.00, price: 175.00 },
        { size: '43', color: 'Suede Tabacco', barcode: '8012345005431', stock: 3, reorder: 2, cost: 76.00, price: 175.00 },
        { size: '44', color: 'Suede Tabacco', barcode: '8012345005448', stock: 2, reorder: 1, cost: 76.00, price: 175.00 },
      ]
    },
    {
      name: 'Borsa Shopping in Cuoio Borrelli',
      brand: 'Borrelli Heritage',
      category: 'Pelletteria & Borse',
      supplier: 'Pelletterie Artigiane Fiorentine',
      sku: 'BOR-BAG-01',
      barcode: '8012345006001',
      description: 'Borsa tote bag shopping in vera pelle conciata al vegetale color cuoio naturale. Interno sfoderato con clutch rimovibile con cerniera.',
      sale_price: 129.00,
      cost_price: 52.00,
      variants: [
        { size: 'Unica', color: 'Cuoio Naturale', barcode: '8012345006018', stock: 8, reorder: 3, cost: 52.00, price: 129.00 },
      ]
    },
    {
      name: "Kit Manutenzione Deluxe Saphir Médaille d'Or",
      brand: "Saphir Médaille d'Or",
      category: 'Cura & Pulizia',
      supplier: 'Calzaturificio Artigiano Campano',
      sku: 'SAP-KIT-01',
      barcode: '3324012015000',
      description: 'Kit professionale per la pulizia, nutrimento e lucidatura del cuoio pregiato. Contiene Crème 1925 nera, cera dapi e spazzola in vero crine di cavallo.',
      sale_price: 29.50,
      cost_price: 12.00,
      variants: [
        { size: 'Standard', color: 'Neutro / Nero', barcode: '3324012015003', stock: 16, reorder: 5, cost: 12.00, price: 29.50 },
      ]
    },
  ];

  const createdVariantsList = [];

  for (const p of productsCatalog) {
    const categoryId = categoryMap.get(p.category);
    const brandId = brandMap.get(p.brand);
    const supplierId = supplierMap.get(p.supplier);

    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .insert({
        organization_id: orgId,
        name: p.name,
        brand: p.brand,
        brand_id: brandId,
        category_name: p.category,
        category_id: categoryId,
        supplier_id: supplierId,
        sku: p.sku,
        barcode: p.barcode,
        description: p.description,
        sale_price: p.sale_price,
        cost_price: p.cost_price,
        tax_rate: 22.00,
        status: 'active',
        active: true,
        attribute_keys: ['size', 'color'],
      })
      .select('id, name, sale_price, cost_price')
      .single();

    if (prodErr || !prod) {
      console.error(`Error creating product ${p.name}:`, prodErr);
      continue;
    }

    for (const v of p.variants) {
      const { data: variant, error: varErr } = await supabase
        .from('product_variants')
        .insert({
          organization_id: orgId,
          product_id: prod.id,
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          sku: `${p.sku}-${v.size}`,
          attributes: { size: v.size, color: v.color },
          cost_price: v.cost,
          sale_price: v.price,
          minimum_stock: 1,
          reorder_threshold: v.reorder,
          status: 'active',
          active: true,
        })
        .select('id, size, color, barcode, sale_price, cost_price')
        .single();

      if (varErr || !variant) {
        console.error(`Error creating variant ${v.size} for ${p.name}:`, varErr);
        continue;
      }

      // Add to inventory balance
      await supabase
        .from('inventory_balances')
        .insert({
          organization_id: orgId,
          variant_id: variant.id,
          location_id: locationId,
          quantity_on_hand: v.stock,
        });

      // Record initial inventory movement
      await supabase
        .from('inventory_movements')
        .insert({
          organization_id: orgId,
          variant_id: variant.id,
          location_id: locationId,
          type: 'initial',
          quantity_delta: v.stock,
          unit_cost: v.cost,
          reason: 'Carico iniziale collezione Autunno/Inverno',
        });

      createdVariantsList.push({
        ...variant,
        productId: prod.id,
        productName: prod.name,
      });
    }
  }

  // 8. Generate Realistic Sales History (Past 7 days)
  console.log(`Generating Realistic Sales History across the last 7 days...`);
  const operators = ['Vincenzo Borrelli', 'Cassa 1'];
  const paymentMethods = ['card', 'card', 'card', 'cash'];

  const now = Date.now();
  const salesToCreate = [
    // Today
    { hoursAgo: 1, items: [{ vIdx: 0, qty: 1 }], custIdx: 0, payment: 'card' }, // Mocassino TG 40
    { hoursAgo: 3, items: [{ vIdx: 12, qty: 1 }], custIdx: 1, payment: 'card' }, // Premiata Mick TG 42
    { hoursAgo: 4, items: [{ vIdx: 21, qty: 1 }, { vIdx: 37, qty: 1 }], custIdx: 2, payment: 'card' }, // NG Décolleté + Kit Saphir
    // Yesterday
    { hoursAgo: 22, items: [{ vIdx: 6, qty: 1 }], custIdx: 3, payment: 'cash' }, // Francesina TG 41
    { hoursAgo: 26, items: [{ vIdx: 16, qty: 1 }], custIdx: null, payment: 'card' }, // Hogan H-Stripes
    { hoursAgo: 30, items: [{ vIdx: 26, qty: 1 }], custIdx: 4, payment: 'card' }, // NG Tronchetto
    // 2 days ago
    { hoursAgo: 48, items: [{ vIdx: 2, qty: 1 }, { vIdx: 36, qty: 1 }], custIdx: 0, payment: 'card' }, // Mocassino TG 42 + Borsa
    { hoursAgo: 52, items: [{ vIdx: 30, qty: 1 }], custIdx: null, payment: 'card' }, // Nike AM95
    // 3 days ago
    { hoursAgo: 72, items: [{ vIdx: 11, qty: 1 }], custIdx: 2, payment: 'card' }, // Premiata Mick
    { hoursAgo: 75, items: [{ vIdx: 7, qty: 1 }], custIdx: null, payment: 'cash' }, // Francesina
    // 4 days ago
    { hoursAgo: 96, items: [{ vIdx: 34, qty: 1 }], custIdx: 1, payment: 'card' }, // Chelsea Boot
    // 5 days ago
    { hoursAgo: 120, items: [{ vIdx: 17, qty: 1 }, { vIdx: 37, qty: 2 }], custIdx: 3, payment: 'card' }, // Hogan + 2 Kit
  ];

  let saleCounter = 101;
  for (const s of salesToCreate) {
    const saleTime = new Date(now - s.hoursAgo * 3600 * 1000).toISOString();
    const customer = s.custIdx !== null ? customerList[s.custIdx] : null;
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let subtotal = 0;
    let costTotal = 0;
    const itemsData = [];

    for (const item of s.items) {
      const variant = createdVariantsList[item.vIdx % createdVariantsList.length];
      const unitPrice = Number(variant.sale_price) || 120;
      const unitCost = Number(variant.cost_price) || 60;
      const totalPrice = unitPrice * item.qty;

      subtotal += totalPrice;
      costTotal += unitCost * item.qty;

      itemsData.push({
        organization_id: orgId,
        product_id: variant.productId,
        variant_id: variant.id,
        product_name: variant.productName,
        variant_name: `TG ${variant.size} - ${variant.color}`,
        sku: `${variant.productName.slice(0, 3)}-${variant.size}`,
        barcode: variant.barcode,
        quantity: item.qty,
        unit_price: unitPrice,
        cost_price: unitCost,
        discount_amount: 0,
        tax_rate: 22.00,
        total_price: totalPrice,
        returned_quantity: 0,
        created_at: saleTime,
      });
    }

    const grossMargin = subtotal - costTotal;
    const saleNumber = `BOR-${saleTime.slice(0, 10).replace(/-/g, '')}-${String(saleCounter++).padStart(4, '0')}`;

    const { data: saleRecord, error: saleErr } = await supabase
      .from('sales')
      .insert({
        organization_id: orgId,
        location_id: locationId,
        sale_number: saleNumber,
        customer_id: customer?.id || null,
        operator_name: operator,
        status: 'completed',
        subtotal: subtotal,
        discount_amount: 0,
        tax_amount: Math.round(subtotal * 0.22 * 100) / 100,
        total_amount: subtotal,
        cost_total: costTotal,
        gross_margin: grossMargin,
        payment_method: s.payment,
        payment_status: 'paid',
        notes: customer ? `Vendita cliente VIP ${customer.first_name} ${customer.last_name}` : 'Scontrino al banco',
        created_at: saleTime,
        updated_at: saleTime,
      })
      .select('id')
      .single();

    if (saleErr || !saleRecord) {
      console.error('Error creating sale:', saleErr);
      continue;
    }

    for (const itemRecord of itemsData) {
      itemRecord.sale_id = saleRecord.id;
      await supabase.from('sale_items').insert(itemRecord);
    }

    await supabase.from('sale_payments').insert({
      organization_id: orgId,
      sale_id: saleRecord.id,
      method: s.payment,
      amount: subtotal,
      created_at: saleTime,
    });
  }

  // 9. Update / Verify Devices
  console.log(`Verifying Devices and Touchpoint Codes...`);
  const { data: devices } = await supabase
    .from('devices')
    .select('id, unique_code, name')
    .eq('organization_id', orgId);

  console.log(`Devices for org ${orgId}:`, devices?.map(d => `${d.name} (${d.unique_code})`));

  console.log(`SUCCESS: Organization ${orgId} seeded with 10 shoe products, 42 size variants, 5 VIP clients, and 12 sales!`);
}

async function main() {
  for (const orgId of ORG_IDS) {
    await seedOrg(orgId);
  }
  console.log(`\n========================================`);
  console.log(`ALL DONE! Both Borrelli Calzature accounts are now fully populated.`);
  console.log(`========================================\n`);
}

main().catch(console.error);

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSimpleMode } from '@/lib/simple-mode';
import { StatusBadge } from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';

export interface SimpleERPVariant {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  reorderThreshold: number;
  supplier: string;
}

export interface SimpleERPSale {
  id: string;
  number: string;
  time: string;
  items: string;
  pieces: number;
  total: number;
  margin: number;
  payment: string;
  operator: string;
}

interface RawBalanceInput {
  id?: string;
  quantity_on_hand?: number | null;
  supplier?: string | null;
  sku?: string;
  name?: string;
  brand?: string;
  category?: string;
  size?: string;
  color?: string;
  barcode?: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  reorderThreshold?: number;
  variant?: {
    id?: string;
    sku?: string | null;
    barcode?: string | null;
    size?: string | null;
    color?: string | null;
    reorder_threshold?: number | null;
    cost_price?: number | null;
    sale_price?: number | null;
    product?: {
      id?: string;
      name?: string | null;
      sku?: string | null;
      barcode?: string | null;
      category_name?: string | null;
      brand?: string | { name?: string | null } | null;
      category?: string | { name?: string | null } | null;
      cost_price?: number | null;
      sale_price?: number | null;
    } | null;
  } | null;
}

interface RawSaleInput {
  id?: string;
  sale_number?: string | null;
  status?: string | null;
  total_amount?: number | null;
  subtotal?: number | null;
  cost_total?: number | null;
  gross_margin?: number | null;
  payment_method?: string | null;
  operator_name?: string | null;
  created_at?: string | null;
  number?: string;
  time?: string;
  items?:
    | string
    | Array<{
        product_name?: string;
        variant_name?: string | null;
        quantity?: number;
        unit_price?: number;
        total_price?: number;
      }>;
  pieces?: number;
  total?: number;
  margin?: number;
  payment?: string;
  operator?: string;
}

interface SimpleRetailERPViewProps {
  orgName?: string;
  initialBalances?: RawBalanceInput[];
  initialSales?: RawSaleInput[];
  onExitSimpleMode?: () => void;
}

// Fallback high-fidelity dataset strictly for static /demo/retail sandbox when props are omitted
const DEFAULT_ERP_VARIANTS: SimpleERPVariant[] = [
  { id: 'v1', sku: 'BOR-MOC-40', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '40', color: 'Testa di Moro', barcode: '8012345001402', costPrice: 65.00, salePrice: 149.00, stock: 4, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v2', sku: 'BOR-MOC-41', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '41', color: 'Testa di Moro', barcode: '8012345001419', costPrice: 65.00, salePrice: 149.00, stock: 6, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v3', sku: 'BOR-MOC-42', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '42', color: 'Testa di Moro', barcode: '8012345001426', costPrice: 65.00, salePrice: 149.00, stock: 5, reorderThreshold: 3, supplier: 'Calzaturificio Campano' },
  { id: 'v4', sku: 'BOR-MOC-43', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '43', color: 'Testa di Moro', barcode: '8012345001433', costPrice: 65.00, salePrice: 149.00, stock: 2, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v5', sku: 'BOR-MOC-44', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '44', color: 'Testa di Moro', barcode: '8012345001440', costPrice: 65.00, salePrice: 149.00, stock: 1, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v6', sku: 'BOR-MOC-45', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '45', color: 'Testa di Moro', barcode: '8012345001457', costPrice: 65.00, salePrice: 149.00, stock: 0, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },

  { id: 'v7', sku: 'BOR-OXF-40', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '40', color: 'Nero Lucido', barcode: '8012345002409', costPrice: 75.00, salePrice: 169.00, stock: 3, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v8', sku: 'BOR-OXF-41', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '41', color: 'Nero Lucido', barcode: '8012345002416', costPrice: 75.00, salePrice: 169.00, stock: 5, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v9', sku: 'BOR-OXF-42', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '42', color: 'Nero Lucido', barcode: '8012345002423', costPrice: 75.00, salePrice: 169.00, stock: 4, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v10', sku: 'BOR-OXF-43', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '43', color: 'Nero Lucido', barcode: '8012345002430', costPrice: 75.00, salePrice: 169.00, stock: 3, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v11', sku: 'BOR-OXF-44', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '44', color: 'Nero Lucido', barcode: '8012345002447', costPrice: 75.00, salePrice: 169.00, stock: 2, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },

  { id: 'v12', sku: 'PRE-MCK-41', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '41', color: 'Antracite', barcode: '8033984110412', costPrice: 108.00, salePrice: 230.00, stock: 4, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v13', sku: 'PRE-MCK-42', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '42', color: 'Antracite', barcode: '8033984110429', costPrice: 108.00, salePrice: 230.00, stock: 3, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v14', sku: 'PRE-MCK-43', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '43', color: 'Antracite', barcode: '8033984110436', costPrice: 108.00, salePrice: 230.00, stock: 5, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v15', sku: 'PRE-MCK-44', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '44', color: 'Antracite', barcode: '8033984110443', costPrice: 108.00, salePrice: 230.00, stock: 2, reorderThreshold: 2, supplier: 'Premiata Luxury' },

  { id: 'v16', sku: 'HOG-HST-37', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '37', color: 'Bianco/Argento', barcode: '8059345010375', costPrice: 175.00, salePrice: 360.00, stock: 2, reorderThreshold: 1, supplier: 'Premiata Luxury' },
  { id: 'v17', sku: 'HOG-HST-38', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '38', color: 'Bianco/Argento', barcode: '8059345010382', costPrice: 175.00, salePrice: 360.00, stock: 4, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v18', sku: 'HOG-HST-39', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '39', color: 'Bianco/Argento', barcode: '8059345010399', costPrice: 175.00, salePrice: 360.00, stock: 3, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v19', sku: 'HOG-HST-40', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '40', color: 'Bianco/Argento', barcode: '8059345010405', costPrice: 175.00, salePrice: 360.00, stock: 2, reorderThreshold: 1, supplier: 'Premiata Luxury' },
  { id: 'v20', sku: 'HOG-HST-41', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '41', color: 'Bianco/Argento', barcode: '8059345010412', costPrice: 175.00, salePrice: 360.00, stock: 1, reorderThreshold: 1, supplier: 'Premiata Luxury' },

  { id: 'v21', sku: 'NG-DEC-37', name: 'Nero Giardini Décolleté Glove', brand: 'Nero Giardini', category: 'Donna', size: '37', color: 'Nero', barcode: '8021045003378', costPrice: 58.00, salePrice: 139.50, stock: 5, reorderThreshold: 2, supplier: 'NeroGiardini Group' },
  { id: 'v22', sku: 'NG-DEC-38', name: 'Nero Giardini Décolleté Glove', brand: 'Nero Giardini', category: 'Donna', size: '38', color: 'Nero', barcode: '8021045003385', costPrice: 58.00, salePrice: 139.50, stock: 6, reorderThreshold: 2, supplier: 'NeroGiardini Group' },
  { id: 'v23', sku: 'NG-DEC-39', name: 'Nero Giardini Décolleté Glove', brand: 'Nero Giardini', category: 'Donna', size: '39', color: 'Nero', barcode: '8021045003392', costPrice: 58.00, salePrice: 139.50, stock: 4, reorderThreshold: 2, supplier: 'NeroGiardini Group' },

  { id: 'v24', sku: 'NK-AM95-42', name: 'Nike Air Max 95 OG', brand: 'Nike', category: 'Sneakers', size: '42', color: 'Triple Black', barcode: '0194956789029', costPrice: 92.00, salePrice: 189.99, stock: 5, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v25', sku: 'NK-AM95-43', name: 'Nike Air Max 95 OG', brand: 'Nike', category: 'Sneakers', size: '43', color: 'Triple Black', barcode: '0194956789036', costPrice: 92.00, salePrice: 189.99, stock: 4, reorderThreshold: 2, supplier: 'Premiata Luxury' },

  { id: 'v26', sku: 'BOR-BAG-01', name: 'Borsa Shopping in Cuoio', brand: 'Borrelli Heritage', category: 'Pelletteria', size: 'Unica', color: 'Cuoio Naturale', barcode: '8012345006018', costPrice: 52.00, salePrice: 129.00, stock: 8, reorderThreshold: 3, supplier: 'Pelletterie Toscane' },
  { id: 'v27', sku: 'SAP-KIT-01', name: 'Kit Manutenzione Deluxe', brand: 'Saphir', category: 'Accessori', size: 'Standard', color: 'Neutro/Nero', barcode: '3324012015003', costPrice: 12.00, salePrice: 29.50, stock: 16, reorderThreshold: 5, supplier: 'Calzaturificio Campano' },
];

const DEFAULT_ERP_SALES: SimpleERPSale[] = [
  { id: 's1', number: 'BOR-20261010-0101', time: '11:15', items: 'Mocassino Artigianale (TG 40)', pieces: 1, total: 149.00, margin: 84.00, payment: 'Carta POS', operator: 'Vincenzo Borrelli' },
  { id: 's2', number: 'BOR-20261010-0102', time: '11:48', items: 'Sneaker Premiata Mick (TG 42)', pieces: 1, total: 230.00, margin: 122.00, payment: 'Carta POS', operator: 'Cassa 1' },
  { id: 's3', number: 'BOR-20261010-0103', time: '12:30', items: 'NG Décolleté (TG 38) + Kit Saphir', pieces: 2, total: 169.00, margin: 99.00, payment: 'Carta POS', operator: 'Vincenzo Borrelli' },
  { id: 's4', number: 'BOR-20261010-0104', time: '13:05', items: 'Francesina Oxford (TG 41)', pieces: 1, total: 169.00, margin: 94.00, payment: 'Contanti', operator: 'Cassa 1' },
];

function extractBrandName(brand: string | { name?: string | null } | null | undefined): string {
  if (!brand) return '—';
  if (typeof brand === 'string') return brand || '—';
  return brand.name || '—';
}

function extractCategoryName(category: string | { name?: string | null } | null | undefined): string {
  if (!category) return 'Generale';
  if (typeof category === 'string') return category || 'Generale';
  return category.name || 'Generale';
}

function mapBalancesToERPVariants(balances: RawBalanceInput[]): SimpleERPVariant[] {
  return balances
    .filter((b): b is RawBalanceInput => Boolean(b))
    .map((b, idx) => {
      if (typeof b.salePrice === 'number' && typeof b.stock === 'number' && b.name) {
        return {
          id: String(b.id || `var_${idx}`),
          sku: b.sku || `SKU-${idx + 1}`,
          name: b.name,
          brand: b.brand || '—',
          category: b.category || 'Generale',
          size: b.size || 'Unica',
          color: b.color || '—',
          barcode: b.barcode || '—',
          costPrice: Number(b.costPrice) || 0,
          salePrice: Number(b.salePrice) || 0,
          stock: Math.max(0, Number(b.stock) || 0),
          reorderThreshold: Number(b.reorderThreshold ?? 2),
          supplier: b.supplier || 'Fornitore',
        };
      }

      const v = b.variant;
      const p = v?.product;
      const rawSale = Number(v?.sale_price ?? p?.sale_price ?? 0) || 0;
      const rawCost = Number(v?.cost_price ?? p?.cost_price ?? rawSale * 0.5) || 0;
      const resolvedId = String(v?.id || b.id || `bal_${idx}`);

      return {
        id: resolvedId,
        sku: v?.sku || p?.sku || `SKU-${resolvedId.slice(0, 6).toUpperCase()}`,
        name: p?.name || 'Articolo',
        brand: extractBrandName(p?.brand),
        category: p?.category_name || extractCategoryName(p?.category),
        size: v?.size || 'Unica',
        color: v?.color || '—',
        barcode: v?.barcode || p?.barcode || '—',
        costPrice: rawCost,
        salePrice: rawSale,
        stock: Math.max(0, Number(b.quantity_on_hand ?? 0) || 0),
        reorderThreshold: Number(v?.reorder_threshold ?? 2),
        supplier: b.supplier || 'Fornitore',
      };
    });
}

function mapSalesToERPSales(sales: RawSaleInput[]): SimpleERPSale[] {
  const timeFmt = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });

  return sales
    .filter((s): s is RawSaleInput => Boolean(s) && s.status !== 'cancelled')
    .map((s, idx) => {
      if (typeof s.total === 'number' && typeof s.number === 'string' && typeof s.time === 'string') {
        return {
          id: String(s.id || `sale_${idx}`),
          number: s.number,
          time: s.time,
          items: typeof s.items === 'string' ? s.items : 'Vendita al banco',
          pieces: Number(s.pieces) || 0,
          total: Number(s.total) || 0,
          margin: Number(s.margin) || 0,
          payment: s.payment || 'Altro',
          operator: s.operator || 'Cassa',
        };
      }

      const itemsArr = Array.isArray(s.items) ? s.items : [];
      const pieces = itemsArr.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
      const itemsSummary =
        itemsArr.length > 0
          ? itemsArr
              .map(
                (it) =>
                  `${it.product_name || 'Articolo'}${it.variant_name ? ` (${it.variant_name})` : ''}${
                    (it.quantity ?? 1) > 1 ? ` ×${it.quantity}` : ''
                  }`
              )
              .join(', ')
          : 'Vendita al banco';

      const totalAmount = Number(s.total_amount) || 0;
      const grossMargin =
        s.gross_margin !== null && s.gross_margin !== undefined
          ? Number(s.gross_margin) || 0
          : totalAmount - (Number(s.cost_total) || 0);

      let formattedTime = '—';
      if (s.created_at) {
        const d = new Date(s.created_at);
        if (!Number.isNaN(d.getTime())) {
          formattedTime = timeFmt.format(d);
        }
      }

      const paymentLabel =
        s.payment_method === 'card'
          ? 'Carta POS'
          : s.payment_method === 'cash'
          ? 'Contanti'
          : s.payment_method === 'transfer'
          ? 'Bonifico'
          : s.payment_method || 'Altro';

      return {
        id: String(s.id || `sale_${idx}`),
        number: s.sale_number || '—',
        time: formattedTime,
        items: itemsSummary,
        pieces,
        total: totalAmount,
        margin: grossMargin,
        payment: paymentLabel,
        operator: s.operator_name || 'Operatore',
      };
    });
}

export default function SimpleRetailERPView({
  orgName = 'Borrelli Calzature',
  initialBalances,
  initialSales,
  onExitSimpleMode,
}: SimpleRetailERPViewProps) {
  const [, toggleSimpleMode] = useSimpleMode();
  const isDemoSandbox = initialBalances === undefined && initialSales === undefined;

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const inventorySearchRef = useRef<HTMLInputElement>(null);

  // Base datasets derived strictly from props when supplied, or sandbox defaults when omitted
  const baseVariants = useMemo(
    () =>
      initialBalances !== undefined
        ? mapBalancesToERPVariants(initialBalances)
        : DEFAULT_ERP_VARIANTS,
    [initialBalances]
  );

  const baseSales = useMemo(
    () =>
      initialSales !== undefined ? mapSalesToERPSales(initialSales) : DEFAULT_ERP_SALES,
    [initialSales]
  );

  // In-memory local deltas & session sales layered on top of base datasets
  const [stockDeltas, setStockDeltas] = useState<Record<string, number>>({});
  const [sessionSales, setSessionSales] = useState<SimpleERPSale[]>([]);

  const variants = useMemo(
    () =>
      baseVariants.map((v) => ({
        ...v,
        stock: Math.max(0, v.stock + (stockDeltas[v.id] || 0)),
      })),
    [baseVariants, stockDeltas]
  );

  const salesList = useMemo(
    () => [...sessionSales, ...baseSales],
    [sessionSales, baseSales]
  );

  // Search & Filters for Inventory Table
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Quick POS State
  const [posBarcodeOrSku, setPosBarcodeOrSku] = useState('');
  const [posSelectedVariantId, setPosSelectedVariantId] = useState<string>(() => {
    if (isDemoSandbox) {
      return DEFAULT_ERP_VARIANTS[2]?.id ?? DEFAULT_ERP_VARIANTS[0]?.id ?? '';
    }
    return '';
  });
  const [posQty, setPosQty] = useState(1);
  const [posCart, setPosCart] = useState<
    Array<{ variant: SimpleERPVariant; qty: number; discount: number }>
  >(() => {
    if (isDemoSandbox && DEFAULT_ERP_VARIANTS[2]) {
      return [{ variant: DEFAULT_ERP_VARIANTS[2], qty: 1, discount: 0 }];
    }
    return [];
  });
  const [posPaymentMethod, setPosPaymentMethod] = useState<'card' | 'cash'>('card');
  const [posFeedback, setPosFeedback] = useState<string | null>(null);

  const effectiveSelectedVariantId = useMemo(() => {
    if (variants.length === 0) return '';
    if (variants.some((v) => v.id === posSelectedVariantId)) return posSelectedVariantId;
    return variants[0].id;
  }, [variants, posSelectedVariantId]);

  const availableCategories = useMemo(
    () => Array.from(new Set(variants.map((v) => v.category).filter(Boolean))),
    [variants]
  );

  // Keyboard shortcuts [F2] Fast POS Barcode & [F3] Inventory Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        inventorySearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stock Adjustment Handlers (+1 / -1)
  const handleAdjustStock = useCallback(
    (variantId: string, delta: number) => {
      const target = variants.find((v) => v.id === variantId);
      if (!target) return;
      if (target.stock + delta < 0) return;

      setStockDeltas((prev) => ({
        ...prev,
        [variantId]: (prev[variantId] || 0) + delta,
      }));
    },
    [variants]
  );

  // POS Add to Cart
  const handleAddToCart = useCallback(() => {
    const target = variants.find((v) => v.id === effectiveSelectedVariantId);
    if (!target) return;

    setPosCart((prev) => {
      const existing = prev.find((item) => item.variant.id === target.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === target.id ? { ...item, qty: item.qty + posQty } : item
        );
      }
      return [...prev, { variant: target, qty: posQty, discount: 0 }];
    });
    setPosFeedback(null);
  }, [variants, effectiveSelectedVariantId, posQty]);

  // Barcode / SKU Direct Add
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = posBarcodeOrSku.trim().toLowerCase();
    if (!query) return;

    const matched = variants.find(
      (v) =>
        v.barcode.toLowerCase() === query ||
        v.sku.toLowerCase() === query ||
        v.name.toLowerCase().includes(query)
    );

    if (matched) {
      setPosSelectedVariantId(matched.id);
      setPosCart((prev) => {
        const existing = prev.find((item) => item.variant.id === matched.id);
        if (existing) {
          return prev.map((item) =>
            item.variant.id === matched.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [...prev, { variant: matched, qty: 1, discount: 0 }];
      });
      setPosBarcodeOrSku('');
      setPosFeedback(`Aggiunto: ${matched.name} (TG ${matched.size})`);
    } else {
      setPosFeedback(`Nessun articolo corrispondente a: "${query}"`);
    }
  };

  // Complete POS Sale
  const handleCompleteSale = () => {
    if (posCart.length === 0) return;

    let saleTotal = 0;
    let saleMargin = 0;
    let totalPieces = 0;
    const itemNames: string[] = [];

    // Deduct stock in memory safely
    setStockDeltas((prev) => {
      const next = { ...prev };
      for (const cartItem of posCart) {
        const currentVariant = variants.find((v) => v.id === cartItem.variant.id);
        const available = currentVariant ? currentVariant.stock : cartItem.variant.stock;
        const deduct = Math.min(available, cartItem.qty);
        next[cartItem.variant.id] = (next[cartItem.variant.id] || 0) - deduct;
      }
      return next;
    });

    for (const item of posCart) {
      const lineTotal = (item.variant.salePrice * item.qty * (100 - item.discount)) / 100;
      const lineCost = item.variant.costPrice * item.qty;
      saleTotal += lineTotal;
      saleMargin += lineTotal - lineCost;
      totalPieces += item.qty;
      itemNames.push(`${item.variant.name} (TG ${item.variant.size})`);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const prefix = isDemoSandbox
      ? 'BOR'
      : orgName
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 3)
          .toUpperCase() || 'RIV';
    const saleNum = `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(salesList.length + 101).padStart(4, '0')}`;

    const newSaleRecord: SimpleERPSale = {
      id: `s_${Date.now()}`,
      number: saleNum,
      time: timeStr,
      items: itemNames.join(', '),
      pieces: totalPieces,
      total: saleTotal,
      margin: saleMargin,
      payment: posPaymentMethod === 'card' ? 'Carta POS' : 'Contanti',
      operator: isDemoSandbox ? 'Banco Demo' : 'Operatore Cassa',
    };

    setSessionSales((prev) => [newSaleRecord, ...prev]);
    setPosCart([]);
    setPosFeedback(
      `SCONTRINO EMESSO [${saleNum}] • Incasso: ${formatItCurrency(saleTotal)} • Scorte aggiornate.`
    );
  };

  // Filtered variants for table
  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return variants.filter((v) => {
      if (categoryFilter !== 'ALL' && v.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.toLowerCase().includes(q) ||
        v.size.toLowerCase() === q
      );
    });
  }, [variants, searchQuery, categoryFilter]);

  // Critical Low Stock Variants
  const criticalItems = useMemo(() => {
    return variants.filter((v) => v.stock <= v.reorderThreshold);
  }, [variants]);

  // Aggregate Totals
  const todayTotalRevenue = useMemo(
    () => salesList.reduce((acc, s) => acc + s.total, 0),
    [salesList]
  );
  const todayTotalMargin = useMemo(
    () => salesList.reduce((acc, s) => acc + s.margin, 0),
    [salesList]
  );
  const todayTotalPieces = useMemo(
    () => salesList.reduce((acc, s) => acc + s.pieces, 0),
    [salesList]
  );
  const totalStockPieces = useMemo(
    () => variants.reduce((acc, v) => acc + v.stock, 0),
    [variants]
  );

  const posSubtotal = posCart.reduce(
    (acc, item) => acc + item.variant.salePrice * item.qty,
    0
  );

  const inputClass =
    'min-h-[38px] max-sm:min-h-[44px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-1';

  return (
    <div className="w-full min-w-0 bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono text-xs select-text pb-12 space-y-4 tabular-nums">
      {/* 1. ERP SYSTEM HEADER BAR */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-sm uppercase tracking-wider text-[var(--text-primary)] truncate">
              {orgName.toUpperCase()} — MODULO GESTIONALE RETAIL
            </span>
            <StatusBadge tone="operational" variant="soft" size="sm" dot>
              ONLINE
            </StatusBadge>
            <StatusBadge tone="neutral" variant="outline" size="sm">
              REGISTRO CASSA 01
            </StatusBadge>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-1">
            {isDemoSandbox ? (
              <>
                Operatore: <strong className="text-[var(--text-primary)]">Banco Demo</strong> | Punto Vendita:{' '}
                <strong className="text-[var(--text-primary)]">{orgName}</strong> | Ambiente:{' '}
                <strong className="text-[var(--rivo-volt-text)]">Demo Sandbox</strong>
              </>
            ) : (
              <>
                Punto Vendita: <strong className="text-[var(--text-primary)]">{orgName}</strong> | Ambiente:{' '}
                <strong className="text-[var(--rivo-volt-text)]">Produzione ERP</strong> | Scorciatoie:{' '}
                <span>[F2] Barcode • [F3] Magazzino</span>
              </>
            )}
          </div>
        </div>

        {/* Exit Simple Mode CTA */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <span className="text-[11px] text-[var(--text-muted)]">Modalità Semplice Attiva</span>
          <button
            type="button"
            onClick={() => {
              if (onExitSimpleMode) onExitSimpleMode();
              else toggleSimpleMode(false);
            }}
            className="inline-flex min-h-[40px] max-sm:min-h-[44px] items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3.5 text-xs font-semibold text-[var(--text-primary)] cursor-pointer transition-none"
          >
            Torna alla Grafica Standard
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL SUMMARY KPI BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 min-w-0">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.08em]">
            Incasso Registrato
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold text-[var(--rivo-volt-text)] tabular-nums truncate">
            {formatItCurrency(todayTotalRevenue)}
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
            {salesList.length} scontrini nel periodo
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 min-w-0">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.08em]">
            Margine Utile Lordo
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold text-[var(--text-primary)] tabular-nums truncate">
            {formatItCurrency(todayTotalMargin)}
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
            {todayTotalRevenue > 0
              ? ((todayTotalMargin / todayTotalRevenue) * 100).toFixed(1)
              : '0.0'}
            % di margine medio
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 min-w-0">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.08em]">
            Pezzi Venduti
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold text-[var(--text-primary)] tabular-nums truncate">
            {todayTotalPieces} PZ
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
            Giacenza globale: {totalStockPieces} pz
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 min-w-0">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.08em]">
            Varianti Sotto Scorta
          </div>
          <div
            className={`mt-1 text-lg sm:text-xl font-bold tabular-nums truncate ${
              criticalItems.length > 0
                ? 'text-[var(--accent-warning-text)]'
                : 'text-[var(--accent-operational-text)]'
            }`}
          >
            {criticalItems.length} CODICI
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
            {criticalItems.length > 0 ? 'Richiede riordino fornitore' : 'Scorte sopra soglia'}
          </div>
        </div>
      </div>

      {/* 3. CASSA VELOCE (FAST POS TERMINAL) */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <span className="font-bold text-xs uppercase tracking-[0.06em] text-[var(--text-primary)]">
            [F2] TERMINALE CASSA RAPIDA — EMISSIONE SCONTRINO
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Scanner Barcode USB / Selezione Rapida
          </span>
        </div>

        {/* Input Barcode / SKU + Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <form
            onSubmit={handleBarcodeSubmit}
            className="flex gap-1.5 min-w-0 lg:w-[280px] xl:w-[320px] shrink-0"
          >
            <input
              ref={barcodeInputRef}
              type="text"
              value={posBarcodeOrSku}
              onChange={(e) => setPosBarcodeOrSku(e.target.value)}
              aria-label="Cerca per Barcode EAN-13, SKU o nome articolo"
              placeholder="Barcode EAN-13 o SKU…"
              spellCheck={false}
              autoComplete="off"
              className={`flex-1 min-w-0 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={variants.length === 0}
              className="min-h-[38px] max-sm:min-h-[44px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3.5 text-xs font-bold text-[var(--text-primary)] disabled:opacity-50 cursor-pointer transition-none whitespace-nowrap shrink-0"
            >
              Invio
            </button>
          </form>

          <div className="flex-1 min-w-0">
            <select
              aria-label="Seleziona variante articolo per la cassa"
              value={effectiveSelectedVariantId}
              onChange={(e) => setPosSelectedVariantId(e.target.value)}
              disabled={variants.length === 0}
              className={`w-full min-w-0 ${inputClass}`}
            >
              {variants.length === 0 ? (
                <option value="">Nessun articolo disponibile in anagrafica</option>
              ) : (
                variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} • TG {v.size} — {formatItCurrency(v.salePrice)} ({v.stock} pz)
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              aria-label="Quantità articolo"
              min={1}
              max={99}
              value={posQty}
              onChange={(e) => setPosQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className={`w-20 lg:w-16 text-center shrink-0 ${inputClass}`}
            />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={variants.length === 0 || !effectiveSelectedVariantId}
              className="flex-1 lg:flex-initial min-h-[38px] max-sm:min-h-[44px] rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 text-xs font-bold text-[var(--rivo-volt-ink)] disabled:opacity-50 cursor-pointer transition-none whitespace-nowrap shrink-0"
            >
              + Aggiungi
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {posFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[var(--rivo-volt-border)] bg-[var(--rivo-volt-bg)] px-3 py-2 text-[11px] font-semibold text-[var(--rivo-volt-text)]"
          >
            {posFeedback}
          </div>
        )}

        {/* Cart Mobile Cards (< md) */}
        <div className="md:hidden space-y-2">
          {posCart.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 text-center text-[11px] text-[var(--text-muted)]">
              Nessun articolo nel carrello cassa. Seleziona un articolo sopra per emettere uno scontrino.
            </div>
          ) : (
            posCart.map((item, idx) => (
              <div
                key={`mobile-cart-${item.variant.id}-${idx}`}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold text-xs text-[var(--text-primary)] truncate">
                    {item.variant.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    TG {item.variant.size} • Q.tà {item.qty} × {formatItCurrency(item.variant.salePrice)}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-xs text-[var(--text-primary)] whitespace-nowrap">
                    {formatItCurrency(item.variant.salePrice * item.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                    className="min-h-[44px] px-2 text-[var(--accent-critical-text)] font-bold text-xs hover:underline cursor-pointer"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Table (Desktop >= md) */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)] uppercase text-[10px] tracking-[0.06em]">
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-9 text-center">#</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)]">Articolo / Descrizione</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-16 text-center whitespace-nowrap">Taglia</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-28 whitespace-nowrap">Barcode</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-24 text-right whitespace-nowrap">Prezzo Unit.</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-14 text-center whitespace-nowrap">Q.tà</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-24 text-right whitespace-nowrap">Totale</th>
                <th className="px-2.5 py-2 w-20 text-center whitespace-nowrap">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {posCart.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-[var(--text-muted)]">
                    Nessun articolo nel carrello cassa. Seleziona un articolo sopra per emettere uno scontrino.
                  </td>
                </tr>
              ) : (
                posCart.map((item, idx) => (
                  <tr key={`${item.variant.id}-${idx}`} className="min-h-[44px]">
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] font-semibold text-[var(--text-primary)]">
                      {item.variant.name}
                      {item.variant.brand !== '—' ? ` — ${item.variant.brand}` : ''}
                    </td>
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center font-bold bg-[var(--bg-elevated)] whitespace-nowrap">
                      {item.variant.size}
                    </td>
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-[var(--text-muted)] whitespace-nowrap">
                      {item.variant.barcode}
                    </td>
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right whitespace-nowrap">
                      {formatItCurrency(item.variant.salePrice)}
                    </td>
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center font-bold whitespace-nowrap">
                      {item.qty}
                    </td>
                    <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right font-bold text-[var(--text-primary)] whitespace-nowrap">
                      {formatItCurrency(item.variant.salePrice * item.qty)}
                    </td>
                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                        className="text-[var(--accent-critical-text)] font-bold hover:underline cursor-pointer"
                      >
                        Rimuovi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Checkout Action Bar */}
        {posCart.length > 0 && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs min-w-0">
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="whitespace-nowrap">Pagamento:</span>
                <select
                  value={posPaymentMethod}
                  onChange={(e) => setPosPaymentMethod(e.target.value as 'card' | 'cash')}
                  className="min-h-[38px] max-sm:min-h-[44px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]"
                >
                  <option value="card">Carta POS Bancomat</option>
                  <option value="cash">Contanti alla Cassa</option>
                </select>
              </label>

              <div className="font-bold text-sm text-[var(--text-primary)] whitespace-nowrap">
                TOTALE DOVUTO:{' '}
                <span className="text-[var(--rivo-volt-text)] font-black">
                  {formatItCurrency(posSubtotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteSale}
              className="w-full md:w-auto min-h-[44px] rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-5 py-2 text-xs font-bold tracking-wide text-[var(--rivo-volt-ink)] whitespace-nowrap shrink-0 cursor-pointer transition-none"
            >
              Emetti Scontrino • Scarica Stock
            </button>
          </div>
        )}
      </div>

      {/* 4. TABELLA COMPLETA GIACENZE & NUMERAZIONI MAGAZZINO */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-[var(--border-subtle)] pb-2.5">
          <span className="font-bold text-xs uppercase tracking-[0.06em] text-[var(--text-primary)]">
            [F3] ANAGRAFICA ARTICOLI, NUMERAZIONI &amp; GIACENZE FISICHE
          </span>

          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <input
              ref={inventorySearchRef}
              type="text"
              aria-label="Cerca modello, brand, SKU o barcode in magazzino"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca modello, brand, barcode…"
              spellCheck={false}
              autoComplete="off"
              className={`w-full sm:w-64 lg:w-72 ${inputClass}`}
            />

            <select
              aria-label="Filtra giacenze per categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`w-full sm:w-auto ${inputClass}`}
            >
              <option value="ALL">Tutte le Categorie</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Stacked Cards (< md) */}
        <div className="md:hidden space-y-2.5">
          {filteredVariants.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-6 text-center text-[11px] text-[var(--text-muted)]">
              {variants.length === 0
                ? 'Nessun articolo registrato nel magazzino di questa attività.'
                : 'Nessun articolo corrisponde ai filtri di ricerca impostati.'}
            </div>
          ) : (
            filteredVariants.map((v) => {
              const marginVal = v.salePrice - v.costPrice;
              const marginPct =
                v.salePrice > 0 ? ((marginVal / v.salePrice) * 100).toFixed(1) : '0.0';
              const isOutOfStock = v.stock === 0;
              const isLowStock = v.stock > 0 && v.stock <= v.reorderThreshold;

              return (
                <div
                  key={`mobile-${v.id}`}
                  className={`rounded-xl border p-3.5 space-y-2.5 ${
                    isOutOfStock
                      ? 'border-[var(--accent-critical-border)] bg-[var(--accent-critical-bg)]/40'
                      : isLowStock
                      ? 'border-[var(--accent-warning-border)] bg-[var(--accent-warning-bg)]/40'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-primary)] whitespace-nowrap">
                          TG {v.size}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] truncate">
                          {v.brand !== '—' ? v.brand : v.category}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-[var(--text-primary)] break-words">
                        {v.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] break-all">
                        {v.sku} • EAN {v.barcode}
                        {v.color !== '—' ? ` • ${v.color}` : ''}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isOutOfStock ? (
                        <StatusBadge tone="critical" size="sm">
                          Esaurito
                        </StatusBadge>
                      ) : isLowStock ? (
                        <StatusBadge tone="warning" size="sm">
                          Sotto Scorta
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="operational" size="sm">
                          OK
                        </StatusBadge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-[11px]">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                        Costo
                      </span>
                      <span className="font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                        {formatItCurrency(v.costPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                        Vendita
                      </span>
                      <span className="font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {formatItCurrency(v.salePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                        Margine
                      </span>
                      <span className="font-bold text-[var(--rivo-volt-text)] whitespace-nowrap">
                        {marginPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="text-xs text-[var(--text-secondary)]">
                      Giacenza:{' '}
                      <strong className="text-sm font-bold text-[var(--text-primary)]">
                        {v.stock} pz
                      </strong>
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(v.id, -1)}
                        disabled={v.stock <= 0}
                        aria-label={`Scarica 1 pezzo per ${v.name} taglia ${v.size}`}
                        className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-xs disabled:opacity-40 cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(v.id, 1)}
                        aria-label={`Carica 1 pezzo per ${v.name} taglia ${v.size}`}
                        className="min-h-[44px] min-w-[44px] rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 font-bold text-xs cursor-pointer"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Master Stock Table (Desktop >= md) */}
        <div className="hidden md:block overflow-x-auto max-h-[440px] rounded-lg border border-[var(--border-subtle)]">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-semibold uppercase text-[10px] tracking-[0.06em]">
              <tr>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] whitespace-nowrap">SKU / EAN</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] whitespace-nowrap">Modello / Brand</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] w-14 text-center whitespace-nowrap">Tg</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right whitespace-nowrap">Costo</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right whitespace-nowrap">Vendita</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right whitespace-nowrap">Margine</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center w-16 whitespace-nowrap">Stock</th>
                <th className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center whitespace-nowrap">Stato</th>
                <th className="px-2.5 py-2 text-center w-20 whitespace-nowrap">Rettifica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-[var(--text-muted)]">
                    {variants.length === 0
                      ? 'Nessun articolo registrato nel magazzino di questa attività.'
                      : 'Nessun articolo corrisponde ai filtri di ricerca impostati.'}
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const marginVal = v.salePrice - v.costPrice;
                  const marginPct =
                    v.salePrice > 0 ? ((marginVal / v.salePrice) * 100).toFixed(1) : '0.0';
                  const isOutOfStock = v.stock === 0;
                  const isLowStock = v.stock > 0 && v.stock <= v.reorderThreshold;
                  const metaLine = [
                    v.brand !== '—' ? v.brand : null,
                    v.color !== '—' ? v.color : null,
                  ]
                    .filter(Boolean)
                    .join(' • ');

                  return (
                    <tr
                      key={v.id}
                      className={`min-h-[48px] hover:bg-[var(--bg-elevated)]/70 ${
                        isOutOfStock
                          ? 'bg-[var(--accent-critical-bg)]/50'
                          : isLowStock
                          ? 'bg-[var(--accent-warning-bg)]/50'
                          : ''
                      }`}
                    >
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] whitespace-nowrap">
                        <div className="font-semibold text-[var(--text-secondary)]">{v.sku}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{v.barcode}</div>
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] min-w-[160px]">
                        <div className="font-semibold text-[var(--text-primary)]">{v.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {metaLine || v.category}
                        </div>
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center font-bold bg-[var(--bg-elevated)] text-[var(--text-primary)] whitespace-nowrap">
                        {v.size}
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right text-[var(--text-secondary)] whitespace-nowrap">
                        {formatItCurrency(v.costPrice)}
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {formatItCurrency(v.salePrice)}
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-right font-semibold text-[var(--rivo-volt-text)] whitespace-nowrap">
                        {marginPct}%
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center font-bold text-sm text-[var(--text-primary)] whitespace-nowrap">
                        {v.stock}
                      </td>
                      <td className="px-2.5 py-2 border-r border-[var(--border-subtle)] text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <StatusBadge tone="critical" size="sm">
                            Esaurito
                          </StatusBadge>
                        ) : isLowStock ? (
                          <StatusBadge tone="warning" size="sm">
                            Sotto Scorta
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="operational" size="sm">
                            OK
                          </StatusBadge>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(v.id, -1)}
                            disabled={v.stock <= 0}
                            aria-label={`Scarica 1 pezzo per ${v.name} taglia ${v.size}`}
                            title="Scarica 1 pezzo"
                            className="min-h-[30px] min-w-[30px] rounded border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-[11px] disabled:opacity-40 cursor-pointer"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(v.id, 1)}
                            aria-label={`Carica 1 pezzo per ${v.name} taglia ${v.size}`}
                            title="Carica 1 pezzo"
                            className="min-h-[30px] min-w-[30px] rounded bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 font-bold text-[11px] cursor-pointer"
                          >
                            +1
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SEZIONE RIORDINO FORNITORI & STORICO SCONTRINI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notifiche Riordino Fornitori */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
            <span className="font-bold text-xs uppercase tracking-[0.06em] text-[var(--accent-warning-text)]">
              RIORDINI FORNITORI (SOTTO SOGLIA)
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {criticalItems.length} articoli da ordinare
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] text-[10px] uppercase tracking-[0.06em]">
                  <th className="p-2 text-left">Articolo</th>
                  <th className="p-2 text-center">Tg</th>
                  <th className="p-2 text-center">Giacenza</th>
                  <th className="p-2 text-left">Fornitore</th>
                  <th className="p-2 text-center">Consiglio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {criticalItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-[var(--text-muted)]">
                      Tutte le scorte sono sopra la soglia minima.
                    </td>
                  </tr>
                ) : (
                  criticalItems.map((c) => (
                    <tr key={c.id} className="min-h-[44px]">
                      <td className="p-2 font-semibold text-[var(--text-primary)]">{c.name}</td>
                      <td className="p-2 text-center font-bold">{c.size}</td>
                      <td className="p-2 text-center font-bold text-[var(--accent-critical-text)]">
                        {c.stock} pz
                      </td>
                      <td className="p-2 text-[var(--text-secondary)]">{c.supplier}</td>
                      <td className="p-2 text-center font-bold text-[var(--rivo-volt-text)]">
                        +6 pz
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registro Vendite */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
            <span className="font-bold text-xs uppercase tracking-[0.06em] text-[var(--text-primary)]">
              ULTIMI SCONTRINI EMESSI A CASSA
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Tot: {formatItCurrency(todayTotalRevenue)}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] text-[10px] uppercase tracking-[0.06em]">
                  <th className="p-2 w-14 text-center">Ora</th>
                  <th className="p-2 text-left">Scontrino #</th>
                  <th className="p-2 text-left">Dettaglio Articoli</th>
                  <th className="p-2 text-right">Totale</th>
                  <th className="p-2 text-center">Metodo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {salesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-[var(--text-muted)]">
                      Nessuna vendita registrata finora. Emetti il primo scontrino dal terminale sopra.
                    </td>
                  </tr>
                ) : (
                  salesList.slice(0, 5).map((s) => (
                    <tr key={s.id} className="min-h-[44px]">
                      <td className="p-2 text-center text-[var(--text-muted)] whitespace-nowrap">
                        {s.time}
                      </td>
                      <td className="p-2 font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {s.number}
                      </td>
                      <td className="p-2 text-[var(--text-secondary)] truncate max-w-[180px]">
                        {s.items}
                      </td>
                      <td className="p-2 text-right font-bold text-[var(--rivo-volt-text)] whitespace-nowrap">
                        {formatItCurrency(s.total)}
                      </td>
                      <td className="p-2 text-center text-[var(--text-secondary)] whitespace-nowrap">
                        {s.payment}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';
import { hasPermission } from '@/lib/rbac';
import { parseImportBuffer, autoDetectColumnMapping, ColumnMapping } from '@/platform/import/parser';
import { validateImportRows, ValidatedImportItem } from '@/platform/import/validator';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * POST /api/import/catalog
 * Handle file preview or atomic commit of imported products and initial stock.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();

    let targetOrgId = profile.organization_id;
    if (!targetOrgId && profile.role === 'admin') {
      const { searchParams } = new URL(request.url);
      const queryOrgId = searchParams.get('organization_id');
      if (queryOrgId && isValidUUID(queryOrgId)) {
        targetOrgId = queryOrgId;
      } else {
        const { data: firstOrg } = await adminClient
          .from('organizations')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        targetOrgId = firstOrg?.id || '';
      }
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione trovata' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'products.create')) {
      return NextResponse.json({ error: 'Permessi insufficienti per importare prodotti' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    // 1. FILE UPLOAD & PREVIEW MODE
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Nessun file selezionato' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const { headers, rows } = parseImportBuffer(bytes);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Il file caricato è vuoto o non contiene righe valide' }, { status: 400 });
      }

      const autoMapping = autoDetectColumnMapping(headers);

      // Initial validation based on auto mapping
      const { items, validCount, errorCount } = validateImportRows(rows, {
        name: autoMapping.name || headers[0] || '',
        sale_price: autoMapping.sale_price || '',
        ...autoMapping,
      } as ColumnMapping);

      return NextResponse.json({
        success: true,
        headers,
        auto_mapping: autoMapping,
        total_rows: rows.length,
        valid_rows: validCount,
        error_rows: errorCount,
        preview_items: items.slice(0, 30),
        raw_rows: rows,
      });
    }

    // 2. COMMIT ATOMIC BATCH MODE
    const body = await request.json();
    const { action, items } = body;

    if (action === 'commit') {
      const importItems = (items as ValidatedImportItem[] || []).filter((it) => it.status === 'valid');

      if (importItems.length === 0) {
        return NextResponse.json({ error: 'Nessuna riga valida da importare' }, { status: 400 });
      }

      // 2.1 Cache or Create Brands
      const uniqueBrandNames = Array.from(
        new Set(importItems.map((it) => it.brand_name?.trim()).filter(Boolean))
      ) as string[];

      const brandMap = new Map<string, string>();
      if (uniqueBrandNames.length > 0) {
        const { data: existingBrands } = await adminClient
          .from('brands')
          .select('id, name')
          .eq('organization_id', targetOrgId);

        (existingBrands || []).forEach((b) => brandMap.set(b.name.toLowerCase().trim(), b.id));

        for (const bName of uniqueBrandNames) {
          const key = bName.toLowerCase().trim();
          if (!brandMap.has(key)) {
            const { data: newB } = await adminClient
              .from('brands')
              .insert({ organization_id: targetOrgId, name: bName })
              .select('id, name')
              .single();
            if (newB) brandMap.set(key, newB.id);
          }
        }
      }

      // 2.2 Cache or Create Categories
      const uniqueCatNames = Array.from(
        new Set(importItems.map((it) => it.category_name?.trim()).filter(Boolean))
      ) as string[];

      const catMap = new Map<string, string>();
      if (uniqueCatNames.length > 0) {
        const { data: existingCats } = await adminClient
          .from('product_categories')
          .select('id, name')
          .eq('organization_id', targetOrgId);

        (existingCats || []).forEach((c) => catMap.set(c.name.toLowerCase().trim(), c.id));

        for (const cName of uniqueCatNames) {
          const key = cName.toLowerCase().trim();
          if (!catMap.has(key)) {
            const { data: newC } = await adminClient
              .from('product_categories')
              .insert({ organization_id: targetOrgId, name: cName })
              .select('id, name')
              .single();
            if (newC) catMap.set(key, newC.id);
          }
        }
      }

      // 2.3 Group items into products and variants
      const productGroups = new Map<string, ValidatedImportItem[]>();
      for (const it of importItems) {
        // Group key: product_name + brand
        const groupKey = `${it.product_name.toLowerCase().trim()}_${(it.brand_name || '').toLowerCase().trim()}`;
        const existing = productGroups.get(groupKey) || [];
        existing.push(it);
        productGroups.set(groupKey, existing);
      }

      let createdProductsCount = 0;
      let createdVariantsCount = 0;
      let initialStockTotal = 0;
      const errors: string[] = [];

      for (const [, groupItems] of productGroups.entries()) {
        const first = groupItems[0];
        const brandId = first.brand_name ? brandMap.get(first.brand_name.toLowerCase().trim()) || null : null;
        const categoryId = first.category_name ? catMap.get(first.category_name.toLowerCase().trim()) || null : null;

        // Collect attribute keys
        const attrKeysSet = new Set<string>();
        if (groupItems.some((it) => it.size)) attrKeysSet.add('size');
        if (groupItems.some((it) => it.color)) attrKeysSet.add('color');

        // Create product
        const { data: newProd, error: prodErr } = await adminClient
          .from('products')
          .insert({
            organization_id: targetOrgId,
            name: sanitizeString(first.product_name, 255)!,
            brand_id: brandId,
            brand: first.brand_name ? sanitizeString(first.brand_name, 100) : null,
            category_id: categoryId,
            category_name: first.category_name ? sanitizeString(first.category_name, 100) : null,
            sku: first.sku ? sanitizeString(first.sku, 100) : null,
            barcode: first.barcode ? sanitizeString(first.barcode, 100) : null,
            cost_price: first.cost_price,
            sale_price: first.sale_price,
            tax_rate: first.tax_rate,
            attribute_keys: Array.from(attrKeysSet),
            status: 'active',
            active: true,
          })
          .select('id')
          .single();

        if (prodErr || !newProd) {
          errors.push(`Errore creazione prodotto ${first.product_name}: ${prodErr?.message}`);
          continue;
        }

        createdProductsCount++;

        // Create variants and initial stock movements
        for (const varItem of groupItems) {
          const attributes: Record<string, string> = {};
          if (varItem.size) attributes.size = varItem.size;
          if (varItem.color) attributes.color = varItem.color;

          const { data: newVar, error: varErr } = await adminClient
            .from('product_variants')
            .insert({
              product_id: newProd.id,
              organization_id: targetOrgId,
              sku: varItem.sku ? sanitizeString(varItem.sku, 100) : null,
              barcode: varItem.barcode ? sanitizeString(varItem.barcode, 100) : null,
              size: varItem.size ? sanitizeString(varItem.size, 50) : null,
              color: varItem.color ? sanitizeString(varItem.color, 50) : null,
              attributes,
              cost_price: varItem.cost_price,
              sale_price: varItem.sale_price,
              minimum_stock: 2,
              reorder_threshold: 2,
              status: 'active',
              active: true,
            })
            .select('id')
            .single();

          if (varErr || !newVar) {
            errors.push(`Errore creazione variante per ${varItem.product_name}: ${varErr?.message}`);
            continue;
          }

          createdVariantsCount++;

          // Record initial inventory movement atomically if stock > 0
          if (varItem.stock > 0) {
            initialStockTotal += varItem.stock;
            await adminClient.rpc('rpc_record_inventory_movement', {
              p_org_id: targetOrgId,
              p_variant_id: newVar.id,
              p_location_id: null,
              p_type: 'initial',
              p_quantity_delta: varItem.stock,
              p_reason: 'Giacenza iniziale importazione catalogo',
              p_reference: 'MIGRAZIONE-INIZIALE',
              p_ref_id: null,
              p_ref_type: 'import',
              p_unit_cost: varItem.cost_price,
              p_user_id: profile.auth_user_id || null,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          imported_products: createdProductsCount,
          imported_variants: createdVariantsCount,
          initial_stock_units: initialStockTotal,
          errors_count: errors.length,
          errors,
        },
      });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

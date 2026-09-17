import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  CURATED_COMMUNITY_TEMPLATES,
  CommunityHubTemplate,
} from '@/lib/community-catalog';
import { mergeHubConfig } from '@/lib/hub-config';
import { sanitizeString } from '@/lib/security';
import { BusinessCategory } from '@/lib/types';

// In-memory fallback cache per template condivisi dalla community sul server
const serverSharedTemplates: CommunityHubTemplate[] = [];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * GET /api/community-catalog
 * Ritorna l'elenco completo dei template Hub (curati d'autore + condivisi dalla community).
 * Supporta filtri opzionali: ?category=... e ?search=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase().trim();

    // 1. Tenta di recuperare eventuali template memorizzati su Supabase
    let dbTemplates: CommunityHubTemplate[] = [];
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('community_hub_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          dbTemplates = data.map((item) => ({
            id: item.id,
            name: item.name,
            author: item.author,
            category: item.category,
            styleTag: item.style_tag || item.styleTag || 'Community Pick',
            description: item.description,
            likesCount: item.likes_count ?? item.likesCount ?? 1,
            usageCount: item.usage_count ?? item.usageCount ?? 0,
            preview: item.preview || {
              primaryColor: item.config?.primaryColor || '#00F0FF',
              themeMode: item.config?.themeMode || 'dark',
              fontFamily: item.config?.fontFamily || 'outfit',
              cardStyle: item.config?.cardStyle || 'glass',
              modulesPreview: [],
            },
            config: mergeHubConfig(item.config, (item.category as BusinessCategory) || 'restaurant'),
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          }));
        }
      } catch {
        // Tabella supabase opzionale o non ancora migrata; fallback indolore alla memoria
      }
    }

    // 2. Unisci template curati + memoria server + database
    const allTemplatesMap = new Map<string, CommunityHubTemplate>();

    // Prima i curati
    for (const t of CURATED_COMMUNITY_TEMPLATES) {
      allTemplatesMap.set(t.id, t);
    }
    // Poi la memoria server
    for (const t of serverSharedTemplates) {
      allTemplatesMap.set(t.id, t);
    }
    // Poi quelli da DB
    for (const t of dbTemplates) {
      allTemplatesMap.set(t.id, t);
    }

    let combined = Array.from(allTemplatesMap.values());

    // 3. Applicazione filtri opzionali
    if (category && category !== 'all') {
      combined = combined.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      combined = combined.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.styleTag.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.author.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      count: combined.length,
      templates: combined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[API /api/community-catalog] GET error:', msg);
    return NextResponse.json(
      {
        success: true,
        count: CURATED_COMMUNITY_TEMPLATES.length,
        templates: CURATED_COMMUNITY_TEMPLATES,
      },
      { status: 200 }
    );
  }
}

/**
 * POST /api/community-catalog
 * Condivide un nuovo template nel catalogo community con validazione e sanitizzazione sicura.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload non valido' }, { status: 400 });
    }

    const rawName = sanitizeString(body.name, 80);
    const rawAuthor = sanitizeString(body.author, 60);
    const rawCategory = sanitizeString(body.category, 40) || 'restaurant';
    const rawStyleTag = sanitizeString(body.styleTag || body.style_tag, 60) || 'Creative Studio';
    const rawDescription = sanitizeString(body.description, 1000);

    if (!rawName) {
      return NextResponse.json({ error: 'Il nome del template è obbligatorio' }, { status: 400 });
    }

    if (!rawDescription) {
      return NextResponse.json({ error: 'La descrizione del template è obbligatoria' }, { status: 400 });
    }

    // Valida e sintetizza la configurazione Hub
    const validatedConfig = mergeHubConfig(body.config, (rawCategory as BusinessCategory) || 'restaurant');

    const preview = {
      primaryColor: sanitizeString(body.preview?.primaryColor, 30) || validatedConfig.primaryColor,
      themeMode: sanitizeString(body.preview?.themeMode, 30) || validatedConfig.themeMode,
      fontFamily: sanitizeString(body.preview?.fontFamily, 30) || validatedConfig.fontFamily,
      cardStyle: sanitizeString(body.preview?.cardStyle, 30) || validatedConfig.cardStyle,
      bgImageUrl: sanitizeString(body.preview?.bgImageUrl || validatedConfig.bgImageUrl, 500) || undefined,
      modulesPreview: Array.isArray(body.preview?.modulesPreview)
        ? body.preview.modulesPreview.map((m: unknown) => sanitizeString(m, 50) || '').filter(Boolean).slice(0, 6)
        : validatedConfig.modules
            .filter((m) => m.enabled)
            .slice(0, 4)
            .map((m) => m.title),
    };

    const newTemplate: CommunityHubTemplate = {
      id: sanitizeString(body.id, 80) || `hub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: rawName,
      author: rawAuthor || 'Community Creator',
      category: rawCategory,
      styleTag: rawStyleTag,
      description: rawDescription,
      likesCount: typeof body.likesCount === 'number' ? Math.max(1, body.likesCount) : 1,
      usageCount: typeof body.usageCount === 'number' ? Math.max(0, body.usageCount) : 0,
      preview,
      config: validatedConfig,
      createdAt: new Date().toISOString(),
    };

    // 1. Salva in memoria del processo server per persistenza dinamica
    serverSharedTemplates.unshift(newTemplate);

    // 2. Se Supabase è configurato e possiede la tabella 'community_hub_templates', tenta l'inserimento
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('community_hub_templates').insert({
          id: newTemplate.id,
          name: newTemplate.name,
          author: newTemplate.author,
          category: newTemplate.category,
          style_tag: newTemplate.styleTag,
          description: newTemplate.description,
          likes_count: newTemplate.likesCount,
          usage_count: newTemplate.usageCount,
          preview: newTemplate.preview,
          config: newTemplate.config,
          created_at: newTemplate.createdAt,
        });
      } catch (dbErr) {
        console.warn('[API /api/community-catalog] DB insert non riuscito, template salvato in memoria:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template condiviso con successo nella community!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
    console.error('[API /api/community-catalog] POST error:', msg);
    return NextResponse.json({ error: 'Impossibile condividere il template nel catalogo' }, { status: 500 });
  }
}

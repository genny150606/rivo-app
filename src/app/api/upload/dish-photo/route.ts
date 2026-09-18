import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // 1. Check user session
    const sessionClient = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    });

    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Sessione non valida. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orgId = formData.get('orgId') as string | null;

    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json(
        { error: 'ID organizzazione mancante o non valido.' },
        { status: 400 }
      );
    }

    // 3. Check authorization for this org
    const { data: profile } = await sessionClient
      .from('profiles')
      .select('organization_id, role')
      .eq('auth_user_id', user.id)
      .single();

    const isAuthorized =
      profile?.role === 'admin' || profile?.organization_id === orgId;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questa attività.' },
        { status: 403 }
      );
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Configurazione server incompleta (Service Role Key).' },
        { status: 500 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file selezionato.' },
        { status: 400 }
      );
    }

    // Validate mime type (safe raster formats only)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato file non supportato. Usa PNG, JPG o WEBP.' },
        { status: 400 }
      );
    }

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Il file è troppo grande. Dimensione massima 8MB.' },
        { status: 400 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${orgId}/dish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Try 'dishes' bucket first, fallback to 'logos'
    let bucket = 'dishes';
    let { error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.warn('Dishes bucket upload error, falling back to logos bucket:', uploadError);
      bucket = 'logos';
      const fallbackUpload = await adminSupabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (fallbackUpload.error) {
        return NextResponse.json(
          { error: `Errore caricamento storage: ${fallbackUpload.error.message}` },
          { status: 500 }
        );
      }
    }

    // Get public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
  } catch (err: unknown) {
    console.error('Dish photo upload error:', err);
    const msg = err instanceof Error ? err.message : 'Errore interno server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

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
    const directUrl = formData.get('directUrl') as string | null;
    const action = formData.get('action') as string | null;

    if (!orgId) {
      return NextResponse.json(
        { error: 'ID organizzazione mancante.' },
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

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Action: Remove Logo
    if (action === 'remove') {
      const { error: updateErr } = await adminSupabase
        .from('organizations')
        .update({
          logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (updateErr) {
        throw updateErr;
      }

      return NextResponse.json({ success: true, logoUrl: null });
    }

    // 5. Action: Direct URL
    if (directUrl && directUrl.trim()) {
      const trimmedUrl = directUrl.trim();
      const { error: updateErr } = await adminSupabase
        .from('organizations')
        .update({
          logo_url: trimmedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (updateErr) {
        throw updateErr;
      }

      return NextResponse.json({ success: true, logoUrl: trimmedUrl });
    }

    // 6. Action: File Upload
    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file selezionato.' },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato file non supportato. Usa PNG, JPG, WEBP o SVG.' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Il file è troppo grande. Dimensione massima 5MB.' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage bucket 'logos'
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `${orgId}/logo-${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminSupabase.storage
      .from('logos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Errore caricamento storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update organizations table with the new logo_url
    const { error: dbError } = await adminSupabase
      .from('organizations')
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (dbError) {
      console.error('DB update error:', dbError);
      return NextResponse.json(
        { error: `Errore aggiornamento database: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (err: unknown) {
    console.error('Logo upload handler error:', err);
    const msg = err instanceof Error ? err.message : 'Errore interno server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

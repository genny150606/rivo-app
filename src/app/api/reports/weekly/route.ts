import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    const orgIdParam = request.nextUrl.searchParams.get('org_id');

    // 1. Fetch organization
    let orgQuery = supabase.from('organizations').select('*');
    if (orgIdParam) {
      orgQuery = orgQuery.eq('id', orgIdParam);
    } else {
      orgQuery = orgQuery.limit(1);
    }

    const { data: orgs, error: orgError } = await orgQuery;
    if (orgError || !orgs || orgs.length === 0) {
      return NextResponse.json({ error: 'Nessuna attività trovata' }, { status: 404 });
    }

    const org = orgs[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch past 7 days interactions
    const { data: interactions } = await supabase
      .from('interactions')
      .select('interaction_type, timestamp')
      .eq('organization_id', org.id)
      .gte('timestamp', sevenDaysAgo);

    const totalInteractions = interactions?.length || 0;
    const nfcCount = interactions?.filter((i) => i.interaction_type === 'nfc').length || 0;
    const qrCount = interactions?.filter((i) => i.interaction_type === 'qr').length || 0;

    // 3. Fetch past 7 days private feedbacks (intercepted reviews)
    const { data: feedbacks } = await supabase
      .from('private_feedbacks')
      .select('id, rating, customer_name, comment, created_at')
      .eq('organization_id', org.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false });

    const interceptedCount = feedbacks?.length || 0;

    // 4. Generate HTML Email Report
    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Report Settimanale RIVO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090B; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #121214; border: 1px solid #27272A; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #27272A;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #BFFF00; display: block; margin-bottom: 4px;">REPORT SETTIMANALE</span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF;">${org.name}</h1>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: rgba(191,255,0,0.1); border: 1px solid rgba(191,255,0,0.3); border-radius: 20px; font-size: 11px; font-weight: 600; color: #BFFF00;">
                      SHIELD ATTIVO
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Intro -->
          <tr>
            <td style="padding: 24px 32px 10px 32px;">
              <p style="margin: 0; font-size: 14px; color: #A1A1AA; line-height: 1.6;">
                Ecco il riepilogo delle interazioni fisiche e della protezione della reputazione registrate negli ultimi 7 giorni con il tuo sistema <strong>RIVO</strong>.
              </p>
            </td>
          </tr>

          <!-- KPI Cards Grid -->
          <tr>
            <td style="padding: 10px 32px 24px 32px;">
              <table width="100%" border="0" cellspacing="10" cellpadding="0">
                <tr>
                  <td width="50%" style="background-color: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 18px;">
                    <span style="font-size: 11px; color: #71717A; text-transform: uppercase; display: block; margin-bottom: 6px;">Interazioni Totali</span>
                    <span style="font-size: 28px; font-weight: 700; color: #FFFFFF; display: block;">${totalInteractions}</span>
                    <span style="font-size: 11px; color: #BFFF00; margin-top: 4px; display: block;">Tap NFC + Scansioni QR</span>
                  </td>
                  <td width="50%" style="background-color: #18181B; border: 1px solid rgba(191,255,0,0.3); border-radius: 12px; padding: 18px;">
                    <span style="font-size: 11px; color: #BFFF00; text-transform: uppercase; display: block; margin-bottom: 6px;">Recensioni Salvate</span>
                    <span style="font-size: 28px; font-weight: 700; color: #BFFF00; display: block;">${interceptedCount}</span>
                    <span style="font-size: 11px; color: #A1A1AA; margin-top: 4px; display: block;">Lamentele intercettate</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="background-color: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 18px;">
                    <span style="font-size: 11px; color: #71717A; text-transform: uppercase; display: block; margin-bottom: 6px;">Tap NFC</span>
                    <span style="font-size: 22px; font-weight: 700; color: #FFFFFF; display: block;">${nfcCount}</span>
                    <span style="font-size: 11px; color: #71717A; margin-top: 4px; display: block;">${totalInteractions > 0 ? Math.round((nfcCount / totalInteractions) * 100) : 0}% del totale</span>
                  </td>
                  <td width="50%" style="background-color: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 18px;">
                    <span style="font-size: 11px; color: #71717A; text-transform: uppercase; display: block; margin-bottom: 6px;">Scansioni QR</span>
                    <span style="font-size: 22px; font-weight: 700; color: #FFFFFF; display: block;">${qrCount}</span>
                    <span style="font-size: 11px; color: #71717A; margin-top: 4px; display: block;">${totalInteractions > 0 ? Math.round((qrCount / totalInteractions) * 100) : 0}% del totale</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shield Highlight -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: rgba(191,255,0,0.05); border: 1px solid rgba(191,255,0,0.2); border-radius: 12px; padding: 18px;">
                <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #FFFFFF;">Protezione Attiva con Review Shield</h3>
                <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                  Tutti i clienti che hanno espresso soddisfazione a 4-5 stelle sono stati indirizzati su Google Reviews. Le ${interceptedCount} lamentele da 1-3 stelle sono rimaste riservate, salvaguardando il tuo rating su Google Maps.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 10px 32px 32px 32px;">
              <a href="https://rivo-app-ten.vercel.app/dashboard" style="display: inline-block; background-color: #BFFF00; color: #000000; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
                Accedi alla Dashboard RIVO &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0D0D0E; border-top: 1px solid #27272A; text-align: center;">
              <span style="font-size: 11px; color: #52525B;">RIVO • Esperienze Connesse e Reputazione Protetta</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

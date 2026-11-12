import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import {
  dispatchOutreachCommunication,
  getCommunicationChannelsStatus,
} from '@/lib/outreach/providers/communication';
import { OutreachComplianceService } from '@/lib/outreach/compliance';
import type {
  LegalBasisType,
  OutreachChannel,
  OutreachDeliveryMode,
  OutreachProspectRecord,
} from '@/lib/outreach/types';
import { isValidUUID } from '@/lib/security';

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb } = auth;

  try {
    const [
      { data: messages },
      { data: permissions },
      { data: suppressions },
      { data: prospects },
    ] = await Promise.all([
      adminDb
        .from('outreach_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      adminDb
        .from('outreach_contact_permissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      adminDb
        .from('outreach_suppressions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      adminDb
        .from('outreach_prospects')
        .select('id, business_name, category, subcategory, city, business_email, business_phone, instagram_url, website, commercial_status')
        .is('merged_into_id', null)
        .order('updated_at', { ascending: false })
        .limit(150),
    ]);

    return NextResponse.json({
      channels: getCommunicationChannelsStatus(),
      messages: messages || [],
      permissions: permissions || [],
      suppressions: suppressions || [],
      prospects: prospects || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nel caricamento del Communication Center.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb, user } = auth;

  try {
    const body = await request.json();
    const action = String(body.action || '');

    // 1. Register / Grant Contact Permission with Legal Basis & Evidence
    if (action === 'grant_permission') {
      const prospectId = String(body.prospect_id || '');
      const channel = String(body.channel || 'email') as OutreachChannel;
      const legalBasis = String(
        body.legal_basis || 'documented_b2b_legitimate_interest'
      ) as LegalBasisType;
      const evidenceReference = String(body.evidence_reference || '').trim();
      const source = String(body.source || 'admin_verification').trim();

      if (!isValidUUID(prospectId) || !evidenceReference) {
        return NextResponse.json(
          {
            error:
              'Per abilitare un canale di contatto è obbligatorio indicare il riferimento dell’evidenza o della base giuridica.',
          },
          { status: 400 }
        );
      }

      const { data: perm, error } = await adminDb
        .from('outreach_contact_permissions')
        .insert({
          prospect_id: prospectId,
          channel,
          permission_status: 'granted',
          legal_basis: legalBasis,
          evidence_reference: evidenceReference,
          source,
          scope: 'b2b_commercial_outreach',
        })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // If inbound user-initiated on Instagram/WhatsApp, open conversation window
      if (legalBasis === 'user_initiated_inbound') {
        await adminDb.from('outreach_conversations').insert({
          prospect_id: prospectId,
          channel,
          conversation_status: 'open_user_initiated',
          last_user_message_at: new Date().toISOString(),
        });
      }

      await Promise.all([
        adminDb
          .from('outreach_prospects')
          .update({
            commercial_status: 'contatto_consentito',
            updated_at: new Date().toISOString(),
          })
          .eq('id', prospectId)
          .in('commercial_status', ['nuovo', 'da_analizzare', 'analizzato', 'da_contattare']),
        adminDb.from('outreach_activity_logs').insert({
          prospect_id: prospectId,
          action: 'contact_permission_granted',
          metadata: {
            channel,
            legal_basis: legalBasis,
            evidence_reference: evidenceReference,
          },
          admin_user_id: user.id,
        }),
      ]);

      return NextResponse.json({ success: true, permission: perm });
    }

    // 2. Send or Queue Message through OutreachComplianceService
    if (action === 'dispatch_message') {
      const prospectId = String(body.prospect_id || '');
      const channel = String(body.channel || 'email') as OutreachChannel;
      const deliveryMode = String(body.delivery_mode || 'approval') as OutreachDeliveryMode;
      const isHumanApproved = body.is_human_approved === true;
      const subject = body.subject ? String(body.subject) : undefined;
      const content = String(body.content || '').trim();
      const variantUsed = body.variant_used ? String(body.variant_used) : undefined;
      const whatsappTemplateName = body.whatsapp_template_name
        ? String(body.whatsapp_template_name)
        : undefined;

      if (!isValidUUID(prospectId) || !content) {
        return NextResponse.json(
          { error: 'Prospect e contenuto del messaggio obbligatori.' },
          { status: 400 }
        );
      }

      const { data: pRow } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle();

      if (!pRow) {
        return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
      }

      const sendResult = await dispatchOutreachCommunication({
        adminDb,
        prospect: pRow as OutreachProspectRecord,
        channel,
        deliveryMode,
        isHumanApproved,
        subject,
        content,
        variantUsed,
        whatsappTemplateName,
        adminUserId: user.id,
      });

      return NextResponse.json(sendResult, {
        status: sendResult.success ? 200 : 422,
      });
    }

    // 3. Record Inbound Reply from Prospect
    if (action === 'record_inbound_reply') {
      const prospectId = String(body.prospect_id || '');
      const channel = String(body.channel || 'email') as OutreachChannel;
      const content = String(body.content || '').trim();

      if (!isValidUUID(prospectId) || !content) {
        return NextResponse.json(
          { error: 'Specifica prospect e testo della risposta ricevuta.' },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      const { data: conv } = await adminDb
        .from('outreach_conversations')
        .insert({
          prospect_id: prospectId,
          channel,
          conversation_status: 'open_user_initiated',
          last_user_message_at: nowIso,
        })
        .select('id')
        .single();

      const { data: msg } = await adminDb
        .from('outreach_messages')
        .insert({
          prospect_id: prospectId,
          conversation_id: conv?.id || null,
          channel,
          direction: 'inbound',
          delivery_mode: 'manual',
          content,
          provider_status: 'replied',
          sent_at: nowIso,
        })
        .select('*')
        .single();

      await Promise.all([
        adminDb
          .from('outreach_prospects')
          .update({
            commercial_status: 'interessato',
            updated_at: nowIso,
          })
          .eq('id', prospectId),
        adminDb.from('outreach_activity_logs').insert({
          prospect_id: prospectId,
          action: 'inbound_reply_recorded',
          metadata: { channel, snippet: content.slice(0, 120) },
          admin_user_id: user.id,
        }),
      ]);

      return NextResponse.json({ success: true, message: msg });
    }

    // 4. Record Opt-Out & Suppression
    if (action === 'record_opt_out') {
      const prospectId = String(body.prospect_id || '');
      const channel = String(body.channel || 'all') as OutreachChannel | 'all';
      const reason = String(body.reason || 'Richiesta di opposizione / opt-out del destinatario');
      const contactIdentifier = body.contact_identifier ? String(body.contact_identifier) : null;

      if (!isValidUUID(prospectId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      await OutreachComplianceService.recordOptOutAndSuppress(adminDb, {
        prospectId,
        channel,
        reason,
        contactIdentifier,
        adminUserId: user.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Prospect aggiunto alla lista di soppressione e bloccato da futuri contatti.',
      });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nella gestione delle comunicazioni.' },
      { status: 500 }
    );
  }
}

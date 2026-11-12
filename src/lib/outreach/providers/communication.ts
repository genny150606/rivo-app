/**
 * RIVO OUTREACH — Modular Communication Providers (`CommunicationProvider`)
 *
 * Every outbound transmission is gated by `OutreachComplianceService.verifyAndAuditOutboundSend`.
 * No provider ever fakes a successful external transmission when credentials are not configured.
 */

import nodemailer from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OutreachChannel, OutreachDeliveryMode, OutreachProspectRecord } from '../types';
import { OutreachComplianceService } from '../compliance';

export interface ChannelStatusInfo {
  channel: OutreachChannel;
  label: string;
  configured: boolean;
  connectionState: 'connected' | 'not_configured' | 'manual_assisted';
  requiredEnvVars: string[];
  policySummary: string;
}

export interface SendMessageParams {
  adminDb: SupabaseClient;
  prospect: OutreachProspectRecord;
  channel: OutreachChannel;
  deliveryMode: OutreachDeliveryMode;
  isHumanApproved: boolean;
  subject?: string;
  content: string;
  variantUsed?: string;
  whatsappTemplateName?: string;
  adminUserId?: string;
}

export interface SendMessageResult {
  success: boolean;
  providerStatus: 'draft' | 'pending_approval' | 'sent' | 'blocked_compliance' | 'failed';
  messageId?: string;
  reason: string;
  manualActionUrl?: string | null;
}

export function getCommunicationChannelsStatus(): ChannelStatusInfo[] {
  const emailConfigured = Boolean(
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
  );
  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
  const instagramConfigured = Boolean(
    process.env.META_IG_ACCESS_TOKEN && process.env.META_IG_BUSINESS_ACCOUNT_ID
  );

  return [
    {
      channel: 'email',
      label: 'Email Commerciale B2B (SMTP / Nodemailer)',
      configured: emailConfigured,
      connectionState: emailConfigured ? 'connected' : 'not_configured',
      requiredEnvVars: ['GMAIL_USER', 'GMAIL_APP_PASSWORD'],
      policySummary:
        'Invio abilitato solo con base giuridica verificata e dicitura di opposizione/opt-out inclusa.',
    },
    {
      channel: 'whatsapp',
      label: 'WhatsApp Business Cloud API (Meta Official)',
      configured: whatsappConfigured,
      connectionState: whatsappConfigured ? 'connected' : 'not_configured',
      requiredEnvVars: ['WHATSAPP_CLOUD_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'],
      policySummary:
        'Richiede opt-in verificato del destinatario e utilizzo di Template Approvati Meta fuori dalla finestra di 24h.',
    },
    {
      channel: 'instagram',
      label: 'Instagram Messaging API (Meta Official + Manual Assist)',
      configured: instagramConfigured,
      connectionState: instagramConfigured ? 'connected' : 'manual_assisted',
      requiredEnvVars: ['META_IG_ACCESS_TOKEN', 'META_IG_BUSINESS_ACCOUNT_ID'],
      policySummary:
        'Invio API consentito solo per conversazioni avviate dall’utente. Per i profili pubblici non raggiungibili via API è disponibile il passaggio manuale assistito.',
    },
    {
      channel: 'manual',
      label: 'Contatto Diretto Manuale (Telefono / Visita / DM 1-a-1)',
      configured: true,
      connectionState: 'connected',
      requiredEnvVars: [],
      policySummary:
        'Tracciamento strutturato nel CRM delle interazioni dirette effettuate dall’amministratore.',
    },
  ];
}

/**
 * Central dispatcher that enforces `OutreachComplianceService` before invoking any channel provider.
 */
export async function dispatchOutreachCommunication(
  params: SendMessageParams
): Promise<SendMessageResult> {
  const {
    adminDb,
    prospect,
    channel,
    deliveryMode,
    isHumanApproved,
    subject,
    content,
    variantUsed,
    whatsappTemplateName,
    adminUserId,
  } = params;

  // 1. Draft Mode: save immediately without external send
  if (deliveryMode === 'draft') {
    const { data: msg } = await adminDb
      .from('outreach_messages')
      .insert({
        prospect_id: prospect.id,
        channel,
        direction: 'outbound',
        delivery_mode: 'draft',
        subject: subject || null,
        content,
        variant_used: variantUsed || null,
        provider_status: 'draft',
      })
      .select('id')
      .single();

    return {
      success: true,
      providerStatus: 'draft',
      messageId: msg?.id,
      reason: 'Messaggio salvato in modalità Bozza (Draft Mode). Nessun invio esterno effettuato.',
    };
  }

  // 2. Mandatory Compliance Gate (NEVER bypassed)
  const complianceCheck = await OutreachComplianceService.verifyAndAuditOutboundSend(adminDb, {
    prospectId: prospect.id,
    channel,
    deliveryMode,
    isHumanApproved,
    adminUserId,
  });

  if (!complianceCheck.allowed) {
    const blockedStatus =
      complianceCheck.status === 'blocked_requires_approval'
        ? 'pending_approval'
        : 'blocked_compliance';

    const { data: msg } = await adminDb
      .from('outreach_messages')
      .insert({
        prospect_id: prospect.id,
        channel,
        direction: 'outbound',
        delivery_mode: deliveryMode,
        subject: subject || null,
        content,
        variant_used: variantUsed || null,
        provider_status: blockedStatus,
        provider_error: complianceCheck.reason,
      })
      .select('id')
      .single();

    return {
      success: false,
      providerStatus: blockedStatus,
      messageId: msg?.id,
      reason: complianceCheck.reason,
      manualActionUrl:
        channel === 'instagram' && prospect.instagram_url ? prospect.instagram_url : null,
    };
  }

  // 3. Ensure conversation record exists
  let conversationId: string | null = null;
  const { data: existingConv } = await adminDb
    .from('outreach_conversations')
    .select('id')
    .eq('prospect_id', prospect.id)
    .eq('channel', channel)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingConv?.id) {
    conversationId = existingConv.id;
  } else {
    const { data: createdConv } = await adminDb
      .from('outreach_conversations')
      .insert({
        prospect_id: prospect.id,
        channel,
        conversation_status: 'awaiting_reply',
      })
      .select('id')
      .single();
    conversationId = createdConv?.id || null;
  }

  // 4. Execute channel-specific transmission
  if (channel === 'manual') {
    const nowIso = new Date().toISOString();
    const { data: msg } = await adminDb
      .from('outreach_messages')
      .insert({
        prospect_id: prospect.id,
        conversation_id: conversationId,
        channel: 'manual',
        direction: 'outbound',
        delivery_mode: 'manual',
        subject: subject || 'Contatto manuale registrato',
        content,
        variant_used: variantUsed || null,
        provider_status: 'sent',
        sent_at: nowIso,
      })
      .select('id')
      .single();

    await adminDb
      .from('outreach_prospects')
      .update({ commercial_status: 'in_conversazione', updated_at: nowIso })
      .eq('id', prospect.id);

    return {
      success: true,
      providerStatus: 'sent',
      messageId: msg?.id,
      reason: 'Contatto manuale 1-a-1 registrato nello storico comunicazioni.',
      manualActionUrl: prospect.instagram_url || prospect.website || null,
    };
  }

  if (channel === 'email') {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      const errReason =
        'Provider Email non configurato sul server: imposta GMAIL_USER e GMAIL_APP_PASSWORD nelle variabili d’ambiente.';
      const { data: msg } = await adminDb
        .from('outreach_messages')
        .insert({
          prospect_id: prospect.id,
          conversation_id: conversationId,
          channel: 'email',
          direction: 'outbound',
          delivery_mode: deliveryMode,
          subject: subject || `Informazioni RIVO per ${prospect.business_name}`,
          content,
          variant_used: variantUsed || null,
          provider_status: 'failed',
          provider_error: errReason,
        })
        .select('id')
        .single();

      return {
        success: false,
        providerStatus: 'failed',
        messageId: msg?.id,
        reason: errReason,
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
      });

      const footer = `\n\n---\nInformativa Privacy & Opposizione (GDPR): Ricevi questa comunicazione informativa B2B all'indirizzo pubblico aziendale di ${prospect.business_name}. Se non desideri ricevere ulteriori comunicazioni da RIVO, rispondi con "NON CONTATTARE" per l'immediata iscrizione nella lista di soppressione.`;

      await transporter.sendMail({
        from: `RIVO Business <${gmailUser}>`,
        to: [prospect.business_email!],
        subject: subject || `Proposta RIVO per ${prospect.business_name}`,
        text: `${content}${footer}`,
      });

      const nowIso = new Date().toISOString();
      const { data: msg } = await adminDb
        .from('outreach_messages')
        .insert({
          prospect_id: prospect.id,
          conversation_id: conversationId,
          channel: 'email',
          direction: 'outbound',
          delivery_mode: deliveryMode,
          subject: subject || `Proposta RIVO per ${prospect.business_name}`,
          content,
          variant_used: variantUsed || null,
          provider_status: 'sent',
          sent_at: nowIso,
        })
        .select('id')
        .single();

      await adminDb
        .from('outreach_prospects')
        .update({ commercial_status: 'in_conversazione', updated_at: nowIso })
        .eq('id', prospect.id);

      return {
        success: true,
        providerStatus: 'sent',
        messageId: msg?.id,
        reason: `Email inviata con successo a ${prospect.business_email}.`,
      };
    } catch (err: any) {
      const errReason = `Errore SMTP durante l'invio: ${err?.message || 'connessione rifiutata'}`;
      await adminDb.from('outreach_messages').insert({
        prospect_id: prospect.id,
        conversation_id: conversationId,
        channel: 'email',
        direction: 'outbound',
        delivery_mode: deliveryMode,
        subject: subject || null,
        content,
        variant_used: variantUsed || null,
        provider_status: 'failed',
        provider_error: errReason,
      });
      return {
        success: false,
        providerStatus: 'failed',
        reason: errReason,
      };
    }
  }

  if (channel === 'whatsapp') {
    const waToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!waToken || !waPhoneId) {
      const errReason =
        'WhatsApp Cloud API non configurata: imposta WHATSAPP_CLOUD_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nelle variabili d’ambiente.';
      await adminDb.from('outreach_messages').insert({
        prospect_id: prospect.id,
        conversation_id: conversationId,
        channel: 'whatsapp',
        direction: 'outbound',
        delivery_mode: deliveryMode,
        content,
        variant_used: variantUsed || null,
        provider_status: 'failed',
        provider_error: errReason,
      });
      return {
        success: false,
        providerStatus: 'failed',
        reason: errReason,
      };
    }

    const cleanPhone = (prospect.business_phone || '').replace(/[^0-9]/g, '');
    try {
      const bodyPayload = whatsappTemplateName
        ? {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: whatsappTemplateName,
              language: { code: 'it' },
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: content },
          };

      const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waToken}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const nowIso = new Date().toISOString();
      const { data: msg } = await adminDb
        .from('outreach_messages')
        .insert({
          prospect_id: prospect.id,
          conversation_id: conversationId,
          channel: 'whatsapp',
          direction: 'outbound',
          delivery_mode: deliveryMode,
          content,
          variant_used: variantUsed || null,
          provider_status: 'sent',
          sent_at: nowIso,
        })
        .select('id')
        .single();

      return {
        success: true,
        providerStatus: 'sent',
        messageId: msg?.id,
        reason: 'Messaggio inviato tramite WhatsApp Business Cloud API ufficiale.',
      };
    } catch (err: any) {
      const errReason = `Errore WhatsApp Cloud API: ${err?.message || 'invio rifiutato'}`;
      await adminDb.from('outreach_messages').insert({
        prospect_id: prospect.id,
        conversation_id: conversationId,
        channel: 'whatsapp',
        direction: 'outbound',
        delivery_mode: deliveryMode,
        content,
        variant_used: variantUsed || null,
        provider_status: 'failed',
        provider_error: errReason,
      });
      return {
        success: false,
        providerStatus: 'failed',
        reason: errReason,
      };
    }
  }

  // Instagram Official API (only reached if open_user_initiated window was verified)
  const igToken = process.env.META_IG_ACCESS_TOKEN;
  const igAccountId = process.env.META_IG_BUSINESS_ACCOUNT_ID;
  if (!igToken || !igAccountId) {
    const errReason =
      'Credenziali Meta Instagram Graph API (META_IG_ACCESS_TOKEN / META_IG_BUSINESS_ACCOUNT_ID) non configurate.';
    await adminDb.from('outreach_messages').insert({
      prospect_id: prospect.id,
      conversation_id: conversationId,
      channel: 'instagram',
      direction: 'outbound',
      delivery_mode: deliveryMode,
      content,
      variant_used: variantUsed || null,
      provider_status: 'failed',
      provider_error: errReason,
    });
    return {
      success: false,
      providerStatus: 'failed',
      reason: errReason,
      manualActionUrl: prospect.instagram_url,
    };
  }

  return {
    success: false,
    providerStatus: 'failed',
    reason: 'Recipient IGSID non associato alla conversazione inbound.',
    manualActionUrl: prospect.instagram_url,
  };
}

/**
 * RIVO OUTREACH — Centralized GDPR, Privacy & Platform Policy Compliance Service
 * (`OutreachComplianceService`)
 *
 * Every outbound communication MUST pass through `OutreachComplianceService` before
 * any provider is invoked. Publicly visible phone numbers or social handles do NOT
 * constitute automatic marketing authorization.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LegalBasisType,
  OutreachChannel,
  OutreachContactPermissionRecord,
  OutreachDeliveryMode,
  OutreachProspectRecord,
} from './types';

export interface ComplianceEvaluationInput {
  prospect: Pick<
    OutreachProspectRecord,
    'id' | 'business_name' | 'commercial_status' | 'business_email' | 'business_phone' | 'instagram_url' | 'merged_into_id'
  >;
  channel: OutreachChannel;
  deliveryMode: OutreachDeliveryMode;
  isHumanApproved: boolean;
  permissions: OutreachContactPermissionRecord[];
  suppressions: { channel: string; contact_identifier?: string | null; reason: string }[];
  openConversationStatus?: 'open' | 'open_user_initiated' | 'awaiting_reply' | 'replied' | 'closed' | 'opted_out' | null;
}

export interface ComplianceEvaluationResult {
  allowed: boolean;
  status: 'allowed' | 'saved_as_draft' | 'blocked_suppression' | 'blocked_missing_permission' | 'blocked_channel_policy' | 'blocked_requires_approval';
  reason: string;
  matchedPermissionId?: string;
  legalBasis?: LegalBasisType;
}

export class OutreachComplianceService {
  /**
   * Pure deterministic compliance evaluation (testable in unit tests and used by DB gate).
   */
  static evaluateSendEligibility(input: ComplianceEvaluationInput): ComplianceEvaluationResult {
    const {
      prospect,
      channel,
      deliveryMode,
      isHumanApproved,
      permissions,
      suppressions,
      openConversationStatus,
    } = input;

    // 1. Draft mode never transmits externally
    if (deliveryMode === 'draft') {
      return {
        allowed: false,
        status: 'saved_as_draft',
        reason: 'Modalità Bozza (Draft Mode): il messaggio viene salvato senza alcun invio esterno.',
      };
    }

    // 2. Check prospect suppression status or merged state
    if (prospect.merged_into_id) {
      return {
        allowed: false,
        status: 'blocked_suppression',
        reason: 'Bloccato: questa scheda prospect è stata unita a un’altra scheda.',
      };
    }

    if (prospect.commercial_status === 'non_contattare' || openConversationStatus === 'opted_out') {
      return {
        allowed: false,
        status: 'blocked_suppression',
        reason: 'Bloccato: il prospect è nello stato "Non contattare" o ha esercitato l’opt-out.',
      };
    }

    // 3. Check suppression list for this prospect or contact identifier
    const contactTarget =
      channel === 'email'
        ? prospect.business_email
        : channel === 'whatsapp'
        ? prospect.business_phone
        : channel === 'instagram'
        ? prospect.instagram_url
        : null;

    const matchingSuppression = suppressions.find(
      (s) =>
        s.channel === 'all' ||
        s.channel === channel ||
        (contactTarget &&
          s.contact_identifier &&
          s.contact_identifier.toLowerCase() === contactTarget.toLowerCase())
    );

    if (matchingSuppression) {
      return {
        allowed: false,
        status: 'blocked_suppression',
        reason: `Bloccato dalla Lista di Soppressione (${matchingSuppression.reason}).`,
      };
    }

    // 4. Approval Mode requires explicit human approval
    if (deliveryMode === 'approval' && !isHumanApproved) {
      return {
        allowed: false,
        status: 'blocked_requires_approval',
        reason: 'Modalità Approvazione: è richiesta l’approvazione esplicita dell’amministratore prima dell’invio.',
      };
    }

    // 5. Locate active permission for the requested channel
    const activePermission = permissions.find(
      (p) =>
        p.channel === channel &&
        p.permission_status === 'granted' &&
        !p.withdrawn_at
    );

    if (!activePermission) {
      return {
        allowed: false,
        status: 'blocked_missing_permission',
        reason: `Bloccato: nessuna autorizzazione o base giuridica attiva registrata per il canale "${channel}". Un contatto pubblicamente visibile online non costituisce consenso automatico al marketing.`,
      };
    }

    // 6. Channel-specific platform policy enforcement
    if (channel === 'instagram') {
      // Meta Platform Terms: Automated DMs cannot be sent to cold profiles collected from directories.
      // Only allowed if the user initiated the conversation within the messaging window.
      if (
        openConversationStatus !== 'open_user_initiated' ||
        activePermission.legal_basis !== 'user_initiated_inbound'
      ) {
        return {
          allowed: false,
          status: 'blocked_channel_policy',
          reason:
            'Bloccato da Policy Meta/Instagram: l’invio API su Instagram è consentito solo in risposta a conversazioni avviate dall’utente nella finestra di messaggistica ufficiale. Usa il flusso manuale assistito.',
        };
      }
    }

    if (channel === 'whatsapp') {
      // WhatsApp Business Messaging Policy: requires opt-in consent or user-initiated inbound window.
      const validWaBases: LegalBasisType[] = [
        'explicit_consent',
        'user_initiated_inbound',
        'pre_contractual_request',
      ];
      if (!validWaBases.includes(activePermission.legal_basis)) {
        return {
          allowed: false,
          status: 'blocked_channel_policy',
          reason:
            'Bloccato da WhatsApp Business Policy: per inviare messaggi su WhatsApp è richiesto un opt-in esplicito verificato o una richiesta inbound dell’utente.',
        };
      }
      if (!prospect.business_phone) {
        return {
          allowed: false,
          status: 'blocked_channel_policy',
          reason: 'Numero telefonico aziendale mancante per il canale WhatsApp.',
        };
      }
    }

    if (channel === 'email') {
      const validEmailBases: LegalBasisType[] = [
        'explicit_consent',
        'pre_contractual_request',
        'documented_b2b_legitimate_interest',
        'user_initiated_inbound',
      ];
      if (!validEmailBases.includes(activePermission.legal_basis)) {
        return {
          allowed: false,
          status: 'blocked_channel_policy',
          reason:
            'Bloccato da Policy Email/GDPR: base giuridica non idonea per l’invio di comunicazioni commerciali via email.',
        };
      }
      if (!prospect.business_email) {
        return {
          allowed: false,
          status: 'blocked_channel_policy',
          reason: 'Indirizzo email aziendale mancante per questo prospect.',
        };
      }
    }

    return {
      allowed: true,
      status: 'allowed',
      reason: `Invio autorizzato (Base giuridica: ${activePermission.legal_basis}, Evidenza: ${activePermission.evidence_reference}).`,
      matchedPermissionId: activePermission.id,
      legalBasis: activePermission.legal_basis,
    };
  }

  /**
   * Database-backed compliance gate executed immediately before any outbound send.
   */
  static async verifyAndAuditOutboundSend(
    adminDb: SupabaseClient,
    params: {
      prospectId: string;
      channel: OutreachChannel;
      deliveryMode: OutreachDeliveryMode;
      isHumanApproved: boolean;
      adminUserId?: string;
    }
  ): Promise<ComplianceEvaluationResult> {
    const [{ data: prospect }, { data: permissions }, { data: suppressions }, { data: conv }] =
      await Promise.all([
        adminDb.from('outreach_prospects').select('*').eq('id', params.prospectId).maybeSingle(),
        adminDb
          .from('outreach_contact_permissions')
          .select('*')
          .eq('prospect_id', params.prospectId),
        adminDb
          .from('outreach_suppressions')
          .select('*')
          .eq('prospect_id', params.prospectId),
        adminDb
          .from('outreach_conversations')
          .select('conversation_status')
          .eq('prospect_id', params.prospectId)
          .eq('channel', params.channel)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (!prospect) {
      return {
        allowed: false,
        status: 'blocked_missing_permission',
        reason: 'Prospect non trovato nel database.',
      };
    }

    const evaluation = this.evaluateSendEligibility({
      prospect,
      channel: params.channel,
      deliveryMode: params.deliveryMode,
      isHumanApproved: params.isHumanApproved,
      permissions: (permissions || []) as OutreachContactPermissionRecord[],
      suppressions: suppressions || [],
      openConversationStatus: conv?.conversation_status || null,
    });

    await adminDb.from('outreach_activity_logs').insert({
      prospect_id: params.prospectId,
      action: evaluation.allowed ? 'compliance_check_passed' : 'compliance_check_blocked',
      metadata: {
        channel: params.channel,
        deliveryMode: params.deliveryMode,
        status: evaluation.status,
        reason: evaluation.reason,
        legalBasis: evaluation.legalBasis || null,
      },
      admin_user_id: params.adminUserId || null,
    });

    return evaluation;
  }

  /**
   * Immediately records an opt-out or opposition (Art. 21 GDPR), suppresses future contact,
   * withdraws active permissions, and sets prospect status to `non_contattare`.
   */
  static async recordOptOutAndSuppress(
    adminDb: SupabaseClient,
    params: {
      prospectId: string;
      channel: OutreachChannel | 'all';
      reason: string;
      contactIdentifier?: string | null;
      adminUserId?: string;
    }
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    await Promise.all([
      adminDb.from('outreach_suppressions').insert({
        prospect_id: params.prospectId,
        channel: params.channel,
        contact_identifier: params.contactIdentifier || null,
        reason: params.reason,
      }),
      adminDb
        .from('outreach_contact_permissions')
        .update({
          permission_status: 'withdrawn',
          withdrawn_at: nowIso,
        })
        .eq('prospect_id', params.prospectId),
      adminDb
        .from('outreach_prospects')
        .update({
          commercial_status: 'non_contattare',
          updated_at: nowIso,
        })
        .eq('id', params.prospectId),
      adminDb.from('outreach_activity_logs').insert({
        prospect_id: params.prospectId,
        action: 'opt_out_suppression_recorded',
        metadata: {
          channel: params.channel,
          reason: params.reason,
        },
        admin_user_id: params.adminUserId || null,
      }),
    ]);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import {
  analyzeProspectWithAI,
  generatePersonalizedSalesPitches,
  validatePitchAgainstHallucinations,
} from '@/lib/outreach/ai-intelligence';
import { loadActiveKnowledgeBase, processOutreachJob } from '@/lib/outreach/jobs';
import { inspectPublicWebsiteMetadata } from '@/lib/outreach/providers/discovery';
import type { OutreachProspectRecord } from '@/lib/outreach/types';
import { isValidUUID } from '@/lib/security';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb, user } = auth;

  try {
    const body = await request.json();
    const action = String(body.action || '');
    const kb = await loadActiveKnowledgeBase(adminDb);

    // 1. Single or Batch AI Business Intelligence Analysis
    if (action === 'analyze') {
      const prospectIds: string[] = Array.isArray(body.prospect_ids)
        ? body.prospect_ids
        : body.prospect_id
        ? [body.prospect_id]
        : [];

      if (prospectIds.length === 0) {
        return NextResponse.json(
          { error: 'Specifica almeno un prospect da sottoporre ad analisi AI.' },
          { status: 400 }
        );
      }

      if (prospectIds.length > 1) {
        const { data: job } = await adminDb
          .from('outreach_jobs')
          .insert({
            job_type: 'ai_analysis',
            status: 'queued',
            progress: 0,
            payload: { prospectIds },
            created_by: user.id,
          })
          .select('*')
          .single();

        const completedJob = job ? await processOutreachJob(adminDb, job.id, user.id) : null;
        return NextResponse.json({ job: completedJob });
      }

      const pid = prospectIds[0];
      if (!isValidUUID(pid)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      const { data: pRow } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .eq('id', pid)
        .maybeSingle();

      if (!pRow) {
        return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
      }

      let prospect = pRow as OutreachProspectRecord;

      // Inspect website metadata if website exists and was not yet inspected
      if (prospect.website && !prospect.digital_signals?.inspectedAt) {
        const signals = await inspectPublicWebsiteMetadata(prospect.website);
        prospect = {
          ...prospect,
          digital_signals: signals,
          description: prospect.description || signals.websiteDescription || null,
        };
      }

      const analysis = await analyzeProspectWithAI(prospect, kb);

      const { data: updatedProspect } = await adminDb
        .from('outreach_prospects')
        .update({
          digital_signals: prospect.digital_signals,
          description: prospect.description,
          lead_score: analysis.totalLeadScore,
          confidence_score: analysis.confidenceScore,
          ai_analysis: analysis,
          commercial_status:
            prospect.commercial_status === 'nuovo' ||
            prospect.commercial_status === 'da_analizzare'
              ? 'analizzato'
              : prospect.commercial_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospect.id)
        .select('*')
        .single();

      await Promise.all([
        adminDb.from('outreach_ai_generations').insert({
          prospect_id: prospect.id,
          generation_type: 'business_intelligence',
          prompt_version: 'v1.0',
          generated_content: analysis,
          model: analysis.modelUsed,
        }),
        adminDb.from('outreach_activity_logs').insert({
          prospect_id: prospect.id,
          action: 'ai_analysis_completed',
          metadata: {
            lead_score: analysis.totalLeadScore,
            confidence_score: analysis.confidenceScore,
            model: analysis.modelUsed,
          },
          admin_user_id: user.id,
        }),
      ]);

      return NextResponse.json({
        prospect: updatedProspect,
        analysis,
      });
    }

    // 2. Generate 3-Variant Personalized Sales Pitch
    if (action === 'generate_pitch') {
      const prospectId = String(body.prospect_id || '');
      const customFocusNote = body.custom_focus_note ? String(body.custom_focus_note) : undefined;

      if (!isValidUUID(prospectId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      const { data: pRow } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle();

      if (!pRow) {
        return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
      }

      const prospect = pRow as OutreachProspectRecord;
      const pitchPayload = await generatePersonalizedSalesPitches(prospect, kb, customFocusNote);

      const { data: genRecord } = await adminDb
        .from('outreach_ai_generations')
        .insert({
          prospect_id: prospect.id,
          generation_type: 'sales_pitch',
          prompt_version: pitchPayload.promptVersion,
          generated_content: pitchPayload,
          model: pitchPayload.modelUsed,
          approved: false,
        })
        .select('*')
        .single();

      await adminDb.from('outreach_activity_logs').insert({
        prospect_id: prospect.id,
        action: 'ai_pitch_variants_generated',
        metadata: {
          generation_id: genRecord?.id,
          model: pitchPayload.modelUsed,
          hallucination_check_passed: pitchPayload.hallucinationCheckPassed,
        },
        admin_user_id: user.id,
      });

      return NextResponse.json({
        generation: genRecord,
        pitchPayload,
      });
    }

    // 3. Edit, Save & Approve a Message Variant
    if (action === 'approve_pitch') {
      const generationId = String(body.generation_id || '');
      const prospectId = String(body.prospect_id || '');
      const selectedVariant = String(body.variant || 'A_professional');
      const editedSubject = String(body.subject || '').trim();
      const editedBody = String(body.content || '').trim();
      const channel = String(body.channel || 'email');

      if (!isValidUUID(prospectId) || !editedBody) {
        return NextResponse.json(
          { error: 'Contenuto del messaggio e prospect ID obbligatori.' },
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

      const check = validatePitchAgainstHallucinations(
        editedBody,
        pRow as OutreachProspectRecord
      );

      if (!check.valid) {
        return NextResponse.json(
          {
            error: `Bloccato dal controllo anti-allucinazione: ${check.notes.join(' ')}`,
          },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      if (isValidUUID(generationId)) {
        await adminDb
          .from('outreach_ai_generations')
          .update({
            approved: true,
            approved_variant: selectedVariant,
            approved_by: user.id,
            approved_at: nowIso,
          })
          .eq('id', generationId);
      }

      // Save as approved draft in outreach_messages
      const { data: savedMsg } = await adminDb
        .from('outreach_messages')
        .insert({
          prospect_id: prospectId,
          channel,
          direction: 'outbound',
          delivery_mode: 'approval',
          subject: editedSubject || `Proposta RIVO per ${pRow.business_name}`,
          content: editedBody,
          variant_used: selectedVariant,
          provider_status: 'approved',
        })
        .select('*')
        .single();

      await adminDb.from('outreach_activity_logs').insert({
        prospect_id: prospectId,
        action: 'pitch_approved_by_admin',
        metadata: {
          variant: selectedVariant,
          channel,
          message_id: savedMsg?.id,
        },
        admin_user_id: user.id,
      });

      return NextResponse.json({
        success: true,
        message: savedMsg,
        hallucinationNotes: check.notes,
      });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nel servizio AI Intelligence.' },
      { status: 500 }
    );
  }
}

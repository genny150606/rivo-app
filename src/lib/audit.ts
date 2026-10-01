import { createClient } from '@supabase/supabase-js';

export interface AuditActor {
  id?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface LogAuditParams {
  organizationId: string;
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates an immutable audit log entry in public.audit_logs
 * Uses the Supabase Service Role Key to bypass RLS and guarantee logging integrity.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('[Audit] Skipping audit log: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
    return false;
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await adminClient.from('audit_logs').insert({
      organization_id: params.organizationId,
      actor_id: params.actor.id || null,
      actor_name: params.actor.email || null,
      actor_role: params.actor.role || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || {},
      ip_address: params.ipAddress || null,
    });

    if (error) {
      console.error('[Audit] Error inserting audit log:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Audit] Unexpected error logging audit event:', err);
    return false;
  }
}

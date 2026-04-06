import { createSupabaseServerClient } from './supabase/server'

export type AuditAction =
  | 'user.verify_toggle'
  | 'user.demote'
  | 'review.delete'
  | 'verification.update'

interface AuditEntry {
  action: AuditAction
  targetId: string
  details?: Record<string, unknown>
}

/**
 * Log an admin action to the audit_logs table.
 * Fire-and-forget — must never block the calling action.
 */
export function logAudit(entry: AuditEntry): void {
  const supabase = createSupabaseServerClient()
  supabase
    .from('audit_logs')
    .insert({
      action: entry.action,
      target_id: entry.targetId,
      details: entry.details ?? {},
      created_at: new Date().toISOString(),
    })
    .then(({ error: _error }) => {
      // Silent — audit failure must never break the admin action
      // The table may not exist yet; this is safe to deploy before the migration
    })
}

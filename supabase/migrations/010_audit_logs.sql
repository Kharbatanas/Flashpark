-- Audit log for admin actions (security requirement)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by action type and time
CREATE INDEX idx_audit_logs_action_created ON audit_logs (action, created_at DESC);

-- RLS: only service role can read/write (admin backend only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- No policies = deny all non-service-role access

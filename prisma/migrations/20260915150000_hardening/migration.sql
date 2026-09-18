-- ─────────────────────────────────────────────────────────────────
-- Hardening migration
-- Enforces at the DB level the guarantees the M9 design depends on.
-- ─────────────────────────────────────────────────────────────────

-- 1. At most ONE non-terminal payment per job.
-- This is the concurrency guard for protected-payment checkout.
-- Two simultaneous "Pay" clicks cannot create two payment rows.
CREATE UNIQUE INDEX payments_one_active_per_job
  ON payments (job_id)
  WHERE status IN ('pending', 'secured', 'release_pending');

-- 2. setting_change_log is append-only.
CREATE OR REPLACE FUNCTION prevent_setting_change_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'setting_change_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER setting_change_log_immutable
  BEFORE UPDATE OR DELETE ON setting_change_log
  FOR EACH ROW EXECUTE FUNCTION prevent_setting_change_log_mutation();

-- 3. audit_logs is append-only.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- 4. Readiness singleton row so the admin UI never has to upsert.
-- updated_at is required (Prisma @updatedAt maps to NOT NULL).
INSERT INTO protected_payment_readiness (id, updated_at)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;
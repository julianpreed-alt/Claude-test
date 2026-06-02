-- Phase GDPR Migration: Consent tracking, policy versioning, audit log
-- Run this in the Supabase SQL Editor

-- Policy versions table — tracks versions of T&Cs and Privacy Policy
CREATE TABLE IF NOT EXISTS public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL CHECK (policy_type IN ('terms', 'privacy')),
  version text NOT NULL,
  content_hash text,
  effective_date timestamptz NOT NULL DEFAULT now(),
  summary_of_changes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(policy_type, version)
);

-- Insert initial versions
INSERT INTO public.policy_versions (policy_type, version, effective_date, summary_of_changes)
VALUES
  ('terms', '1.0', now(), 'Initial version'),
  ('privacy', '1.0', now(), 'Initial version')
ON CONFLICT (policy_type, version) DO NOTHING;

-- Consents table — records each consent action with timestamp and policy version
CREATE TABLE IF NOT EXISTS public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'data_processing', 'special_category')),
  policy_version text NOT NULL,
  given_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_user_type ON public.consents (user_id, consent_type);

-- Audit log table — retained after account deletion for legal compliance
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);

-- Enable RLS
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: users can read their own consents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consents' AND policyname = 'Users can view own consents') THEN
    CREATE POLICY "Users can view own consents" ON public.consents
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS: policy versions are public read
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'policy_versions' AND policyname = 'Anyone can read policy versions') THEN
    CREATE POLICY "Anyone can read policy versions" ON public.policy_versions
      FOR SELECT USING (true);
  END IF;
END $$;

-- RLS: audit log only accessible by service role (admin)
-- No user-facing policy needed — accessed via service role key only

-- Add accepted_terms_version and accepted_privacy_version to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS accepted_terms_version text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS accepted_privacy_version text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('consents', 'policy_versions', 'audit_log')
ORDER BY table_name;

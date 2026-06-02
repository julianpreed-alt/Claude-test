-- Phase B Migration: Ensure all assessment and message columns exist
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
--
-- This is safe to run multiple times — it only adds columns that don't exist yet.

-- Add Phase B columns to assessments table
DO $$
BEGIN
  -- questionnaire_responses: raw item responses as JSON
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='questionnaire_responses') THEN
    ALTER TABLE public.assessments ADD COLUMN questionnaire_responses jsonb;
  END IF;

  -- questionnaire_scores: computed dimension scores with confidence
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='questionnaire_scores') THEN
    ALTER TABLE public.assessments ADD COLUMN questionnaire_scores jsonb;
  END IF;

  -- phase1_system_prompt: stored at creation for reproducibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase1_system_prompt') THEN
    ALTER TABLE public.assessments ADD COLUMN phase1_system_prompt text;
  END IF;

  -- phase2_system_prompt: stored when Phase 2 starts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase2_system_prompt') THEN
    ALTER TABLE public.assessments ADD COLUMN phase2_system_prompt text;
  END IF;

  -- phase1_handoff: structured handoff extracted from Phase 1 completion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase1_handoff') THEN
    ALTER TABLE public.assessments ADD COLUMN phase1_handoff text;
  END IF;

  -- phase1_report: user-facing personality report
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase1_report') THEN
    ALTER TABLE public.assessments ADD COLUMN phase1_report text;
  END IF;

  -- phase2_report: unified career profile
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase2_report') THEN
    ALTER TABLE public.assessments ADD COLUMN phase2_report text;
  END IF;

  -- phase1_pdf_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase1_pdf_url') THEN
    ALTER TABLE public.assessments ADD COLUMN phase1_pdf_url text;
  END IF;

  -- phase2_pdf_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase2_pdf_url') THEN
    ALTER TABLE public.assessments ADD COLUMN phase2_pdf_url text;
  END IF;

  -- intake_data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='intake_data') THEN
    ALTER TABLE public.assessments ADD COLUMN intake_data jsonb;
  END IF;

  -- phase1_credit_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase1_credit_id') THEN
    ALTER TABLE public.assessments ADD COLUMN phase1_credit_id uuid;
  END IF;

  -- phase2_credit_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assessments' AND column_name='phase2_credit_id') THEN
    ALTER TABLE public.assessments ADD COLUMN phase2_credit_id uuid;
  END IF;
END $$;

-- Ensure messages table has the correct columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='messages' AND column_name='phase') THEN
    ALTER TABLE public.messages ADD COLUMN phase integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='messages' AND column_name='sequence_number') THEN
    ALTER TABLE public.messages ADD COLUMN sequence_number integer DEFAULT 0;
  END IF;
END $$;

-- Add index on messages for efficient history loading
CREATE INDEX IF NOT EXISTS idx_messages_assessment_phase_seq 
  ON public.messages (assessment_id, phase, sequence_number);

-- Add index on credits for efficient lookup
CREATE INDEX IF NOT EXISTS idx_credits_user_status 
  ON public.credits (user_id, status);

-- Add index on assessments for user lookup
CREATE INDEX IF NOT EXISTS idx_assessments_user_status 
  ON public.assessments (user_id, status);

-- Ensure RLS is enabled on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see their own messages (via assessment ownership)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view own messages') THEN
    CREATE POLICY "Users can view own messages" ON public.messages
      FOR SELECT USING (
        assessment_id IN (
          SELECT id FROM public.assessments WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Verify: list all columns on the assessments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'assessments'
ORDER BY ordinal_position;

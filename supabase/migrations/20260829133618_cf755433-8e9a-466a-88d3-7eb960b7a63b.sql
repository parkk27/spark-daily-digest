ALTER TABLE public.decision_records
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS action_owner text,
  ADD COLUMN IF NOT EXISTS action_due_date date,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_notes text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.decision_record_history
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS action_owner text,
  ADD COLUMN IF NOT EXISTS action_due_date date,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_notes text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
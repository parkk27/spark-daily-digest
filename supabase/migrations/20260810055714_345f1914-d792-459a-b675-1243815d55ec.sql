ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS signal_type TEXT
    CHECK (signal_type IN ('competitive','customer','technology','market','commercial','regulatory','ecosystem'))
    DEFAULT 'market',
  ADD COLUMN IF NOT EXISTS polarity TEXT
    CHECK (polarity IN ('opportunity','threat','neutral'))
    DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.decision_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('investigate','positioning','customer_research','monitor','no_action')),
  reason TEXT,
  stakeholders TEXT[] NOT NULL DEFAULT '{}',
  next_step TEXT,
  review_date DATE,
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating','in_progress','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recommendation_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_records TO authenticated;
GRANT ALL ON public.decision_records TO service_role;
ALTER TABLE public.decision_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own decision records" ON public.decision_records
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_decision_records_updated BEFORE UPDATE ON public.decision_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_decision_records_user ON public.decision_records (user_id);
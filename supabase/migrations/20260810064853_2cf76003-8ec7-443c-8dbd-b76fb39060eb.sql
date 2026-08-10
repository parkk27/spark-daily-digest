-- 1. Stable signal identity
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS signal_key text;

UPDATE public.recommendations
SET signal_key = lower(coalesce(related_vendor, 'unknown')) || ':' ||
  regexp_replace(regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
WHERE signal_key IS NULL;

-- de-duplicate before unique index
DELETE FROM public.recommendations a
USING public.recommendations b
WHERE a.ctid < b.ctid AND a.date = b.date AND a.signal_key = b.signal_key;

ALTER TABLE public.recommendations ALTER COLUMN signal_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS recommendations_date_signal_key_uidx
  ON public.recommendations (date, signal_key);

-- 2. Decisions survive recommendation regeneration
ALTER TABLE public.decision_records ADD COLUMN IF NOT EXISTS signal_key text;

UPDATE public.decision_records d
SET signal_key = r.signal_key
FROM public.recommendations r
WHERE r.id = d.recommendation_id AND d.signal_key IS NULL;

ALTER TABLE public.decision_records ALTER COLUMN recommendation_id DROP NOT NULL;
ALTER TABLE public.decision_records DROP CONSTRAINT IF EXISTS decision_records_recommendation_id_fkey;
ALTER TABLE public.decision_records
  ADD CONSTRAINT decision_records_recommendation_id_fkey
  FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_decision_records_signal_key ON public.decision_records (user_id, signal_key);

-- 3. Append-only decision history
CREATE TABLE IF NOT EXISTS public.decision_record_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_record_id uuid REFERENCES public.decision_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_key text,
  recommendation_id uuid,
  decision text NOT NULL,
  reason text,
  stakeholders text[] NOT NULL DEFAULT '{}'::text[],
  next_step text,
  review_date date,
  status text,
  change_reason text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.decision_record_history TO authenticated;
GRANT ALL ON public.decision_record_history TO service_role;
ALTER TABLE public.decision_record_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own decision history" ON public.decision_record_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own decision history" ON public.decision_record_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_decision_history_user_signal
  ON public.decision_record_history (user_id, signal_key, changed_at DESC);

-- 4. Backfill classification for legacy rows (same deterministic rules as the edge function)
WITH cls AS (
  SELECT id,
    lower(title || ' ' || summary) AS hay,
    lower(coalesce(related_vendor,'')) AS src,
    priority
  FROM public.recommendations
  WHERE score_breakdown = '{}'::jsonb
), typed AS (
  SELECT id, hay, src, priority,
    CASE
      WHEN hay ~ 'pricing|cost|tco|serverless|savings' THEN 'commercial'
      WHEN hay ~ 'architecture|design|lessons|migration|case study|benchmark|performance|latency|throughput|photon|agent|ai |ml |llm|copilot|genai' THEN 'technology'
      WHEN hay ~ 'governance|catalog|lineage|security|compliance' THEN 'regulatory'
      WHEN hay ~ 'iceberg|delta|open table|interoperab' THEN 'ecosystem'
      WHEN hay ~ 'customer|adoption|enterprise' THEN 'customer'
      WHEN src ~ 'databricks|aws|google|snowflake' THEN 'competitive'
      ELSE 'market'
    END AS stype,
    (src ~ 'databricks|aws|google|snowflake' AND src !~ 'microsoft|fabric') AS competitor
  FROM cls
)
UPDATE public.recommendations r
SET signal_type = t.stype,
    polarity = CASE WHEN t.competitor THEN 'threat'
                    WHEN t.stype IN ('ecosystem','technology') THEN 'opportunity'
                    ELSE 'neutral' END,
    score_breakdown = jsonb_build_object(
      'strategic_relevance', CASE WHEN t.stype IN ('commercial','technology','ecosystem') THEN 70 ELSE 40 END,
      'customer_impact', CASE WHEN t.stype = 'customer' THEN 90 ELSE 25 END,
      'competitive_intensity', CASE WHEN t.competitor THEN 75 WHEN t.stype = 'competitive' THEN 60 ELSE 20 END,
      'momentum', 35,
      'evidence_confidence', LEAST(95, r.confidence),
      'urgency', CASE t.priority WHEN 'high' THEN 90 WHEN 'medium' THEN 60 ELSE 30 END
    )
FROM typed t
WHERE r.id = t.id;
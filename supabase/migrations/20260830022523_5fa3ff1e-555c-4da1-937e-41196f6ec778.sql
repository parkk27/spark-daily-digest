ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS perspective_id text;

CREATE TABLE IF NOT EXISTS public.perspective_trend_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perspective_id text NOT NULL,
  entity_id text NOT NULL,
  entity_name text NOT NULL,
  entity_kind text NOT NULL DEFAULT 'topic',
  window_start date NOT NULL,
  window_end date NOT NULL,
  current_activity numeric NOT NULL DEFAULT 0,
  baseline_activity numeric NOT NULL DEFAULT 0,
  momentum_percent numeric NOT NULL DEFAULT 0,
  momentum_direction text NOT NULL DEFAULT 'STABLE',
  trend_confidence integer NOT NULL DEFAULT 0,
  top_drivers jsonb NOT NULL DEFAULT '[]'::jsonb,
  strategic_relevance integer NOT NULL DEFAULT 0,
  competitive_intensity integer NOT NULL DEFAULT 0,
  impact_score integer NOT NULL DEFAULT 0,
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.perspective_trend_snapshots TO authenticated;
GRANT ALL ON public.perspective_trend_snapshots TO service_role;

ALTER TABLE public.perspective_trend_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trend snapshots readable by authenticated"
ON public.perspective_trend_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role writes trend snapshots"
ON public.perspective_trend_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS perspective_trend_snapshots_unique
ON public.perspective_trend_snapshots (perspective_id, entity_id, window_end);

CREATE INDEX IF NOT EXISTS perspective_trend_snapshots_lookup
ON public.perspective_trend_snapshots (perspective_id, window_end DESC);
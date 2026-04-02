CREATE TABLE public.spark_daily_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  tag_counts JSONB NOT NULL DEFAULT '{}',
  article_count INTEGER NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.spark_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read snapshots"
  ON public.spark_daily_snapshots
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert snapshots"
  ON public.spark_daily_snapshots
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_snapshots_date ON public.spark_daily_snapshots (date DESC);
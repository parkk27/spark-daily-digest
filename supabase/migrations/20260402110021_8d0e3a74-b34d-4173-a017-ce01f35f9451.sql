DROP POLICY "Service role can insert snapshots" ON public.spark_daily_snapshots;

CREATE POLICY "Service role can insert snapshots"
  ON public.spark_daily_snapshots
  FOR INSERT
  TO service_role
  WITH CHECK (true);
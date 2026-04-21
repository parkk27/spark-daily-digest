-- Update spark-scrape cron schedule from once-daily (06:00 UTC) to every 6 hours.
-- This lets fresh vendor blog posts surface within 6h instead of 24h.
DO $$
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN
    SELECT jobid, jobname FROM cron.job
    WHERE command ILIKE '%spark-scrape%'
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'spark-scrape-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dpjzypvarubkomehrwht.supabase.co/functions/v1/spark-scrape',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwanp5cHZhcnVia29tZWhyd2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjM0NTUsImV4cCI6MjA5MDY5OTQ1NX0.maqHbbT_yKuRuG8QlwmaWJIR6VzdczpIlvktAGnuecI"}'::jsonb,
    body := concat('{"trigger":"cron","time":"', now(), '"}')::jsonb
  );
  $$
);
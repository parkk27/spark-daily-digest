UPDATE public.spark_daily_snapshots
SET summary = jsonb_set(
  summary,
  '{all_articles}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN a->>'link' = 'https://cloud.google.com/blog/topics/google-cloud-next/google-cloud-next-2026-wrap-up'
        THEN jsonb_set(a, '{title}', to_jsonb('260 things we announced at Google Cloud Next ''26 – a recap'::text))
        ELSE a
      END
    )
    FROM jsonb_array_elements(summary->'all_articles') a
  )
)
WHERE summary->'all_articles' @> '[{"link": "https://cloud.google.com/blog/topics/google-cloud-next/google-cloud-next-2026-wrap-up"}]';
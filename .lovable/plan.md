## Add Google Transform + Google Cloud Next sources

### `supabase/functions/spark-scrape/index.ts`
1. Append to `SOURCES`:
   - `{ name: 'google-transform', url: 'https://cloud.google.com/transform/topics/data-analytics', weight: 0.9 }`
   - `{ name: 'google-next', url: 'https://cloud.google.com/blog/topics/google-cloud-next', weight: 0.9 }`
2. Extend `TOPIC_TAGS` with agentic/Gemini/BigQuery Studio/Dataplex/Looker/Vertex AI keywords so these posts clear the signal threshold.
3. Add both URLs to `SOURCE_URLS` so the landing pages get rejected by `isBlogPostLink`.

### `src/components/SourceBadge.tsx`
Add color entries for `google-transform` (indigo) and `google-next` (sky) so badges render properly.

### Deploy & refresh
- Redeploy `spark-scrape` edge function.
- Trigger a manual scrape to populate the News feed.

### Outcome
News feed includes posts like "What's New in the Agentic Data Cloud" and "Architecting the Agentic Data Cloud" with proper source badges. Existing release-note rejection and link validation still apply.


## Goal

The News feed currently only shows 2 articles because the strict analytical filters in the scrape pipeline are too aggressive. The user wants to see **more variety on the News page** while keeping the curated, analytical highlights on the Home page.

## Approach

Decouple the **News feed** (broad, varied) from the **Home page highlights** (strict, analytical). The Home page keeps the high-bar curation; the News page shows everything we managed to ingest.

## Changes

### 1. `supabase/functions/spark-scrape/index.ts`

Split the pipeline into two tiers stored in the same snapshot:

- **`articles`** (existing field) — stays strict (signalScore ≥ 6, analytical only). Powers the Home page highlights and the daily AI summary.
- **`all_articles`** (new field in snapshot JSON) — relaxed tier (signalScore ≥ 3, no 80-char summary requirement, release-note rejection still applies). Up to ~30 items, deduped, with per-source cap raised from 3 → 5.

Both tiers come from the same scrape pass — no extra Firecrawl calls. We just keep two filtered views of the same fetched articles.

Persistence: extend the `summary` JSONB to include `all_articles: Article[]` alongside the existing fields. No schema migration needed.

### 2. `src/hooks/useSparkData.ts`

Extend `SparkData` to expose both tiers:
- `articles` (strict, for Home)
- `allArticles` (relaxed, for News)

Read `all_articles` from the edge function response, falling back to `articles` if older snapshots don't have the new field.

### 3. `src/pages/NewsPage.tsx`

Switch from `data.articles` → `data.allArticles`. Same UI, same grouping by date, same source badges — just a richer dataset.

### 4. Trigger a fresh scrape

Run `spark-scrape` once after deploy so today's snapshot includes the new `all_articles` field. Until that runs, the News page falls back to the strict list (no breakage).

## What stays the same

- Home page (`HomePage.tsx`) and Trends page — unchanged, still backed by the curated `articles` list and AI summary.
- Database schema — only the JSON contents grow.
- Cron schedule, freshness memory, dedup, AI prompt, Firecrawl settings — unchanged.
- Release-note rejection (GitHub releases, changelogs, version dumps) still applies to **both** tiers.

## Expected outcome

- News page shows 15–25 articles per day across all vendors (Databricks, AWS, Azure, GCP, Iceberg, Delta, etc.) instead of 2.
- Home page highlights stay tight and analytical.
- No release-note pollution on either page.


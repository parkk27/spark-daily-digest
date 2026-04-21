

## Why the News page is empty

The last scrape only returned 6 raw articles across all 8 sources (Firecrawl is giving thin markdown for the category pages right now). After the `signalScore >= 3` cutoff and the `-3` "seen recently" penalty, the relaxed tier collapsed too. Older snapshots in the DB don't have the `all_articles` field yet (it was just introduced), so there's nothing to fall back to either.

## Fix

Make the News feed never go empty by (a) loosening the relaxed tier and (b) backfilling from the last 10 days of snapshots when today is thin.

### 1. `supabase/functions/spark-scrape/index.ts` — relax Tier B further

- **Drop the signal-score cutoff for Tier B.** Today only the strict tier (Home) needs `signalScore >= 6`. The News tier should accept any article that passed the basic extraction filter (release-note rejection, exclude patterns, age ≤ 14 days). Per-source cap stays at 5, total cap stays at 30.
- **Skip the recency penalty when scoring the News tier.** Apply the +4 "unseen" boost and -3 "seen recently" penalty only to the strict tier ranking. The News tier should re-include older-but-still-valid links so the feed never empties.
- **Add a backfill step**: after building today's `newsArticles`, if `< 12`, query the last 10 days of `spark_daily_snapshots`, pull each row's `summary.all_articles`, dedupe by link against today's set, and append — preserving each article's original `date` field so the News page groups them under their actual day. Cap total merged list at 40.

### 2. `supabase/functions/spark-scrape/index.ts` — backwards-compatible history read

When reading historical snapshots for backfill, also accept old-shape rows that don't have `all_articles` (those will simply contribute nothing — no error). Going forward, every snapshot writes `all_articles`, so the backfill pool grows day by day.

### 3. `src/pages/NewsPage.tsx` — graceful empty state

If `allArticles` is still empty after backfill (truly nothing in the last 10 days), show a clearer message: "No fresh articles in the last 10 days. The next scrape runs every 6 hours." Keep current grouping-by-date UI otherwise.

### 4. Trigger a fresh scrape after deploy

Run `spark-scrape` once so today's snapshot gets the new `all_articles` field populated and the backfill starts working immediately for future runs.

## What stays the same

- Home page strict tier (`signalScore >= 6`, max 3/source) — unchanged.
- AI summary, trend detection, freshness memory for the strict tier — unchanged.
- Database schema, cron schedule, Firecrawl settings, RLS — unchanged.
- News page UI: still grouped by date, still uses `SourceBadge`.

## Expected outcome

- News page shows **at least 12 articles** as long as anything was scraped in the last 10 days, grouped by their original publish date.
- "Today" section shows whatever fresh items today's scrape produced; older sections fill in from the historical pool.
- No more empty-state when a single scrape happens to be thin.


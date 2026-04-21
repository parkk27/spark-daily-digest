

## Why the news isn't refreshing

**Diagnosis** (confirmed by inspecting the data and the scraper):

1. **Vendor blog landing pages are sticky.** We scrape the homepage of each blog (e.g. `databricks.com/blog`, `azure.microsoft.com/en-us/blog/`). These pages feature the same "hero" posts for days or weeks. Looking at the last 4 daily snapshots, the highlights are nearly identical (Forrester Wave, Agent Bricks, Smart Tier, Data+AI Summit) repeating from Apr 18 → Apr 21.
2. **We sort by signal score and take the top 10.** The same high-signal hero posts always win, even when fresher (lower-scored) posts exist on the page.
3. **No "freshness memory."** We never check whether an article link was already shown in a previous snapshot, so yesterday's stories dominate again today.
4. **Firecrawl caches.** `maxAge: 3600000` (1 hour) is fine, but the source pages themselves rarely change.
5. **No publication-date filtering.** Even when a vendor publishes 5 new posts, our extraction grabs whatever is at the top of the markdown (usually the "featured" section).

## Fix Plan — make the feed actually fresh daily

**1. Track recently-seen article links**
- Query `spark_daily_snapshots` for the last 7 days of articles (store article links in the snapshot JSON going forward).
- During scoring, **boost** unseen links by +4 and **penalize** links seen in the last 3 days by -3. This ensures fresh stories surface even if their raw signal is slightly lower than an evergreen hero post.

**2. Switch from blog landing pages to richer discovery sources**

Replace/augment the sticky landing pages with sources that change daily:

| Source | Old | New |
|---|---|---|
| Databricks | `/blog` | `/blog` + `/blog/category/engineering` |
| Azure | `/en-us/blog/` | `/en-us/blog/category/analytics/` |
| AWS | `/blogs/big-data/` | `/blogs/big-data/feed/` (RSS-style, date-ordered) |
| GCP | `/blog/products/data-analytics` | + `/blog/products/data-analytics/rss` |
| Iceberg | `/blogs/` | + GitHub releases `https://github.com/apache/iceberg/releases` |
| Delta Lake | (new) | `https://delta.io/blog/` |
| Spark | (new) | `https://spark.apache.org/news/` |

**3. Extract and respect article publication dates**
- Parse dates from the markdown (most blog cards include "Apr 19, 2026" or ISO dates).
- Reject articles older than **14 days**.
- Add a `+2` recency boost for articles published in the last 3 days.

**4. Increase scrape frequency**
- Change cron from `0 6 * * *` (once daily 6 AM UTC) to `0 */6 * * *` (every 6 hours).
- Each run still saves a single per-day snapshot (UPSERT on date), so the latest run wins.

**5. Diversify final selection (anti-clustering)**
- After dedup, before slicing top 10: enforce **max 3 articles per source** so one chatty vendor doesn't crowd out fresher items from others.

**6. Lower Firecrawl cache**
- Drop `maxAge` from 1 hour → 15 minutes for the more frequent runs.

**7. Persist article links in snapshot for #1 to work**
- Extend `spark_daily_snapshots.summary` JSON to include an `article_links: string[]` field (no schema change needed — it's `jsonb`).

## Files touched

- `supabase/functions/spark-scrape/index.ts` — sources list, date extraction + filtering, freshness scoring against recent snapshots, per-source cap, lower cache TTL, store `article_links`.
- `supabase/migrations/<new>.sql` — update `cron.job` schedule from daily → every 6 hours.

## What stays the same

- UI layout (Home / News / Trends pages — no changes).
- Database schema (only JSON contents grow).
- AI summarization model and prompt structure.
- Fallback-to-previous-snapshot behavior.
- React Query 30-min `staleTime` on the client (so users still see consistent data within a session).

## Expected outcome

- Within 24h of deploy, Home page highlights and News feed should rotate as new posts appear on vendor blogs.
- Same hero post won't reappear for 3 days unless it genuinely is the only signal.
- Cron runs 4×/day so a fresh Databricks/AWS post lands in the feed within 6 hours, not 24.


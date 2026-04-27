## Why the wrong link is appearing

In `supabase/functions/spark-scrape/index.ts`, when an extracted "article" section has no real markdown link, the scraper falls back to the source's landing URL:

```ts
let link = linkMatch ? linkMatch[2] : sourceUrl;
```

For the `databricks-oss` source, `sourceUrl` is `https://www.databricks.com/blog/category/open-source` — a **category page**, not a post. So a card ends up rendering with a title that looks like an article but a link that drops the user on the open-source category listing. This sends the wrong signal.

The same risk exists for any link the scraper picks up that points to a category, tag, author, feed, or image URL (`/blog/category/...`, `/blog/tag/...`, `/blog/author/...`, `/feed`, `.png`, etc.).

## Fix

Tighten link validation in `extractArticlesFromMarkdown` so the News (and Home) feed only ever surfaces links to actual blog posts.

### Changes — `supabase/functions/spark-scrape/index.ts`

1. **Add a `isBlogPostLink(link, sourceUrl)` helper** that returns false if the link is:
   - The source URL itself, or any of the configured `SOURCES[].url` (i.e. a landing page)
   - A category/tag/author/archive/page listing: matches `/category/`, `/categories/`, `/tag/`, `/tags/`, `/author/`, `/authors/`, `/page/`, `/archive/`
   - A feed or sitemap: ends with `/feed`, `/feed/`, `.xml`, `.rss`, `/rss`
   - An asset (image, video, pdf): ends with `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.mp4`, `.pdf`
   - An anchor-only or empty link (`#...`, empty)

2. **Drop the `sourceUrl` fallback entirely.** If a section has no usable post link, skip the candidate instead of attaching the category URL. Replace:
   ```ts
   let link = linkMatch ? linkMatch[2] : sourceUrl;
   ```
   with: extract the link, normalize relative paths, then `if (!isBlogPostLink(link, sourceUrl)) continue;`.

3. **When a section has multiple markdown links, pick the first one that passes `isBlogPostLink`** instead of always the first link (some cards have an author or tag link before the title link). Use `section.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)` and pick the first valid candidate.

4. **One-time backfill of stored snapshots**: existing rows in `spark_daily_snapshots` may already contain bad links in `summary.all_articles` and `summary.articles`. Add a small filter at read time in:
   - the `loadHistoricalNewsArticles` backfill loop, and
   - the API response assembly,
   so any stored article whose link fails `isBlogPostLink` is dropped before being returned. This way the bad link disappears from the UI immediately on next invocation, even before a fresh scrape runs.

5. **Trigger one fresh scrape** after deploy so today's snapshot is regenerated with the new validator.

## What stays the same

- Source list, Firecrawl settings, signal scoring, Tier A vs Tier B logic, recency penalties, deduplication, AI summarization, RLS, schema, cron schedule — all unchanged.
- News page UI and grouping — unchanged.

## Expected outcome

- `https://www.databricks.com/blog/category/open-source` (and any other category/tag/author/feed URL) never appears as an article link on the News or Home pages.
- Cards that the scraper can't tie to a real post URL are dropped instead of mis-pointed to a landing page.
- Article counts may dip slightly (a handful of mis-linked items will be removed), but the 10-day backfill keeps the feed populated.

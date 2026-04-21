

## Goal

Filter the feed to favor **analytical blog posts** (with insights, strategic takeaways, deep-dives) and **drop release-note style sources** (GitHub releases, changelogs, version dumps).

## Changes — `supabase/functions/spark-scrape/index.ts`

**1. Remove pure release-note sources from `SOURCES`**
- Remove `iceberg-releases` → `https://github.com/apache/iceberg/releases` (raw version tags, no analysis)
- Remove `dataproc` → `https://cloud.google.com/dataproc/docs/release-notes` (changelog format)
- Replace `spark` news feed (`/news/`, mostly version announcements) with `https://www.databricks.com/blog/category/open-source` for Spark-ecosystem analysis. Optional: keep `spark` only if filtered to non-release items.
- Keep all analytical blogs: Databricks, Databricks Engineering, Azure Analytics, AWS Big Data feed, Iceberg blogs, Delta blog, GCP data-analytics.

**2. Add a "release-note" rejection filter** (new `RELEASE_NOTE_PATTERNS`)
Reject any article whose title/summary matches:
- `/^(release notes?|changelog|what.?s new in)/i`
- `/\b(v?\d+\.\d+(\.\d+)?)\s*(released|available|now ga|is out)\b/i`
- `/\brelease\s+v?\d+\.\d+/i`
- `/\b(patch|hotfix|bugfix)\s+release\b/i`
- `/^(version\s+\d+|tag\s+v?\d+)/i`
- `/\bgithub\.com\/.+\/releases\//i` (link-based reject)

Apply this filter inside `extractArticlesFromMarkdown` alongside `EXCLUDE_PATTERNS`.

**3. Strengthen "analytical signal" scoring**
In `computeSignalScore`, add a dedicated **analysis boost** (+3 each, max once) for these phrases that indicate a strategic/analytical post rather than a release announcement:
- `lessons learned`, `deep dive`, `under the hood`, `how we`, `why we`, `case study`, `benchmark results`, `architecture`, `design`, `comparison`, `vs`, `tradeoff`, `best practices`, `pattern`, `strategy`, `analysis`, `insights`, `inside`, `evolution`, `journey`

And **penalize** (-4) titles that look like release dumps:
- `release notes`, `changelog`, `version `, `now generally available` (the bare phrase, when unaccompanied by analysis terms), `is now available`

**4. Require minimum content depth**
- Raise minimum summary length from 30 → 80 chars (release notes typically have very short stub summaries like "Iceberg 1.5.0 released").
- If `summary.length < 80` AND no analysis keyword present → skip article.

**5. Lift minimum signal threshold**
- Raise the per-article cutoff from `signalScore < 3` to `signalScore < 6` so only well-scored analytical posts make it through.

**6. Update AI summarization prompt**
Tighten the rule line:
> "Rules: focus on **analytical posts with strategic takeaways** (architecture decisions, performance analyses, case studies, comparisons). **Skip pure release notes, version announcements, and changelogs.** Cluster similar updates."

This nudges the AI to deprioritize anything release-flavored that slipped through.

**7. Trigger a fresh scrape after deploy**
Call the deployed `spark-scrape` function once to immediately repopulate today's snapshot with the stricter filters, so the user sees the change without waiting for the next cron run.

## What stays the same

- UI (Home / News / Trends layout).
- Database schema and snapshot structure.
- Cron schedule (every 6 hours).
- Freshness memory, per-source cap, deduplication logic.
- AI model (`google/gemini-2.5-flash-lite`).

## Expected outcome

- News feed shows posts like "Lessons from migrating to Iceberg", "Deep dive: Photon vectorization", "Why we moved Delta to S3 Express" — not "Iceberg 1.5.2 released" or "Spark 4.0.1 now available".
- GitHub release pages no longer scraped.
- If a vendor only publishes release notes on a given day, those slots stay empty rather than filling with low-value items (per-source cap already prevents over-rotation to a single noisy vendor).


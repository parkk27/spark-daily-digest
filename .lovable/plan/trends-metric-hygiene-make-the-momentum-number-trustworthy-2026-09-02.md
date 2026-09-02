# Trends Metric Hygiene: Make the Momentum Number Trustworthy

Calculation-and-labelling correction only. No page redesign, no changes to auth, Action Radar, Compare, ingestion or the recommendation workflow.

## What the audit found (from the stored snapshots, perspective = Microsoft Fabric, window_end 2026-09-02)

| entity | kind | current | baseline | delta | correct % | displayed % | direction | confidence |
|---|---|---|---|---|---|---|---|---|
| spark | topic | 233 | 132.5 | +100.5 | +75.8 | +75.8 | VERY_HIGH_UP | 85 |
| databricks | competitor | 183 | 140 | +43 | +30.7 | +30.7 | HIGH_UP | 80 |
| fabric | topic | 128.5 | 81 | +47.5 | +58.6 | +58.6 | VERY_HIGH_UP | 85 |
| governance | topic | 44 | 24.5 | +19.5 | +79.6 | +79.6 | VERY_HIGH_UP | 80 |
| bigquery | competitor | 37.5 | 45 | −7.5 | −16.7 | −16.7 | DOWN | 60 |
| lakehouse | topic | 25 | 6 | +19 | +316.7 | +316.7 | VERY_HIGH_UP | 75 |
| emr | competitor | 16.5 | 0 | +16.5 | undefined | **+1650%** | VERY_HIGH_UP | 70 |
| snowflake | competitor | 3 | 6 | −3 | −50 | −50 | VERY_HIGH_DOWN | 44 |

Three real defects, one wording defect:

1. **Zero baseline invents a percentage.** `momentumPercent` divides by `max(baseline, 1)`, so 0 → 16.5 renders as +1650%. Same class of distortion for tiny baselines (lakehouse 6 → 25 = +316.7%).
2. **Windows are 31 and 30 days.** Current window is `today-30 .. today` (31 calendar days); baseline is `today-60 .. today-31` (30 days). They are not comparable.
3. **Low-volume guard is too weak.** Snowflake 3 vs 6 (combined 9, confidence 44) is published as "Strongly falling".
4. **Entity dimension is mixed.** `perspectiveEntities` emits `kind: "topic"` for Spark, Governance, Lakehouse, OneLake and `kind: "competitor"` for Databricks, EMR, BigQuery — but the UI renders them in one undifferentiated ranking, implying Governance and Databricks are peers.

The charts also scale bars by `momentum_percent`, so EMR's fabricated +1650% would dominate the chart.

## Fixes

**1. Exact windows** (`supabase/functions/_shared/momentum.ts`)
Current = `today-29 .. today`, baseline = `today-59 .. today-30`. Both exactly 30 calendar days, rolling, never calendar months. Snapshot fetch widened to 60 days.

**2. Honest percentage**
`momentumPercent` returns `null` when baseline is 0 or below a new `min_baseline_activity` (default 3). No divide-by-one fallback. New classification returned alongside the direction:

- `ESTABLISHED` — baseline at or above the minimum: show the percentage.
- `EMERGING` — baseline 0 or below the minimum but current activity is meaningful: show "New signal" (baseline 0) or "Emerging", plus current weighted signals. No percentage.
- `COOLING` — established and negative.
- `LOW_DATA` — combined weighted activity below threshold: no directional claim.

Existing valid results (Spark, Fabric, Databricks, BigQuery) are unchanged by this.

**3. Three separate concepts on the trend record**
`signal_activity` (current weighted volume), `signal_momentum` (change vs the preceding 30 days, nullable), `strategic_impact` (existing impact score). These already exist as `current_activity` / `momentum_percent` / `impact_score`; the change is that they are surfaced as three distinct labelled values instead of collapsing into one percentage.

**4. Entity taxonomy**
Keep the stored data as-is; add an explicit `entity_type` (`platform` | `technology` | `theme` | `competitor`) derived from the perspective config, persisted on new snapshot rows and used by the UI to group and label. Competitors and themes are never shown as one ranked list without a type label.

**5. Chart scaling**
Bars are driven by **current weighted signal activity**, not percentage. Momentum becomes a secondary annotation on each bar (`EMR 16.5 weighted signals · New signal`). Emerging entities can never distort the axis.

**6. Naming and wording**
Section title: "Signal Momentum — Rolling 30 Days". Subtitle: "Change in weighted intelligence signals versus the preceding 30-day window. This measures signal activity, not market share, revenue, adoption, or competitive success." Negative movement is labelled "Cooling signal", never decline/loss/defeat.

**7. Explain every movement**
The existing explain drawer and "Drivers behind the move" section get the full row for each rising or cooling entity: current weighted signals, previous weighted signals, absolute delta, percentage only when statistically valid, confidence, top contributing drivers, supporting evidence.

**8. Data-quality safeguards**
Zero baseline, low baseline, missing snapshot days, duplicate articles (existing canonical-ID dedupe kept and extended to cross-date duplicates), outsized individual weights (existing 2.0 cap kept and logged when hit), insufficient evidence, and crawl gaps (a window with missing days is flagged rather than treated as zero activity). No synthetic data.

**9. Recompute**
Bump the cache key in the `perspective-trends` function so stored rows carrying `+1650%` are recomputed rather than served from cache.

## Technical notes

- Files touched: `supabase/functions/_shared/momentum.ts`, `supabase/functions/perspective-trends/index.ts`, `src/lib/trendCharts.ts`, `src/components/trends/*` (chip, bar chart, explain drawer, sections), `src/pages/TrendsPage.tsx` labels.
- One migration: add nullable `entity_type` and `data_quality_flags` to `perspective_trend_snapshots`; existing RLS and grants untouched.
- `momentum_percent` becomes nullable in the stored contract; every reader handles `null` as "no valid comparison".
- Tests extended for: 30/30-day window boundaries, zero baseline → no percentage, baseline below minimum → Emerging, valid percentages unchanged against the seven audited entities, chart bars scaled by activity, cooling labelling.

## Order of work

Calculation and safeguards first, verified against the audit table above, then the label and chart-scaling updates. No visual redesign in this pass.

**Acceptance:** no zero-baseline entity ever shows an invented percentage; activity, momentum and strategic impact read as three distinct things; every number on the page is explainable to a first-time viewer.

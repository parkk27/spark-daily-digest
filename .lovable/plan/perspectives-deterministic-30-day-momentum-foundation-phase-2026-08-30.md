# Perspectives + Deterministic 30-Day Momentum (Foundation Phase)

Additive foundation only. No rebuild of Radar, Compare, Recommendations, Decision Records, ingestion or auth. No new LLM.

## What I inspected

- `recommendations`: 120 rows, 5–29 Aug 2026 only, with `signal_key`, `signal_type`, `polarity`, `score_breakdown` (strategic_relevance, customer_impact, competitive_intensity, momentum, evidence_confidence, urgency), `confidence`, `related_vendor`, `related_technologies`.
- `spark_daily_snapshots`: 150 days, 2 Apr – 30 Aug 2026, each holding `all_articles` (title, source, tags, link, summary) and per-day `trends`.
- Frontend trend model today is day-over-day only: `TrendItem { today, yesterday, change }` in `src/data/mockData.ts`, consumed by `src/lib/trends.ts` and the Trends page.
- `user_preferences` already exists per user with RLS scoped to `auth.uid()`.

Consequence: recommendations only cover ~25 days, so a 30/60-day window over them would be structurally low-data. **Snapshots are the activity source** for momentum (full 60-day history); recommendation `score_breakdown` remains the source for strategic impact.

## What gets built

**1. Perspective model (config, not DB-heavy)**
`src/lib/perspectives.ts` — single central config: id, name, display_name, type (platform | technology), description, aliases, core_topics, related_topics, competitors, technologies, default_weight_profile, is_active. Ten perspectives: Microsoft Fabric (default), Databricks, Google BigQuery, AWS EMR, Google Dataproc, Snowflake, Apache Spark, Apache Iceberg, Delta Lake, Apache Flink. No perspective facts hardcoded in components.

**2. Preference persistence**
One migration: add nullable `perspective_id text` to `user_preferences` (existing RLS/grants unchanged). `usePerspective()` hook: DB value for signed-in users, `localStorage` fallback for anonymous/preview, default Microsoft Fabric when unset. No forced selection.

**3. PerspectiveSelector**
Lightweight dropdown ("Viewing through: Microsoft Fabric") grouped Platforms / Technologies. Placed in the Trends page header and the Big Data Brief header only. No page redesigns.

**4. Deterministic scoring (`src/lib/perspectiveScoring.ts`)**
- `perspectiveRelevance(signal, perspective)` → 0–100 from topic (0–30), competitive (0–20), capability (0–20), entity/vendor (0–15), customer/business (0–15); missing components are dropped and the remainder renormalised, never invented.
- `strategicImpact(score_breakdown)` → 0.25·strategic_relevance + 0.20·customer_impact + 0.20·competitive_intensity + 0.15·momentum + 0.10·evidence_confidence + 0.10·urgency, rounded. Existing fields kept as-is.
- Impact and evidence confidence stay separate values, surfaced as separate labels.
- Polarity reuses the existing competitor/pattern logic, evaluated against the selected perspective's competitor list; insufficient evidence → neutral.

**5. Rolling 30-day momentum (`src/lib/momentum.ts`)**
- Canonical signal = existing `signal_key` where present, else normalised article URL.
- Windows: current = today-30..today; baseline = today-60..today-30. Rolling, not calendar.
- Signal weight: base 1.0, official vendor 1.5, high confidence up to 1.5, major competitive up to 2.0, capped at 2.0 (no unlimited stacking).
- `momentum_percent = (current - baseline) / max(baseline, 1) * 100`.
- Direction bands: ≥40 VERY_HIGH_UP, 20–39.9 HIGH_UP, 5–19.9 UP, −4.9..4.9 STABLE, −5..−19.9 DOWN, −20..−39.9 HIGH_DOWN, ≤−40 VERY_HIGH_DOWN. Raw percent always retained.
- Low-volume guard: combined weighted activity < 5 (configurable) → `LOW_DATA`, never "high momentum".
- `trend_confidence` 0–100 from volume, evidence confidence, source diversity, movement consistency.
- Trend drivers: group by topic/capability/signal_type/competitor, rank by absolute weighted contribution to the change, not raw volume.
- Deterministic rationale string ("driven by observed signal activity…"), never causal claims.
- Competitor momentum computed independently per perspective competitor; wording is "signal momentum", never winner/loser.

**6. Trend data contract**
`PerspectiveTrend { perspective_id, entity_id, entity_name, current_activity, baseline_activity, momentum_percent, momentum_direction, trend_confidence, top_drivers, strategic_relevance, competitive_intensity, impact_score, generated_at }` — one shape reused by Brief, Trends, Compare, Radar.

**7. Caching**
New edge function `perspective-trends` computes the contract from the last 60 days of snapshots and writes `perspective_trend_snapshots` (unique on perspective_id + entity_id + window_end). Frontend reads the cached rows; recompute at most every 6 hours, aligned to the existing refresh cycle. No heavy client-side computation.

**8. Minimal UI exposure**
Trends page: replace the `+1 / -1` chip with 30-day momentum (`↑ 24%` / `Stable` / `Low data`). Clicking expands current vs previous activity, momentum %, confidence and top driver. Existing day-over-day sections stay until the new model is validated. Full Trends redesign, charts, AI narratives and forecasting are out of scope.

**9. Action Radar link**
Trend becomes Radar-eligible only when strategic impact ≥ 70, perspective relevance ≥ 60, trend confidence ≥ 60 (all configurable). Eligible trends surface a recommended PM action through the existing Radar architecture, upserted on the existing `signal_key` so refreshes never duplicate.

**10. Tests**
Vitest covering the 14 listed cases: default perspective, switching, persistence, canonical-signal independence, +20%, stable at +2%, 3-vs-1 low data, +50% VERY_HIGH_UP, −30% HIGH_DOWN, driver ranking, low confidence, competitor context, Radar eligibility, no duplicate recommendations.

## Technical notes

- One migration only: `user_preferences.perspective_id` plus the `perspective_trend_snapshots` table with grants (read for authenticated, write for service_role), RLS enabled. No renames, no deletions, no changes to existing policies.
- No secrets reach the frontend; the trend function runs with the service role server-side.
- Structured logs for perspective/trend calculation, snapshot generation, failures, missing metadata and low-volume cases.
- Backward compatibility: unset preference = Microsoft Fabric; existing recommendations, decisions and Compare behaviour untouched.

## Delivery order

Config + preference + selector → scoring → momentum + confidence + drivers → cached snapshots edge function → UI momentum chip → Radar eligibility → tests + validation report covering the 20 required items.

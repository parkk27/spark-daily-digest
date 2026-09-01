# Perspective-Driven Trends, Dashboard, Roadmap and Narrative Brief

Everything below reuses the already-deployed `perspective-trends` edge function (6-hour cached 30-day momentum) and the existing deterministic scoring libraries. No new AI calls, so no extra model credits.

## 1. Full Trends page

Rebuild `/trends` around the selected perspective while keeping the existing daily trend sections:

- **Momentum** — ranked list of tracked entities with direction (rising / steady / cooling / low data), percent vs the 30-day baseline, confidence, and a link into the existing explain drawer.
- **Drivers** — for each top entity, its `top_drivers` (the articles/sources behind the move), so the number is always traceable to evidence.
- **Competitive momentum** — the perspective's competitor set side by side (activity, momentum, competitive intensity), with the perspective itself shown as the reference row.
- Existing daily sections (fastest growing, vendor momentum, emerging, declining, watchlist) stay below as the "today" layer.
- Empty and low-data states are explicit — no invented movement when evidence is thin.

## 2. Dashboard reflects the perspective

`/dashboard` currently only re-ranks the Brief. It will also get:

- A **perspective momentum strip**: top rising and cooling entities with chips and drawer access.
- A **competitive momentum card**: how the perspective stands against its benchmark set this window.
- A **top drivers card**: the handful of articles that moved the perspective most, linking out to source.

## 3. Narrative brief

Replace "Today's Big Data Intelligence Brief" numbers-only framing with a deterministic generated narrative — a few sentences composed from real momentum values, e.g. what accelerated, what cooled, where a competitor is pulling ahead, and what that means for the selected perspective. Every clause is derived from the cached trend rows (direction, percent, confidence, drivers), so it stays honest and costs nothing per view. Numbers remain visible beneath the narrative.

## 4. Roadmap page

New protected route `/roadmap` (added to the main nav):

- One entry per perspective (Fabric Spark, Databricks, Snowflake, BigQuery, EMR, …).
- Each entry shows: current momentum band, top 3 drivers, competitive pressure, and **recommended actions** derived from the existing Action Radar recommendation scoring for that perspective.
- Actions link into Action Radar / Compare so a roadmap item becomes a tracked decision.
- Selecting an entry switches the global perspective so the rest of the app follows.

## 5. Publish and walk the loop

After the build: publish, then verify the full path — select Fabric, open Compare, open a momentum chip drawer, check the Dashboard brief, check Action Radar — and report what renders with live data.

## Technical notes

- New: `src/pages/RoadmapPage.tsx`, `src/components/trends/MomentumSection.tsx`, `DriversList.tsx`, `CompetitiveMomentum.tsx`, `src/lib/briefNarrative.ts` (pure, unit-tested).
- Reuse: `usePerspectiveTrends`, `momentumIndex`, `perspectiveMatch.ts`, `perspectiveScoring.ts`, `MomentumExplainDrawer`.
- Route added in `src/App.tsx` behind `RequireAuth`, lazy-loaded; nav entry in `Navbar.tsx`.
- No schema changes, no RLS changes, no new edge functions.
- Tests for narrative generation and momentum sectioning; typecheck + full suite before publish.

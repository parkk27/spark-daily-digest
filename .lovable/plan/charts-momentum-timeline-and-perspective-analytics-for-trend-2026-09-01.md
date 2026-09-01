# Charts, Momentum Timeline and Perspective Analytics for Trends

Note on scope: the project's MVP rule said "no charts". This plan intentionally reverses that for the Trends page only, since you asked for it. Everything stays on cached perspective-trends data — no new AI calls or edge functions.

## 1. Charts on the Trends page

Three charts, using the chart library already in the project (recharts), styled with existing design tokens:

- **Momentum bar chart** — one bar per reportable entity in the selected perspective, sorted by momentum percent, rising above the axis and cooling below. Clicking a bar opens the existing explain drawer.
- **Competitor comparison chart** — the perspective's own mean momentum as a reference bar next to each tracked competitor, so lead or lag is visible at a glance.
- **Driver counts chart** — horizontal bars of the aggregated top drivers (weighted contribution per theme/source), replacing nothing: the existing driver list stays beneath it as the evidence detail.

Low-data entities are excluded from charts and reported as a count, so the picture never implies movement that the evidence doesn't support.

## 2. Momentum timeline

Snapshot history for a perspective is read directly from the trend snapshot table (read access already exists), grouped by snapshot window end date:

- A line chart of momentum percent over time, one line per top entity of the perspective.
- Today there are only 1-2 snapshot windows stored (from Aug 30 and Sep 1), so the chart starts sparse and fills in as the pipeline keeps writing daily snapshots. Until at least two points exist for an entity, the chart shows an explicit "collecting history" state rather than a flat fake line.

## 3. Where each trend leads

Under the charts, a compact "where this leads" section on Trends reusing the existing roadmap action logic: for the selected perspective, its recommended actions with priority and links into Radar and Compare. No duplicate logic — the Roadmap page and this section share the same functions.

## 4. Perspective change analytics

- Perspective switches are logged to the analytics events table as a `perspective_changed` event with the previous and next perspective, plus the surface it was changed from (dashboard, trends, compare, roadmap).
- The admin Analytics page gains a "Perspective engagement" card: switch counts per perspective and distinct users per perspective, so real engagement is separable from the Fabric default.

## Technical notes

- New: `src/components/trends/MomentumBarChart.tsx`, `CompetitorChart.tsx`, `DriverCountsChart.tsx`, `MomentumTimeline.tsx`, `src/hooks/usePerspectiveTrendHistory.ts`, `src/lib/trendCharts.ts` (pure shaping functions, unit tested).
- Reuse: `usePerspectiveTrends`, `briefNarrative` selectors, `roadmap.ts`, `MomentumExplainDrawer`, `useTrackEvent`.
- Edited: `TrendsPage.tsx` (charts + roadmap section), `PerspectiveSelector.tsx` and `usePerspective.ts` (emit the change event with a `surface` prop), `AnalyticsPage.tsx` (engagement card).
- No schema change, no RLS change: `analytics_events` already accepts user-owned inserts and `perspective_trend_snapshots` is readable by authenticated users.
- Tests for chart data shaping and timeline grouping; typecheck and full suite before finishing.

# Visual Redesign Pass — Executive Dashboard Language

A presentation-only pass. No changes to data model, pipeline, routes, auth, comparison logic, Action Radar logic, or Copilot behavior. Several requested capabilities already exist (guided tour with skip/replay, executive perspective/benchmark context, compare capability labels, radar sections and chips) — those get styling and copy polish rather than rebuilds.

## 1. Design tokens (index.css + tailwind.config.ts)

Extend the existing dark palette instead of replacing it:

- Elevation scale: `--surface-1` (page), `--surface-2` (card), `--surface-3` (raised/hover), plus `--shadow-card` and `--shadow-raised` — soft, low-opacity, no glow.
- Hairline borders: `--border-subtle` for internal dividers, current `--border` for card edges.
- Typography scale tokens for section eyebrow / card title / metric / body, with tighter tracking on headings and improved line-height on body.
- Focus ring polish using existing `--ring`.

No new colors beyond neutrals plus the existing primary and status hues. No gradients.

## 2. Shared presentation primitives (new, small)

- `SectionHeader` — eyebrow icon + label, title, optional description and right-side actions. Used across Dashboard, Trends, Compare, Radar for one consistent rhythm.
- `SurfaceCard` — the standard card container (border, surface-2, shadow-card, hover to surface-3).
- `MetaChip` — compact label/value chip used for priority, confidence, owner, due date, source counts.
- `EmptyState` — icon, headline, one-line explanation, primary action.
- `SkeletonCard` — shared loading placeholder replacing the ad-hoc pulse blocks.

## 3. Dashboard (HomePage + ExecutiveSummaryCard)

- Executive Intelligence becomes the visual anchor: full-width raised card at top, larger heading, context strip (Perspective, Benchmarked against, Analysis window, Sources/refresh) rendered as labeled chips rather than four plain text blocks.
- Seven insight rows regrouped into a two-tier layout: three lead insights (change / opportunity / risk) at larger type, the rest in a compact grid.
- Quick-action row restyled as a bordered toolbar footer.
- Top Insight, Highlights, Trends, Why It Matters get consistent `SectionHeader` + `SurfaceCard` treatment and a single staggered fade (existing animation, tuned).
- Loading uses `SkeletonCard`; each section gets an empty state.

## 4. Action Radar

- Reads as a decision surface: sticky filter bar, section bands (Act now / Watch / Deprioritize) with count badges, act-now cards visually heavier (accent left edge, raised surface).
- Each card shows priority, confidence, owner, and due date as `MetaChip`s in a single row; status control aligned right.
- Strong empty state ("No recommendations yet — refresh the radar") and skeleton loading.

## 5. Compare

- Card header restated as an explicit two-column contrast: "Competitor capability" vs "Microsoft Fabric Spark capability", with the gap line between them.
- "Why this matters" (from existing customer impact field) and "Recommended next action" (from existing recommendation fields) promoted into labeled blocks instead of collapsed detail.
- Benchmarking perspective stated in the page header and repeated as a small persistent chip on the filter bar.
- Filter chips and result summary restyled to match the shared language; empty state upgraded.

## 6. Trends, News, Copilot

- Same header/card/chip language applied; 10-second skim goal via clearer status color usage and tighter metric rows.
- Copilot input and message bubbles get consistent surfaces, plus a first-run suggestion state with example questions.

## 7. Onboarding

Existing tour is extended, not replaced:

- Welcome dialog copy states what the product is, who it's for, and the Fabric Spark perspective.
- New steps for "Benchmarking against" (what the benchmark universe means), Compare usage, Action Radar usage, and how to ask the Copilot a question.
- Skip and Replay already exist; both surfaced more clearly in the dialog and account menu.
- Spotlight styling updated to the new elevation and border tokens.

## Technical notes

- All colors via semantic tokens; no hardcoded utility colors added.
- No new dependencies; shadcn components restyled through variants and tokens.
- Files touched: `src/index.css`, `tailwind.config.ts`, new `src/components/ui/section-header.tsx`, `surface-card.tsx`, `meta-chip.tsx`, `empty-state.tsx`, `skeleton-card.tsx`, plus presentation edits in `HomePage`, `ExecutiveSummaryCard`, `ActionRadarPage`, `ComparisonPage`, `ComparisonCard`, `ComparisonBadges`, `TrendsPage`/`TrendSection`, `NewsPage`, `AskBigDataHub`, `Navbar`, and the tour files.
- Verification: type-check plus browser screenshots of /dashboard, /compare, /radar, /trends at desktop and mobile widths.

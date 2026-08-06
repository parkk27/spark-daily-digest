# Product Tour + Executive Intelligence Context

Two independent additions: a guided first-run tour, and explicit perspective/context on the Executive Intelligence card.

## 1. Guided product tour

New files under `src/components/tour/`:
- `tourSteps.ts` — 7 steps (dashboard, executive-intelligence, news, trends, compare, radar, copilot), each with `route`, `target` selector, title, body.
- `ProductTour.tsx` — dimmed overlay with a spotlight cut-out around the target rect, positioned tooltip card with Back / Next / Skip, Escape and arrow-key support.
- `TourWelcomeDialog.tsx` — existing shadcn `Dialog`: "Welcome to Big Data Intelligence Hub", 5-item checklist, Start / Skip.
- `TourOverlay.tsx` — mounts the welcome dialog plus the active tour.

New `src/hooks/useProductTour.tsx`: `TourProvider` context tracking `active`, `stepIndex`, `showWelcome`, with `start/next/prev/skip/replay`. On step change it navigates to the step's route when different, then the tour polls (rAF/interval with timeout) for the target element to mount — needed because protected pages are lazy-loaded. Completion is persisted in localStorage keyed by user id; only signed-in first-time users get the welcome dialog automatically.

Wiring:
- `App.tsx`: wrap `TourProvider` inside `AuthProvider` around Navbar/Routes, render `<TourOverlay />` once.
- `Navbar.tsx`: add `data-tour="nav-dashboard|nav-news|nav-trends|nav-radar|nav-compare|nav-copilot"` on the matching links, plus a "Replay tour" item in the account dropdown calling `replay()`.
- `ExecutiveSummaryCard.tsx`: `data-tour="executive-intelligence"` on the outer `<section>`.

## 2. Executive Intelligence perspective

`src/lib/executive.ts`:
- Export `OUR_PLATFORM = "Microsoft Fabric Spark"` and `BENCHMARK_VENDORS`.
- Extend `ExecutiveIntelligence` with `perspective`, `benchmarkVendors`, `analysisWindowLabel`, `sourceCount`, `lastRefreshedLabel`.
- Rename `vendorLeadingInnovation` → `innovationLeader`, worded as "most tracked announcements in this window (not an endorsement)".
- Reword `topOpportunity` / `topCompetitiveRisk` to explicitly name Microsoft Fabric Spark.
- `lastRefreshedLabel` via `formatDistanceToNowStrict` (date-fns already used).
- Add per-vendor announcement counts to `evidence` for the Why popover.

`ExecutiveSummaryCard.tsx`:
- Context banner above the grid (4 columns): Perspective, Benchmarked against, Analysis window, Sources / freshness / confidence — always visible.
- Row labels renamed: "Most important ecosystem change", "Highest competitive risk", "Recommended immediate action", "Current innovation leader".
- Quick-action button row below: Supporting articles → `/news`, Competitive comparison → `/compare`, Action radar → `/radar`, Ask copilot → `/copilot`, plus Export brief and Share (stubbed with a toast for now).

## Constraints

Existing shadcn/ui + Tailwind tokens only, no new dependencies, no changes to auth, data fetching, or personalization behavior. `HomePage` keeps calling `buildExecutiveIntelligence` with the same arguments (plus the snapshot date already available) so no pipeline changes are needed.

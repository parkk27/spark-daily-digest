# VibeCode 30 Readiness Pass

Four phases, each a deployable state. No existing auth-gated behavior is removed — every public surface is added in parallel.

## Phase 1 — Public demo mode (highest priority)

- New `src/data/sampleData.ts`: a frozen fixture matching the existing `DailySummary` / `Article` / `TrendItem` shapes from `src/data/mockData.ts`, plus 7 sample recommendations spread across `act_now` / `watch` / `deprioritize` using the `useRecommendations` row shape.
- New `src/components/PreviewBanner.tsx`: dismissible (session-persisted) banner — "You're viewing sample data. Sign in for your personalized brief, watchlist, and Action Radar." Rendered on all preview routes.
- `/preview` — new `PreviewBriefPage`: reuses `ExecutiveSummaryCard` (fed by `buildExecutiveIntelligence` over the fixture) plus the highlights/trends/impact layout from HomePage. No refresh, no copilot, no bookmark/watchlist controls.
- `/preview/compare` — renders the existing `ComparisonPage`; it already reads static `BENCHMARKS` and has no write actions. A `readOnly` prop is added only to suppress the bookmark button inside `ComparisonCard`.
- `/preview/radar` — new `PreviewRadarPage`: same visual card structure as `ActionRadarPage`, fed by the fixture, status selects rendered disabled, and the "Refresh radar" button replaced with a "Sign in to manage your own radar" link.
- `src/App.tsx`: three public routes, lazy-loaded, outside `RequireAuth`.
- `src/pages/LandingPage.tsx`: primary CTA becomes "See today's brief" → `/preview`; "Create free account" becomes the secondary button.
- SEO: `SeoHead` on each preview page with real titles/descriptions (indexable, unlike the gated pages); add the three routes to `public/sitemap.xml` and `public/llms.txt`.

## Phase 2 — Traction and shareability

- New `src/components/share/TrendCard.tsx`: a 1200×630-proportioned card (topic, one-line why-it-matters, status badge, source count) built with existing tokens. Shown in a dialog.
- "Share" button on each trend in `TrendsPage.tsx` and each `ComparisonCard`: opens the card preview and copies the shareable link.
- `/card/:cardId` public route rendering the same card full-bleed, with `SeoHead` title/description per card.
- Landing footer counter: real count queried from the backend (distinct users in `profiles`). If the count is below a meaningful threshold, the line is omitted entirely rather than shown — no fabricated numbers.

Note on unfurling: this app is a client-rendered SPA, so LinkedIn/X/Slack crawlers see only the static `index.html` head — per-card `og:image`/title will not unfurl correctly without server rendering. The `/card/:cardId` page will still work for humans and JS-executing crawlers. True per-link unfurls need the SSR template upgrade ([what the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start)); I'll flag it rather than ship something that silently doesn't unfurl.

## Phase 3 — Executive export and distribution

- "Export brief" on `HomePage.tsx`: renders the `ExecutiveIntelligence` object into a clean print-styled layout and triggers the browser print-to-PDF path — no new dependency, single page, matches current typography.
- Migration: add `slack_webhook_url text` to `public.profiles`.
- `SettingsPage.tsx`: field to save/clear the Slack webhook URL (own-row RLS already covers it).
- New `send-slack-digest` edge function: reads the latest snapshot, formats the daily brief as Slack blocks, posts to each opted-in user's webhook. Scheduled with pg_cron alongside the existing pipeline.

## Phase 4 — Trust and neutrality

- `src/data/features.ts` + `ComparisonPage.tsx`: introduce a "baseline platform" selector. The benchmark rows keep the same data; the chosen vendor becomes "your platform" and the rest are relabeled as competitors relative to it. Copy shifts from Fabric-centric to methodology-centric.
- `ArticleIntelligencePanel.tsx`: the existing `EvidencePopover` becomes an inline expandable "Why this score?" block listing the matched signals from `ArticleIntelligence.evidence`, plus importance and confidence. UI only — `decisionIntelligence.ts` already produces the data.

## Technical notes

- All fixtures are typed against existing interfaces so preview pages reuse `ExecutiveSummaryCard`, `TrendSection`, and `ComparisonCard` unchanged.
- Preview routes never call `useSparkData`, `useBookmarks`, or `useRecommendations`, so they render with no session and make no authenticated queries.
- Design system untouched: existing Tailwind tokens, shadcn primitives, and the `SeoHead` pattern.

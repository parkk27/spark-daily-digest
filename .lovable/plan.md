# Compare Feature — Prototype (Phase 1)

A static, fully interactive Feature Comparison prototype at `/compare`, using hardcoded baseline data. No backend, no AI, no scraping yet — the goal is to validate the navigation, layout and analysis model before wiring it to live data.

Nothing exists for this feature today: there is no `src/data/features.ts` and no comparison page in the project.

## Navigation

- New protected route `/compare` (sign-in required, same as Dashboard/News/Trends/Copilot, lazy-loaded).
- Navbar gets a "Compare" item with a bar-chart icon, placed between Trends and Copilot, so the authenticated nav reads: Dashboard, News, Trends, Compare, Copilot.
- Landing page and public nav unchanged.

## What the page shows

```text
Compare Competitor Features
[ All ] [ Performance 4 ] [ Cost 6 ] [ AI 5 ] [ Governance 4 ]   <- sticky filter bar
Category header: threat breakdown (x high / y medium / z low)

┌ Databricks · High threat · We lag ─────────────────────────┐
│ Their feature            │ Our feature                     │
│ name, announced date,    │ name, shipped date,             │
│ summary, mention count   │ status, maturity                │
│ Timeline: they shipped 4 months earlier                    │
│ [ Show analysis ▾ ]                                        │
│   Suggested response · Recommended action · GTM priority   │
│   [ Copy RFP response ]  [ Share to Slack (disabled) ]     │
└────────────────────────────────────────────────────────────┘
```

- Cards sorted by threat level, then most recent announcement.
- Gap status: we lead / parity / we lag / they have only, each with its own badge.
- Expand/collapse for analysis so the grid stays scannable.
- Responsive: single column under 768px, two-column comparison above.
- Empty state per category when nothing matches the filter.

## Data for the prototype

`src/data/features.ts` holds:
- `OUR_FEATURES` — 19 baseline entries across performance, cost, AI and governance (id, name, description, shipped date, status, roadmap quarter, maturity).
- `COMPETITOR_FEATURES` — 9 seeded announcements from Databricks, Google and Microsoft (vendor, feature name, category, announced date, source link, article title, summary, threat level, mention count).
- `compareFeatures()` — matches each competitor feature to our baseline by category plus token overlap on the name, computes the timeline delta, gap status, threat, GTM priority, suggested response text and recommended action.

## Actions in the prototype

- "Copy RFP response" copies the generated talking points to the clipboard with a toast confirmation.
- "Share to Slack" renders disabled with a "coming soon" tooltip.

## Technical notes

- New files: `src/data/features.ts`, `src/pages/ComparisonPage.tsx`, plus a `ComparisonCard` component and a small `ThreatBadge`/`GapBadge` pair under `src/components/compare/`.
- Edits: `src/App.tsx` (lazy route inside `RequireAuth`), `src/components/Navbar.tsx` (nav item), `public/sitemap.xml` skipped since the route is gated.
- Colors come from existing semantic tokens in `index.css` (status growing/declining/stable already map to the green/amber/red scale the threat badges need) — no hardcoded hex values, so the dark executive theme stays intact.
- `SeoHead` used with a `noindex` flag, matching other authenticated pages.
- All comparison logic is pure and typed, so it can be moved server-side unchanged later.

## Deliberately out of scope for this prototype

Supabase tables, scraping/AI extraction of competitor features, vendor and date-range filters, CSV/PDF export, Slack webhook, CRM links, admin editing of the baseline. These are the follow-on phases once the layout and analysis model are approved.

## Follow-on phases (for reference, not built now)

1. Move `OUR_FEATURES` and `COMPETITOR_FEATURES` into the database with owner-scoped policies and an admin editor.
2. Extend the daily pipeline to extract competitor features from articles into that table.
3. AI semantic matching, richer threat scoring, historical archive view, export and Slack wiring.

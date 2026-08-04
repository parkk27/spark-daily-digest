# Compare → Competitive Intelligence Workspace

Rework `/compare` from a release-timeline parity view into a capability-based competitive intelligence workspace centred on Microsoft Fabric Spark. Same visual language, cards, sticky filters and dark executive theme — new terminology, new content model, better decision support.

## What changes conceptually

Today the page matches a competitor announcement to one of our features and scores the gap by who shipped first (`timeline_delta_days`, "We lead / We lag", "Announced <date>"). All timeline-based framing is removed. Each card becomes a current-capability benchmark: what the competitor does today vs what Fabric Spark does today, plus positioning, impact and actions.

Competitors covered: Databricks, Google BigQuery, AWS EMR, Snowflake, Apache Spark ecosystem.

## Card layout (same shell, new sections)

```text
┌ Databricks · Competitive · High customer impact ───────────────┐
│ Competitor capability          │ Microsoft Fabric Spark        │
│ current capability description │ current capability description│
│ Capability gap: one-sentence assessment                        │
│ Fabric differentiators  ·  Competitor differentiators          │
│ Confidence: High (4 sources · updated Jul 2026 · vendor docs)  │
│ [ Show analysis ▾ ]                                            │
│   Customer impact                                              │
│   Strategic recommendation: Product / Sales / GTM / CS         │
│   Product recommendation: Accelerate                           │
│   Executive actions: PM · Sales · Engineering · Leadership     │
│   Related articles (linked sources)                            │
│   [ Copy briefing ]   [ Share to Slack (disabled) ]            │
└────────────────────────────────────────────────────────────────┘
```

- Competitive position badge: Leader / Competitive / Emerging (replaces the gap badge).
- Confidence chip: High / Medium / Low, derived from source count, recency and whether vendor documentation confirms it.
- Executive actions render as four short checklists, one line each.
- Cards sort by customer impact, then confidence.

## Filters and header

- Category tabs stay (Performance, Cost, AI/ML, Governance) and gain a vendor filter row.
- Header summary changes from threat counts to position counts: "N capabilities benchmarked · X leader · Y competitive · Z emerging".
- Page title becomes "Competitive intelligence workspace"; subtitle describes current-capability benchmarking, not announcements.

## Data model (`src/data/features.ts`, rewritten)

Replaces `OUR_FEATURES` / `COMPETITOR_FEATURES` / `compareFeatures()`:

- `CapabilityBenchmark[]` — one entry per competitor capability area, each with: vendor, category, capability name, competitor description, Fabric Spark description, position, capability-gap sentence, Fabric differentiators, competitor differentiators, customer impact, strategic recommendation split by Product/Sales/GTM/CS, product recommendation (Investigate / Monitor / Validate / Accelerate / Deprioritize), confidence with its supporting signals, and related articles (title + link + source).
- Label maps for position, product recommendation, confidence and vendors (adds AWS EMR and Apache Spark ecosystem).
- Pure selector helpers for filtering and counting so the set can move to the database unchanged later.
- Seed content: roughly 15-18 benchmarks spread across the five competitors and four categories, written as current capabilities with no dates-shipped framing.

## Files

- `src/data/features.ts` — rewritten to the benchmark model.
- `src/components/compare/ComparisonBadges.tsx` — `PositionBadge`, `ImpactBadge`, `ConfidenceBadge`; drop `GapBadge`, keep the existing token-based styling.
- `src/components/compare/ComparisonCard.tsx` — new sections, timeline block removed, "Copy RFP response" becomes "Copy briefing" with the full assessment text.
- `src/components/compare/ExecutiveActions.tsx` — new small component for the four role checklists.
- `src/pages/ComparisonPage.tsx` — vendor filter, new summary line, updated copy and SEO text.

No backend, no schema changes; existing colours, spacing and semantic tokens are reused so the page looks like the rest of the app.

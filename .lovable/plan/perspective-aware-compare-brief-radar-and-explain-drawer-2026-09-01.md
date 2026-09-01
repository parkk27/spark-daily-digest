# Perspective-aware Compare, Brief, Radar and Explain Drawer

Four additive changes that reuse the existing deterministic perspective + 30-day momentum foundation. No new tables, no duplicated signal data, no new AI calls.

## 1. Compare page reflects the selected perspective

- Add the perspective selector to the Compare header, replacing the hardcoded "Perspective: Microsoft Fabric Spark" chip.
- The benchmark dataset stays a single source of truth. Instead of copying rows per perspective, each benchmark row is *scored* against the selected perspective using the existing relevance function (topics, aliases, technologies, competitors).
- Competitor filter chips are derived from the selected perspective's competitor list; rows that no longer belong to the perspective's benchmark universe are hidden rather than duplicated.
- Rows are ordered by perspective relevance, and each card shows a small relevance chip plus the matched terms behind it.
- When a perspective has no benchmarked capabilities yet, an explicit empty state says so instead of silently falling back to Fabric.

## 2. Momentum explain drawer

- Clicking a momentum chip opens a side drawer (replacing today's small inline expansion) that shows, in labelled sections:
  - Momentum: current vs previous 30-day activity, percent change, direction, and the exact band thresholds used.
  - Perspective relevance: score plus each contributing component and its cap.
  - Strategic impact: score plus the weighted factors that produced it.
  - Evidence confidence: score, label, and the low-data threshold.
  - Top trend drivers: ranked with current/baseline counts and contribution.
  - Radar eligibility: the three thresholds (impact, relevance, confidence), which are met, and the promote action for eligible trends.
- Every number shown is already computed deterministically; nothing is invented and unavailable components are omitted rather than defaulted.

## 3. Today's Spark Brief uses 30-day momentum

- The Home brief loads the cached perspective momentum alongside today's snapshot.
- Highlights, trends and impact sections are re-ranked and annotated so items tied to entities with strong momentum surface first, each carrying its momentum chip.
- A short perspective line states the window, the number of entities with sufficient data, and how many are low-data — so the brief is honest when evidence is thin.
- Existing daily summary text remains the source of the wording; momentum only orders and annotates it.

## 4. Recommendations reflect the perspective

- On the Radar / recommendations surface, each recommendation is scored with the same relevance function and matched against momentum for its related technologies and vendor.
- Each card gains: a perspective relevance chip, the momentum chip for its strongest matched entity, and an inline "why this matches your perspective" list of matched terms.
- A filter toggle limits the list to recommendations relevant to the selected perspective; off by default so nothing disappears unexpectedly.
- Sorting gains a "perspective fit" option, leaving current lifecycle sorting untouched.

## Technical notes

- Reuses `src/lib/perspectives.ts`, `src/lib/perspectiveScoring.ts`, `src/lib/momentum.ts`, `usePerspective`, `usePerspectiveTrends`.
- New shared UI: `MomentumExplainDrawer` (shadcn Sheet) consumed by `MomentumChip`; the chip keeps its current compact appearance.
- Compare scoring is a pure helper next to the existing benchmark data; the benchmark rows themselves are unchanged.
- Thresholds are read from `MOMENTUM_CONFIG` so displayed values can never drift from the model.
- Unit tests: compare relevance ordering/filtering, brief ordering with and without momentum, recommendation matching, and threshold display values.

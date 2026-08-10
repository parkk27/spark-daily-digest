# Action Radar 2.0 — Phase 1.1 Hardening

## Audit report (verified against the live database and code)

| # | Area | Status | Evidence |
|---|------|--------|----------|
| 1 | Signal classification | Works | All 59 recommendation rows have a `signal_type`; the edge function maps 8 deterministic patterns onto 7 types. |
| 2 | Polarity | Works, but skewed | Threat only fires for named competitor sources; sampled rows are all `neutral` because they come from Microsoft/Google market posts. |
| 3 | Six-factor breakdown | Partially broken | 23 of 59 rows (the older date) still have an empty `score_breakdown` — they predate the migration and were never regenerated. |
| 4 | Decision creation | Works | Workspace writes to `decision_records` with a unique key per user + recommendation. |
| 5 | Decision editing | Works but destructive | Editing upserts in place; the previous decision is overwritten and unrecoverable (0 rows today, so no data lost yet). |
| 6 | Legacy status sync | Works | Each decision mirrors into `recommendation_status` with unchanged legacy values. |
| 7 | RLS / isolation | Correct | Single policy scoped to `auth.uid() = user_id`; no cross-user read path. |
| 8 | My decisions filter | Works | Client-side filter on the decisions map. |
| 9 | Persistence | Works across refresh/logout, fails across radar refresh | See #10. |
| 10 | Radar refresh | Confirmed data-loss bug | `generate-recommendations` deletes all rows for the snapshot date and reinserts new UUIDs, and `decision_records.recommendation_id` has `ON DELETE CASCADE` — every decision for that day is silently deleted. This is the top-priority fix. |

## What Phase 1.1 will do

### A. Stable signal identity
Add a deterministic `signal_key` to `recommendations`, derived in the edge function from canonical source + normalized article identity (lowercased host + URL path when a link exists, otherwise source + slugified title). Refresh switches from delete-and-reinsert to an upsert on `(date, signal_key)`, so UUIDs survive. Decision records gain their own `signal_key` column and resolve by key, so a decision stays attached even if a row is ever recreated.

### B. Decision history (append-only)
New `decision_record_history` table. Every change writes the outgoing decision into history before the current row updates. The Radar card shows current decision, previous decision, when it changed, and the reason given for the change. The Workspace asks for a "reason for change" when a decision already exists.

### C. Review date
When `review_date` is in the past and the decision is unresolved, the card shows a "Needs review" flag, plus a "Needs review" filter next to "My decisions". The review prompt offers: Review now (opens Workspace), Extend review date (+14 days), Change decision, Resolve.

### D. Backfill
One migration backfills `signal_key`, and fills `signal_type`, `polarity` and `score_breakdown` for the 23 legacy rows using the same deterministic rules as the edge function — no manual radar refresh needed.

### E. Testing
Vitest coverage for the pure scoring/identity/review helpers: all seven signal types, all three polarities, all five decision types, edit-then-history, review-overdue boundary, invalid/empty form states, missing score data, and low-confidence/high-impact plus high-confidence/low-impact cases. RLS isolation, persistence and refresh durability are verified with database queries and documented in the final report.

## Technical detail

- Migration 1: `recommendations.signal_key text` + unique `(date, signal_key)`; `decision_records.signal_key text`; change the decision FK to `ON DELETE SET NULL` on `recommendation_id` so a lost row never deletes a decision; backfill legacy classification fields.
- Migration 2: `decision_record_history` (decision_record_id, user_id, decision, reason, stakeholders, next_step, review_date, changed_at, change_reason) with user-scoped RLS and grants for `authenticated` / `service_role`.
- `supabase/functions/generate-recommendations/index.ts`: compute `signal_key`, replace `delete + insert` with `upsert(onConflict: "date,signal_key")`.
- `src/lib/signalIdentity.ts` (new): shared normalization + review-status helpers, unit-tested.
- `src/hooks/useRecommendations.ts`: history write inside `upsertDecision`, expose `useDecisionHistory`, key decisions by `signal_key` with UUID fallback.
- `src/components/DecisionWorkspace.tsx`: change-reason field, extend-review action.
- `src/pages/ActionRadarPage.tsx`: previous-decision line, Needs review chip + filter + inline actions.

No new LLM calls, scoring stays deterministic, existing `recommendation_status` values unchanged.

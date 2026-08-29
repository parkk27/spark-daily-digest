# Action Radar Phase 2 — Signal → Review → Decision → Action → Outcome

Additive evolution of the existing Radar. No new recommendation engine, no new tables beyond one lifecycle addition, no redesign of other pages.

## What already exists (verified)

- `recommendations` with `signal_key`, `section`, `owner`, `priority`, `confidence`, `signal_type`, `polarity`, `score_breakdown`, `evidence`, `related_vendor`, `related_technologies`.
- `decision_records` (decision, reason, stakeholders, next_step, review_date, status) + append-only `decision_record_history`, both RLS-scoped to the user.
- `recommendation_status` mirror (`open` / `in_progress` / `dismissed` / `resolved`).
- `useRecommendations.ts` hooks: recommendations, statuses, decision upsert with history archive, review extension, resolve.
- `ActionRadarPage.tsx` with three sections (Act now / Watch / Deprioritize) and toggles: role filter, "My decisions", "Needs review".
- `EvidencePopover`, `DecisionWorkspace`, `DecisionSummary`, `signalIdentity.ts` (review state, overdue, addDays).
- Compare page driven by static `src/data/features.ts` benchmarks (no DB writes today).
- `analytics_events` + `useTrackEvent` for telemetry.

## Phase 2A — Workflow foundation

- New lifecycle derivation module `src/lib/radarLifecycle.ts`: maps each signal to `needs_review | act_now | tracking | action_in_progress | completed` using existing decision + status data (no new decision values).
- Rename the "My Decisions" surface to **My Radar** with four lanes: Needs My Review, I'm Tracking, Actions in Progress, Completed. Existing records are unchanged and stay visible.
- Radar header becomes "Your attention this week" with real counts: Act Now, Need Review, Tracking, Reviews Due. Item total moves to secondary text.
- Compact "This week" summary strip above the lanes.
- Meaningful empty states per lane (exact copy from the brief).

## Phase 2B — Intelligence context on the card

Radar Card 2.0 keeps the current visual language, restructured hierarchy with progressive disclosure:

- Signal title + explicit competitive framing: **Our platform: Microsoft Fabric Spark** vs. named competitor (from `related_vendor`). Never "we"/"they".
- "What changed" (article summary) and "Why it matters" (deterministic from `signal_type`, `polarity`, matched score factors).
- Impact chips derived from `score_breakdown` (competitive, customer, capability/commercial, urgency). Missing factors render as "Unknown", never invented.
- Confidence band High/Medium/Low from `confidence`, shown separately from Priority.
- Evidence freshness from the recommendation `date` / evidence timestamps; "Freshness unavailable" when absent.
- Collapsible "Why am I seeing this?" — up to 3 deterministic reasons from role match, competitor identity, momentum, evidence confidence.
- Competitive context block: capability + our position / competitor position, defaulting to "Unknown" unless the Compare benchmark data has a match.

## Phase 2C — Decision → Action

Additive migration on `decision_records` (no new table):

```
action text, action_owner text, action_due_date date,
outcome text, outcome_notes text, completed_at timestamptz
```

Existing RLS policy (`auth.uid() = user_id`) already covers these columns; mirrored into `decision_record_history` too.

`DecisionWorkspace` becomes a 4-step flow: Review → Decide (existing five options unchanged) → Act (action, owner, due date) → Confirm. Completing an action captures a structured outcome from a fixed list plus optional notes.

## Phase 2D — Strategic layer

- **Compare → Add to Action Radar**: on a benchmark row with a gap/movement, create a recommendation row through a small edge-function path (service role) keyed by a deterministic `signal_key`, so re-adding reuses the same signal instead of duplicating.
- **Radar delta**: `generate-recommendations` compares the incoming set against the stored rows for the signal key and returns counts of new / changed / escalated / unchanged; the UI shows "Radar updated X ago" with that summary. Resolved counts come from user decision state. Any metric without backing data is shown as unavailable, not fabricated.
- **Emerging themes**: deterministic grouping by shared `related_technologies` tag + `signal_type`, showing vendor breakdown. Only rendered when a group has 3+ signals; no LLM, no speculative themes.

## Technical notes

- Migrations are additive `ALTER TABLE ... ADD COLUMN`; existing status values (`open`, `in_progress`, `dismissed`, `resolved`, `investigating`) are preserved and continue to be mirrored.
- All mutations use existing React Query invalidation so cards and counts update in place with no page reload.
- Role filter results show the lifecycle breakdown (relevant / Act Now / Needs Review / Tracking / Completed) rather than a bare item count; role and lifecycle filters compose without hiding valid records.
- Telemetry through existing `useTrackEvent`: radar_view, radar_refresh, radar_item_reviewed, decision_created, action_created, action_completed, radar_filter_role, radar_filter_status, compare_to_radar.
- No service-role work moves into the frontend; radar writes stay in the edge function.

## Known limitations up front

- Capability positions on the card are only as good as the static Compare benchmark data; unmatched signals show "Unknown".
- Deduplication of multiple articles about the same event is not attempted in this phase (no reliable existing key); clustering is presented as themes instead.
- Delta comparison starts from the first refresh after this ships; earlier history is unavailable.

## Verification

Build + typecheck, existing 18 unit tests plus new lifecycle/mapping tests, and a Playwright pass over the Radar covering the 16 listed test cases that can be exercised without new production data.

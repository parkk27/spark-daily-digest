# Action Radar 2.0 — Phase 1: Signal → Decision

Extends the existing Radar (recommendations + recommendation_status + the deterministic scoring function). Nothing existing is removed or renamed.

## What changes for the user

- Each Radar card shows what kind of signal it is (commercial, technology, competitive, ...) and whether it reads as an opportunity, a threat, or neutral.
- The "Why" popover now shows the score broken into six named factors instead of one unexplained confidence number.
- The four status buttons are replaced by a single "Take action" button that opens a Decision Workspace: pick one of five responses, give a reason, optionally tag stakeholders, a next step and a review date. That saves a Decision Record.
- Once a decision exists, the card shows it collapsed (decision, reason, review date) with a "Change decision" link.
- A new "My decisions" filter chip shows only signals you have decided on.

## Build steps

**1. Database (additive migration)**
- Add `signal_type`, `polarity`, `score_breakdown` to `recommendations` with the constraints and defaults from the PRD.
- Create `decision_records` (decision, reason, stakeholders, next step, review date, status; unique per user + recommendation) with grants, RLS restricted to the owning user, updated-at trigger, and a user index.

**2. `generate-recommendations` edge function (deterministic, no AI)**
- Add `signalType` to each of the 8 `SIGNALS` entries per the prompt's mapping.
- `signal_type` = first matched pattern's type, fallback `market`; overridden to `competitive` when the source is an official named competitor (Databricks, AWS, Google, Snowflake) and no stronger pattern type applies.
- `polarity`: `threat` when official + named competitor (Microsoft/Fabric excluded); `opportunity` when `boost` is true and not competitor-attributed; else `neutral`.
- `score_breakdown` (0–100 each), from values already computed in the function:
  - strategic_relevance = matched weight sum scaled to 100
  - customer_impact = 90 if a customer-type pattern matched, else 25
  - competitive_intensity = 95 threat / 60 competitive type / 20 otherwise
  - momentum = 85 if `boost`, else 35
  - evidence_confidence = official flag + matched count (reuses current confidence inputs)
  - urgency = priority mapped high 90 / medium 60 / low 30
- Backfill: existing rows keep the column defaults until the next "Refresh radar" run regenerates the day's rows.

**3. `src/hooks/useRecommendations.ts`**
- Extend the `Recommendation` interface with the three new fields.
- Add `useDecisionRecords()`: query keyed `["decision-records", user?.id]` returning a `recommendation_id → DecisionRecord` map, plus `upsertDecision(...)` which upserts `decision_records` (on conflict user+recommendation) and mirrors into `recommendation_status` per the mapping table (investigate/customer_research → in_progress, positioning → in_progress, monitor → open, no_action → dismissed), invalidating both queries.

**4. `src/components/DecisionWorkspace.tsx` (new)**
- shadcn `Dialog`, heading "How should Microsoft Fabric Spark respond to this signal?" (platform name imported from `@/lib/executive`).
- Five selectable option cards with the PRD one-liners; selecting one reveals reason (required), stakeholder chips (Sales, Engineering, Finance, Leadership, GTM), next step, review date (shadcn date picker with `pointer-events-auto`).
- Submit → `upsertDecision`, close, sonner toast. Pre-fills when editing an existing record.

**5. `src/pages/ActionRadarPage.tsx`**
- Signal-type `MetaChip` + polarity icon (ArrowUp / AlertTriangle / Minus) beside the priority chip.
- `EvidencePopover` gains an optional `breakdown` prop rendering the six factors as a labeled list above the evidence bullets.
- Status button row replaced by the collapsed Decision Record or the "Take action" button.
- New "My decisions" toggle chip next to "Filter to my role".

## Technical notes

- All classification stays regex/threshold-based inside the edge function — no new model calls, no new secrets.
- `recommendation_status` and its four values are untouched; the mirror write keeps the existing data and any other consumers valid.
- Styling reuses `SurfaceCard`, `MetaChip`, `Button`, `Dialog` and existing tokens only.

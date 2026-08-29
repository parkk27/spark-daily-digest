import { useState } from "react";
import { ArrowUp, AlertTriangle, ChevronDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SurfaceCard from "@/components/ui/surface-card";
import MetaChip from "@/components/ui/meta-chip";
import EvidencePopover from "@/components/EvidencePopover";
import BookmarkButton from "@/components/BookmarkButton";
import DecisionSummary from "@/components/DecisionSummary";
import { cn } from "@/lib/utils";
import { DECISION_LABELS, type DecisionRecord, type Recommendation } from "@/hooks/useRecommendations";
import {
  OUR_PLATFORM_LABEL,
  WORKFLOW_STATE_LABELS,
  competitiveContext,
  confidenceBand,
  freshnessLabel,
  impactBands,
  isReviewDue,
  recommendedPmAction,
  significanceOf,
  whyAmISeeingThis,
  type Lane,
} from "@/lib/radarLifecycle";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  competitive: "Competitive",
  customer: "Customer",
  technology: "Technology",
  market: "Market",
  commercial: "Commercial",
  regulatory: "Regulatory",
  ecosystem: "Ecosystem",
};

const PolarityIcon = ({ polarity }: { polarity: string }) => {
  if (polarity === "opportunity")
    return <ArrowUp className="h-3.5 w-3.5 text-status-growing" aria-label="Opportunity" />;
  if (polarity === "threat")
    return <AlertTriangle className="h-3.5 w-3.5 text-status-declining" aria-label="Threat" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-label="Neutral" />;
};

interface Props {
  recommendation: Recommendation;
  decision?: DecisionRecord;
  lane: Lane;
  roleFocus: string;
  onReview: () => void;
  onCompleteAction: () => void;
}

/** Radar Card 2.0 — signal, competitive context, impact, evidence, workflow state, CTA. */
const RadarCard = ({
  recommendation: r,
  decision,
  lane,
  roleFocus,
  onReview,
  onCompleteAction,
}: Props) => {
  const [open, setOpen] = useState(false);
  const ctx = competitiveContext(r);
  const impacts = impactBands(r);
  const reasons = whyAmISeeingThis(r, roleFocus);
  const overdue = isReviewDue(decision);

  return (
    <SurfaceCard
      as="article"
      interactive
      accent={lane === "act_now"}
      raised={lane === "act_now"}
      className="p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-border bg-surface-3 px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
              {WORKFLOW_STATE_LABELS[lane]}
            </span>
            {overdue && (
              <span className="rounded-md border border-status-declining/30 bg-status-declining/10 px-1.5 py-0.5 text-[0.7rem] font-medium text-status-declining">
                Review overdue
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-foreground">{r.title}</h3>
        </div>
        <BookmarkButton
          kind="recommendation"
          refId={r.id}
          title={r.title}
          source={r.related_vendor}
        />
      </div>

      {ctx && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Our platform:</span> {OUR_PLATFORM_LABEL}
          <span className="mx-1.5 opacity-50">·</span>
          <span className="font-medium text-foreground">Compared with:</span> {ctx.competitor}
        </p>
      )}

      <div className="mt-3 space-y-2">
        <div>
          <p className="eyebrow text-muted-foreground">What changed</p>
          <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">{r.summary}</p>
        </div>
        <div>
          <p className="eyebrow text-muted-foreground">Why it matters</p>
          <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
            {significanceOf(r)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MetaChip
          label="Priority"
          value={<span className="capitalize">{r.priority}</span>}
          tone={r.priority === "high" ? "declining" : "neutral"}
        />
        <MetaChip label="Confidence" value={confidenceBand(r.confidence)} />
        <MetaChip
          label="Signal"
          value={
            <span className="inline-flex items-center gap-1">
              <PolarityIcon polarity={r.polarity} />
              {SIGNAL_TYPE_LABELS[r.signal_type] ?? r.signal_type}
            </span>
          }
        />
        <MetaChip label="Owner" value={<span className="capitalize">{r.owner}</span>} />
        <EvidencePopover
          confidence={r.confidence}
          evidence={[
            ...(Array.isArray(r.evidence) ? (r.evidence as string[]) : []),
            freshnessLabel(r.date),
          ]}
          why={r.rationale ?? undefined}
          breakdown={r.score_breakdown ?? undefined}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        {open ? "Hide detail" : "Impact, evidence & why am I seeing this?"}
      </Button>

      {open && (
        <div className="mt-2 space-y-4 border-t border-border-subtle pt-3">
          <div>
            <p className="eyebrow text-muted-foreground">Impact on {OUR_PLATFORM_LABEL}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {impacts.map((i) => (
                <MetaChip key={i.label} label={i.label} value={i.value} />
              ))}
            </div>
          </div>

          {ctx && (
            <div>
              <p className="eyebrow text-muted-foreground">Competitive context</p>
              <dl className="mt-1.5 grid gap-1.5 text-xs sm:grid-cols-2">
                {(
                  [
                    ["Capability", ctx.capability],
                    ["Competitor", ctx.competitor],
                    [`${OUR_PLATFORM_LABEL} position`, ctx.ourPosition],
                    ["Competitor position", ctx.competitorPosition],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5"
                  >
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <p className="eyebrow text-muted-foreground">Evidence</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.evidence_count} source signal{r.evidence_count === 1 ? "" : "s"} ·{" "}
              {confidenceBand(r.confidence)} confidence · {freshnessLabel(r.date)}
            </p>
          </div>

          {reasons.length > 0 && (
            <div>
              <p className="eyebrow text-muted-foreground">Why am I seeing this?</p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="text-primary">·</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-border-subtle pt-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Recommended PM action: </span>
          {recommendedPmAction(r)}
        </p>

        {decision ? (
          <div className="space-y-2">
            <DecisionSummary decision={decision} onChangeDecision={onReview} />
            {decision.action && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Action: </span>
                {decision.action}
                {decision.action_owner ? ` · ${decision.action_owner}` : ""}
                {decision.action_due_date ? ` · due ${decision.action_due_date}` : ""}
              </p>
            )}
            {decision.outcome && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Outcome: </span>
                {decision.outcome}
                {decision.outcome_notes ? ` — ${decision.outcome_notes}` : ""}
              </p>
            )}
            {lane === "action_in_progress" && (
              <Button size="sm" variant="outline" onClick={onCompleteAction}>
                Complete action
              </Button>
            )}
            {lane === "tracking" && (
              <p className="text-[0.7rem] text-muted-foreground">
                Tracking as “{DECISION_LABELS[decision.decision]}”
                {decision.review_date ? ` · review ${decision.review_date}` : ""}
              </p>
            )}
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={onReview}>
            Review &amp; decide
          </Button>
        )}
      </div>
    </SurfaceCard>
  );
};

export default RadarCard;

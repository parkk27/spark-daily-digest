import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DECISION_LABELS,
  useDecisionHistory,
  useDecisionRecords,
  type DecisionRecord,
} from "@/hooks/useRecommendations";
import { addDays, reviewState } from "@/lib/signalIdentity";

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

interface Props {
  decision: DecisionRecord;
  onChangeDecision: () => void;
}

/** Current decision, the decision it replaced, and the review prompt when it is overdue. */
const DecisionSummary = ({ decision, onChangeDecision }: Props) => {
  const { extendReview, resolveDecision } = useDecisionRecords();
  const { data: history = [] } = useDecisionHistory(decision.signal_key);
  const previous = history[0];
  const review = reviewState(decision.review_date, decision.status);
  const resolved = decision.status === "resolved" || decision.status === "dismissed";

  const extend = async () => {
    try {
      await extendReview.mutateAsync({
        id: decision.id,
        review_date: addDays(decision.review_date, 14),
      });
      toast.success("Review date extended by 14 days");
    } catch {
      toast.error("Could not extend the review date");
    }
  };

  const resolve = async () => {
    try {
      await resolveDecision.mutateAsync(decision);
      toast.success("Decision resolved");
    } catch {
      toast.error("Could not resolve the decision");
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium text-primary">{DECISION_LABELS[decision.decision]}</span>
        {decision.reason && <span className="text-muted-foreground">{decision.reason}</span>}
        {decision.review_date && (
          <span className={review === "overdue" ? "text-status-declining" : "text-muted-foreground"}>
            Review {shortDate(decision.review_date)}
          </span>
        )}
        {resolved && <span className="text-muted-foreground">Resolved</span>}
        <button
          onClick={onChangeDecision}
          className="ml-auto text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Change decision
        </button>
      </div>

      {previous && (
        <p className="text-muted-foreground">
          Previously <span className="text-foreground">{DECISION_LABELS[previous.decision]}</span>,
          changed {shortDate(previous.changed_at)}
          {previous.change_reason ? ` — ${previous.change_reason}` : ""}
        </p>
      )}

      {review === "overdue" && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-status-declining/30 bg-status-declining/5 p-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-status-declining">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Needs review
          </span>
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={onChangeDecision}>
            Review now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={extend}
            disabled={extendReview.isPending}
          >
            Extend 14 days
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={resolve}
            disabled={resolveDecision.isPending}
          >
            Resolve
          </Button>
        </div>
      )}
    </div>
  );
};

export default DecisionSummary;

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DECISION_LABELS,
  useDecisionRecords,
  type DecisionKind,
} from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";

const BULK_DECISIONS: DecisionKind[] = ["monitor", "investigate", "customer_research"];

export interface BulkTarget {
  recommendationId: string;
  signalKey: string;
}

interface Props {
  targets: BulkTarget[];
  onClear: () => void;
  onApplied: (decision: DecisionKind, count: number) => void;
}

/** Apply one decision — and optionally one shared action — to many selected signals. */
const BulkActionBar = ({ targets, onClear, onApplied }: Props) => {
  const { bulkDecision } = useDecisionRecords();
  const [decision, setDecision] = useState<DecisionKind>("monitor");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  const apply = async () => {
    if (!reason.trim()) {
      toast.error("Add a reason so the audit trail stays meaningful");
      return;
    }
    try {
      const count = await bulkDecision.mutateAsync({
        targets,
        decision,
        reason: reason.trim(),
        stakeholders: [],
        next_step: action.trim() || null,
        action: action.trim() || null,
        action_owner: owner.trim() || null,
        action_due_date: due || null,
        review_date: reviewDate || null,
        change_reason: "Bulk update",
      });
      toast.success(`${count} signal${count === 1 ? "" : "s"} updated`, {
        description: DECISION_LABELS[decision],
      });
      setReason("");
      setAction("");
      onApplied(decision, count);
    } catch {
      toast.error("Could not apply the bulk update");
    }
  };

  return (
    <div className="sticky bottom-4 z-30 rounded-xl border border-primary/30 bg-surface-2/95 p-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {targets.length} signal{targets.length === 1 ? "" : "s"} selected
        </p>
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
          <X className="h-4 w-4" /> Clear selection
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {BULK_DECISIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDecision(d)}
            aria-pressed={decision === d}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              decision === d
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-surface-3"
            )}
          >
            {DECISION_LABELS[d]}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="bulk-reason" className="text-xs">
            Reason (required)
          </Label>
          <Input
            id="bulk-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reviewed in weekly radar triage"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bulk-action" className="text-xs">
            Shared action (optional)
          </Label>
          <Input
            id="bulk-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Review competitive battlecard"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bulk-owner" className="text-xs">
            Action owner (optional)
          </Label>
          <Input
            id="bulk-owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Product"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="bulk-due" className="text-xs">
              Action due
            </Label>
            <Input id="bulk-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bulk-review" className="text-xs">
              Review date
            </Label>
            <Input
              id="bulk-review"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={apply} disabled={bulkDecision.isPending}>
          {bulkDecision.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Apply to {targets.length}
        </Button>
        <p className="text-[0.7rem] text-muted-foreground">
          Each change is archived to the signal history.
        </p>
      </div>
    </div>
  );
};

export default BulkActionBar;

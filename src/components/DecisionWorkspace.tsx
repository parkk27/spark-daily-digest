import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { OUR_PLATFORM } from "@/lib/executive";
import {
  DECISION_DESCRIPTIONS,
  DECISION_LABELS,
  useDecisionRecords,
  type DecisionKind,
  type DecisionRecord,
} from "@/hooks/useRecommendations";

const DECISIONS: DecisionKind[] = [
  "investigate",
  "positioning",
  "customer_research",
  "monitor",
  "no_action",
];

const STAKEHOLDERS = ["Sales", "Engineering", "Finance", "Leadership", "GTM"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendationId: string;
  /** Stable signal identity — decisions attach to this, not to the recommendation UUID. */
  signalKey: string;
  signalTitle: string;
  existing?: DecisionRecord;
}

/** Structured PM response to a signal — turns a recommendation into an auditable Decision Record. */
const DecisionWorkspace = ({
  open,
  onOpenChange,
  recommendationId,
  signalKey,
  signalTitle,
  existing,
}: Props) => {
  const { upsertDecision } = useDecisionRecords();
  const [decision, setDecision] = useState<DecisionKind | null>(null);
  const [reason, setReason] = useState("");
  const [stakeholders, setStakeholders] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [actionDue, setActionDue] = useState("");
  const [reviewDate, setReviewDate] = useState<Date | undefined>();
  const [changeReason, setChangeReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setDecision(existing?.decision ?? null);
    setReason(existing?.reason ?? "");
    setStakeholders(existing?.stakeholders ?? []);
    setNextStep(existing?.action ?? existing?.next_step ?? "");
    setActionOwner(existing?.action_owner ?? "");
    setActionDue(existing?.action_due_date ?? "");
    setReviewDate(existing?.review_date ? new Date(existing.review_date) : undefined);
    setChangeReason("");
  }, [open, existing]);


  const isChange = !!existing;
  const canSubmit =
    !!decision && !!reason.trim() && (!isChange || !!changeReason.trim()) && !upsertDecision.isPending;

  const toggleStakeholder = (name: string) =>
    setStakeholders((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );

  const submit = async () => {
    if (!decision || !reason.trim() || (isChange && !changeReason.trim())) return;
    try {
      await upsertDecision.mutateAsync({
        recommendationId,
        signalKey,
        decision,
        reason: reason.trim(),
        stakeholders,
        next_step: nextStep.trim() || null,
        action: nextStep.trim() || null,
        action_owner: actionOwner.trim() || null,
        action_due_date: actionDue || null,
        review_date: reviewDate ? format(reviewDate, "yyyy-MM-dd") : null,
        change_reason: isChange ? changeReason.trim() : null,
      });
      onOpenChange(false);
      toast.success("Decision Record saved", { description: DECISION_LABELS[decision] });
    } catch {
      toast.error("Could not save the Decision Record");
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            How should {OUR_PLATFORM} respond to this signal?
          </DialogTitle>
          <DialogDescription className="text-xs">{signalTitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDecision(d)}
              aria-pressed={decision === d}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                decision === d
                  ? "border-primary/50 bg-primary/10"
                  : "border-border hover:bg-surface-3"
              )}
            >
              <span className="block text-sm font-medium text-foreground">
                {DECISION_LABELS[d]}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {DECISION_DESCRIPTIONS[d]}
              </span>
            </button>
          ))}
        </div>

        {decision && (
          <div className="space-y-4 border-t border-border-subtle pt-4">
            {isChange && (
              <div className="space-y-1.5">
                <Label htmlFor="decision-change-reason" className="text-xs">
                  Why is this changing from “{DECISION_LABELS[existing!.decision]}”?{" "}
                  <span className="text-muted-foreground">(required)</span>
                </Label>
                <Input
                  id="decision-change-reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="New evidence from customer calls"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  The previous decision is preserved in the decision history.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="decision-reason" className="text-xs">
                Reason <span className="text-muted-foreground">(required)</span>
              </Label>
              <Input
                id="decision-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Potential customer evaluation impact"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">Stakeholders</span>
              <div className="flex flex-wrap gap-1.5">
                {STAKEHOLDERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStakeholder(s)}
                    aria-pressed={stakeholders.includes(s)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs transition-colors",
                      stakeholders.includes(s)
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-surface-3"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="decision-next-step" className="text-xs">
                Step 3 — Action: what should happen next?{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="decision-next-step"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Interview 5 customers"
                list="decision-action-suggestions"
              />
              <datalist id="decision-action-suggestions">
                {ACTION_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="decision-action-owner" className="text-xs">
                Action owner <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="decision-action-owner"
                value={actionOwner}
                onChange={(e) => setActionOwner(e.target.value)}
                placeholder="Product"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="decision-action-due" className="text-xs">
                Action due date <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="decision-action-due"
                type="date"
                value={actionDue}
                onChange={(e) => setActionDue(e.target.value)}
              />
            </div>


            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                Review date <span className="text-muted-foreground">(optional)</span>
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reviewDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reviewDate ? format(reviewDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reviewDate}
                    onSelect={setReviewDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={!canSubmit}
          >
            {upsertDecision.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionWorkspace;

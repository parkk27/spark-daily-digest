import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { OUTCOMES, useDecisionRecords, type DecisionRecord } from "@/hooks/useRecommendations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: DecisionRecord;
  signalTitle: string;
  onCompleted?: () => void;
}

/** Closes the loop: SIGNAL → DECISION → ACTION → OUTCOME. */
const CompleteActionDialog = ({ open, onOpenChange, record, signalTitle, onCompleted }: Props) => {
  const { completeAction } = useDecisionRecords();
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setOutcome(record.outcome ?? null);
    setNotes(record.outcome_notes ?? "");
  }, [open, record]);

  const submit = async () => {
    if (!outcome) return;
    try {
      await completeAction.mutateAsync({ record, outcome, outcome_notes: notes.trim() || null });
      onOpenChange(false);
      onCompleted?.();
      toast.success("Action completed", { description: outcome });
    } catch {
      toast.error("Could not record the outcome");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">What was the outcome?</DialogTitle>
          <DialogDescription className="text-xs">{signalTitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              aria-pressed={outcome === o}
              className={cn(
                "rounded-lg border p-2.5 text-left text-sm transition-colors",
                outcome === o
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-surface-3"
              )}
            >
              {o}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="outcome-notes" className="text-xs">
            Notes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="outcome-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What we learned"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!outcome || completeAction.isPending}>
            {completeAction.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Complete action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteActionDialog;

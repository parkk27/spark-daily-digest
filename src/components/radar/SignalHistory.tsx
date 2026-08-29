import { History } from "lucide-react";
import {
  DECISION_LABELS,
  useDecisionHistory,
  type DecisionRecord,
} from "@/hooks/useRecommendations";

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  signalKey: string;
  current?: DecisionRecord;
}

/** Append-only audit trail: every decision, action and outcome recorded for a signal. */
const SignalHistory = ({ signalKey, current }: Props) => {
  const { data: history = [], isLoading } = useDecisionHistory(signalKey);

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading history…</p>;
  if (!current && history.length === 0)
    return <p className="text-xs text-muted-foreground">No decisions recorded yet.</p>;

  return (
    <ol className="space-y-2 text-xs">
      {current && (
        <li className="rounded-md border border-primary/30 bg-primary/5 p-2">
          <p className="font-medium text-primary">
            Current — {DECISION_LABELS[current.decision]}
            <span className="ml-2 font-normal text-muted-foreground">
              {when(current.updated_at)}
            </span>
          </p>
          {current.reason && <p className="mt-0.5 text-muted-foreground">{current.reason}</p>}
          {current.action && (
            <p className="mt-0.5 text-muted-foreground">
              Action: {current.action}
              {current.action_owner ? ` · ${current.action_owner}` : ""}
              {current.action_due_date ? ` · due ${current.action_due_date}` : ""}
            </p>
          )}
          {current.outcome && (
            <p className="mt-0.5 text-muted-foreground">Outcome: {current.outcome}</p>
          )}
        </li>
      )}

      {history.map((h) => (
        <li key={h.id} className="rounded-md border border-border/60 p-2">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            <History className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {DECISION_LABELS[h.decision]}
            <span className="font-normal text-muted-foreground">{when(h.changed_at)}</span>
          </p>
          {h.change_reason && (
            <p className="mt-0.5 text-muted-foreground">Changed because: {h.change_reason}</p>
          )}
          {h.reason && <p className="mt-0.5 text-muted-foreground">{h.reason}</p>}
          {h.action && <p className="mt-0.5 text-muted-foreground">Action: {h.action}</p>}
          {h.outcome && <p className="mt-0.5 text-muted-foreground">Outcome: {h.outcome}</p>}
        </li>
      ))}
    </ol>
  );
};

export default SignalHistory;

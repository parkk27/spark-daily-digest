import { CheckSquare } from "lucide-react";
import { ROLE_LABELS, type CapabilityBenchmark } from "@/data/features";

const ORDER: (keyof CapabilityBenchmark["executive_actions"])[] = [
  "pm",
  "sales",
  "engineering",
  "leadership",
];

const ExecutiveActions = ({
  actions,
}: {
  actions: CapabilityBenchmark["executive_actions"];
}) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">Executive actions</p>
    <ul className="mt-2 grid gap-2 md:grid-cols-2">
      {ORDER.map((role) => (
        <li
          key={role}
          className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/20 p-3"
        >
          <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{ROLE_LABELS[role]}: </span>
            {actions[role]}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default ExecutiveActions;

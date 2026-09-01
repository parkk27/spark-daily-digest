import { Layers } from "lucide-react";
import type { AggregatedDriver } from "@/lib/briefNarrative";

/** Weighted drivers behind a momentum move — always traceable to observed activity. */
const DriversList = ({
  drivers,
  emptyLabel = "No driver had a material weighted change this window.",
}: {
  drivers: AggregatedDriver[];
  emptyLabel?: string;
}) => {
  if (!drivers.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {drivers.map((d) => (
        <li key={d.label} className="flex items-start gap-3 text-sm">
          <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <span className="font-medium capitalize text-foreground">{d.label}</span>
            {d.entities.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                via {d.entities.slice(0, 3).join(", ")}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {d.baseline} → {d.current} weighted signals
            </p>
          </div>
          <span
            className={`text-xs font-semibold ${d.contribution >= 0 ? "text-status-growing" : "text-status-declining"}`}
          >
            {d.contribution > 0 ? "+" : ""}
            {d.contribution}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default DriversList;

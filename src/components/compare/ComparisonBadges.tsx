import { cn } from "@/lib/utils";
import { Award, Scale, AlertTriangle, Siren } from "lucide-react";
import { GAP_LABELS, type GapStatus, type Severity } from "@/data/features";

const severityStyles: Record<Severity, string> = {
  high: "bg-status-declining/15 text-status-declining border-status-declining/30",
  medium: "bg-status-stable/15 text-status-stable border-status-stable/30",
  low: "bg-status-growing/15 text-status-growing border-status-growing/30",
};

const gapStyles: Record<GapStatus, string> = {
  we_lead: "bg-status-growing/15 text-status-growing border-status-growing/30",
  parity: "bg-status-new/15 text-status-new border-status-new/30",
  we_lag: "bg-status-stable/15 text-status-stable border-status-stable/30",
  they_have_only: "bg-status-declining/15 text-status-declining border-status-declining/30",
};

const gapIcons: Record<GapStatus, React.ElementType> = {
  we_lead: Award,
  parity: Scale,
  we_lag: AlertTriangle,
  they_have_only: Siren,
};

const base =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium";

export const ThreatBadge = ({ level, label = "threat" }: { level: Severity; label?: string }) => (
  <span className={cn(base, "capitalize", severityStyles[level])}>
    {level} {label}
  </span>
);

export const GapBadge = ({ status }: { status: GapStatus }) => {
  const Icon = gapIcons[status];
  return (
    <span className={cn(base, gapStyles[status])}>
      <Icon className="h-3 w-3" />
      {GAP_LABELS[status]}
    </span>
  );
};

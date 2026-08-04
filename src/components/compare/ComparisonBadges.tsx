import { cn } from "@/lib/utils";
import { Trophy, Swords, Sprout, ShieldCheck } from "lucide-react";
import {
  POSITION_LABELS,
  type Confidence,
  type Impact,
  type Position,
} from "@/data/features";

const base =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium";

const positionStyles: Record<Position, string> = {
  leader: "bg-status-growing/15 text-status-growing border-status-growing/30",
  competitive: "bg-status-new/15 text-status-new border-status-new/30",
  emerging: "bg-status-stable/15 text-status-stable border-status-stable/30",
};

const positionIcons: Record<Position, React.ElementType> = {
  leader: Trophy,
  competitive: Swords,
  emerging: Sprout,
};

const impactStyles: Record<Impact, string> = {
  high: "bg-status-declining/15 text-status-declining border-status-declining/30",
  medium: "bg-status-stable/15 text-status-stable border-status-stable/30",
  low: "bg-secondary text-secondary-foreground border-border",
};

const confidenceStyles: Record<Confidence, string> = {
  high: "bg-status-growing/15 text-status-growing border-status-growing/30",
  medium: "bg-status-stable/15 text-status-stable border-status-stable/30",
  low: "bg-status-declining/15 text-status-declining border-status-declining/30",
};

export const PositionBadge = ({ position }: { position: Position }) => {
  const Icon = positionIcons[position];
  return (
    <span className={cn(base, positionStyles[position])}>
      <Icon className="h-3 w-3" />
      {POSITION_LABELS[position]}
    </span>
  );
};

export const ImpactBadge = ({ impact }: { impact: Impact }) => (
  <span className={cn(base, "capitalize", impactStyles[impact])}>
    {impact} customer impact
  </span>
);

export const ConfidenceBadge = ({
  confidence,
  detail,
}: {
  confidence: Confidence;
  detail?: string;
}) => (
  <span className={cn(base, confidenceStyles[confidence])}>
    <ShieldCheck className="h-3 w-3" />
    <span className="capitalize">{confidence}</span> confidence
    {detail && <span className="font-normal opacity-70">· {detail}</span>}
  </span>
);

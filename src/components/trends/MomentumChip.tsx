import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { DIRECTION_LABEL, type PerspectiveTrend } from "@/lib/momentum";
import MomentumExplainDrawer from "@/components/trends/MomentumExplainDrawer";

const tone = (d: string) =>
  d === "LOW_DATA"
    ? "text-muted-foreground"
    : d.endsWith("UP")
      ? "text-status-growing"
      : d.endsWith("DOWN")
        ? "text-status-declining"
        : "text-muted-foreground";

const Icon = ({ d }: { d: string }) => {
  if (d === "LOW_DATA") return <HelpCircle className="h-3.5 w-3.5" />;
  if (d.endsWith("UP")) return <TrendingUp className="h-3.5 w-3.5" />;
  if (d.endsWith("DOWN")) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

/** 30-day momentum chip. Click opens the full deterministic explanation drawer. */
const MomentumChip = ({ trend }: { trend?: PerspectiveTrend }) => {
  const [open, setOpen] = useState(false);
  if (!trend) return null;

  const d = trend.momentum_direction;
  const label =
    d === "LOW_DATA"
      ? "Low data"
      : d === "STABLE"
        ? "Stable"
        : `${trend.momentum_percent > 0 ? "↑" : "↓"} ${Math.abs(trend.momentum_percent)}%`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-xs font-medium ${tone(d)}`}
        title={`${DIRECTION_LABEL[d]} — explain 30-day momentum`}
      >
        <Icon d={d} />
        {label}
      </button>
      {open && <MomentumExplainDrawer trend={trend} open={open} onOpenChange={setOpen} />}
    </>
  );
};

export default MomentumChip;

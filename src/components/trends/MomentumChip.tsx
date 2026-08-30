import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { DIRECTION_LABEL, isRadarEligible, type PerspectiveTrend } from "@/lib/momentum";
import { confidenceLabel } from "@/lib/perspectiveScoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

/** 30-day momentum chip. Click expands the deterministic explanation. */
const MomentumChip = ({ trend }: { trend?: PerspectiveTrend }) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  if (!trend) return null;

  const eligible = isRadarEligible(trend);

  const sendToRadar = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("add-radar-signal", {
      body: {
        kind: "trend",
        perspective_id: trend.perspective_id,
        entity_name: trend.entity_name,
        momentum_percent: trend.momentum_percent,
        trend_confidence: trend.trend_confidence,
        impact_score: trend.impact_score,
        strategic_relevance: trend.strategic_relevance,
        competitive_intensity: trend.competitive_intensity,
        rationale: trend.rationale,
      },
    });
    setSending(false);
    toast(
      error || !data?.success
        ? { title: "Could not add to Radar", variant: "destructive" }
        : { title: `${trend.entity_name} added to Action Radar` },
    );
  };

  const d = trend.momentum_direction;
  const label =
    d === "LOW_DATA"
      ? "Low data"
      : d === "STABLE"
        ? "Stable"
        : `${trend.momentum_percent > 0 ? "↑" : "↓"} ${Math.abs(trend.momentum_percent)}%`;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-xs font-medium ${tone(d)}`}
        title={`${DIRECTION_LABEL[d]} — 30-day momentum`}
      >
        <Icon d={d} />
        {label}
      </button>
      {open && (
        <div className="w-full max-w-md rounded-md border border-border bg-muted/30 p-2 text-left text-[11px] leading-relaxed text-muted-foreground">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Previous 30d: <span className="text-foreground">{trend.baseline_activity}</span></span>
            <span>Current 30d: <span className="text-foreground">{trend.current_activity}</span></span>
            <span>{confidenceLabel(trend.trend_confidence)} ({trend.trend_confidence})</span>
          </div>
          <p className="mt-1">{trend.rationale}</p>
          {eligible && (
            <button
              type="button"
              onClick={sendToRadar}
              disabled={sending}
              className="mt-2 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {sending ? "Adding…" : "Add to Action Radar"}
            </button>
          )}
          {trend.top_drivers.length > 0 && (
            <p className="mt-1">
              Top driver: <span className="text-foreground">{trend.top_drivers[0].label}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MomentumChip;

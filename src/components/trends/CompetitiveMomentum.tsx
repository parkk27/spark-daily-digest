import { Swords } from "lucide-react";
import MomentumChip from "@/components/trends/MomentumChip";
import SurfaceCard from "@/components/ui/surface-card";
import EmptyState from "@/components/ui/empty-state";
import { competitivePosture, competitorTrends } from "@/lib/briefNarrative";
import type { PerspectiveTrend } from "@/lib/momentum";
import type { Perspective } from "@/lib/perspectives";

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

/** Perspective vs its benchmark universe over the same rolling window. */
const CompetitiveMomentum = ({
  perspective,
  trends,
  delay = 0,
}: {
  perspective: Perspective;
  trends: PerspectiveTrend[];
  delay?: number;
}) => {
  const rivals = competitorTrends(trends).sort(
    (a, b) => b.momentum_percent - a.momentum_percent,
  );
  const posture = competitivePosture(trends);

  return (
    <SurfaceCard className="p-6 opacity-0 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-1 flex items-center gap-2">
        <Swords className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Competitive momentum</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {perspective.display_name} topics averaging {pct(posture.own)} against {pct(posture.rivals)}{" "}
        across the tracked benchmark set.
      </p>

      {rivals.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No competitor activity observed in this window."
          className="border-none bg-transparent py-6"
        />
      ) : (
        <ul className="divide-y divide-border/60">
          <li className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {perspective.display_name}{" "}
                <span className="text-xs font-normal text-muted-foreground">(reference)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Mean own-topic momentum across this perspective
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${posture.own >= 0 ? "text-status-growing" : "text-status-declining"}`}
            >
              {pct(posture.own)}
            </span>
          </li>
          {rivals.map((t) => (
            <li key={t.entity_id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize text-foreground">
                  {t.entity_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.current_activity} weighted signals · intensity {t.competitive_intensity} ·{" "}
                  {t.trend_confidence}% confidence
                </p>
              </div>
              <MomentumChip trend={t} />
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
};

export default CompetitiveMomentum;

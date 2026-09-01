import MomentumChip from "@/components/trends/MomentumChip";
import SurfaceCard from "@/components/ui/surface-card";
import EmptyState from "@/components/ui/empty-state";
import { DIRECTION_LABEL, type PerspectiveTrend } from "@/lib/momentum";

/** Ranked 30-day momentum rows for a perspective. Each row opens the explain drawer. */
const MomentumSection = ({
  icon: Icon,
  title,
  subtitle,
  trends,
  empty,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  trends: PerspectiveTrend[];
  empty: string;
  delay?: number;
}) => (
  <SurfaceCard className="p-6 opacity-0 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
    <div className="mb-1 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
    {subtitle && <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>}

    {trends.length === 0 ? (
      <EmptyState icon={Icon} title={empty} className="border-none bg-transparent py-6" />
    ) : (
      <ul className="divide-y divide-border/60">
        {trends.map((t) => (
          <li key={`${t.entity_id}-${t.window_end}`} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium capitalize text-foreground">
                {t.entity_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {DIRECTION_LABEL[t.momentum_direction]} · {t.baseline_activity} →{" "}
                {t.current_activity} weighted signals · {t.trend_confidence}% confidence
              </p>
            </div>
            <MomentumChip trend={t} />
          </li>
        ))}
      </ul>
    )}
  </SurfaceCard>
);

export default MomentumSection;

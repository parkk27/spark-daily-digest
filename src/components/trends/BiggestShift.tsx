import { Zap, ArrowRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import type { TrendItem } from "@/data/mockData";

interface Props {
  trend: TrendItem | null;
  why?: string;
  loading?: boolean;
}

const BiggestShift = ({ trend, why, loading }: Props) => {
  if (!trend) return null;

  const DirIcon = trend.status === "new" ? Sparkles : trend.change >= 0 ? TrendingUp : TrendingDown;
  const dirColor =
    trend.status === "new"
      ? "text-status-new"
      : trend.change >= 0
        ? "text-status-growing"
        : "text-status-declining";

  return (
    <div
      className="rounded-lg border border-primary/30 bg-primary/5 p-6 opacity-0 animate-fade-in"
      style={{ animationDelay: "50ms" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Biggest Shift Today</h2>
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold capitalize tracking-tight text-foreground">{trend.topic}</span>
        <div className={`flex items-center gap-1.5 ${dirColor}`}>
          <DirIcon className="h-4 w-4" />
          <span className="text-sm font-semibold">
            {trend.status === "new" ? "NEW" : `${trend.change > 0 ? "+" : ""}${trend.change}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>{trend.yesterday}</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{trend.today}</span>
          <span>mentions</span>
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
        ) : why ? (
          <p className="text-sm leading-relaxed text-foreground/90">{why}</p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Largest momentum change in today's ecosystem signal.
          </p>
        )}
      </div>
    </div>
  );
};

export default BiggestShift;

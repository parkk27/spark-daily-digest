import { Hash, ArrowRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import type { TrendItem } from "@/data/mockData";
import ShareCardDialog from "@/components/share/ShareCardDialog";
import MomentumChip from "@/components/trends/MomentumChip";
import type { PerspectiveTrend } from "@/lib/momentum";

const directionIcon = (t: TrendItem) => {
  if (t.status === "new") return <Sparkles className="h-3.5 w-3.5 text-status-new" />;
  if (t.change > 0) return <TrendingUp className="h-3.5 w-3.5 text-status-growing" />;
  if (t.change < 0) return <TrendingDown className="h-3.5 w-3.5 text-status-declining" />;
  return null;
};

const directionLabel = (t: TrendItem) => {
  if (t.status === "new") return <span className="text-xs font-medium text-status-new">NEW</span>;
  if (t.change > 0) return <span className="text-xs font-medium text-status-growing">+{t.change}</span>;
  if (t.change < 0) return <span className="text-xs font-medium text-status-declining">{t.change}</span>;
  return <span className="text-xs font-medium text-muted-foreground">—</span>;
};

interface TrendRowProps {
  trend: TrendItem;
  why?: string;
  loading?: boolean;
  momentum?: PerspectiveTrend;
}

const TrendRow = ({ trend, why, loading, momentum }: TrendRowProps) => (
  <div className="flex flex-col gap-1.5 border-b border-border/50 py-3 last:border-0 last:pb-0 first:pt-0">

    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium capitalize text-foreground">{trend.topic}</span>
        {directionIcon(trend)}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{trend.yesterday}</span>
        <ArrowRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{trend.today}</span>
        {momentum ? <MomentumChip trend={momentum} /> : directionLabel(trend)}

        <ShareCardDialog
          label=""
          data={{
            title: trend.topic,
            why:
              why ??
              `Mentions moved from ${trend.yesterday} to ${trend.today} across tracked data platform sources.`,
            status:
              trend.status === "new"
                ? "New signal"
                : trend.change > 0
                  ? `Growing +${trend.change}`
                  : trend.change < 0
                    ? `Declining ${trend.change}`
                    : "Stable",
            sources: trend.today,
            eyebrow: "Ecosystem trend",
          }}
        />
      </div>
    </div>
    {loading ? (
      <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
    ) : why ? (
      <p className="text-xs leading-relaxed text-muted-foreground">{why}</p>
    ) : null}
  </div>
);

interface TrendSectionProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  trends: TrendItem[];
  insights: Record<string, string>;
  momentum?: Record<string, PerspectiveTrend>;
  loading?: boolean;
  empty?: string;
  delay?: number;
  accent?: boolean;
}

const TrendSection = ({
  icon: Icon,
  title,
  subtitle,
  trends,
  insights,
  momentum,
  loading,
  empty = "No signals in this category today.",
  delay = 0,
  accent,
}: TrendSectionProps) => (
  <div
    className={`rounded-lg border p-6 opacity-0 animate-fade-in ${
      accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="mb-4 flex items-center gap-2">
      <Icon className={`h-5 w-5 ${accent ? "text-primary" : "text-primary"}`} />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    {subtitle && <p className="-mt-2 mb-4 text-xs text-muted-foreground">{subtitle}</p>}
    {trends.length === 0 ? (
      <p className="text-sm text-muted-foreground">{empty}</p>
    ) : (
      <div className="flex flex-col">
        {trends.map((t) => (
          <TrendRow
            key={t.topic}
            trend={t}
            why={insights[t.topic.toLowerCase()]}
            loading={loading}
            momentum={momentum?.[t.topic.toLowerCase()]}
          />
        ))}
      </div>
    )}
  </div>
);

export default TrendSection;


export default TrendSection;

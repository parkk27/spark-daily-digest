import { Lightbulb, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useSparkData } from "@/hooks/useSparkData";

const SectionCard = ({
  icon: Icon,
  title,
  items,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  delay: number;
}) => (
  <div
    className="rounded-lg border border-border bg-card p-6 opacity-0 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-secondary-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const HomePage = () => {
  const { data, isLoading, isFetching, refetch } = useSparkData();
  const { summary, date } = data?.dailySummary ?? { summary: { highlights: [], trends: [], impact: [] }, date: new Date().toISOString().split("T")[0] };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-start justify-between opacity-0 animate-fade-in">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(date), "EEEE, MMMM d, yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Today's Spark Brief
          </h1>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <SectionCard icon={Lightbulb} title="Key Highlights" items={summary.highlights} delay={100} />
          <SectionCard icon={TrendingUp} title="Emerging Trends" items={summary.trends} delay={200} />
          <SectionCard icon={Sparkles} title="Why It Matters" items={summary.impact} delay={300} />
        </div>
      )}
    </div>
  );
};

export default HomePage;

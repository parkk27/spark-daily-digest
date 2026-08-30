import { useMemo } from "react";
import { Lightbulb, TrendingUp, Sparkles, RefreshCw, Zap, Hash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useSparkData } from "@/hooks/useSparkData";
import AskBigDataHub from "@/components/AskBigDataHub";
import ExecutiveSummaryCard from "@/components/ExecutiveSummaryCard";
import { buildExecutiveIntelligence } from "@/lib/executive";
import SeoHead from "@/components/SeoHead";
import SurfaceCard from "@/components/ui/surface-card";
import SkeletonCard from "@/components/ui/skeleton-card";
import EmptyState from "@/components/ui/empty-state";
import { siteUrl } from "@/config";

const SectionCard = ({
  icon: Icon,
  title,
  items,
  delay,
  emptyLabel,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  delay: number;
  emptyLabel: string;
}) => (
  <SurfaceCard
    className="p-6 opacity-0 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
    {items.length === 0 ? (
      <EmptyState icon={Icon} title={emptyLabel} className="border-none bg-transparent py-6" />
    ) : (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-secondary-foreground">
            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </SurfaceCard>
);

const HomePage = () => {
  const { perspective } = usePerspective();
  const { data, isLoading, isFetching, refetch } = useSparkData();

  const trends = data?.trends ?? [];
  const topTrends = trends.filter((t) => t.status === "growing" || t.status === "new").slice(0, 4);
  const { summary, date } = data?.dailySummary ?? {
    summary: { highlights: [], trends: [], impact: [], topInsight: "" },
    date: new Date().toISOString().split("T")[0],
  };
  const execIntel = useMemo(
    () =>
      buildExecutiveIntelligence(
        { date, summary },
        data?.allArticles ?? data?.articles ?? [],
        trends
      ),
    [date, summary, data, trends]
  );

  return (
    <div className="container max-w-4xl py-10">
      <SeoHead
        title="Big Data Intelligence Hub — Daily Ecosystem Brief"
        description="Daily AI-curated brief on Databricks, Spark, Iceberg, Delta, Fabric, EMR, and BigQuery. Top insights, highlights, and trends in one place."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Big Data Intelligence Hub",
            url: siteUrl("/"),
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Big Data Intelligence Hub",
            url: siteUrl("/"),
          },
        ]}
      />
      <div className="mb-8 flex items-start justify-between opacity-0 animate-fade-in">
        <div>
          <p className="eyebrow text-muted-foreground">
            {format(parseISO(date), "EEEE, MMMM d, yyyy")}
          </p>
          <h1 className="mt-1.5 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
            Today's big data brief
          </h1>
          <p className="measure mt-2 text-sm text-muted-foreground">
            Synthesized from today's ingested ecosystem coverage, written from the{" "}
            {perspective.display_name} point of view.
          </p>
          <div className="mt-3">
            <PerspectiveSelector />
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh data"
          className="mt-1 rounded-md border border-border bg-surface-2 p-2 text-muted-foreground shadow-card transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard lines={6} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : (
        <div className="space-y-6">
          <ExecutiveSummaryCard intel={execIntel} />

          {summary.topInsight && (
            <div
              className="rounded-lg border border-primary/25 bg-primary/[0.06] p-6 shadow-card opacity-0 animate-fade-in"
              style={{ animationDelay: "50ms" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Top insight</h2>
              </div>
              <p className="text-[0.9375rem] leading-relaxed text-foreground/90">
                {summary.topInsight}
              </p>
            </div>
          )}

          <SectionCard
            icon={Lightbulb}
            title="Key highlights"
            items={summary.highlights}
            delay={100}
            emptyLabel="No highlights in the latest ingestion cycle yet."
          />

          {topTrends.length > 0 && (
            <SurfaceCard
              className="p-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "150ms" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Top trends today</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {topTrends.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface-3 px-2.5 py-1.5"
                  >
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t.topic}</span>
                    <span
                      className={`text-xs font-semibold ${t.status === "new" ? "text-status-new" : "text-status-growing"}`}
                    >
                      {t.status === "new" ? "NEW" : `↑${t.change}`}
                    </span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          <SectionCard
            icon={TrendingUp}
            title="Emerging trends"
            items={summary.trends}
            delay={200}
            emptyLabel="No emerging trends detected in this window."
          />
          <SectionCard
            icon={Sparkles}
            title="Why it matters"
            items={summary.impact}
            delay={300}
            emptyLabel="Impact analysis will appear after the next ingestion cycle."
          />
          <AskBigDataHub />
        </div>
      )}
    </div>
  );
};

export default HomePage;

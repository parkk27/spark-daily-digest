import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, TrendingUp, Sparkles, Zap, Hash, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import SeoHead from "@/components/SeoHead";
import PreviewBanner from "@/components/PreviewBanner";
import ExecutiveSummaryCard from "@/components/ExecutiveSummaryCard";
import { Button } from "@/components/ui/button";
import { buildExecutiveIntelligence } from "@/lib/executive";
import {
  SAMPLE_ARTICLES,
  SAMPLE_SUMMARY,
  SAMPLE_TRENDS,
} from "@/data/sampleData";

const SectionCard = ({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) => (
  <div className="rounded-lg border border-border bg-card p-6">
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-secondary-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const PreviewBriefPage = () => {
  const { summary, date } = SAMPLE_SUMMARY;
  const topTrends = SAMPLE_TRENDS.filter(
    (t) => t.status === "growing" || t.status === "new"
  ).slice(0, 4);

  const intel = useMemo(
    () => buildExecutiveIntelligence(SAMPLE_SUMMARY, SAMPLE_ARTICLES, SAMPLE_TRENDS),
    []
  );

  return (
    <>
      <SeoHead
        title="Sample Daily Brief — Big Data Intelligence Hub"
        description="See a full example of the daily executive brief: the most important change in the big data ecosystem, top opportunity, competitive risk and the highest-priority action."
        path="/preview"
      />
      <PreviewBanner />
      <div className="container max-w-4xl py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(date), "EEEE, MMMM d, yyyy")} · sample brief
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Today's Big Data Brief
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/preview/compare">Compare platforms</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/preview/radar">Action radar</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <ExecutiveSummaryCard intel={intel} />

          {summary.topInsight && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Top Insight</h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{summary.topInsight}</p>
            </div>
          )}

          <SectionCard icon={Lightbulb} title="Key Highlights" items={summary.highlights} />

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Top Trends Today</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {topTrends.map((t) => (
                <div
                  key={t.topic}
                  className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5"
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t.topic}</span>
                  <span
                    className={`text-xs font-medium ${
                      t.status === "new" ? "text-status-new" : "text-status-growing"
                    }`}
                  >
                    {t.status === "new" ? "NEW" : `↑${t.change}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SectionCard icon={TrendingUp} title="Emerging Trends" items={summary.trends} />
          <SectionCard icon={Sparkles} title="Why It Matters" items={summary.impact} />

          <div className="rounded-xl border border-border bg-card/60 p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              This brief refreshes every day
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Sign in to get the live version, follow your own topics, and ask the copilot what
              changed.
            </p>
            <Button asChild className="mt-5 gap-1.5">
              <Link to="/signup">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewBriefPage;

import { Lightbulb, TrendingUp, Sparkles, RefreshCw, Zap, Hash, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useSparkData } from "@/hooks/useSparkData";
import { supabase } from "@/integrations/supabase/client";

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
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const trends = data?.trends ?? [];
  const topTrends = trends.filter((t) => t.status === "growing" || t.status === "new").slice(0, 4);
  const { summary, date } = data?.dailySummary ?? {
    summary: { highlights: [], trends: [], impact: [], topInsight: "" },
    date: new Date().toISOString().split("T")[0],
  };

  const handleSendTestEmail = async () => {
    setEmailStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { email: "test@example.com" },
      });
      if (error) throw error;
      setEmailStatus("success");
      setTimeout(() => setEmailStatus("idle"), 4000);
    } catch {
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 4000);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-start justify-between opacity-0 animate-fade-in">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(date), "EEEE, MMMM d, yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Today's Big Data Brief
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Insight of the Day */}
          {summary.topInsight && (
            <div
              className="rounded-lg border border-primary/30 bg-primary/5 p-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "50ms" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Top Insight</h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{summary.topInsight}</p>
            </div>
          )}

          <SectionCard icon={Lightbulb} title="Key Highlights" items={summary.highlights} delay={100} />

          {/* Top Trends Today */}
          {topTrends.length > 0 && (
            <div
              className="rounded-lg border border-border bg-card p-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "150ms" }}
            >
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
                    <span className={`text-xs font-medium ${t.status === "new" ? "text-status-new" : "text-status-growing"}`}>
                      {t.status === "new" ? "NEW" : `↑${t.change}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SectionCard icon={TrendingUp} title="Emerging Trends" items={summary.trends} delay={200} />
          <SectionCard icon={Sparkles} title="Why It Matters" items={summary.impact} delay={300} />
        </div>
      )}
    </div>
  );
};

export default HomePage;

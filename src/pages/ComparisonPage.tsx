import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import ComparisonCard from "@/components/compare/ComparisonCard";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  compareFeatures,
  type Category,
} from "@/data/features";

type Filter = Category | "all";

const ORDER: Category[] = ["performance", "cost", "ai", "governance"];

const ComparisonPage = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => compareFeatures(), []);

  const counts = useMemo(() => {
    const map = { all: rows.length } as Record<Filter, number>;
    ORDER.forEach((c) => {
      map[c] = rows.filter((r) => r.competitor.category === c).length;
    });
    return map;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.competitor.category === filter);

  const breakdown = useMemo(
    () => ({
      high: visible.filter((r) => r.threat === "high").length,
      medium: visible.filter((r) => r.threat === "medium").length,
      low: visible.filter((r) => r.threat === "low").length,
    }),
    [visible]
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    ...ORDER.map((c) => ({ key: c as Filter, label: CATEGORY_LABELS[c] })),
  ];

  return (
    <div className="container max-w-5xl py-10">
      <SeoHead
        title="Compare Competitor Features | Big Data Intelligence Hub"
        description="Gap analysis between competitor announcements and our feature baseline, with threat scoring and GTM talking points."
        path="/compare"
        noindex
      />

      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wide">Competitive intelligence</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Compare competitor features
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every tracked competitor announcement matched against our feature baseline, scored for
          threat and turned into talking points your team can use in the next call.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {visible.length} announcement{visible.length === 1 ? "" : "s"} ·{" "}
        <span className="text-status-declining">{breakdown.high} high</span> ·{" "}
        <span className="text-status-stable">{breakdown.medium} medium</span> ·{" "}
        <span className="text-status-growing">{breakdown.low} low</span> threat
      </p>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No competitor announcements tracked in this category yet.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((row) => (
            <ComparisonCard key={row.competitor.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;

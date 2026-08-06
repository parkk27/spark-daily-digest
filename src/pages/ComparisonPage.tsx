import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import EmptyState from "@/components/ui/empty-state";

import ComparisonCard from "@/components/compare/ComparisonCard";
import { cn } from "@/lib/utils";
import {
  BENCHMARKS,
  CATEGORY_LABELS,
  VENDOR_LABELS,
  countByPosition,
  filterBenchmarks,
  sortBenchmarks,
  type Category,
  type Vendor,
} from "@/data/features";

const CATEGORIES: Category[] = ["performance", "cost", "ai", "governance"];
const VENDORS: Vendor[] = ["databricks", "bigquery", "emr", "snowflake", "spark"];

const ComparisonPage = ({ preview = false }: { preview?: boolean }) => {
  const [category, setCategory] = useState<Category | "all">("all");
  const [vendor, setVendor] = useState<Vendor | "all">("all");

  const all = useMemo(() => sortBenchmarks(BENCHMARKS), []);
  const visible = useMemo(
    () => filterBenchmarks(all, category, vendor),
    [all, category, vendor]
  );
  const positions = useMemo(() => countByPosition(visible), [visible]);

  const chip = (active: boolean) =>
    cn(
      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    );

  return (
    <div className="container max-w-5xl py-10">
      <SeoHead
        title="Competitive Intelligence Workspace | Big Data Intelligence Hub"
        description="Benchmark Microsoft Fabric Spark against Databricks, BigQuery, AWS EMR, Snowflake and the Apache Spark ecosystem on current capabilities, customer impact and recommended actions."
        path={preview ? "/preview/compare" : "/compare"}
        noindex={!preview}
      />

      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <BarChart3 className="h-5 w-5" />
          <span className="eyebrow">Competitive intelligence</span>
        </div>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
          Competitive intelligence workspace
        </h1>
        <p className="measure mt-2 text-sm text-muted-foreground">
          Microsoft Fabric Spark benchmarked against competing data platforms on the capabilities
          they ship today — with differentiation, why it matters and the action each team should
          take next.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 mb-6 space-y-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            Perspective: Microsoft Fabric Spark
          </span>
          <span className="text-xs text-muted-foreground">
            benchmarked against Databricks, BigQuery, AWS EMR, Snowflake and the Apache Spark
            ecosystem
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory("all")} aria-pressed={category === "all"} className={chip(category === "all")}>
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={chip(category === c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setVendor("all")} aria-pressed={vendor === "all"} className={chip(vendor === "all")}>
            All competitors
          </button>
          {VENDORS.map((v) => (
            <button
              key={v}
              onClick={() => setVendor(v)}
              aria-pressed={vendor === v}
              className={chip(vendor === v)}
            >
              {VENDOR_LABELS[v]}
            </button>
          ))}
        </div>
      </div>


      <p className="mb-4 text-sm text-muted-foreground">
        {visible.length} capabilit{visible.length === 1 ? "y" : "ies"} benchmarked ·{" "}
        <span className="text-status-growing">{positions.leader} leader</span> ·{" "}
        <span className="text-status-new">{positions.competitive} competitive</span> ·{" "}
        <span className="text-status-stable">{positions.emerging} emerging</span>
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No benchmarked capabilities match this filter"
          description="Try a different category or competitor to see how Microsoft Fabric Spark stacks up."
        />

      ) : (
        <div className="space-y-4">
          {visible.map((row) => (
            <ComparisonCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import EmptyState from "@/components/ui/empty-state";

import ComparisonCard from "@/components/compare/ComparisonCard";
import PerspectiveSelector from "@/components/PerspectiveSelector";
import MomentumChip from "@/components/trends/MomentumChip";
import { usePerspective } from "@/hooks/usePerspective";
import { usePerspectiveTrends, momentumIndex } from "@/hooks/usePerspectiveTrends";
import { perspectiveVendors, rankByPerspective } from "@/lib/perspectiveMatch";
import { cn } from "@/lib/utils";
import {
  BENCHMARKS,
  CATEGORY_LABELS,
  VENDOR_LABELS,
  countByPosition,
  filterBenchmarks,
  sortBenchmarks,
  type CapabilityBenchmark,
  type Category,
  type Vendor,
} from "@/data/features";

const CATEGORIES: Category[] = ["performance", "cost", "ai", "governance"];
const VENDORS: Vendor[] = ["databricks", "bigquery", "emr", "snowflake", "spark"];

/** Benchmark row expressed as a scorable signal — no data is duplicated per perspective. */
const benchmarkSignal = (row: CapabilityBenchmark) => ({
  title: `${VENDOR_LABELS[row.vendor]} ${row.capability}`,
  summary: `${row.competitor_capability} ${row.fabric_capability} ${row.capability_gap} ${row.customer_impact}`,
  related_vendor: VENDOR_LABELS[row.vendor],
  related_technologies: [...row.fabric_differentiators, ...row.competitor_differentiators],
  tags: [row.category, row.position],
});

const ComparisonPage = ({ preview = false }: { preview?: boolean }) => {
  const [category, setCategory] = useState<Category | "all">("all");
  const [vendor, setVendor] = useState<Vendor | "all">("all");
  const { perspective } = usePerspective();
  const { data: trends } = usePerspectiveTrends(perspective.id);
  const momentum = useMemo(() => momentumIndex(trends), [trends]);

  const all = useMemo(() => sortBenchmarks(BENCHMARKS), []);

  /** Competitors the selected perspective is actually benchmarked against. */
  const vendorScope = useMemo(() => {
    const scoped = perspectiveVendors(VENDORS, VENDOR_LABELS, perspective);
    return scoped.length > 0 ? scoped : VENDORS;
  }, [perspective]);

  const inScope = useMemo(
    () => all.filter((row) => vendorScope.includes(row.vendor)),
    [all, vendorScope]
  );

  const ranked = useMemo(
    () => rankByPerspective(inScope, benchmarkSignal, perspective, momentum),
    [inScope, perspective, momentum]
  );

  const visible = useMemo(() => {
    const rows = filterBenchmarks(
      ranked.map((m) => m.row),
      category,
      vendor === "all" ? "all" : vendor
    );
    const keep = new Set(rows.map((r) => r.id));
    return ranked.filter((m) => keep.has(m.row.id));
  }, [ranked, category, vendor]);

  const positions = useMemo(() => countByPosition(visible.map((m) => m.row)), [visible]);

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
        description="Benchmark your selected platform perspective against Databricks, BigQuery, AWS EMR, Snowflake and the Apache Spark ecosystem on current capabilities, customer impact and recommended actions."
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
          Benchmarked capabilities ranked by how relevant they are to the{" "}
          {perspective.display_name} perspective — with differentiation, why it matters and the
          action each team should take next.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 mb-6 space-y-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <PerspectiveSelector surface="compare" />
          <span className="text-xs text-muted-foreground">
            benchmarked against{" "}
            {vendorScope.map((v) => VENDOR_LABELS[v]).join(", ")}
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
          {vendorScope.map((v) => (
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
          title={`No benchmarked capabilities for ${perspective.display_name}`}
          description="Try a different category, competitor or perspective — benchmarks are never duplicated across perspectives, so a perspective without coverage stays empty."
        />

      ) : (
        <div className="space-y-4">
          {visible.map(({ row, relevance, trend }) => (
            <div key={row.id} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
                  {perspective.display_name} fit {relevance.score}
                </span>
                {relevance.matched_terms.length > 0 && (
                  <span className="text-[0.7rem] text-muted-foreground">
                    matched: {relevance.matched_terms.slice(0, 4).join(", ")}
                  </span>
                )}
                <MomentumChip trend={trend} />
              </div>
              <ComparisonCard row={row} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;

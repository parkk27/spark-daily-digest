import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { Map as MapIcon, Check, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SeoHead from "@/components/SeoHead";
import SurfaceCard from "@/components/ui/surface-card";
import SectionHeader from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import MomentumChip from "@/components/trends/MomentumChip";
import DriversList from "@/components/trends/DriversList";
import { usePerspective } from "@/hooks/usePerspective";
import { dedupeLatest } from "@/hooks/usePerspectiveTrends";
import { ACTIVE_PERSPECTIVES } from "@/lib/perspectives";
import { MOMENTUM_CONFIG, type PerspectiveTrend } from "@/lib/momentum";
import { buildRoadmapEntry, type ActionPriority } from "@/lib/roadmap";
import { siteUrl } from "@/config";

const priorityTone: Record<ActionPriority, string> = {
  high: "border-status-declining/40 text-status-declining",
  medium: "border-primary/40 text-primary",
  low: "border-border text-muted-foreground",
};

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

const RoadmapPage = () => {
  const { perspectiveId, setPerspective } = usePerspective();

  // One cached edge-function read per perspective; the function itself caches 6h.
  const queries = useQueries({
    queries: ACTIVE_PERSPECTIVES.map((p) => ({
      queryKey: ["perspective-trends", p.id],
      staleTime: 1000 * 60 * 60 * 6,
      gcTime: 1000 * 60 * 60 * 12,
      retry: 0,
      queryFn: async (): Promise<PerspectiveTrend[]> => {
        const { data, error } = await supabase.functions.invoke("perspective-trends", {
          body: { perspective_id: p.id },
        });
        if (error) return [];
        return dedupeLatest((data?.trends ?? []) as PerspectiveTrend[]);
      },
    })),
  });

  const loading = queries.some((q) => q.isLoading);

  const entries = useMemo(
    () =>
      ACTIVE_PERSPECTIVES.map((p, i) => buildRoadmapEntry(p, queries[i]?.data ?? [])).sort(
        (a, b) =>
          (b.perspective.id === perspectiveId ? 1 : 0) -
            (a.perspective.id === perspectiveId ? 1 : 0) ||
          b.reportable - a.reportable,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queries.map((q) => q.dataUpdatedAt).join(","), perspectiveId],
  );

  return (
    <div className="container max-w-4xl py-10">
      <SeoHead
        title="Perspective Roadmap — Big Data Intelligence Hub"
        description="Roadmap of big data platform perspectives with 30-day momentum, evidence drivers and recommended actions."
        path="/roadmap"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Perspective Roadmap",
          url: siteUrl("/roadmap"),
        }}
      />

      <SectionHeader
        level="page"
        icon={MapIcon}
        eyebrow="Strategic planning"
        title="Perspective roadmap"
        description={`Each platform perspective with its rolling ${MOMENTUM_CONFIG.window_days}-day momentum, the drivers behind it, and the actions the evidence supports.`}
        className="mb-8"
      />

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {entries.map((e, index) => {
            const active = e.perspective.id === perspectiveId;
            return (
              <SurfaceCard
                key={e.perspective.id}
                accent={active}
                className="p-6 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">
                      {e.perspective.display_name}
                    </h2>
                    <p className="measure mt-1 text-sm text-muted-foreground">
                      {e.perspective.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Own topics {pct(e.posture.own)} · benchmark set {pct(e.posture.rivals)} ·{" "}
                      {e.reportable} of {e.reportable + e.lowData} entities reportable
                    </p>
                  </div>
                  {active ? (
                    <span className="flex items-center gap-1.5 rounded-md border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary">
                      <Check className="h-3.5 w-3.5" /> Selected
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPerspective(e.perspective.id)}
                    >
                      Use this perspective
                    </Button>
                  )}
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-2 text-muted-foreground">Momentum</p>
                    {e.rising.length === 0 && e.cooling.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Not enough observed activity to report a trend.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {[...e.rising, ...e.cooling].map((t) => (
                          <li key={t.entity_id} className="flex items-center gap-2 text-sm">
                            {t.momentum_percent >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5 text-status-growing" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-status-declining" />
                            )}
                            <span className="flex-1 truncate capitalize text-foreground">
                              {t.entity_name}
                            </span>
                            <MomentumChip trend={t} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="eyebrow mb-2 text-muted-foreground">Top drivers</p>
                    <DriversList
                      drivers={e.drivers}
                      emptyLabel="No weighted driver change in this window."
                    />
                  </div>
                </div>

                <div className="mt-5 border-t border-border/60 pt-4">
                  <p className="eyebrow mb-2 text-muted-foreground">Recommended actions</p>
                  <ul className="space-y-3">
                    {e.actions.map((a) => (
                      <li key={a.id} className="rounded-md border border-border bg-surface-3 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{a.title}</span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase ${priorityTone[a.priority]}`}
                          >
                            {a.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {a.rationale}
                        </p>
                        <Link
                          to={a.link.to}
                          onClick={() => {
                            if (!active) setPerspective(e.perspective.id);
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {a.link.label} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;

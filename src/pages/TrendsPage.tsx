import {
  TrendingUp,
  Sparkles,
  TrendingDown,
  Building2,
  Star,
  Activity,
  Layers,
  BarChart3,
  Swords,
  LineChart as LineChartIcon,
  Map as MapIcon,
  ArrowRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSparkData } from "@/hooks/useSparkData";
import { useTrendInsights } from "@/hooks/useTrendInsights";
import { useWatchlist } from "@/hooks/usePersonalization";
import { useAuth } from "@/hooks/useAuth";
import {
  getBiggestShift,
  getFastestGrowing,
  getVendorMomentum,
  getEmergingSignals,
  getDeclining,
} from "@/lib/trends";
import BiggestShift from "@/components/trends/BiggestShift";
import TrendSection from "@/components/trends/TrendSection";
import MomentumSection from "@/components/trends/MomentumSection";
import CompetitiveMomentum from "@/components/trends/CompetitiveMomentum";
import DriversList from "@/components/trends/DriversList";
import MomentumBarChart from "@/components/trends/MomentumBarChart";
import CompetitorChart from "@/components/trends/CompetitorChart";
import DriverCountsChart from "@/components/trends/DriverCountsChart";
import MomentumTimeline from "@/components/trends/MomentumTimeline";
import MomentumExplainDrawer from "@/components/trends/MomentumExplainDrawer";
import SurfaceCard from "@/components/ui/surface-card";
import SeoHead from "@/components/SeoHead";
import { siteUrl } from "@/config";
import PerspectiveSelector from "@/components/PerspectiveSelector";
import { usePerspective } from "@/hooks/usePerspective";
import { usePerspectiveTrends, momentumIndex } from "@/hooks/usePerspectiveTrends";
import { usePerspectiveTrendHistory } from "@/hooks/usePerspectiveTrendHistory";
import { MOMENTUM_CONFIG } from "@/lib/momentum";
import { risingTrends, coolingTrends, topDrivers, ownTrends } from "@/lib/briefNarrative";
import {
  momentumBars,
  competitorBars,
  driverBars,
  timelineSeries,
  lowDataCount,
} from "@/lib/trendCharts";
import { roadmapActions, type ActionPriority } from "@/lib/roadmap";

const priorityTone: Record<ActionPriority, string> = {
  high: "border-status-declining/40 text-status-declining",
  medium: "border-primary/40 text-primary",
  low: "border-border text-muted-foreground",
};

const TrendsPage = () => {
  const { data, isLoading } = useSparkData();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const { perspectiveId, perspective } = usePerspective();
  const momentumQuery = usePerspectiveTrends(perspectiveId);
  const historyQuery = usePerspectiveTrendHistory(perspectiveId);
  const momentum = useMemo(() => momentumIndex(momentumQuery.data), [momentumQuery.data]);
  const pTrends = momentumQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => pTrends.find((t) => t.entity_id === selectedId) ?? null,
    [pTrends, selectedId],
  );
  const bars = useMemo(() => momentumBars(pTrends), [pTrends]);
  const rivalBars = useMemo(
    () => competitorBars(perspective.display_name, pTrends),
    [perspective.display_name, pTrends],
  );
  const dBars = useMemo(() => driverBars(pTrends), [pTrends]);
  const suppressed = useMemo(() => lowDataCount(pTrends), [pTrends]);
  const timeline = useMemo(() => timelineSeries(historyQuery.data ?? []), [historyQuery.data]);
  const actions = useMemo(
    () => roadmapActions(perspective, pTrends).slice(0, 5),
    [perspective, pTrends],
  );
  const rising = useMemo(() => risingTrends(pTrends, 6), [pTrends]);
  const cooling = useMemo(() => coolingTrends(pTrends, 6), [pTrends]);
  const drivers = useMemo(() => topDrivers(pTrends, 6), [pTrends]);
  const ownCount = useMemo(
    () => ownTrends(pTrends).filter((t) => t.momentum_direction !== "LOW_DATA").length,
    [pTrends],
  );

  const trends = data?.trends ?? [];
  const articles = data?.allArticles ?? [];
  const date = data?.dailySummary.date;


  const watched = useMemo(() => {
    const topics = user ? watchlist.data ?? [] : [];
    if (!topics.length) return [];
    return trends.filter((t) => topics.some((w) => t.topic.toLowerCase().includes(w)));
  }, [trends, watchlist.data, user]);

  const insightsQuery = useTrendInsights(date, trends, articles);
  const insightsMap = useMemo(() => {
    const map: Record<string, string> = {};
    (insightsQuery.data ?? []).forEach((i) => {
      map[i.topic.toLowerCase()] = i.why;
    });
    return map;
  }, [insightsQuery.data]);

  const biggest = getBiggestShift(trends);
  const growing = getFastestGrowing(trends);
  const vendors = getVendorMomentum(trends);
  const emerging = getEmergingSignals(trends);
  const declining = getDeclining(trends);

  const loadingWhy = insightsQuery.isLoading;

  return (
    <div className="container max-w-4xl py-8">
      <SeoHead
        title="Ecosystem Trends — Big Data Intelligence Hub"
        description="Executive view of big data ecosystem momentum: biggest shifts, fastest growing technologies, vendor momentum, emerging signals, and declining topics."
        path="/trends"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Big Data Ecosystem Trends",
          url: siteUrl("/trends"),
          description: "Strategic trend analysis across Spark, Iceberg, Delta, Fabric, EMR, and BigQuery.",
        }}
      />
      <div className="mb-8 opacity-0 animate-fade-in">
        <p className="text-sm text-muted-foreground">Ecosystem Intelligence</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Trends That Matter
        </h1>
        <p className="measure mt-2 text-sm text-muted-foreground">
          Rolling {MOMENTUM_CONFIG.window_days}-day momentum through the{" "}
          {perspective.display_name} lens, with the drivers and competitive position behind every
          number.
        </p>
        <div className="mt-3">
          <PerspectiveSelector surface="trends" />
        </div>
      </div>

      {/* Perspective momentum layer (rolling 30-day, cached) */}
      {momentumQuery.isLoading ? (
        <div className="mb-6 h-40 animate-pulse rounded-lg bg-surface-2" />
      ) : (
        <div className="mb-8 space-y-6">
          <SurfaceCard className="p-6 opacity-0 animate-fade-in">
            <div className="mb-1 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Momentum by entity ({MOMENTUM_CONFIG.window_days} days)
              </h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Percent change versus the previous window. Select a bar to open its full explanation.
              {suppressed > 0 && ` ${suppressed} entity${suppressed === 1 ? "" : " groups"} hidden as low data.`}
            </p>
            {bars.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                No entity has enough observed activity to chart in this window.
              </p>
            ) : (
              <MomentumBarChart bars={bars} onSelect={setSelectedId} />
            )}
          </SurfaceCard>

          <div className="grid gap-6 md:grid-cols-2">
            <SurfaceCard className="p-6 opacity-0 animate-fade-in" style={{ animationDelay: "60ms" }}>
              <div className="mb-1 flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Competitive comparison</h2>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                {perspective.display_name} mean momentum against each tracked rival.
              </p>
              {rivalBars.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No competitor activity observed in this window.
                </p>
              ) : (
                <CompetitorChart bars={rivalBars} />
              )}
            </SurfaceCard>

            <SurfaceCard className="p-6 opacity-0 animate-fade-in" style={{ animationDelay: "90ms" }}>
              <div className="mb-1 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Driver counts</h2>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Weighted change per theme or source between the two windows.
              </p>
              {dBars.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No driver had a material weighted change this window.
                </p>
              ) : (
                <DriverCountsChart drivers={dBars} />
              )}
            </SurfaceCard>
          </div>

          <SurfaceCard className="p-6 opacity-0 animate-fade-in" style={{ animationDelay: "110ms" }}>
            <div className="mb-1 flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Momentum timeline</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Momentum per stored snapshot window for the most-observed entities in this
              perspective.
            </p>
            {historyQuery.isLoading ? (
              <div className="h-40 animate-pulse rounded-md bg-surface-2" />
            ) : (
              <MomentumTimeline series={timeline} />
            )}
          </SurfaceCard>

          <div className="grid gap-6 md:grid-cols-2">
            <MomentumSection
              icon={TrendingUp}
              title="Rising momentum"
              subtitle={`${ownCount} reportable entities in this perspective`}
              trends={rising}
              empty="Nothing is accelerating with enough evidence to report."
            />
            <MomentumSection
              icon={TrendingDown}
              title="Cooling momentum"
              subtitle="Losing weighted activity versus the previous 30 days"
              trends={cooling}
              delay={80}
              empty="Nothing is cooling with enough evidence to report."
            />
          </div>

          <SurfaceCard
            className="p-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "120ms" }}
          >
            <div className="mb-1 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Drivers behind the move</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Sources and themes with the largest weighted change between the current and baseline
              windows.
            </p>
            <DriversList drivers={drivers} />
          </SurfaceCard>

          <CompetitiveMomentum perspective={perspective} trends={pTrends} delay={160} />

          <SurfaceCard className="p-6 opacity-0 animate-fade-in" style={{ animationDelay: "180ms" }}>
            <div className="mb-1 flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Where this leads</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Actions the evidence supports for {perspective.display_name}, ordered by priority.
            </p>
            <ul className="space-y-3">
              {actions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-md border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${priorityTone[a.priority]}`}
                    >
                      {a.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.rationale}</p>
                  <Link
                    to={a.link.to}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {a.link.label} <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      )}

      {selected && (
        <MomentumExplainDrawer
          trend={selected}
          open={!!selected}
          onOpenChange={(o) => !o && setSelectedId(null)}
        />
      )}


      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Today's daily signal layer</h2>
      </div>



      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : trends.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trend data available.</p>
      ) : (
        <div className="space-y-6">
          {watched.length > 0 && (
            <TrendSection
              icon={Star}
              title="Your Watchlist"
              subtitle="Topics you track, pinned to the top."
              trends={watched}
              insights={insightsMap}
              momentum={momentum}
              loading={loadingWhy}
              delay={0}
              empty="No movement on your watched topics."
            />
          )}

          <BiggestShift
            trend={biggest}
            why={biggest ? insightsMap[biggest.topic.toLowerCase()] : undefined}
            loading={loadingWhy}
          />

          <TrendSection
            icon={TrendingUp}
            title="Fastest Growing Technologies"
            subtitle="Topics gaining the most mention velocity vs yesterday."
            trends={growing}
            insights={insightsMap}
            momentum={momentum}
            loading={loadingWhy}
            delay={100}
            empty="No accelerating topics today."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TrendSection
              icon={Building2}
              title="Vendor Momentum"
              subtitle="Where the platform vendors stand today."
              trends={vendors}
              insights={insightsMap}
              momentum={momentum}
              loading={loadingWhy}
              delay={150}
              empty="No vendor-specific signals."
            />
            <TrendSection
              icon={Sparkles}
              title="Emerging Signals"
              subtitle="New topics worth watching early."
              trends={emerging}
              insights={insightsMap}
              momentum={momentum}
              loading={loadingWhy}
              delay={200}
              empty="No new signals today."
            />
          </div>

          <TrendSection
            icon={TrendingDown}
            title="Declining Topics"
            subtitle="Losing mindshare — reassess strategic weight."
            trends={declining}
            insights={insightsMap}
            momentum={momentum}
            loading={loadingWhy}
            delay={250}
            empty="Nothing fading today."
          />
        </div>
      )}
    </div>
  );
};

export default TrendsPage;

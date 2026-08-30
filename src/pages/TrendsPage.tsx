import { TrendingUp, Sparkles, TrendingDown, Building2, Star } from "lucide-react";
import { useMemo } from "react";
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
import SeoHead from "@/components/SeoHead";
import { siteUrl } from "@/config";
import PerspectiveSelector from "@/components/PerspectiveSelector";
import { usePerspective } from "@/hooks/usePerspective";
import { usePerspectiveTrends, momentumIndex } from "@/hooks/usePerspectiveTrends";


const TrendsPage = () => {
  const { data, isLoading } = useSparkData();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const { perspectiveId } = usePerspective();
  const momentumQuery = usePerspectiveTrends(perspectiveId);
  const momentum = useMemo(() => momentumIndex(momentumQuery.data), [momentumQuery.data]);
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

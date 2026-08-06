import { formatDistanceToNowStrict, parseISO } from "date-fns";
import type { Article, TrendItem, DailySummary } from "@/data/mockData";
import { scoreArticle } from "@/lib/decisionIntelligence";

/** The platform this brief is written from the perspective of. */
export const OUR_PLATFORM = "Microsoft Fabric Spark";

/** Vendors the ecosystem is benchmarked against. */
export const BENCHMARK_VENDORS = [
  "Databricks",
  "Google BigQuery",
  "AWS EMR",
  "Snowflake",
  "Apache Spark ecosystem",
];

export interface ExecutiveIntelligence {
  perspective: string;
  benchmarkVendors: string[];
  analysisWindowLabel: string;
  sourceCount: number;
  lastRefreshedLabel: string;
  mostImportantChange: string;
  topOpportunity: string;
  topCompetitiveRisk: string;
  highestPriorityAction: string;
  innovationLeader: string;
  marketDirection: string;
  strategicOutlook: string;
  evidence: string[];
  confidence: number;
}

const VENDOR_NAMES: Record<string, string> = {
  databricks: "Databricks",
  aws: "AWS",
  microsoft: "Microsoft",
  google: "Google Cloud",
  snowflake: "Snowflake",
  iceberg: "Apache Iceberg community",
  spark: "Apache Spark community",
};

const pretty = (source: string) => {
  const key = Object.keys(VENDOR_NAMES).find((k) => source.toLowerCase().includes(k));
  return key ? VENDOR_NAMES[key] : source;
};

const safeDistance = (date: string) => {
  try {
    return `${formatDistanceToNowStrict(parseISO(date))} ago`;
  } catch {
    return "unknown";
  }
};

export function buildExecutiveIntelligence(
  daily: DailySummary,
  articles: Article[],
  trends: TrendItem[]
): ExecutiveIntelligence {
  const scored = articles
    .map((a) => ({ article: a, intel: scoreArticle(a) }))
    .sort((a, b) => b.intel.importance - a.intel.importance);

  const top = scored[0];
  const growing = trends.filter((t) => t.status === "growing" || t.status === "new");
  const declining = trends.filter((t) => t.status === "declining");

  const vendorCounts = articles.reduce<Record<string, number>>((acc, a) => {
    const name = pretty(a.source);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const vendorRanking = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1]);
  const leadVendor = vendorRanking[0];

  const riskArticle =
    scored.find(
      ({ article }) =>
        /pricing|cost|benchmark|performance|launch|general availability/i.test(
          `${article.title} ${article.summary}`
        ) && !/fabric/i.test(article.source)
    ) ??
    scored[1] ??
    top;

  const opportunityTrend = growing[0];

  const confidence = Math.min(
    95,
    50 + Math.min(articles.length, 20) * 1.5 + Math.min(trends.length, 10) * 2
  );

  return {
    perspective: OUR_PLATFORM,
    benchmarkVendors: BENCHMARK_VENDORS,
    analysisWindowLabel: "Latest daily ingestion cycle",
    sourceCount: Object.keys(vendorCounts).length,
    lastRefreshedLabel: safeDistance(daily.date),
    mostImportantChange:
      daily.summary.topInsight ||
      top?.article.title ||
      "No significant ecosystem change detected today.",
    topOpportunity: opportunityTrend
      ? `${opportunityTrend.topic} momentum is ${
          opportunityTrend.status === "new" ? "newly emerging" : `up ${opportunityTrend.change}`
        } — an opening for ${OUR_PLATFORM} to lead the narrative before competitors consolidate it.`
      : `No clear opening for ${OUR_PLATFORM} detected in today's signals.`,
    topCompetitiveRisk: riskArticle
      ? `${pretty(riskArticle.article.source)}: ${riskArticle.article.title}`
      : `No material competitive risk to ${OUR_PLATFORM} detected today.`,
    highestPriorityAction: top?.intel.next_action ?? "Continue monitoring the ecosystem feed.",
    innovationLeader: leadVendor
      ? `${leadVendor[0]} — most tracked announcements in this window (${leadVendor[1]} item${
          leadVendor[1] === 1 ? "" : "s"
        }); a volume signal, not an endorsement.`
      : "Insufficient data in this window",
    marketDirection:
      daily.summary.trends?.[0] ??
      (growing.length > declining.length
        ? "Ecosystem attention is expanding across open formats and AI-native data platforms."
        : "Ecosystem attention is consolidating around a narrower set of themes."),
    strategicOutlook:
      daily.summary.impact?.[0] ??
      "Open table formats and AI integration remain the decisive competitive axes for the next two quarters.",
    evidence: [
      `Perspective: ${OUR_PLATFORM}`,
      `${articles.length} articles ingested from ${Object.keys(vendorCounts).length} sources`,
      `${trends.length} tracked topics · ${growing.length} growing · ${declining.length} declining`,
      ...vendorRanking
        .slice(0, 6)
        .map(([name, count]) => `${name}: ${count} announcement${count === 1 ? "" : "s"}`),
      top ? `Highest-importance item scored ${top.intel.importance}/10` : "No scored items",
    ],
    confidence: Math.round(confidence),
  };
}

import type { TrendItem } from "@/data/mockData";

export const VENDOR_TOPICS = new Set([
  "databricks", "snowflake", "aws", "google", "microsoft",
  "bigquery", "fabric", "emr", "redshift", "synapse", "azure",
]);

export function getBiggestShift(trends: TrendItem[]): TrendItem | null {
  if (!trends.length) return null;
  return [...trends].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0] ?? null;
}

export function getFastestGrowing(trends: TrendItem[], limit = 4): TrendItem[] {
  return trends
    .filter((t) => t.status === "growing" && t.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, limit);
}

export function getVendorMomentum(trends: TrendItem[]): TrendItem[] {
  return trends
    .filter((t) => VENDOR_TOPICS.has(t.topic.toLowerCase()))
    .sort((a, b) => b.today - a.today);
}

export function getEmergingSignals(trends: TrendItem[], limit = 5): TrendItem[] {
  return trends
    .filter((t) => t.status === "new")
    .sort((a, b) => b.today - a.today)
    .slice(0, limit);
}

export function getDeclining(trends: TrendItem[], limit = 4): TrendItem[] {
  return trends
    .filter((t) => t.status === "declining" || t.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, limit);
}

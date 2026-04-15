import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  dailySummary as mockSummary,
  articles as mockArticles,
  trends as mockTrends,
  type Article,
  type TrendItem,
  type DailySummary,
} from "@/data/mockData";

export interface PipelineMetrics {
  articles_fetched: number;
  articles_after_filter: number;
  duplicates_removed: number;
  summary_generated: boolean;
  used_fallback: boolean;
  processing_time_ms: number;
}

interface SparkData {
  dailySummary: DailySummary;
  articles: Article[];
  trends: TrendItem[];
  metrics?: PipelineMetrics;
}

async function fetchSparkData(): Promise<SparkData> {
  const { data, error } = await supabase.functions.invoke("spark-scrape");

  if (error) throw error;

  if (!data?.success || !data?.data) {
    throw new Error("Invalid response from scrape function");
  }

  const d = data.data;
  return {
    dailySummary: { date: d.date, summary: d.summary },
    articles: d.articles ?? [],
    trends: d.trends ?? [],
    metrics: data.metrics,
  };
}

export function useSparkData() {
  return useQuery<SparkData>({
    queryKey: ["spark-data"],
    queryFn: fetchSparkData,
    staleTime: 1000 * 60 * 30, // Fetch once per session (30 min)
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    retry: 1,
    placeholderData: {
      dailySummary: mockSummary,
      articles: mockArticles,
      trends: mockTrends,
    },
  });
}

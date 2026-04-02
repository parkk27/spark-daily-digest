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

interface SparkData {
  dailySummary: DailySummary;
  articles: Article[];
  trends: TrendItem[];
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
    articles: d.articles,
    trends: d.trends,
  };
}

export function useSparkData() {
  return useQuery<SparkData>({
    queryKey: ["spark-data"],
    queryFn: fetchSparkData,
    staleTime: 1000 * 60 * 30,
    retry: 1,
    placeholderData: {
      dailySummary: mockSummary,
      articles: mockArticles,
      trends: mockTrends,
    },
  });
}

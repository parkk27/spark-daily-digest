import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Article, TrendItem } from "@/data/mockData";

export interface TrendInsight { topic: string; why: string }

async function fetchInsights(date: string, trends: TrendItem[], articles: Article[]): Promise<TrendInsight[]> {
  const { data, error } = await supabase.functions.invoke("spark-trend-insights", {
    body: { date, trends, articles },
  });
  if (error) return [];
  return (data?.insights ?? []) as TrendInsight[];
}

export function useTrendInsights(date: string | undefined, trends: TrendItem[], articles: Article[]) {
  return useQuery({
    queryKey: ["trend-insights", date],
    queryFn: () => fetchInsights(date!, trends, articles),
    enabled: !!date && trends.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 0,
  });
}

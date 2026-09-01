import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PerspectiveTrend } from "@/lib/momentum";

/**
 * Full stored snapshot history for a perspective (every window, not just the
 * latest). Read straight from the cached snapshot table — no edge function call.
 */
export function usePerspectiveTrendHistory(perspectiveId: string) {
  return useQuery({
    queryKey: ["perspective-trend-history", perspectiveId],
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 12,
    retry: 0,
    queryFn: async (): Promise<PerspectiveTrend[]> => {
      const { data, error } = await supabase
        .from("perspective_trend_snapshots")
        .select("*")
        .eq("perspective_id", perspectiveId)
        .order("window_end", { ascending: true })
        .limit(1000);
      if (error) return [];
      return (data ?? []) as unknown as PerspectiveTrend[];
    },
  });
}

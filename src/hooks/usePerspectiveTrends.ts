import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PerspectiveTrend } from "@/lib/momentum";

/**
 * Reads cached 30-day momentum for a perspective. The edge function recomputes at
 * most every 6 hours, so the client never does heavy computation.
 */
export function usePerspectiveTrends(perspectiveId: string) {
  return useQuery({
    queryKey: ["perspective-trends", perspectiveId],
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 12,
    retry: 0,
    queryFn: async (): Promise<PerspectiveTrend[]> => {
      const { data, error } = await supabase.functions.invoke("perspective-trends", {
        body: { perspective_id: perspectiveId },
      });
      if (error) return [];
      return (data?.trends ?? []) as PerspectiveTrend[];
    },
  });
}

/** Momentum keyed by lowercase entity id for quick lookup from trend rows. */
export function momentumIndex(trends: PerspectiveTrend[] | undefined) {
  const map: Record<string, PerspectiveTrend> = {};
  (trends ?? []).forEach((t) => {
    map[t.entity_id.toLowerCase()] = t;
  });
  return map;
}

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
      return dedupeLatest((data?.trends ?? []) as PerspectiveTrend[]);
    },
  });
}

/**
 * The cache can hold several windows per entity. Keep only the most recent
 * window per entity so the UI never shows the same entity twice.
 */
export function dedupeLatest(trends: PerspectiveTrend[]): PerspectiveTrend[] {
  const best = new Map<string, PerspectiveTrend>();
  for (const t of trends) {
    const key = t.entity_id.toLowerCase();
    const current = best.get(key);
    if (!current || String(t.window_end) > String(current.window_end)) best.set(key, t);
  }
  return [...best.values()];
}

/** Momentum keyed by lowercase entity id for quick lookup from trend rows. */
export function momentumIndex(trends: PerspectiveTrend[] | undefined) {
  const map: Record<string, PerspectiveTrend> = {};
  (trends ?? []).forEach((t) => {
    map[t.entity_id.toLowerCase()] = t;
  });
  return map;
}

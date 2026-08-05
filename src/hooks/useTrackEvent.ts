import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Fire-and-forget product analytics. Never blocks or breaks the UI. */
export function useTrackEvent() {
  const { user } = useAuth();
  return useCallback(
    (event: string, target?: string, metadata: Record<string, unknown> = {}) => {
      if (!user) return;
      void supabase
        .from("analytics_events")
        .insert({ user_id: user.id, event, target, metadata })
        .then(({ error }) => {
          if (error) console.warn("analytics", error.message);
        });
    },
    [user]
  );
}

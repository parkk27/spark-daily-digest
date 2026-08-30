import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_PERSPECTIVE_ID, getPerspective } from "@/lib/perspectives";

const STORAGE_KEY = "bdh.perspective";

function readLocal(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PERSPECTIVE_ID;
  } catch {
    return DEFAULT_PERSPECTIVE_ID;
  }
}

/**
 * Selected intelligence perspective.
 * Signed-in users persist to their preferences; everyone else falls back to
 * localStorage. Unset always resolves to the default perspective — never forced.
 */
export function usePerspective() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [id, setId] = useState<string>(readLocal);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("user_preferences")
      .select("perspective_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.perspective_id) {
          setId(data.perspective_id);
          try {
            localStorage.setItem(STORAGE_KEY, data.perspective_id);
          } catch { /* storage unavailable */ }
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  const setPerspective = useCallback(
    async (next: string) => {
      setId(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch { /* storage unavailable */ }
      qc.invalidateQueries({ queryKey: ["perspective-trends"] });
      if (user) {
        await supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, perspective_id: next }, { onConflict: "user_id" });
      }
    },
    [user, qc],
  );

  return { perspectiveId: id, perspective: getPerspective(id), setPerspective };
}

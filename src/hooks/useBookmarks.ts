import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Bookmark {
  id: string;
  kind: string;
  ref_id: string;
  title: string;
  url: string | null;
  source: string | null;
  note: string | null;
  created_at: string;
}

export function useBookmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Bookmark[]> => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id, kind, ref_id, title, url, source, note, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBookmarkMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["bookmarks", user?.id] });

  const add = useMutation({
    mutationFn: async (b: Omit<Bookmark, "id" | "created_at" | "note"> & { note?: string }) => {
      const { error } = await supabase.from("bookmarks").insert({ ...b, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (refId: string) => {
      const { error } = await supabase.from("bookmarks").delete().eq("ref_id", refId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

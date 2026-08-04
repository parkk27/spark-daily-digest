import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserPreferences {
  user_id: string;
  preferred_technologies: string[];
  email_frequency: string;
  notifications_enabled: boolean;
}

export function usePreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["preferences", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserPreferences | null> => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("user_id, preferred_technologies, email_frequency, notifications_enabled")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdatePreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserPreferences, "user_id">>) => {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user!.id, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences", user?.id] }),
  });
}

export function useWatchlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["watchlist", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("watchlists")
        .select("topic")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => r.topic);
    },
  });
}

export function useWatchlistMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["watchlist", user?.id] });

  const add = useMutation({
    mutationFn: async (topic: string) => {
      const { error } = await supabase
        .from("watchlists")
        .insert({ user_id: user!.id, topic: topic.trim().toLowerCase() });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (topic: string) => {
      const { error } = await supabase.from("watchlists").delete().eq("topic", topic);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-searches", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavedSearch[]> => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("id, name, query")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSavedSearchMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["saved-searches", user?.id] });

  const add = useMutation({
    mutationFn: async (s: { name: string; query: string }) => {
      const { error } = await supabase.from("saved_searches").insert({ user_id: user!.id, ...s });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_searches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}

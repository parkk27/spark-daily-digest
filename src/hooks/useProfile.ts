import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RoleFocus = "product" | "engineering" | "sales" | "gtm" | "leadership";

export const ROLE_FOCUS_LABELS: Record<RoleFocus, string> = {
  product: "Product management",
  engineering: "Engineering",
  sales: "Sales",
  gtm: "Go-to-market",
  leadership: "Leadership",
};

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role_focus: RoleFocus;
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role_focus")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Profile, "id">>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RecommendationSection = "act_now" | "watch" | "deprioritize";

export interface Recommendation {
  id: string;
  signal_key: string | null;
  date: string;
  section: RecommendationSection;
  title: string;
  summary: string;
  owner: string;
  priority: string;
  confidence: number;
  evidence_count: number;
  evidence: unknown;
  rationale: string | null;
  related_vendor: string | null;
  related_technologies: string[] | null;
  due_date: string | null;
  signal_type: string;
  polarity: string;
  score_breakdown: Record<string, number>;
}

export type DecisionKind =
  | "investigate"
  | "positioning"
  | "customer_research"
  | "monitor"
  | "no_action";

export interface DecisionRecord {
  id: string;
  recommendation_id: string | null;
  signal_key: string | null;
  decision: DecisionKind;
  reason: string | null;
  stakeholders: string[];
  next_step: string | null;
  review_date: string | null;
  status: string;
  updated_at: string;
}

export interface DecisionHistoryEntry {
  id: string;
  signal_key: string | null;
  decision: DecisionKind;
  reason: string | null;
  change_reason: string | null;
  review_date: string | null;
  status: string | null;
  changed_at: string;
}


export const DECISION_LABELS: Record<DecisionKind, string> = {
  investigate: "Investigate",
  positioning: "Update positioning",
  customer_research: "Customer research",
  monitor: "Monitor",
  no_action: "No action",
};

export const DECISION_DESCRIPTIONS: Record<DecisionKind, string> = {
  investigate: "Needs more evidence before deciding",
  positioning: "No product change — update competitive messaging",
  customer_research: "Validate with 5–10 customers",
  monitor: "Insufficient evidence to act now",
  no_action: "Low strategic relevance",
};

const DECISION_SYNC: Record<DecisionKind, { record: string; mirrored: string }> = {
  investigate: { record: "investigating", mirrored: "in_progress" },
  customer_research: { record: "investigating", mirrored: "in_progress" },
  positioning: { record: "in_progress", mirrored: "in_progress" },
  monitor: { record: "investigating", mirrored: "open" },
  no_action: { record: "dismissed", mirrored: "dismissed" },
};


export const SECTION_LABELS: Record<RecommendationSection, string> = {
  act_now: "Act now",
  watch: "Watch",
  deprioritize: "Deprioritize",
};

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: async (): Promise<Recommendation[]> => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Recommendation[];
    },
  });
}

export function useRecommendationStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["recommendation-status", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("recommendation_status")
        .select("recommendation_id, status");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.recommendation_id, r.status]));
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("recommendation_status")
        .upsert(
          { user_id: user!.id, recommendation_id: id, status, updated_at: new Date().toISOString() },
          { onConflict: "user_id,recommendation_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendation-status", user?.id] }),
  });

  return { statuses: query.data ?? {}, isLoading: query.isLoading, setStatus };
}

export interface DecisionInput {
  recommendationId: string;
  decision: DecisionKind;
  reason: string;
  stakeholders: string[];
  next_step?: string | null;
  review_date?: string | null;
}

/** Decision Records — the auditable "what did we decide" layer on top of recommendations. */
export function useDecisionRecords() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["decision-records", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Record<string, DecisionRecord>> => {
      const { data, error } = await supabase
        .from("decision_records")
        .select("id, recommendation_id, decision, reason, stakeholders, next_step, review_date, status, updated_at");
      if (error) throw error;
      return Object.fromEntries(
        (data ?? []).map((r) => [r.recommendation_id, r as unknown as DecisionRecord])
      );
    },
  });

  const upsertDecision = useMutation({
    mutationFn: async (input: DecisionInput) => {
      const sync = DECISION_SYNC[input.decision];
      const { error } = await supabase.from("decision_records").upsert(
        {
          user_id: user!.id,
          recommendation_id: input.recommendationId,
          decision: input.decision,
          reason: input.reason,
          stakeholders: input.stakeholders,
          next_step: input.next_step ?? null,
          review_date: input.review_date ?? null,
          status: sync.record,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,recommendation_id" }
      );
      if (error) throw error;

      const { error: statusError } = await supabase.from("recommendation_status").upsert(
        {
          user_id: user!.id,
          recommendation_id: input.recommendationId,
          status: sync.mirrored,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,recommendation_id" }
      );
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decision-records", user?.id] });
      qc.invalidateQueries({ queryKey: ["recommendation-status", user?.id] });
    },
  });

  return { decisions: query.data ?? {}, isLoading: query.isLoading, upsertDecision };
}


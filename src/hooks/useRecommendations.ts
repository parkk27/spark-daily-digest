import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RecommendationSection = "act_now" | "watch" | "deprioritize";

export interface Recommendation {
  id: string;
  signal_key?: string | null;
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
  /** Action layer — what happens next, who owns it and when it is due. */
  action: string | null;
  action_owner: string | null;
  action_due_date: string | null;
  outcome: string | null;
  outcome_notes: string | null;
  completed_at: string | null;
}

export const OUTCOMES = [
  "Roadmap changed",
  "Positioning changed",
  "Customer research completed",
  "Sales response created",
  "No change required",
  "Signal proved irrelevant",
  "Continue monitoring",
] as const;

export type Outcome = (typeof OUTCOMES)[number];

export const ACTION_SUGGESTIONS = [
  "Review competitive battlecard",
  "Validate roadmap gap",
  "Interview customers",
  "Prepare Sales response",
  "Review technical capability",
  "Monitor next release",
];


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
  /** Stable business identity of the signal — survives radar refreshes. */
  signalKey: string;
  decision: DecisionKind;
  reason: string;
  stakeholders: string[];
  next_step?: string | null;
  review_date?: string | null;
  /** Action layer captured in the same workspace step. */
  action?: string | null;
  action_owner?: string | null;
  action_due_date?: string | null;
  /** Required when an earlier decision is being replaced. */
  change_reason?: string | null;
}

const DECISION_COLUMNS =
  "id, recommendation_id, signal_key, decision, reason, stakeholders, next_step, review_date, status, updated_at, action, action_owner, action_due_date, outcome, outcome_notes, completed_at";


/** Decision Records — the auditable "what did we decide" layer on top of recommendations. */
export function useDecisionRecords() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["decision-records", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Record<string, DecisionRecord>> => {
      const { data, error } = await supabase.from("decision_records").select(DECISION_COLUMNS);
      if (error) throw error;
      // Keyed by stable signal key, with the legacy UUID kept as a fallback key.
      const map: Record<string, DecisionRecord> = {};
      for (const row of (data ?? []) as unknown as DecisionRecord[]) {
        if (row.signal_key) map[row.signal_key] = row;
        if (row.recommendation_id) map[row.recommendation_id] = row;
      }
      return map;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["decision-records", user?.id] });
    qc.invalidateQueries({ queryKey: ["decision-history", user?.id] });
    qc.invalidateQueries({ queryKey: ["recommendation-status", user?.id] });
  };

  /** Append-only: snapshot the outgoing decision before it is replaced. */
  const archive = async (prev: DecisionRecord, changeReason?: string | null) => {
    const { error } = await supabase.from("decision_record_history").insert({
      decision_record_id: prev.id,
      user_id: user!.id,
      signal_key: prev.signal_key,
      recommendation_id: prev.recommendation_id,
      decision: prev.decision,
      reason: prev.reason,
      stakeholders: prev.stakeholders ?? [],
      next_step: prev.next_step,
      review_date: prev.review_date,
      status: prev.status,
      change_reason: changeReason ?? null,
    });
    if (error) throw error;
  };

  const findExisting = async (signalKey: string, recommendationId: string) => {
    const { data, error } = await supabase
      .from("decision_records")
      .select(DECISION_COLUMNS)
      .or(`signal_key.eq.${signalKey},recommendation_id.eq.${recommendationId}`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as DecisionRecord) ?? null;
  };

  const upsertDecision = useMutation({
    mutationFn: async (input: DecisionInput) => {
      const sync = DECISION_SYNC[input.decision];
      const existing = await findExisting(input.signalKey, input.recommendationId);
      if (existing) await archive(existing, input.change_reason);

      const payload = {
        user_id: user!.id,
        recommendation_id: input.recommendationId,
        signal_key: input.signalKey,
        decision: input.decision,
        reason: input.reason,
        stakeholders: input.stakeholders,
        next_step: input.next_step ?? null,
        review_date: input.review_date ?? null,
        status: sync.record,
        updated_at: new Date().toISOString(),
      };

      const { error } = existing
        ? await supabase.from("decision_records").update(payload).eq("id", existing.id)
        : await supabase.from("decision_records").insert(payload);
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
    onSuccess: invalidate,
  });

  /** Push a review date out without changing the decision itself. */
  const extendReview = useMutation({
    mutationFn: async ({ id, review_date }: { id: string; review_date: string }) => {
      const { error } = await supabase
        .from("decision_records")
        .update({ review_date, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Close a decision out — mirrors to the existing legacy status values only. */
  const resolveDecision = useMutation({
    mutationFn: async (record: DecisionRecord) => {
      await archive(record, "Resolved");
      const { error } = await supabase
        .from("decision_records")
        .update({ status: "resolved", updated_at: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      if (record.recommendation_id) {
        await supabase.from("recommendation_status").upsert(
          {
            user_id: user!.id,
            recommendation_id: record.recommendation_id,
            status: "resolved",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,recommendation_id" }
        );
      }
    },
    onSuccess: invalidate,
  });

  return {
    decisions: query.data ?? {},
    isLoading: query.isLoading,
    upsertDecision,
    extendReview,
    resolveDecision,
  };
}

/** Previous decisions for a signal, newest first. */
export function useDecisionHistory(signalKey?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["decision-history", user?.id, signalKey],
    enabled: !!user && !!signalKey,
    queryFn: async (): Promise<DecisionHistoryEntry[]> => {
      const { data, error } = await supabase
        .from("decision_record_history")
        .select("id, signal_key, decision, reason, change_reason, review_date, status, changed_at")
        .eq("signal_key", signalKey!)
        .order("changed_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as DecisionHistoryEntry[];
    },
  });
}



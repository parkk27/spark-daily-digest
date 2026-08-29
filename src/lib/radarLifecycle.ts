/**
 * Deterministic Action Radar lifecycle.
 *
 * Every lane, reason, impact band and competitive position below is derived from
 * data that already exists on `recommendations` / `decision_records`. Nothing here
 * infers, guesses or fabricates — missing data renders as "Unknown".
 */

import { formatDistanceToNowStrict, parseISO } from "date-fns";
import type { Recommendation, DecisionRecord } from "@/hooks/useRecommendations";
import { reviewState } from "@/lib/signalIdentity";
import { BENCHMARKS, VENDOR_LABELS, type Vendor } from "@/data/features";

export type Lane =
  | "act_now"
  | "needs_review"
  | "tracking"
  | "action_in_progress"
  | "completed";

export const LANES: Lane[] = [
  "act_now",
  "needs_review",
  "tracking",
  "action_in_progress",
  "completed",
];

export const LANE_LABELS: Record<Lane, string> = {
  act_now: "Act now",
  needs_review: "Needs my review",
  tracking: "I'm tracking",
  action_in_progress: "Actions in progress",
  completed: "Completed",
};

export const LANE_EMPTY: Record<Lane, string> = {
  act_now: "Nothing requires immediate action.",
  needs_review: "You're caught up. No new signals require review.",
  tracking: "You're not currently tracking any signals.",
  action_in_progress: "No active actions.",
  completed: "No completed actions yet.",
};

export const WORKFLOW_STATE_LABELS: Record<Lane, string> = {
  act_now: "Needs review",
  needs_review: "Needs review",
  tracking: "Tracking",
  action_in_progress: "Action in progress",
  completed: "Completed",
};

const CLOSED_STATUSES = ["resolved", "dismissed", "completed"];

/** Where a signal sits in the SIGNAL → REVIEW → DECISION → ACTION → OUTCOME lifecycle. */
export const laneOf = (r: Recommendation, d?: DecisionRecord): Lane => {
  if (!d) return r.section === "act_now" ? "act_now" : "needs_review";
  if (d.completed_at || d.outcome || CLOSED_STATUSES.includes(d.status)) return "completed";
  if (d.decision === "monitor") return "tracking";
  return "action_in_progress";
};

/** A decision whose review date has passed and is still open. */
export const isReviewDue = (d?: DecisionRecord): boolean =>
  !!d && reviewState(d.review_date, d.status) === "overdue";

export type ConfidenceBand = "High" | "Medium" | "Low";

export const confidenceBand = (confidence?: number | null): ConfidenceBand | "Unknown" => {
  if (typeof confidence !== "number") return "Unknown";
  if (confidence >= 80) return "High";
  if (confidence >= 55) return "Medium";
  return "Low";
};

/** Evidence freshness from the ingestion date on the recommendation. */
export const freshnessLabel = (date?: string | null): string => {
  if (!date) return "Freshness unavailable";
  try {
    return `Evidence from ${formatDistanceToNowStrict(parseISO(date))} ago`;
  } catch {
    return "Freshness unavailable";
  }
};

const VENDOR_MATCH: { key: RegExp; vendor: Vendor; label: string }[] = [
  { key: /databricks/i, vendor: "databricks", label: "Databricks" },
  { key: /bigquery|google/i, vendor: "bigquery", label: "Google Cloud / BigQuery" },
  { key: /aws|amazon|emr/i, vendor: "emr", label: "AWS" },
  { key: /snowflake/i, vendor: "snowflake", label: "Snowflake" },
  { key: /spark|iceberg/i, vendor: "spark", label: "Apache Spark ecosystem" },
];

export const OUR_PLATFORM_LABEL = "Microsoft Fabric Spark";

export interface CompetitiveContext {
  competitor: string;
  capability: string;
  ourPosition: string;
  competitorPosition: string;
}

/**
 * Explicit "us vs. them" framing. Positions only come from the Compare benchmark
 * data — when there is no benchmark match the position is "Unknown", never a guess.
 */
export const competitiveContext = (r: Recommendation): CompetitiveContext | null => {
  const haystack = `${r.related_vendor ?? ""} ${r.title}`;
  if (/microsoft|fabric/i.test(r.related_vendor ?? "")) return null;
  const match = VENDOR_MATCH.find((v) => v.key.test(haystack));
  if (!match) return null;

  const text = `${r.title} ${r.summary} ${(r.related_technologies ?? []).join(" ")}`.toLowerCase();
  const benchmark = BENCHMARKS.filter((b) => b.vendor === match.vendor).find((b) =>
    b.capability
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .some((w) => text.includes(w))
  );

  const ourPosition = benchmark
    ? benchmark.position === "leader"
      ? "Strong"
      : benchmark.position === "competitive"
        ? "Comparable"
        : "Gap"
    : "Unknown";
  const competitorPosition = benchmark
    ? benchmark.position === "leader"
      ? "Comparable"
      : benchmark.position === "competitive"
        ? "Strong"
        : "Emerging"
    : "Unknown";

  return {
    competitor: VENDOR_LABELS[match.vendor] ?? match.label,
    capability: benchmark?.capability ?? "Unknown",
    ourPosition,
    competitorPosition,
  };
};

const IMPACT_FACTORS: { key: string; label: string }[] = [
  { key: "competitive_intensity", label: "Competitive" },
  { key: "customer_impact", label: "Customer" },
  { key: "strategic_relevance", label: "Capability" },
  { key: "momentum", label: "Roadmap" },
  { key: "urgency", label: "Commercial" },
];

export interface ImpactBand {
  label: string;
  value: string;
  score: number | null;
}

/** Impact on Microsoft Fabric, banded from the existing deterministic score breakdown. */
export const impactBands = (r: Recommendation): ImpactBand[] =>
  IMPACT_FACTORS.map(({ key, label }) => {
    const score = r.score_breakdown?.[key];
    if (typeof score !== "number") return { label, value: "Unknown", score: null };
    return {
      label,
      value: score >= 70 ? "High" : score >= 40 ? "Medium" : "Low",
      score,
    };
  });

/** Why the PM is seeing this signal — max three deterministic reasons. */
export const whyAmISeeingThis = (r: Recommendation, roleFocus: string): string[] => {
  const reasons: string[] = [];
  const b = r.score_breakdown ?? {};
  if (r.owner === roleFocus) reasons.push(`Assigned to your role (${r.owner})`);
  if (r.polarity === "threat") reasons.push("Competitive movement from a named competitor");
  if ((b.customer_impact ?? 0) >= 70) reasons.push("Customer impact scored high");
  if ((b.momentum ?? 0) >= 70) reasons.push("Topic momentum increased");
  if ((b.evidence_confidence ?? 0) >= 70) reasons.push("Evidence confidence is high");
  if (r.section === "act_now") reasons.push("Ranked in the act-now priority band");
  return reasons.slice(0, 3);
};

/** Concise, factual significance statement — no superiority claims. */
export const significanceOf = (r: Recommendation): string => {
  const ctx = competitiveContext(r);
  if (ctx) {
    return `This changes the competitive comparison between ${OUR_PLATFORM_LABEL} and ${ctx.competitor}${
      ctx.capability !== "Unknown" ? ` on ${ctx.capability.toLowerCase()}` : ""
    }.`;
  }
  if (r.signal_type === "customer") return "This affects how customers evaluate the platform.";
  if (r.signal_type === "regulatory") return "This affects governance and compliance posture.";
  if (r.signal_type === "commercial") return "This affects the commercial and pricing narrative.";
  return "This affects the ecosystem context the platform is positioned within.";
};

/** Deterministic PM action suggestion derived from signal type and polarity. */
export const recommendedPmAction = (r: Recommendation): string => {
  if (r.polarity === "threat") return "Review competitive positioning";
  if (r.signal_type === "customer") return "Validate with customer research";
  if (r.signal_type === "technology") return "Review technical capability";
  if (r.signal_type === "commercial") return "Review commercial positioning";
  return "Monitor the next release";
};

export interface ThemeGroup {
  theme: string;
  count: number;
  vendors: { name: string; count: number }[];
}

/**
 * Deterministic clustering by shared technology tag. Only groups with 3+ signals
 * are surfaced — no LLM, no speculative themes.
 */
export const emergingThemes = (rows: Recommendation[]): ThemeGroup[] => {
  const byTag = new Map<string, Recommendation[]>();
  for (const r of rows) {
    for (const tag of r.related_technologies ?? []) {
      const key = tag.trim().toLowerCase();
      if (!key) continue;
      byTag.set(key, [...(byTag.get(key) ?? []), r]);
    }
  }
  return Array.from(byTag.entries())
    .filter(([, items]) => items.length >= 3)
    .map(([tag, items]) => {
      const counts = new Map<string, number>();
      for (const i of items) {
        const name = i.related_vendor ?? "Unknown source";
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      return {
        theme: tag.replace(/\b\w/g, (c) => c.toUpperCase()),
        count: items.length,
        vendors: Array.from(counts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
};

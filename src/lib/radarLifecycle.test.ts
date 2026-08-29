import { describe, expect, it } from "vitest";
import {
  confidenceBand,
  emergingThemes,
  impactBands,
  isReviewDue,
  laneOf,
  whyAmISeeingThis,
} from "@/lib/radarLifecycle";
import type { Recommendation, DecisionRecord } from "@/hooks/useRecommendations";

const rec = (over: Partial<Recommendation> = {}): Recommendation =>
  ({
    id: "r1",
    signal_key: "src:one",
    date: "2026-08-01",
    section: "watch",
    title: "Databricks pricing change",
    summary: "Summary",
    owner: "product",
    priority: "medium",
    confidence: 70,
    evidence_count: 2,
    evidence: [],
    rationale: null,
    related_vendor: "Databricks",
    related_technologies: ["iceberg"],
    due_date: null,
    signal_type: "competitive",
    polarity: "threat",
    score_breakdown: { customer_impact: 80, momentum: 30 },
    ...over,
  }) as Recommendation;

const dec = (over: Partial<DecisionRecord> = {}): DecisionRecord =>
  ({
    id: "d1",
    recommendation_id: "r1",
    signal_key: "src:one",
    decision: "investigate",
    reason: "r",
    stakeholders: [],
    next_step: null,
    review_date: null,
    status: "investigating",
    updated_at: "2026-08-01",
    action: null,
    action_owner: null,
    action_due_date: null,
    outcome: null,
    outcome_notes: null,
    completed_at: null,
    ...over,
  }) as DecisionRecord;

describe("laneOf", () => {
  it("puts undecided act_now signals in act now", () => {
    expect(laneOf(rec({ section: "act_now" }))).toBe("act_now");
  });
  it("puts other undecided signals in needs review", () => {
    expect(laneOf(rec())).toBe("needs_review");
  });
  it("puts monitor decisions in tracking", () => {
    expect(laneOf(rec(), dec({ decision: "monitor" }))).toBe("tracking");
  });
  it("puts active decisions in actions in progress", () => {
    expect(laneOf(rec(), dec())).toBe("action_in_progress");
  });
  it("puts recorded outcomes in completed", () => {
    expect(laneOf(rec(), dec({ outcome: "No change required" }))).toBe("completed");
  });
});

describe("review + bands", () => {
  it("flags overdue open reviews", () => {
    expect(isReviewDue(dec({ review_date: "2020-01-01" }))).toBe(true);
    expect(isReviewDue(dec({ review_date: "2020-01-01", status: "resolved" }))).toBe(false);
    expect(isReviewDue(undefined)).toBe(false);
  });
  it("bands confidence and reports unknown", () => {
    expect(confidenceBand(90)).toBe("High");
    expect(confidenceBand(60)).toBe("Medium");
    expect(confidenceBand(10)).toBe("Low");
    expect(confidenceBand(null)).toBe("Unknown");
  });
  it("marks missing score factors unknown", () => {
    const bands = impactBands(rec());
    expect(bands.find((b) => b.label === "Customer")?.value).toBe("High");
    expect(bands.find((b) => b.label === "Commercial")?.value).toBe("Unknown");
  });
});

describe("explainability + themes", () => {
  it("returns at most three deterministic reasons", () => {
    const reasons = whyAmISeeingThis(rec({ section: "act_now" }), "product");
    expect(reasons.length).toBeLessThanOrEqual(3);
    expect(reasons[0]).toContain("product");
  });
  it("only groups tags with three or more signals", () => {
    const rows = [rec(), rec({ id: "r2" }), rec({ id: "r3" }), rec({ id: "r4", related_technologies: ["solo"] })];
    const themes = emergingThemes(rows);
    expect(themes).toHaveLength(1);
    expect(themes[0].theme).toBe("Iceberg");
    expect(themes[0].count).toBe(3);
  });
});

import { describe, expect, it } from "vitest";
import { activeReminders, dueReminders, reminderId } from "@/lib/radarReminders";
import { buildCsv, toExportRow } from "@/lib/radarExport";
import type { DecisionRecord, Recommendation } from "@/hooks/useRecommendations";
import type { Lane } from "@/lib/radarLifecycle";

const rec = (over: Partial<Recommendation> = {}): Recommendation => ({
  id: "rec-1",
  signal_key: "databricks:post",
  date: "2026-08-20",
  section: "act_now",
  title: "Databricks ships new engine",
  summary: "Summary, with a comma",
  owner: "product",
  priority: "high",
  confidence: 82,
  evidence_count: 3,
  evidence: [],
  rationale: null,
  related_vendor: "Databricks",
  related_technologies: ["iceberg"],
  due_date: null,
  signal_type: "competitive",
  polarity: "threat",
  score_breakdown: {},
  ...over,
});

const dec = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  id: "dec-1",
  recommendation_id: "rec-1",
  signal_key: "databricks:post",
  decision: "investigate",
  reason: "Impacts evaluation",
  stakeholders: [],
  next_step: null,
  review_date: null,
  status: "investigating",
  updated_at: "2026-08-20T00:00:00Z",
  action: null,
  action_owner: null,
  action_due_date: null,
  outcome: null,
  outcome_notes: null,
  completed_at: null,
  ...over,
});

const today = new Date("2026-08-30T10:00:00Z");

describe("radar reminders", () => {
  it("flags an overdue review with the day count", () => {
    const out = dueReminders([rec()], { "databricks:post": dec({ review_date: "2026-08-27" }) }, today);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("review_overdue");
    expect(out[0].daysOverdue).toBe(3);
  });

  it("flags a review due today", () => {
    const out = dueReminders([rec()], { "databricks:post": dec({ review_date: "2026-08-30" }) }, today);
    expect(out[0].kind).toBe("review_today");
  });

  it("ignores future reviews and resolved decisions", () => {
    expect(
      dueReminders([rec()], { "databricks:post": dec({ review_date: "2026-09-30" }) }, today)
    ).toHaveLength(0);
    expect(
      dueReminders(
        [rec()],
        { "databricks:post": dec({ review_date: "2026-08-01", status: "resolved" }) },
        today
      )
    ).toHaveLength(0);
  });

  it("flags an overdue action only while there is no outcome", () => {
    const open = dueReminders([rec()], { "databricks:post": dec({ action_due_date: "2026-08-25" }) }, today);
    expect(open[0].kind).toBe("action_overdue");
    const closed = dueReminders(
      [rec()],
      { "databricks:post": dec({ action_due_date: "2026-08-25", outcome: "Roadmap changed" }) },
      today
    );
    expect(closed).toHaveLength(0);
  });

  it("respects dismissals keyed by due date", () => {
    const list = dueReminders([rec()], { "databricks:post": dec({ review_date: "2026-08-27" }) }, today);
    expect(activeReminders(list, [reminderId(list[0])])).toHaveLength(0);
    expect(activeReminders(list, ["other"])).toHaveLength(1);
  });
});

describe("radar export", () => {
  const counts: Record<Lane, number> = {
    act_now: 2,
    needs_review: 1,
    tracking: 0,
    action_in_progress: 3,
    completed: 4,
  };

  it("maps a signal and its decision to an export row", () => {
    const row = toExportRow(rec(), { "databricks:post": dec({ action: "Interview customers" }) });
    expect(row.lane).toBe("Actions in progress");
    expect(row.decision).toBe("Investigate");
    expect(row.action).toBe("Interview customers");
    expect(row.signal_key).toBe("databricks:post");
  });

  it("quotes CSV values containing commas and includes the count summary", () => {
    const csv = buildCsv([toExportRow(rec(), {})], counts);
    expect(csv).toContain("Act now,2");
    expect(csv).toContain('"Summary, with a comma"');
    expect(csv.split("\n").filter(Boolean).length).toBe(1 + 5 + 1 + 1);
  });
});

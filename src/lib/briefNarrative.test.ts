import { describe, it, expect } from "vitest";
import {
  briefNarrative,
  competitivePosture,
  coolingTrends,
  risingTrends,
  topDrivers,
} from "./briefNarrative";
import { roadmapActions, buildRoadmapEntry } from "./roadmap";
import { getPerspective } from "./perspectives";
import type { PerspectiveTrend } from "./momentum";

const perspective = getPerspective("microsoft-fabric");

const trend = (over: Partial<PerspectiveTrend>): PerspectiveTrend => ({
  perspective_id: perspective.id,
  entity_id: "fabric",
  entity_name: "fabric",
  entity_kind: "topic",
  window_start: "2026-08-01",
  window_end: "2026-08-31",
  current_activity: 12,
  baseline_activity: 8,
  momentum_percent: 50,
  momentum_direction: "VERY_HIGH_UP",
  trend_confidence: 80,
  top_drivers: [{ label: "microsoft", contribution: 4, current: 6, baseline: 2 }],
  strategic_relevance: 80,
  competitive_intensity: 40,
  impact_score: 80,
  rationale: "",
  generated_at: "2026-08-31T00:00:00Z",
  ...over,
});

const rows = [
  trend({}),
  trend({
    entity_id: "onelake",
    entity_name: "onelake",
    momentum_percent: -30,
    momentum_direction: "HIGH_DOWN",
    top_drivers: [{ label: "microsoft", contribution: -2, current: 1, baseline: 3 }],
  }),
  trend({
    entity_id: "databricks",
    entity_name: "databricks",
    entity_kind: "competitor",
    momentum_percent: 25,
    momentum_direction: "HIGH_UP",
    top_drivers: [{ label: "databricks blog", contribution: 3, current: 5, baseline: 2 }],
  }),
  trend({
    entity_id: "synapse",
    entity_name: "synapse",
    momentum_percent: 0,
    momentum_direction: "LOW_DATA",
    current_activity: 1,
    baseline_activity: 1,
    top_drivers: [],
  }),
];

describe("momentum selectors", () => {
  it("ranks rising and cooling by absolute momentum and excludes low data", () => {
    expect(risingTrends(rows).map((t) => t.entity_id)).toEqual(["fabric", "databricks"]);
    expect(coolingTrends(rows).map((t) => t.entity_id)).toEqual(["onelake"]);
  });

  it("aggregates drivers across entities", () => {
    const d = topDrivers(rows);
    const microsoft = d.find((x) => x.label === "microsoft");
    expect(microsoft?.contribution).toBe(2);
    expect(microsoft?.entities).toContain("fabric");
  });

  it("computes competitive posture as own vs rivals", () => {
    const p = competitivePosture(rows);
    expect(p.own).toBe(10); // (50 + -30) / 2
    expect(p.rivals).toBe(25);
    expect(p.gap).toBe(-15);
    expect(p.leadingRival?.entity_id).toBe("databricks");
  });
});

describe("briefNarrative", () => {
  it("returns an honest fallback when nothing is reportable", () => {
    const out = briefNarrative(perspective, [rows[3]]);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("not yet enough observed activity");
  });

  it("describes movers, decline and competitive position from real numbers", () => {
    const out = briefNarrative(perspective, rows).join(" ");
    expect(out).toContain("fabric");
    expect(out).toContain("+50%");
    expect(out).toContain("onelake");
    expect(out).toContain("databricks");
  });
});

describe("roadmap", () => {
  it("derives prioritised actions anchored to entities", () => {
    const actions = roadmapActions(perspective, rows);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].priority).toBe("high");
    expect(actions.some((a) => a.link.to === "/compare")).toBe(true);
  });

  it("falls back to observation when there is no reportable trend", () => {
    const actions = roadmapActions(perspective, [rows[3]]);
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe("observe");
  });

  it("builds a complete entry", () => {
    const entry = buildRoadmapEntry(perspective, rows);
    expect(entry.reportable).toBe(3);
    expect(entry.lowData).toBe(1);
    expect(entry.drivers.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import type { PerspectiveTrend } from "./momentum";
import { driverBars, lowDataCount, momentumBars, timelineSeries } from "./trendCharts";

const trend = (over: Partial<PerspectiveTrend>): PerspectiveTrend =>
  ({
    perspective_id: "fabric-spark",
    entity_id: "fabric",
    entity_name: "Fabric",
    entity_kind: "self",
    window_start: "2026-08-01",
    window_end: "2026-08-31",
    current_activity: 10,
    baseline_activity: 5,
    momentum_percent: 100,
    momentum_direction: "UP",
    trend_confidence: 80,
    top_drivers: [],
    strategic_relevance: 70,
    competitive_intensity: 50,
    impact_score: 60,
    rationale: "",
    ...over,
  }) as PerspectiveTrend;

describe("trendCharts", () => {
  it("sorts momentum bars from strongest rise to steepest decline", () => {
    const bars = momentumBars([
      trend({ entity_id: "a", entity_name: "A", momentum_percent: 10 }),
      trend({ entity_id: "b", entity_name: "B", momentum_percent: 90 }),
      trend({ entity_id: "c", entity_name: "C", momentum_percent: -40 }),
    ]);
    expect(bars.map((b) => b.entityId)).toEqual(["b", "a", "c"]);
  });

  it("excludes low-data entities and counts them separately", () => {
    const rows = [
      trend({ entity_id: "a", momentum_direction: "UP" }),
      trend({ entity_id: "b", momentum_direction: "LOW_DATA" }),
    ];
    expect(momentumBars(rows)).toHaveLength(1);
    expect(lowDataCount(rows)).toBe(1);
  });

  it("reports no history when only one window exists", () => {
    const series = timelineSeries([trend({ window_end: "2026-08-31" })]);
    expect(series.hasHistory).toBe(false);
  });

  it("builds one timeline row per stored window", () => {
    const series = timelineSeries([
      trend({ window_end: "2026-07-31", momentum_percent: 20 }),
      trend({ window_end: "2026-08-31", momentum_percent: 60 }),
    ]);
    expect(series.hasHistory).toBe(true);
    expect(series.points.map((p) => p.date)).toEqual(["2026-07-31", "2026-08-31"]);
    expect(series.points[1].Fabric).toBe(60);
  });

  it("returns no driver bars when there are no drivers", () => {
    expect(driverBars([trend({})])).toEqual([]);
  });
});

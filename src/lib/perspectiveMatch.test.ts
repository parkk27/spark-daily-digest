import { describe, expect, it } from "vitest";
import {
  bestTrend,
  momentumCoverage,
  perspectiveVendors,
  rankBriefItems,
  rankByPerspective,
} from "@/lib/perspectiveMatch";
import { getPerspective } from "@/lib/perspectives";
import { MOMENTUM_BANDS, MOMENTUM_CONFIG, type PerspectiveTrend } from "@/lib/momentum";

const fabric = getPerspective("microsoft-fabric");
const databricks = getPerspective("databricks");

const trend = (over: Partial<PerspectiveTrend>): PerspectiveTrend => ({
  perspective_id: "microsoft-fabric",
  entity_id: "spark",
  entity_name: "spark",
  entity_kind: "topic",
  window_start: "2026-08-01",
  window_end: "2026-08-31",
  current_activity: 20,
  baseline_activity: 10,
  momentum_percent: 100,
  momentum_direction: "VERY_HIGH_UP",
  trend_confidence: 80,
  top_drivers: [],
  strategic_relevance: 70,
  competitive_intensity: 40,
  impact_score: 75,
  rationale: "",
  generated_at: "2026-08-31T00:00:00Z",
  ...over,
});

describe("perspective matching", () => {
  it("ranks rows by perspective relevance, keeping input order on ties", () => {
    const rows = ["nothing relevant here", "OneLake governance in Fabric", "also nothing"];
    const ranked = rankByPerspective(rows, (r) => ({ title: r }), fabric);
    expect(ranked[0].row).toBe("OneLake governance in Fabric");
    expect(ranked[1].row).toBe("nothing relevant here");
  });

  it("does not duplicate rows when scoring", () => {
    const rows = ["fabric", "databricks"];
    expect(rankByPerspective(rows, (r) => ({ title: r }), fabric)).toHaveLength(2);
  });

  it("picks the strongest reportable momentum entity mentioned", () => {
    const momentum = {
      spark: trend({ entity_id: "spark", entity_name: "spark", momentum_percent: 12 }),
      iceberg: trend({ entity_id: "iceberg", entity_name: "iceberg", momentum_percent: 45 }),
      delta: trend({
        entity_id: "delta",
        entity_name: "delta",
        momentum_percent: 90,
        momentum_direction: "LOW_DATA",
      }),
    };
    const t = bestTrend({ title: "spark iceberg delta update" }, momentum);
    expect(t?.entity_id).toBe("iceberg");
  });

  it("falls back to a low-data trend only when nothing reportable matches", () => {
    const momentum = {
      delta: trend({ entity_id: "delta", entity_name: "delta", momentum_direction: "LOW_DATA" }),
    };
    expect(bestTrend({ title: "delta news" }, momentum)?.entity_id).toBe("delta");
    expect(bestTrend({ title: "unrelated" }, momentum)).toBeUndefined();
  });

  it("scopes benchmark vendors to the perspective and excludes the perspective itself", () => {
    const vendors = ["databricks", "bigquery", "emr", "snowflake", "spark"] as const;
    const labels = {
      databricks: "Databricks",
      bigquery: "Google BigQuery",
      emr: "AWS EMR",
      snowflake: "Snowflake",
      spark: "Apache Spark ecosystem",
    };
    const forFabric = perspectiveVendors(vendors, labels, fabric);
    expect(forFabric).toContain("databricks");
    const forDatabricks = perspectiveVendors(vendors, labels, databricks);
    expect(forDatabricks).not.toContain("databricks");
    expect(forDatabricks).toContain("snowflake");
  });

  it("orders brief items by momentum strength", () => {
    const momentum = {
      iceberg: trend({ entity_id: "iceberg", entity_name: "iceberg", momentum_percent: 60 }),
    };
    const ranked = rankBriefItems(
      ["general market note", "iceberg adoption accelerates"],
      fabric,
      momentum
    );
    expect(ranked[0].row).toBe("iceberg adoption accelerates");
    expect(ranked[0].trend?.entity_id).toBe("iceberg");
  });

  it("reports honest momentum coverage", () => {
    const c = momentumCoverage([
      trend({}),
      trend({ momentum_direction: "LOW_DATA" }),
    ]);
    expect(c).toMatchObject({ total: 2, reportable: 1, lowData: 1 });
    expect(momentumCoverage(undefined).total).toBe(0);
  });

  it("exposes display thresholds for every direction band", () => {
    expect(MOMENTUM_BANDS).toHaveLength(8);
    expect(MOMENTUM_BANDS.at(-1)?.rule).toContain(String(MOMENTUM_CONFIG.low_data_threshold));
  });
});

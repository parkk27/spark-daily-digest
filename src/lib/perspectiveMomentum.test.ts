import { describe, expect, it } from "vitest";
import {
  ACTIVE_PERSPECTIVES,
  DEFAULT_PERSPECTIVE_ID,
  getPerspective,
} from "@/lib/perspectives";
import {
  canonicalSignalId,
  computePerspectiveTrends,
  isRadarEligible,
  momentumDirection,
  momentumPercent,
  signalWeight,
  trendConfidence,
  trendDrivers,
  type MomentumSignal,
} from "@/lib/momentum";
import { perspectiveRelevance, strategicImpact, perspectivePolarity } from "@/lib/perspectiveScoring";

const fabric = getPerspective(DEFAULT_PERSPECTIVE_ID);

const sig = (over: Partial<MomentumSignal>): MomentumSignal => ({
  id: "",
  date: "2026-08-20",
  title: "iceberg update",
  source: "microsoft",
  tags: ["iceberg"],
  ...over,
});

// 1. default perspective
describe("perspective configuration", () => {
  it("defaults to Microsoft Fabric when unset", () => {
    expect(getPerspective(null).id).toBe("microsoft-fabric");
    expect(getPerspective("does-not-exist").id).toBe("microsoft-fabric");
  });

  // 2. switching perspective changes the lens
  it("switching perspective changes relevance for the same signal", () => {
    const s = { title: "Databricks Photon benchmark results", tags: ["databricks", "performance"] };
    const fabricScore = perspectiveRelevance(s, fabric).score;
    const dbxScore = perspectiveRelevance(s, getPerspective("databricks")).score;
    expect(dbxScore).toBeGreaterThan(0);
    expect(dbxScore).not.toBe(fabricScore);
  });

  // 3. every active perspective is selectable and self-consistent
  it("exposes platform and technology perspectives", () => {
    expect(ACTIVE_PERSPECTIVES.length).toBeGreaterThanOrEqual(10);
    expect(ACTIVE_PERSPECTIVES.some((p) => p.type === "technology")).toBe(true);
    ACTIVE_PERSPECTIVES.forEach((p) => expect(p.competitors).not.toContain(p.id));
  });
});

// 4. canonical signal identity
describe("canonical signal identity", () => {
  it("is independent of URL noise and duplicates", () => {
    const a = canonicalSignalId({ url: "https://www.databricks.com/blog/post/" });
    const b = canonicalSignalId({ url: "https://databricks.com/blog/post" });
    expect(a).toBe(b);
  });

  it("prefers the existing signal_key", () => {
    expect(canonicalSignalId({ id: "aws:post-1", url: "https://x.dev/y" })).toBe("aws:post-1");
  });
});

describe("momentum math", () => {
  // 5. +20%
  it("computes +20% as HIGH_UP", () => {
    const pct = momentumPercent(12, 10);
    expect(pct).toBe(20);
    expect(momentumDirection(pct, 22)).toBe("HIGH_UP");
  });

  // 6. stable at +2%
  it("treats +2% as STABLE", () => {
    const pct = momentumPercent(10.2, 10);
    expect(momentumDirection(pct, 20.2)).toBe("STABLE");
  });

  // 7. low-volume guard: 3 vs 1
  it("flags LOW_DATA instead of high momentum on tiny volume", () => {
    const pct = momentumPercent(3, 1);
    expect(pct).toBe(200);
    expect(momentumDirection(pct, 4)).toBe("LOW_DATA");
  });

  // 8. +50%
  it("computes +50% as VERY_HIGH_UP", () => {
    expect(momentumDirection(momentumPercent(15, 10), 25)).toBe("VERY_HIGH_UP");
  });

  // 9. -30%
  it("computes -30% as HIGH_DOWN", () => {
    expect(momentumDirection(momentumPercent(7, 10), 17)).toBe("HIGH_DOWN");
  });

  it("caps signal weight at 2.0", () => {
    expect(signalWeight(sig({ official: true, competitive: true, confidence: 100 }))).toBe(2);
    expect(signalWeight(sig({}))).toBe(1);
  });
});

// 10. driver ranking by contribution, not volume
describe("trend drivers", () => {
  it("ranks by weighted contribution to the change", () => {
    const current = [
      sig({ tags: ["governance"], source: "aws" }),
      sig({ tags: ["governance"], source: "aws" }),
      sig({ tags: ["cost"], source: "aws" }),
      sig({ tags: ["cost"], source: "aws" }),
      sig({ tags: ["cost"], source: "aws" }),
    ];
    const baseline = [
      sig({ tags: ["cost"], source: "aws" }),
      sig({ tags: ["cost"], source: "aws" }),
      sig({ tags: ["cost"], source: "aws" }),
    ];
    const drivers = trendDrivers(current, baseline);
    expect(drivers[0].label).toBe("governance");
  });
});

// 11. low confidence when evidence is thin
describe("trend confidence", () => {
  it("is low for a single sparse signal and higher with diverse volume", () => {
    const low = trendConfidence([sig({ source: "aws" })], []);
    const high = trendConfidence(
      [
        sig({ source: "aws", confidence: 90 }),
        sig({ source: "microsoft", confidence: 85 }),
        sig({ source: "google", confidence: 80 }),
        sig({ source: "databricks", confidence: 88 }),
        sig({ source: "snowflake", confidence: 82 }),
      ],
      [sig({ source: "aws", confidence: 70 })],
    );
    expect(low).toBeLessThan(40);
    expect(high).toBeGreaterThan(low);
  });
});

// 12. competitor context is perspective-relative and never invented
describe("scoring", () => {
  it("marks competitor-only signals as threats and own-platform signals as opportunities", () => {
    expect(perspectivePolarity({ title: "Databricks lowers pricing", tags: ["databricks"] }, fabric)).toBe("threat");
    expect(perspectivePolarity({ title: "Fabric adds OneLake governance", tags: ["fabric"] }, fabric)).toBe("opportunity");
    expect(perspectivePolarity({ title: "Unrelated networking release", tags: [] }, fabric)).toBe("neutral");
  });

  it("renormalises impact when score components are missing and never invents values", () => {
    expect(strategicImpact(null)).toBe(0);
    expect(strategicImpact({ strategic_relevance: 80 })).toBe(80);
    expect(strategicImpact({ strategic_relevance: 80, urgency: 40 })).toBeGreaterThan(40);
    expect(perspectiveRelevance({ title: "totally unrelated" }, fabric).score).toBe(0);
  });
});

// 13. Radar eligibility thresholds
describe("radar eligibility", () => {
  it("requires impact, relevance and confidence to all clear the bar", () => {
    const base = { impact_score: 75, strategic_relevance: 65, trend_confidence: 70, momentum_direction: "HIGH_UP" as const };
    expect(isRadarEligible(base)).toBe(true);
    expect(isRadarEligible({ ...base, trend_confidence: 50 })).toBe(false);
    expect(isRadarEligible({ ...base, momentum_direction: "LOW_DATA" })).toBe(false);
  });
});

// 14. no duplicate counting across refreshes
describe("computePerspectiveTrends", () => {
  const today = "2026-08-30";
  const build = (n: number, date: string, tag: string): MomentumSignal[] =>
    Array.from({ length: n }, (_, i) =>
      sig({ id: `${tag}-${date}-${i}`, date, title: `${tag} analysis ${i}`, tags: [tag], source: "microsoft" }),
    );

  it("produces stable output and ignores re-ingested duplicates", () => {
    const signals = [...build(8, "2026-08-20", "iceberg"), ...build(4, "2026-07-20", "iceberg")];
    const once = computePerspectiveTrends(fabric, signals, { today });
    const twice = computePerspectiveTrends(fabric, [...signals, ...signals], { today });
    const a = once.find((t) => t.entity_id === "iceberg")!;
    const b = twice.find((t) => t.entity_id === "iceberg")!;
    expect(a.current_activity).toBe(b.current_activity);
    expect(a.momentum_percent).toBe(b.momentum_percent);
    expect(a.momentum_direction).toBe("VERY_HIGH_UP");
    expect(a.rationale).toContain("observed signal activity");
  });

  it("reports LOW_DATA rather than a spike when volume is tiny", () => {
    const signals = [...build(2, "2026-08-25", "flink"), ...build(1, "2026-07-15", "flink")];
    const t = computePerspectiveTrends(getPerspective("apache-flink"), signals, { today })
      .find((x) => x.entity_id === "flink")!;
    expect(t.momentum_direction).toBe("LOW_DATA");
    expect(t.rationale).toContain("Not enough observed signal activity");
  });
});

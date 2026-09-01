/**
 * Deterministic roadmap actions derived from cached 30-day momentum.
 * No AI, no network — thresholds mirror the momentum model exactly.
 */
import {
  MOMENTUM_CONFIG,
  isRadarEligible,
  type PerspectiveTrend,
} from "./momentum";
import {
  competitivePosture,
  coolingTrends,
  competitorTrends,
  risingTrends,
  topDrivers,
  type AggregatedDriver,
  type CompetitivePosture,
} from "./briefNarrative";
import type { Perspective } from "./perspectives";

export type ActionPriority = "high" | "medium" | "low";

export interface RoadmapAction {
  id: string;
  title: string;
  rationale: string;
  priority: ActionPriority;
  /** Entity the action is anchored to, so it can be promoted to the Radar. */
  entityName?: string;
  link: { to: string; label: string };
}

export interface RoadmapEntry {
  perspective: Perspective;
  trends: PerspectiveTrend[];
  rising: PerspectiveTrend[];
  cooling: PerspectiveTrend[];
  drivers: AggregatedDriver[];
  posture: CompetitivePosture;
  reportable: number;
  lowData: number;
  actions: RoadmapAction[];
}

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

/** Recommended actions for a perspective, ordered by priority. */
export function roadmapActions(
  perspective: Perspective,
  trends: PerspectiveTrend[] = [],
): RoadmapAction[] {
  const actions: RoadmapAction[] = [];
  const rising = risingTrends(trends, 3);
  const cooling = coolingTrends(trends, 2);
  const posture = competitivePosture(trends);
  const rivals = competitorTrends(trends).filter((t) => t.momentum_direction !== "LOW_DATA");

  for (const t of rising) {
    const eligible = isRadarEligible(t);
    actions.push({
      id: `adopt-${t.entity_id}`,
      title:
        t.entity_kind === "competitor"
          ? `Counter-position against ${t.entity_name}`
          : `Invest ahead of ${t.entity_name}`,
      rationale:
        `${t.entity_name} is at ${pct(t.momentum_percent)} over the rolling ${MOMENTUM_CONFIG.window_days}-day window ` +
        `(${t.baseline_activity} → ${t.current_activity} weighted signals, ${t.trend_confidence}% confidence).` +
        (eligible ? " Clears the Radar eligibility bar for impact, relevance and confidence." : ""),
      priority: eligible ? "high" : Math.abs(t.momentum_percent) >= 20 ? "medium" : "low",
      entityName: t.entity_name,
      link: { to: "/radar", label: "Track in Action Radar" },
    });
  }

  const topRival = [...rivals].sort((a, b) => b.momentum_percent - a.momentum_percent)[0];
  if (topRival && topRival.momentum_percent > 0) {
    actions.push({
      id: `benchmark-${topRival.entity_id}`,
      title: `Re-benchmark ${perspective.display_name} against ${topRival.entity_name}`,
      rationale: `${topRival.entity_name} is the fastest-moving rival at ${pct(topRival.momentum_percent)} while ${perspective.display_name} topics average ${pct(posture.own)}.`,
      priority: posture.gap < 0 ? "high" : "medium",
      entityName: topRival.entity_name,
      link: { to: "/compare", label: "Open Compare" },
    });
  }

  for (const t of cooling) {
    actions.push({
      id: `reassess-${t.entity_id}`,
      title: `Reassess roadmap weight on ${t.entity_name}`,
      rationale: `Activity fell ${pct(t.momentum_percent)} versus the previous 30 days (${t.baseline_activity} → ${t.current_activity} weighted signals).`,
      priority: "low",
      entityName: t.entity_name,
      link: { to: "/trends", label: "Review trend detail" },
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "observe",
      title: `Keep observing ${perspective.display_name}`,
      rationale: `No entity in this perspective has enough observed activity to clear the low-data threshold of ${MOMENTUM_CONFIG.low_data_threshold} weighted signals.`,
      priority: "low",
      link: { to: "/news", label: "Review latest coverage" },
    });
  }

  const rank: Record<ActionPriority, number> = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

/** Full roadmap entry for one perspective. */
export function buildRoadmapEntry(
  perspective: Perspective,
  trends: PerspectiveTrend[] = [],
): RoadmapEntry {
  const lowData = trends.filter((t) => t.momentum_direction === "LOW_DATA").length;
  return {
    perspective,
    trends,
    rising: risingTrends(trends, 3),
    cooling: coolingTrends(trends, 2),
    drivers: topDrivers(trends, 3),
    posture: competitivePosture(trends),
    reportable: trends.length - lowData,
    lowData,
    actions: roadmapActions(perspective, trends),
  };
}

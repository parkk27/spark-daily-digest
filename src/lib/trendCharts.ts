/**
 * Pure shaping functions turning cached 30-day momentum rows into chart-ready
 * series. No network, no AI — same input always produces the same output.
 */
import type { PerspectiveTrend } from "./momentum";
import {
  competitivePosture,
  competitorTrends,
  ownTrends,
  topDrivers,
  type AggregatedDriver,
} from "./briefNarrative";

export interface MomentumBar {
  entityId: string;
  name: string;
  momentum: number;
  confidence: number;
  kind: string;
}

const reportable = (t: PerspectiveTrend) => t.momentum_direction !== "LOW_DATA";

/** Count of entities suppressed from the charts because evidence is too thin. */
export function lowDataCount(trends: PerspectiveTrend[] = []): number {
  return trends.filter((t) => !reportable(t)).length;
}

/** All reportable entities sorted from strongest rise to steepest decline. */
export function momentumBars(trends: PerspectiveTrend[] = [], limit = 10): MomentumBar[] {
  return trends
    .filter(reportable)
    .sort((a, b) => b.momentum_percent - a.momentum_percent)
    .slice(0, limit)
    .map((t) => ({
      entityId: t.entity_id,
      name: t.entity_name,
      momentum: t.momentum_percent,
      confidence: t.trend_confidence,
      kind: t.entity_kind,
    }));
}

/** The perspective's own mean momentum plotted alongside each tracked rival. */
export function competitorBars(
  perspectiveName: string,
  trends: PerspectiveTrend[] = [],
): MomentumBar[] {
  const posture = competitivePosture(trends);
  const rivals = competitorTrends(trends)
    .filter(reportable)
    .sort((a, b) => b.momentum_percent - a.momentum_percent)
    .map((t) => ({
      entityId: t.entity_id,
      name: t.entity_name,
      momentum: t.momentum_percent,
      confidence: t.trend_confidence,
      kind: "competitor",
    }));
  if (!rivals.length && !ownTrends(trends).filter(reportable).length) return [];
  return [
    {
      entityId: "__self__",
      name: perspectiveName,
      momentum: posture.own,
      confidence: 100,
      kind: "self",
    },
    ...rivals,
  ];
}

export interface DriverBar {
  label: string;
  contribution: number;
  current: number;
  baseline: number;
  entities: string[];
}

/** Aggregated driver contributions, largest absolute change first. */
export function driverBars(trends: PerspectiveTrend[] = [], limit = 8): DriverBar[] {
  return topDrivers(trends, limit).map((d: AggregatedDriver) => ({
    label: d.label,
    contribution: d.contribution,
    current: d.current,
    baseline: d.baseline,
    entities: d.entities,
  }));
}

export interface TimelinePoint {
  date: string;
  [entity: string]: string | number;
}

export interface TimelineSeries {
  points: TimelinePoint[];
  entities: string[];
  /** True when at least one entity has two or more observed windows. */
  hasHistory: boolean;
}

/**
 * Groups every stored snapshot window into one row per window_end so each top
 * entity becomes a line. Sparse history stays sparse — nothing is interpolated.
 */
export function timelineSeries(
  history: PerspectiveTrend[] = [],
  maxEntities = 5,
): TimelineSeries {
  const perEntity = new Map<string, PerspectiveTrend[]>();
  for (const t of history) {
    if (!reportable(t)) continue;
    const list = perEntity.get(t.entity_name) ?? [];
    list.push(t);
    perEntity.set(t.entity_name, list);
  }

  const ranked = [...perEntity.entries()]
    .sort((a, b) => {
      const spread = b[1].length - a[1].length;
      if (spread !== 0) return spread;
      const peak = (rows: PerspectiveTrend[]) =>
        Math.max(...rows.map((r) => Math.abs(r.momentum_percent)));
      return peak(b[1]) - peak(a[1]);
    })
    .slice(0, maxEntities);

  const entities = ranked.map(([name]) => name);
  const dates = [...new Set(ranked.flatMap(([, rows]) => rows.map((r) => String(r.window_end))))]
    .sort();

  const points: TimelinePoint[] = dates.map((date) => {
    const row: TimelinePoint = { date };
    for (const [name, rows] of ranked) {
      const match = rows.find((r) => String(r.window_end) === date);
      if (match) row[name] = match.momentum_percent;
    }
    return row;
  });

  const hasHistory = ranked.some(([, rows]) => new Set(rows.map((r) => r.window_end)).size > 1);
  return { points, entities, hasHistory };
}

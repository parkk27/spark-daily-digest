/**
 * Deterministic matching between arbitrary app rows (benchmarks, recommendations,
 * brief bullets) and the selected perspective + its cached 30-day momentum.
 *
 * Pure functions only — no data is duplicated per perspective, rows are scored.
 */
import { perspectiveRelevance, type RelevanceResult, type ScoredSignal } from "./perspectiveScoring";
import type { Perspective } from "./perspectives";
import type { PerspectiveTrend } from "./momentum";

export interface Matched<T> {
  row: T;
  relevance: RelevanceResult;
  trend?: PerspectiveTrend;
}

const textOf = (s: ScoredSignal) =>
  `${s.title ?? ""} ${s.summary ?? ""} ${(s.tags ?? []).join(" ")} ${(s.related_technologies ?? []).join(" ")} ${s.related_vendor ?? ""} ${s.source ?? ""}`.toLowerCase();

/**
 * Strongest momentum entity observed in the signal text.
 * Entities with a reportable direction always win over low-data ones.
 */
export function bestTrend(
  signal: ScoredSignal,
  momentum?: Record<string, PerspectiveTrend>
): PerspectiveTrend | undefined {
  if (!momentum) return undefined;
  const text = textOf(signal);
  const hits = Object.values(momentum).filter(
    (t) =>
      text.includes(t.entity_id.toLowerCase()) || text.includes(t.entity_name.toLowerCase())
  );
  if (hits.length === 0) return undefined;
  const reportable = hits.filter((t) => t.momentum_direction !== "LOW_DATA");
  const pool = reportable.length ? reportable : hits;
  return [...pool].sort(
    (a, b) => Math.abs(b.momentum_percent) - Math.abs(a.momentum_percent)
  )[0];
}

/** Score and rank any row set against the perspective. Ties keep the original order. */
export function rankByPerspective<T>(
  rows: T[],
  toSignal: (row: T) => ScoredSignal,
  perspective: Perspective,
  momentum?: Record<string, PerspectiveTrend>
): Matched<T>[] {
  return rows
    .map((row, index) => {
      const signal = toSignal(row);
      return {
        index,
        row,
        relevance: perspectiveRelevance(signal, perspective),
        trend: bestTrend(signal, momentum),
      };
    })
    .sort((a, b) => b.relevance.score - a.relevance.score || a.index - b.index)
    .map(({ row, relevance, trend }) => ({ row, relevance, trend }));
}

/**
 * Which benchmark vendors belong to this perspective's benchmark universe.
 * The perspective itself is never benchmarked against itself, and vendors that
 * the perspective never references are dropped rather than duplicated.
 */
export function perspectiveVendors<V extends string>(
  vendors: readonly V[],
  labels: Record<V, string>,
  p: Perspective
): V[] {
  const own = p.aliases.map((a) => a.toLowerCase());
  const universe = [...p.competitors, ...p.core_topics, ...p.related_topics, ...p.technologies].map(
    (t) => t.toLowerCase()
  );
  const referenced = (v: V) => {
    const terms = [v.toLowerCase(), labels[v].toLowerCase()];
    return universe.some((u) => terms.some((t) => t.includes(u) || u.includes(t)));
  };
  const isOwn = (v: V) => {
    const terms = [v.toLowerCase(), labels[v].toLowerCase()];
    return own.some((o) => terms.some((t) => t === o || t.includes(o)));
  };
  return vendors.filter((v) => referenced(v) && !isOwn(v));
}

/** Rank plain brief bullets by the momentum of the entities they mention. */
export function rankBriefItems(
  items: string[],
  perspective: Perspective,
  momentum?: Record<string, PerspectiveTrend>
): Matched<string>[] {
  return rankByPerspective(items, (text) => ({ title: text }), perspective, momentum).sort(
    (a, b) => trendWeight(b.trend) - trendWeight(a.trend)
  );
}

const trendWeight = (t?: PerspectiveTrend) =>
  !t || t.momentum_direction === "LOW_DATA" ? 0 : Math.abs(t.momentum_percent) + t.impact_score;

/** Honest coverage summary — how much of the perspective actually has data. */
export function momentumCoverage(trends: PerspectiveTrend[] | undefined) {
  const list = trends ?? [];
  const lowData = list.filter((t) => t.momentum_direction === "LOW_DATA").length;
  return {
    total: list.length,
    reportable: list.length - lowData,
    lowData,
    windowStart: list[0]?.window_start,
    windowEnd: list[0]?.window_end,
  };
}

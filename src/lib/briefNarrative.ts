/**
 * Deterministic selectors and narrative generation over cached 30-day momentum.
 * Pure functions only — no AI calls, no network, same input → same output.
 */
import { DIRECTION_LABEL, type PerspectiveTrend, type TrendDriver } from "./momentum";
import type { Perspective } from "./perspectives";

const isReportable = (t: PerspectiveTrend) => t.momentum_direction !== "LOW_DATA";
const byAbsMomentum = (a: PerspectiveTrend, b: PerspectiveTrend) =>
  Math.abs(b.momentum_percent) - Math.abs(a.momentum_percent);

/** Own-topic trends (everything that is not a tracked competitor). */
export function ownTrends(trends: PerspectiveTrend[] = []): PerspectiveTrend[] {
  return trends.filter((t) => t.entity_kind !== "competitor");
}

/** Competitor trends only. */
export function competitorTrends(trends: PerspectiveTrend[] = []): PerspectiveTrend[] {
  return trends.filter((t) => t.entity_kind === "competitor");
}

/** Entities gaining ground, strongest first. */
export function risingTrends(trends: PerspectiveTrend[] = [], limit = 5): PerspectiveTrend[] {
  return trends
    .filter((t) => isReportable(t) && t.momentum_percent > 0)
    .sort(byAbsMomentum)
    .slice(0, limit);
}

/** Entities losing ground, steepest first. */
export function coolingTrends(trends: PerspectiveTrend[] = [], limit = 5): PerspectiveTrend[] {
  return trends
    .filter((t) => isReportable(t) && t.momentum_percent < 0)
    .sort(byAbsMomentum)
    .slice(0, limit);
}

export interface AggregatedDriver extends TrendDriver {
  entities: string[];
}

/** Merge per-entity drivers into one ranked list of what actually moved the window. */
export function topDrivers(trends: PerspectiveTrend[] = [], limit = 6): AggregatedDriver[] {
  const map = new Map<string, AggregatedDriver>();
  for (const t of trends) {
    if (!isReportable(t)) continue;
    for (const d of t.top_drivers ?? []) {
      const key = d.label.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.contribution = Math.round((existing.contribution + d.contribution) * 10) / 10;
        existing.current = Math.round((existing.current + d.current) * 10) / 10;
        existing.baseline = Math.round((existing.baseline + d.baseline) * 10) / 10;
        if (!existing.entities.includes(t.entity_name)) existing.entities.push(t.entity_name);
      } else {
        map.set(key, { ...d, label: d.label, entities: [t.entity_name] });
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, limit);
}

export interface CompetitivePosture {
  /** Mean momentum of the perspective's own topics. */
  own: number;
  /** Mean momentum across tracked competitors. */
  rivals: number;
  /** own - rivals; positive means the perspective is outpacing its benchmark set. */
  gap: number;
  leadingRival?: PerspectiveTrend;
  reportable: boolean;
}

const mean = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;

/** How the perspective is moving relative to its benchmark universe this window. */
export function competitivePosture(trends: PerspectiveTrend[] = []): CompetitivePosture {
  const own = ownTrends(trends).filter(isReportable);
  const rivals = competitorTrends(trends).filter(isReportable);
  const ownMean = mean(own.map((t) => t.momentum_percent));
  const rivalMean = mean(rivals.map((t) => t.momentum_percent));
  return {
    own: ownMean,
    rivals: rivalMean,
    gap: Math.round((ownMean - rivalMean) * 10) / 10,
    leadingRival: [...rivals].sort((a, b) => b.momentum_percent - a.momentum_percent)[0],
    reportable: own.length > 0 || rivals.length > 0,
  };
}

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

/**
 * Narrative interpretation of the window. Every clause is derived from real
 * momentum values, so nothing is asserted that the evidence does not support.
 */
export function briefNarrative(
  perspective: Perspective,
  trends: PerspectiveTrend[] = [],
): string[] {
  const reportable = trends.filter(isReportable);
  if (reportable.length === 0) {
    return [
      `There is not yet enough observed activity in the rolling 30-day window to describe a reliable ${perspective.display_name} trend. The daily brief below still reflects today's ingested coverage.`,
    ];
  }

  const paras: string[] = [];
  const rising = risingTrends(reportable, 3);
  const cooling = coolingTrends(reportable, 2);
  const posture = competitivePosture(reportable);
  const drivers = topDrivers(reportable, 3);

  // 1. What is moving.
  if (rising.length) {
    const lead = rising[0];
    const rest = rising.slice(1).map((t) => `${t.entity_name} (${pct(t.momentum_percent)})`);
    paras.push(
      `Through the ${perspective.display_name} lens, ${lead.entity_name} is the clearest mover: ${DIRECTION_LABEL[lead.momentum_direction].toLowerCase()} at ${pct(lead.momentum_percent)} against its 30-day baseline, on ${lead.current_activity} weighted signals versus ${lead.baseline_activity} before` +
        (rest.length ? `. ${rest.join(" and ")} are moving in the same direction.` : "."),
    );
  }

  // 2. What is fading.
  if (cooling.length) {
    paras.push(
      `Attention is draining from ${cooling
        .map((t) => `${t.entity_name} (${pct(t.momentum_percent)})`)
        .join(" and ")}. Treat these as areas where the ecosystem conversation has moved on — worth re-checking any roadmap weight you still assign them.`,
    );
  }

  // 3. Competitive read.
  if (posture.reportable) {
    const ahead = posture.gap >= 0;
    const rival = posture.leadingRival;
    paras.push(
      `Competitively, ${perspective.display_name} topics are averaging ${pct(posture.own)} against ${pct(posture.rivals)} across the tracked benchmark set — ${ahead ? `a ${pct(posture.gap)} lead` : `${Math.abs(posture.gap)}% behind`} this window` +
        (rival && rival.momentum_percent > 0
          ? `. ${rival.entity_name} is the fastest-moving rival at ${pct(rival.momentum_percent)}, so expect its narrative to shape customer questions next.`
          : `. No rival is currently accelerating faster than the perspective itself.`),
    );
  }

  // 4. What is behind the movement.
  if (drivers.length) {
    paras.push(
      `The movement is carried by ${drivers.map((d) => d.label).join(", ")} — these sources and themes account for the largest weighted change between the current and baseline windows, so they are where the underlying evidence lives.`,
    );
  }

  // 5. Confidence caveat.
  const lowConfidence = reportable.filter((t) => t.trend_confidence < 60).length;
  if (lowConfidence > 0) {
    paras.push(
      `Caveat: ${lowConfidence} of ${reportable.length} reported entities sit below 60% trend confidence, mostly from thin source diversity. Use them as direction, not as proof.`,
    );
  }

  return paras;
}

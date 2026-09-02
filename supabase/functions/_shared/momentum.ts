/**
 * Deterministic rolling 30-day momentum model.
 * Pure functions — same input always produces the same output.
 */
import type { Perspective } from "./perspectives.ts";
import { perspectiveEntities } from "./perspectives.ts";

export interface MomentumSignal {
  /** Canonical identity: existing signal_key when present, else a normalised URL. */
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  summary?: string;
  source?: string | null;
  url?: string | null;
  tags?: string[];
  confidence?: number | null;
  official?: boolean;
  competitive?: boolean;
}

export type MomentumDirection =
  | "VERY_HIGH_UP" | "HIGH_UP" | "UP" | "STABLE" | "DOWN" | "HIGH_DOWN" | "VERY_HIGH_DOWN"
  | "NEW_SIGNAL" | "LOW_DATA";

/** Taxonomy separating vendor platforms, technologies and cross-cutting themes. */
export type EntityType = "platform" | "technology" | "theme" | "competitor";

export interface TrendDriver {
  label: string;
  contribution: number;
  current: number;
  baseline: number;
}

export interface PerspectiveTrend {
  perspective_id: string;
  entity_id: string;
  entity_name: string;
  entity_kind: string;
  entity_type: EntityType;
  window_start: string;
  window_end: string;
  current_activity: number;
  baseline_activity: number;
  /** null when the baseline window is too thin to divide by honestly. */
  momentum_percent: number | null;
  momentum_direction: MomentumDirection;
  trend_confidence: number;
  top_drivers: TrendDriver[];
  strategic_relevance: number;
  competitive_intensity: number;
  impact_score: number;
  rationale: string;
  generated_at: string;
}

export const MOMENTUM_CONFIG = {
  window_days: 30,
  /** Minimum combined weighted activity before a direction other than LOW_DATA is reported. */
  low_data_threshold: 5,
  /** Minimum baseline weighted activity required before a percentage is computed at all. */
  min_baseline_activity: 3,
  /** Current-window activity needed to call something a genuinely new signal. */
  new_signal_min_activity: 3,
  max_signal_weight: 2,
  radar_eligibility: { impact: 70, relevance: 60, confidence: 60 },
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Canonical signal identity so the same story counted twice never inflates momentum. */
export function canonicalSignalId(s: { id?: string | null; url?: string | null; title?: string | null }): string {
  if (s.id) return s.id;
  if (s.url) {
    try {
      const u = new URL(s.url);
      return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
    } catch {
      /* fall through */
    }
  }
  return String(s.title ?? "untitled").trim().toLowerCase();
}

/** Weight is capped so no single signal can dominate a window. */
export function signalWeight(s: MomentumSignal): number {
  let w = 1;
  if (s.official) w += 0.5;
  if (typeof s.confidence === "number") w += Math.max(0, Math.min(0.5, ((s.confidence - 50) / 50) * 0.5));
  if (s.competitive) w += 0.5;
  return Math.min(MOMENTUM_CONFIG.max_signal_weight, Math.round(w * 100) / 100);
}

/**
 * Percentage change between the two windows, or null when the baseline is too
 * small to divide by. A near-zero baseline never becomes a huge percentage.
 */
export function momentumPercent(current: number, baseline: number): number | null {
  if (baseline < MOMENTUM_CONFIG.min_baseline_activity) return null;
  return round1(((current - baseline) / baseline) * 100);
}

export function momentumDirection(
  percent: number | null,
  combinedActivity: number,
  currentActivity = combinedActivity,
): MomentumDirection {
  if (combinedActivity < MOMENTUM_CONFIG.low_data_threshold) return "LOW_DATA";
  if (percent === null) {
    return currentActivity >= MOMENTUM_CONFIG.new_signal_min_activity ? "NEW_SIGNAL" : "LOW_DATA";
  }
  if (percent >= 40) return "VERY_HIGH_UP";
  if (percent >= 20) return "HIGH_UP";
  if (percent >= 5) return "UP";
  if (percent > -5) return "STABLE";
  if (percent > -20) return "DOWN";
  if (percent > -40) return "HIGH_DOWN";
  return "VERY_HIGH_DOWN";
}

export const DIRECTION_LABEL: Record<MomentumDirection, string> = {
  VERY_HIGH_UP: "Strongly rising",
  HIGH_UP: "Rising",
  UP: "Edging up",
  STABLE: "Stable",
  DOWN: "Edging down",
  HIGH_DOWN: "Falling",
  VERY_HIGH_DOWN: "Strongly falling",
  NEW_SIGNAL: "New signal",
  LOW_DATA: "Low data",
};

/**
 * Display-only band table — mirrors momentumDirection() exactly so the UI can
 * show the thresholds actually used to classify a trend.
 */
export const MOMENTUM_BANDS: { direction: MomentumDirection; rule: string }[] = [
  { direction: "VERY_HIGH_UP", rule: "change >= +40%" },
  { direction: "HIGH_UP", rule: "+20% to +40%" },
  { direction: "UP", rule: "+5% to +20%" },
  { direction: "STABLE", rule: "-5% to +5%" },
  { direction: "DOWN", rule: "-20% to -5%" },
  { direction: "HIGH_DOWN", rule: "-40% to -20%" },
  { direction: "VERY_HIGH_DOWN", rule: "change <= -40%" },
  { direction: "NEW_SIGNAL", rule: `no comparable baseline (previous window < ${MOMENTUM_CONFIG.min_baseline_activity} weighted signals)` },
  { direction: "LOW_DATA", rule: `combined weighted activity < ${MOMENTUM_CONFIG.low_data_threshold}` },
];

/** Display-only breakdown of trendConfidence() — same caps as the implementation. */
export const CONFIDENCE_FACTORS: { label: string; max: number; note: string }[] = [
  { label: "Signal volume", max: 40, note: "4 points per observed signal" },
  { label: "Evidence confidence", max: 25, note: "mean source confidence, 10 when unknown" },
  { label: "Source diversity", max: 20, note: "5 points per distinct source" },
  { label: "Consistency", max: 15, note: "15 when the second half of the window agrees with the overall move" },
];

function daysBetween(a: string, b: string) {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function matches(s: MomentumSignal, entity: string): boolean {
  const text = `${s.title ?? ""} ${s.summary ?? ""} ${(s.tags ?? []).join(" ")} ${s.source ?? ""}`.toLowerCase();
  return text.includes(entity.toLowerCase());
}

/** Trend confidence 0-100: volume, evidence confidence, source diversity, consistency. */
export function trendConfidence(current: MomentumSignal[], baseline: MomentumSignal[]): number {
  const all = [...current, ...baseline];
  if (all.length === 0) return 0;
  const volume = Math.min(40, all.length * 4);
  const confs = all.map((s) => s.confidence).filter((c): c is number => typeof c === "number");
  const evidence = confs.length ? (confs.reduce((a, b) => a + b, 0) / confs.length / 100) * 25 : 10;
  const diversity = Math.min(20, new Set(all.map((s) => (s.source ?? "unknown").toLowerCase())).size * 5);

  // consistency: does the second half of the current window move the same way as the window overall?
  const sorted = [...current].sort((a, b) => a.date.localeCompare(b.date));
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half).length;
  const secondHalf = sorted.slice(half).length;
  const overallUp = current.length >= baseline.length;
  const halfUp = secondHalf >= firstHalf;
  const consistency = current.length < 2 ? 0 : overallUp === halfUp ? 15 : 5;

  return clamp100(volume + evidence + diversity + consistency);
}

/** Drivers ranked by weighted contribution to the change, not raw volume. */
export function trendDrivers(current: MomentumSignal[], baseline: MomentumSignal[], limit = 3): TrendDriver[] {
  const bucket = new Map<string, { current: number; baseline: number }>();
  const add = (list: MomentumSignal[], key: "current" | "baseline") => {
    for (const s of list) {
      const labels = new Set<string>([...(s.tags ?? []), s.source ?? ""].filter(Boolean).map((t) => t.toLowerCase()));
      const w = signalWeight(s);
      for (const l of labels) {
        const b = bucket.get(l) ?? { current: 0, baseline: 0 };
        b[key] += w;
        bucket.set(l, b);
      }
    }
  };
  add(current, "current");
  add(baseline, "baseline");

  return [...bucket.entries()]
    .map(([label, b]) => ({
      label,
      current: round1(b.current),
      baseline: round1(b.baseline),
      contribution: round1(b.current - b.baseline),
    }))
    .filter((d) => d.contribution !== 0)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, limit);
}

export function momentumRationale(t: {
  entity_name: string;
  momentum_direction: MomentumDirection;
  momentum_percent: number | null;
  current_activity: number;
  baseline_activity: number;
  top_drivers: TrendDriver[];
}): string {
  if (t.momentum_direction === "LOW_DATA") {
    return `Not enough observed signal activity for ${t.entity_name} to report a reliable 30-day trend.`;
  }
  const drivers = t.top_drivers.map((d) => d.label).slice(0, 2).join(", ");
  if (t.momentum_direction === "NEW_SIGNAL" || t.momentum_percent === null) {
    return (
      `New signal: ${t.entity_name} has ${t.current_activity} weighted signals in the current 30-day window ` +
      `with no comparable previous window (${t.baseline_activity}), so no percentage change is reported` +
      `${drivers ? `; observed signal activity comes from ${drivers}` : ""}.`
    );
  }
  const move = t.momentum_percent >= 0 ? "increase" : "decrease";
  return (
    `${DIRECTION_LABEL[t.momentum_direction]}: observed signal activity for ${t.entity_name} moved from ` +
    `${t.baseline_activity} to ${t.current_activity} weighted signals, a ${Math.abs(t.momentum_percent)}% ${move} ` +
    `over the rolling 30-day window${drivers ? `, driven by observed activity in ${drivers}` : ""}.`
  );
}

export interface ComputeOptions {
  today: string; // YYYY-MM-DD
  strategicRelevance?: (entityId: string) => number;
  competitiveIntensity?: (entityId: string) => number;
  impactScore?: (entityId: string) => number;
}

/**
 * Compute one PerspectiveTrend per tracked entity from a flat signal list.
 * Rolling windows: current = today-29..today (30 days inclusive),
 * baseline = today-59..today-30 (the 30 days immediately before). No overlap.
 */
export function computePerspectiveTrends(
  perspective: Perspective,
  signals: MomentumSignal[],
  opts: ComputeOptions,
): PerspectiveTrend[] {
  const { today } = opts;
  const window = MOMENTUM_CONFIG.window_days;
  const windowStart = addDays(today, -(window - 1));
  const baselineEnd = addDays(windowStart, -1);
  const baselineStart = addDays(today, -(window * 2 - 1));

  // Deduplicate by canonical identity + date so re-ingested stories are counted once.
  const seen = new Set<string>();
  const unique = signals.filter((s) => {
    const key = `${canonicalSignalId(s)}|${s.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const inWindow = (s: MomentumSignal) => daysBetween(windowStart, s.date) >= 0 && daysBetween(s.date, today) >= 0;
  const inBaseline = (s: MomentumSignal) =>
    daysBetween(baselineStart, s.date) >= 0 && daysBetween(s.date, baselineEnd) >= 0;

  const generated_at = new Date().toISOString();

  return perspectiveEntities(perspective).map((entity) => {
    const matched = unique.filter((s) => matches(s, entity.name));
    const current = matched.filter(inWindow);
    const baseline = matched.filter(inBaseline);

    const currentWeight = round1(current.reduce((n, s) => n + signalWeight(s), 0));
    const baselineWeight = round1(baseline.reduce((n, s) => n + signalWeight(s), 0));
    const percent = momentumPercent(currentWeight, baselineWeight);
    const direction = momentumDirection(percent, currentWeight + baselineWeight, currentWeight);
    const drivers = trendDrivers(current, baseline);

    const base = {
      perspective_id: perspective.id,
      entity_id: entity.id,
      entity_name: entity.name,
      entity_kind: entity.kind,
      entity_type: entity.type,
      window_start: windowStart,
      window_end: today,
      current_activity: currentWeight,
      baseline_activity: baselineWeight,
      momentum_percent: percent,
      momentum_direction: direction,
      trend_confidence: trendConfidence(current, baseline),
      top_drivers: drivers,
      strategic_relevance: opts.strategicRelevance?.(entity.id) ?? 0,
      competitive_intensity: opts.competitiveIntensity?.(entity.id) ?? (entity.kind === "competitor" ? 70 : 25),
      impact_score: opts.impactScore?.(entity.id) ?? 0,
      generated_at,
    };

    return { ...base, rationale: momentumRationale(base) };
  });
}

/** A trend only reaches Action Radar when impact, relevance and confidence all clear the bar. */
export function isRadarEligible(t: Pick<PerspectiveTrend, "impact_score" | "strategic_relevance" | "trend_confidence" | "momentum_direction">): boolean {
  const c = MOMENTUM_CONFIG.radar_eligibility;
  return (
    t.momentum_direction !== "LOW_DATA" &&
    t.momentum_direction !== "NEW_SIGNAL" &&
    t.impact_score >= c.impact &&
    t.strategic_relevance >= c.relevance &&
    t.trend_confidence >= c.confidence
  );
}

/** Signed percentage label, honest about windows with no comparable baseline. */
export function momentumLabel(t: Pick<PerspectiveTrend, "momentum_percent" | "momentum_direction">): string {
  if (t.momentum_direction === "LOW_DATA") return "Low data";
  if (t.momentum_percent === null) return "New signal";
  if (t.momentum_direction === "STABLE") return "Stable";
  const p = t.momentum_percent;
  return `${p > 0 ? "+" : ""}${p}%`;
}

/** Momentum as a number for sorting only — never rendered as a measured value. */
export const momentumSortValue = (t: { momentum_percent: number | null }): number =>
  t.momentum_percent ?? 0;

/** True when the row carries a measured percentage change. */
export const hasMeasuredMomentum = (t: { momentum_percent: number | null; momentum_direction: MomentumDirection }) =>
  t.momentum_percent !== null && t.momentum_direction !== "LOW_DATA";

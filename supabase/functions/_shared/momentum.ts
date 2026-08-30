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
  | "VERY_HIGH_UP" | "HIGH_UP" | "UP" | "STABLE" | "DOWN" | "HIGH_DOWN" | "VERY_HIGH_DOWN" | "LOW_DATA";

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
  window_start: string;
  window_end: string;
  current_activity: number;
  baseline_activity: number;
  momentum_percent: number;
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

export function momentumPercent(current: number, baseline: number): number {
  return round1(((current - baseline) / Math.max(baseline, 1)) * 100);
}

export function momentumDirection(percent: number, combinedActivity: number): MomentumDirection {
  if (combinedActivity < MOMENTUM_CONFIG.low_data_threshold) return "LOW_DATA";
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
  LOW_DATA: "Low data",
};

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
  momentum_percent: number;
  current_activity: number;
  baseline_activity: number;
  top_drivers: TrendDriver[];
}): string {
  if (t.momentum_direction === "LOW_DATA") {
    return `Not enough observed signal activity for ${t.entity_name} to report a reliable 30-day trend.`;
  }
  const drivers = t.top_drivers.map((d) => d.label).slice(0, 2).join(", ");
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
 * Rolling windows: current = today-30..today, baseline = today-60..today-30.
 */
export function computePerspectiveTrends(
  perspective: Perspective,
  signals: MomentumSignal[],
  opts: ComputeOptions,
): PerspectiveTrend[] {
  const { today } = opts;
  const window = MOMENTUM_CONFIG.window_days;
  const windowStart = addDays(today, -window);
  const baselineStart = addDays(today, -window * 2);

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
    daysBetween(baselineStart, s.date) >= 0 && daysBetween(s.date, windowStart) > 0;

  const generated_at = new Date().toISOString();

  return perspectiveEntities(perspective).map((entity) => {
    const matched = unique.filter((s) => matches(s, entity.name));
    const current = matched.filter(inWindow);
    const baseline = matched.filter(inBaseline);

    const currentWeight = round1(current.reduce((n, s) => n + signalWeight(s), 0));
    const baselineWeight = round1(baseline.reduce((n, s) => n + signalWeight(s), 0));
    const percent = momentumPercent(currentWeight, baselineWeight);
    const direction = momentumDirection(percent, currentWeight + baselineWeight);
    const drivers = trendDrivers(current, baseline);

    const base = {
      perspective_id: perspective.id,
      entity_id: entity.id,
      entity_name: entity.name,
      entity_kind: entity.kind,
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
    t.impact_score >= c.impact &&
    t.strategic_relevance >= c.relevance &&
    t.trend_confidence >= c.confidence
  );
}

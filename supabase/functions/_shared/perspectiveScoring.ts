/**
 * Deterministic, explainable scoring. No LLM, no randomness.
 * Every component is derived from observed signal metadata only.
 */
import type { Perspective } from "./perspectives.ts";

export interface ScoreBreakdown {
  strategic_relevance?: number;
  customer_impact?: number;
  competitive_intensity?: number;
  momentum?: number;
  evidence_confidence?: number;
  urgency?: number;
}

export interface ScoredSignal {
  title?: string;
  summary?: string;
  source?: string | null;
  tags?: string[];
  signal_type?: string | null;
  related_vendor?: string | null;
  related_technologies?: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const hay = (s: ScoredSignal) =>
  `${s.title ?? ""} ${s.summary ?? ""} ${(s.tags ?? []).join(" ")} ${(s.related_technologies ?? []).join(" ")} ${s.source ?? ""} ${s.related_vendor ?? ""}`.toLowerCase();

const hits = (text: string, terms: string[]) => terms.filter((t) => t && text.includes(t.toLowerCase())).length;

const CAPABILITY_TERMS = [
  "performance", "benchmark", "latency", "throughput", "governance", "catalog",
  "lineage", "security", "streaming", "serverless", "scalability", "interoperab",
];
const BUSINESS_TERMS = ["pricing", "cost", "tco", "customer", "adoption", "enterprise", "revenue", "savings"];

export interface RelevanceResult {
  score: number;
  components: { key: string; label: string; value: number; max: number }[];
  matched_terms: string[];
}

/**
 * Perspective relevance 0-100.
 * Components that have no observable evidence in the signal are dropped and the
 * remaining weights are renormalised — values are never invented.
 */
export function perspectiveRelevance(signal: ScoredSignal, p: Perspective): RelevanceResult {
  const text = hay(signal);
  const w = p.default_weight_profile;

  const topicTerms = [...p.core_topics, ...p.aliases];
  const relatedTerms = p.related_topics;
  const topicHits = hits(text, topicTerms);
  const relatedHits = hits(text, relatedTerms);
  const competitiveHits = hits(text, p.competitors);
  const capabilityHits = hits(text, CAPABILITY_TERMS);
  const entityHits = hits(text, [...p.technologies, ...p.aliases]);
  const businessHits = hits(text, BUSINESS_TERMS);

  const raw = [
    { key: "topic", label: "Topic alignment", hits: topicHits * 2 + relatedHits, max: w.topic },
    { key: "competitive", label: "Competitive relevance", hits: competitiveHits, max: w.competitive },
    { key: "capability", label: "Capability relevance", hits: capabilityHits, max: w.capability },
    { key: "entity", label: "Entity match", hits: entityHits, max: w.entity },
    { key: "business", label: "Customer / business signal", hits: businessHits, max: w.business },
  ];

  const present = raw.filter((c) => c.hits > 0);
  if (present.length === 0) {
    return { score: 0, components: [], matched_terms: [] };
  }

  const presentMax = present.reduce((n, c) => n + c.max, 0);
  const components = present.map((c) => {
    // saturating curve: 1 hit = 60% of the component, 3+ hits = full component
    const fill = Math.min(1, 0.6 + (Math.min(c.hits, 3) - 1) * 0.2);
    const renormalised = (c.max / presentMax) * 100;
    return { key: c.key, label: c.label, value: Math.round(renormalised * fill), max: Math.round(renormalised) };
  });

  const matched_terms = [...topicTerms, ...relatedTerms, ...p.competitors]
    .filter((t) => text.includes(t.toLowerCase()))
    .slice(0, 6);

  return {
    score: clamp(components.reduce((n, c) => n + c.value, 0)),
    components,
    matched_terms,
  };
}

const IMPACT_WEIGHTS: [keyof ScoreBreakdown, number][] = [
  ["strategic_relevance", 0.25],
  ["customer_impact", 0.2],
  ["competitive_intensity", 0.2],
  ["momentum", 0.15],
  ["evidence_confidence", 0.1],
  ["urgency", 0.1],
];

/** Strategic impact 0-100 from the existing recommendation score breakdown. */
export function strategicImpact(b: ScoreBreakdown | null | undefined): number {
  if (!b) return 0;
  let total = 0;
  let weight = 0;
  for (const [key, w] of IMPACT_WEIGHTS) {
    const v = b[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      total += v * w;
      weight += w;
    }
  }
  if (weight === 0) return 0;
  return clamp(total / weight);
}

export type Polarity = "opportunity" | "threat" | "neutral";

/**
 * Polarity relative to the selected perspective. Insufficient evidence stays neutral —
 * a signal is never labelled a threat without an observed competitor reference.
 */
export function perspectivePolarity(signal: ScoredSignal, p: Perspective): Polarity {
  const text = hay(signal);
  const own = hits(text, [...p.core_topics, ...p.aliases]) > 0;
  const rival = hits(text, p.competitors) > 0;
  if (rival && !own) return "threat";
  if (own && !rival) return "opportunity";
  return "neutral";
}

/** Separate label helpers — impact and confidence are never merged into one number. */
export const impactLabel = (v: number) => (v >= 70 ? "High impact" : v >= 40 ? "Moderate impact" : "Low impact");
export const confidenceLabel = (v: number) =>
  v >= 70 ? "High confidence" : v >= 40 ? "Moderate confidence" : "Low confidence";

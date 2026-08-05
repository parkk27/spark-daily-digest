import type { Article } from "@/data/mockData";

export type Owner = "product" | "engineering" | "sales" | "gtm" | "leadership";
export type Level = "high" | "medium" | "low";

export const OWNER_LABELS: Record<Owner, string> = {
  product: "Product",
  engineering: "Engineering",
  sales: "Sales",
  gtm: "GTM",
  leadership: "Leadership",
};

export interface ArticleIntelligence {
  importance: number;
  confidence: number;
  strategic_impact: Level;
  customer_impact: Level;
  engineering_complexity: Level;
  commercial_impact: Level;
  next_action: string;
  owner: Owner;
  evidence: string[];
  timeline: string;
  why: string;
}

const OFFICIAL_SOURCES = [
  "databricks",
  "aws",
  "microsoft",
  "google",
  "snowflake",
  "iceberg",
  "spark",
  "dataproc",
];

const SIGNALS: { re: RegExp; weight: number; label: string; owner?: Owner }[] = [
  { re: /pricing|cost|tco|serverless|savings/i, weight: 3, label: "Commercial / pricing signal", owner: "product" },
  { re: /architecture|design|lessons|migration|case study/i, weight: 3, label: "Architectural analysis", owner: "engineering" },
  { re: /benchmark|performance|latency|throughput|photon/i, weight: 2, label: "Performance evidence", owner: "engineering" },
  { re: /governance|catalog|lineage|security|compliance/i, weight: 2, label: "Governance relevance", owner: "leadership" },
  { re: /agent|ai|ml|llm|copilot|genai/i, weight: 3, label: "AI ecosystem movement", owner: "product" },
  { re: /iceberg|delta|open table|interoperab/i, weight: 3, label: "Open format convergence", owner: "product" },
  { re: /general availability|ga |launch|announce/i, weight: 1, label: "Vendor announcement", owner: "gtm" },
  { re: /customer|adoption|enterprise|case/i, weight: 2, label: "Customer signal", owner: "sales" },
];

const level = (score: number): Level => (score >= 7 ? "high" : score >= 4 ? "medium" : "low");

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Deterministic decision-intelligence scoring for every ingested article.
 * Explainable by construction: every score traces back to the matched signals.
 */
export function scoreArticle(article: Article): ArticleIntelligence {
  const haystack = `${article.title} ${article.summary} ${article.tags.join(" ")}`;
  const matched = SIGNALS.filter((s) => s.re.test(haystack));

  const signalScore = matched.reduce((sum, s) => sum + s.weight, 0);
  const official = OFFICIAL_SOURCES.some((s) => article.source.toLowerCase().includes(s));
  const depth = clamp(Math.round(article.summary.length / 120), 0, 3);

  const importance = clamp(signalScore + depth + (official ? 2 : 0), 1, 10);
  const confidence = clamp(
    45 + (official ? 25 : 5) + matched.length * 6 + (article.date ? 6 : 0),
    40,
    97
  );

  const has = (re: RegExp) => (re.test(haystack) ? 4 : 0);
  const strategic = clamp(signalScore, 1, 10);
  const customer = clamp(has(/customer|adoption|enterprise|migration|case/i) + depth * 2 + 2, 1, 10);
  const complexity = clamp(has(/migration|architecture|integration|runtime|engine/i) + depth + 2, 1, 10);
  const commercial = clamp(has(/pricing|cost|license|savings|contract/i) + (official ? 3 : 1) + depth, 1, 10);

  const primary = matched.find((s) => s.owner)?.owner ?? "product";
  const nextAction =
    primary === "engineering"
      ? "Review technical implications and log a spike for the affected component."
      : primary === "sales"
        ? "Update the competitive talk track and flag affected accounts."
        : primary === "gtm"
          ? "Refresh positioning and messaging for this capability area."
          : primary === "leadership"
            ? "Add to the leadership watchlist and review at the next strategy sync."
            : "Assess roadmap impact and decide whether to investigate or monitor.";

  return {
    importance,
    confidence,
    strategic_impact: level(strategic),
    customer_impact: level(customer),
    engineering_complexity: level(complexity),
    commercial_impact: level(commercial),
    next_action: nextAction,
    owner: primary,
    evidence: [
      `Source: ${article.source}${official ? " (official vendor blog)" : ""}`,
      ...matched.map((m) => m.label),
    ],
    timeline: importance >= 8 ? "Act this week" : importance >= 5 ? "Review in 2 weeks" : "Monitor",
    why: matched.length
      ? `Scored on ${matched.length} matched signal${matched.length === 1 ? "" : "s"} from the article content, weighted by source reliability and analysis depth.`
      : "No strong strategic signals matched; scored on source reliability and analysis depth only.",
  };
}

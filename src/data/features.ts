// Feature comparison baseline + pure comparison logic.
// Static for the prototype; the shapes are DB-ready for a later migration.

export type Category = "performance" | "cost" | "ai" | "governance";
export type Vendor = "databricks" | "google" | "microsoft" | "snowflake" | "aws";

export interface OurFeature {
  id: string;
  category: Category;
  name: string;
  description: string;
  shipped_date: string;
  status: "shipped" | "in_progress" | "planned";
  roadmap_quarter: string;
  maturity: "stable" | "beta" | "new";
}

export interface CompetitorFeature {
  id: string;
  vendor: Vendor;
  feature_name: string;
  category: Category;
  announced_date: string;
  source_article_link: string;
  article_title: string;
  extracted_summary: string;
  threat_level: "high" | "medium" | "low";
  mentioned_count: number;
}

export type GapStatus = "we_lead" | "parity" | "we_lag" | "they_have_only";
export type Severity = "high" | "medium" | "low";
export type RecommendedAction =
  | "accelerate_roadmap"
  | "messaging_adjustment"
  | "competitive_response"
  | "monitor";

export interface Comparison {
  competitor: CompetitorFeature;
  ours: OurFeature | null;
  gap_status: GapStatus;
  /** Positive = we shipped earlier by N days. Null when unmatched. */
  timeline_delta_days: number | null;
  threat: Severity;
  gtm_priority: Severity;
  suggested_response: string;
  recommended_action: RecommendedAction;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  performance: "Performance",
  cost: "Cost",
  ai: "AI / ML",
  governance: "Governance",
};

export const VENDOR_LABELS: Record<Vendor, string> = {
  databricks: "Databricks",
  google: "Google BigQuery",
  microsoft: "Microsoft Fabric",
  snowflake: "Snowflake",
  aws: "AWS",
};

export const ACTION_LABELS: Record<RecommendedAction, string> = {
  accelerate_roadmap: "Accelerate roadmap",
  messaging_adjustment: "Messaging adjustment",
  competitive_response: "Competitive response",
  monitor: "Monitor",
};

export const GAP_LABELS: Record<GapStatus, string> = {
  we_lead: "We lead",
  parity: "Parity",
  we_lag: "We lag",
  they_have_only: "They have only",
};

export const OUR_FEATURES: OurFeature[] = [
  // Performance
  {
    id: "photon_acceleration",
    category: "performance",
    name: "Photon vectorized acceleration",
    description: "Native vectorized execution engine for SQL and DataFrame workloads.",
    shipped_date: "2024-01-15",
    status: "shipped",
    roadmap_quarter: "Q1 2024",
    maturity: "stable",
  },
  {
    id: "adaptive_query_optimization",
    category: "performance",
    name: "Adaptive query optimization",
    description: "Runtime re-planning based on observed statistics and skew.",
    shipped_date: "2024-06-02",
    status: "shipped",
    roadmap_quarter: "Q2 2024",
    maturity: "stable",
  },
  {
    id: "partition_pruning",
    category: "performance",
    name: "Dynamic partition pruning",
    description: "Prunes partitions at runtime using join-side filters.",
    shipped_date: "2023-11-20",
    status: "shipped",
    roadmap_quarter: "Q4 2023",
    maturity: "stable",
  },
  {
    id: "query_result_caching",
    category: "performance",
    name: "Query result caching",
    description: "Transparent result cache across warm sessions and dashboards.",
    shipped_date: "2025-02-10",
    status: "shipped",
    roadmap_quarter: "Q1 2025",
    maturity: "beta",
  },
  // Cost
  {
    id: "serverless_compute",
    category: "cost",
    name: "Serverless compute",
    description: "Per-second billed elastic compute with no cluster management.",
    shipped_date: "2024-09-05",
    status: "shipped",
    roadmap_quarter: "Q3 2024",
    maturity: "stable",
  },
  {
    id: "spot_instance_optimization",
    category: "cost",
    name: "Spot instance optimization",
    description: "Automatic spot bidding with graceful fallback to on-demand.",
    shipped_date: "2024-03-18",
    status: "shipped",
    roadmap_quarter: "Q1 2024",
    maturity: "stable",
  },
  {
    id: "cost_allocation",
    category: "cost",
    name: "Fine-grained cost allocation",
    description: "Per-team, per-job and per-query chargeback attribution.",
    shipped_date: "2025-04-22",
    status: "shipped",
    roadmap_quarter: "Q2 2025",
    maturity: "new",
  },
  {
    id: "data_tiering",
    category: "cost",
    name: "Automated data tiering",
    description: "Policy-driven movement of cold data to cheaper storage classes.",
    shipped_date: "2026-03-01",
    status: "in_progress",
    roadmap_quarter: "Q3 2026",
    maturity: "beta",
  },
  {
    id: "auto_scaling",
    category: "cost",
    name: "Workload-aware auto-scaling",
    description: "Scales warehouses on queue depth and SLA targets.",
    shipped_date: "2024-05-14",
    status: "shipped",
    roadmap_quarter: "Q2 2024",
    maturity: "stable",
  },
  {
    id: "reserved_capacity",
    category: "cost",
    name: "Reserved capacity commitments",
    description: "Discounted committed-use pricing with burst overflow.",
    shipped_date: "2025-08-19",
    status: "shipped",
    roadmap_quarter: "Q3 2025",
    maturity: "stable",
  },
  // AI
  {
    id: "genai_sql",
    category: "ai",
    name: "GenAI SQL generation",
    description: "Natural-language to SQL with schema-aware grounding.",
    shipped_date: "2025-01-28",
    status: "shipped",
    roadmap_quarter: "Q1 2025",
    maturity: "stable",
  },
  {
    id: "ml_pipeline_sdk",
    category: "ai",
    name: "ML pipeline SDK",
    description: "Declarative training, evaluation and deployment pipelines.",
    shipped_date: "2024-10-11",
    status: "shipped",
    roadmap_quarter: "Q4 2024",
    maturity: "stable",
  },
  {
    id: "vector_db_integration",
    category: "ai",
    name: "Vector database integration",
    description: "Native vector index and hybrid retrieval over lakehouse tables.",
    shipped_date: "2025-06-30",
    status: "shipped",
    roadmap_quarter: "Q2 2025",
    maturity: "beta",
  },
  {
    id: "llm_prompt_caching",
    category: "ai",
    name: "LLM prompt caching",
    description: "Deduplicates repeated prompt prefixes to cut inference spend.",
    shipped_date: "2026-06-15",
    status: "planned",
    roadmap_quarter: "Q4 2026",
    maturity: "new",
  },
  {
    id: "automated_insights",
    category: "ai",
    name: "Automated insights",
    description: "Agent that surfaces anomalies and narrative explanations daily.",
    shipped_date: "2026-02-09",
    status: "in_progress",
    roadmap_quarter: "Q3 2026",
    maturity: "beta",
  },
  // Governance
  {
    id: "iceberg_support",
    category: "governance",
    name: "Apache Iceberg support",
    description: "Read/write Iceberg V3 tables with REST catalog interop.",
    shipped_date: "2024-12-03",
    status: "shipped",
    roadmap_quarter: "Q4 2024",
    maturity: "stable",
  },
  {
    id: "rbac",
    category: "governance",
    name: "Role-based access control",
    description: "Catalog, schema, table and column level role grants.",
    shipped_date: "2023-09-12",
    status: "shipped",
    roadmap_quarter: "Q3 2023",
    maturity: "stable",
  },
  {
    id: "data_lineage",
    category: "governance",
    name: "Column-level data lineage",
    description: "Automatic lineage capture across jobs, notebooks and BI.",
    shipped_date: "2025-05-06",
    status: "shipped",
    roadmap_quarter: "Q2 2025",
    maturity: "stable",
  },
  {
    id: "pii_masking",
    category: "governance",
    name: "PII masking and classification",
    description: "Automatic PII detection with dynamic masking policies.",
    shipped_date: "2025-11-17",
    status: "shipped",
    roadmap_quarter: "Q4 2025",
    maturity: "beta",
  },
];

export const COMPETITOR_FEATURES: CompetitorFeature[] = [
  {
    id: "dbx_photon_next",
    vendor: "databricks",
    feature_name: "Next-gen Photon engine",
    category: "performance",
    announced_date: "2026-07-22",
    source_article_link: "https://www.databricks.com/blog",
    article_title: "Photon gets a second-generation vectorized runtime",
    extracted_summary:
      "Databricks claims 2x throughput on wide joins with a rewritten vectorized runtime and smarter shuffle.",
    threat_level: "high",
    mentioned_count: 7,
  },
  {
    id: "dbx_predictive_optimization",
    vendor: "databricks",
    feature_name: "Predictive query optimization",
    category: "performance",
    announced_date: "2026-05-14",
    source_article_link: "https://www.databricks.com/blog",
    article_title: "Predictive optimization goes GA across Unity Catalog",
    extracted_summary:
      "Statistics-driven re-planning is now automatic for all managed tables, removing manual tuning.",
    threat_level: "medium",
    mentioned_count: 4,
  },
  {
    id: "dbx_serverless_pricing",
    vendor: "databricks",
    feature_name: "Serverless compute price cut",
    category: "cost",
    announced_date: "2026-07-30",
    source_article_link: "https://www.databricks.com/blog",
    article_title: "Serverless SQL pricing reduced by 30%",
    extracted_summary:
      "Aggressive serverless price reduction paired with per-second billing and instant warm pools.",
    threat_level: "high",
    mentioned_count: 9,
  },
  {
    id: "google_bq_autoscaling",
    vendor: "google",
    feature_name: "BigQuery slot autoscaling",
    category: "cost",
    announced_date: "2026-04-02",
    source_article_link: "https://cloud.google.com/blog/products/data-analytics",
    article_title: "Editions autoscaling reaches sub-second granularity",
    extracted_summary:
      "Slot autoscaling now reacts in under a second, narrowing the gap on bursty workloads.",
    threat_level: "medium",
    mentioned_count: 5,
  },
  {
    id: "google_gemini_sql",
    vendor: "google",
    feature_name: "Gemini SQL assistant",
    category: "ai",
    announced_date: "2026-07-18",
    source_article_link: "https://cloud.google.com/blog/products/data-analytics",
    article_title: "Gemini writes and explains BigQuery SQL in the console",
    extracted_summary:
      "Schema-grounded natural language SQL with inline explanation and cost preview before execution.",
    threat_level: "high",
    mentioned_count: 8,
  },
  {
    id: "google_agentic_data_cloud",
    vendor: "google",
    feature_name: "Agentic data cloud workflows",
    category: "ai",
    announced_date: "2026-06-25",
    source_article_link: "https://cloud.google.com/blog/transform",
    article_title: "What's new in the agentic data cloud",
    extracted_summary:
      "Multi-agent workflows that plan, query and act across BigQuery, Looker and Vertex AI.",
    threat_level: "high",
    mentioned_count: 6,
  },
  {
    id: "ms_fabric_iceberg",
    vendor: "microsoft",
    feature_name: "OneLake Iceberg interop",
    category: "governance",
    announced_date: "2026-03-11",
    source_article_link: "https://blog.fabric.microsoft.com/",
    article_title: "OneLake adds native Iceberg shortcuts",
    extracted_summary:
      "Fabric reads and writes Iceberg tables without conversion, matching Delta parity in OneLake.",
    threat_level: "medium",
    mentioned_count: 4,
  },
  {
    id: "ms_fabric_purview_lineage",
    vendor: "microsoft",
    feature_name: "Purview end-to-end lineage",
    category: "governance",
    announced_date: "2026-01-20",
    source_article_link: "https://blog.fabric.microsoft.com/",
    article_title: "Purview lineage now spans Fabric pipelines and Power BI",
    extracted_summary:
      "Column-level lineage stitched from ingestion through semantic models and reports.",
    threat_level: "low",
    mentioned_count: 2,
  },
  {
    id: "ms_fabric_capacity_insights",
    vendor: "microsoft",
    feature_name: "Capacity cost insights",
    category: "cost",
    announced_date: "2025-12-08",
    source_article_link: "https://blog.fabric.microsoft.com/",
    article_title: "Chargeback reporting arrives for Fabric capacities",
    extracted_summary:
      "Per-workspace chargeback and forecasting for capacity units, aimed at FinOps teams.",
    threat_level: "low",
    mentioned_count: 3,
  },
];

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "of", "for", "with", "to", "in", "on", "next", "gen",
  "new", "native", "automatic", "support", "engine",
]);

const tokenize = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
  );

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((t) => {
    if (b.has(t)) shared += 1;
  });
  return shared / (a.size + b.size - shared);
};

const DAY = 86_400_000;
const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY);

const findMatch = (competitor: CompetitorFeature): OurFeature | null => {
  let best: OurFeature | null = null;
  let bestScore = 0.4;
  const target = tokenize(`${competitor.feature_name} ${competitor.extracted_summary}`);
  for (const ours of OUR_FEATURES) {
    if (ours.category !== competitor.category) continue;
    const score = Math.max(
      jaccard(tokenize(competitor.feature_name), tokenize(ours.name)),
      jaccard(target, tokenize(`${ours.name} ${ours.description}`)) + 0.05
    );
    if (score > bestScore) {
      bestScore = score;
      best = ours;
    }
  }
  return best;
};

const monthsLabel = (days: number) => {
  const abs = Math.abs(days);
  if (abs < 45) return `${abs} days`;
  const months = Math.round(abs / 30);
  if (months < 18) return `${months} months`;
  return `${(months / 12).toFixed(1)} years`;
};

export const timelineLabel = (deltaDays: number | null): string | null => {
  if (deltaDays === null) return null;
  if (Math.abs(deltaDays) <= 30) return "Shipped within 30 days of each other";
  return deltaDays > 0
    ? `We shipped ${monthsLabel(deltaDays)} earlier`
    : `They shipped ${monthsLabel(deltaDays)} earlier`;
};

const generateResponse = (
  gap: GapStatus,
  competitor: CompetitorFeature,
  ours: OurFeature | null
): string => {
  const vendor = VENDOR_LABELS[competitor.vendor];
  switch (gap) {
    case "we_lead":
      return `We shipped ${ours?.name} before ${vendor} announced ${competitor.feature_name}, and it is ${ours?.maturity} in production today. Lead with proof points and reference customers rather than roadmap promises.`;
    case "parity":
      return `We have comparable capability in ${ours?.name}. Move the conversation to where we differentiate: unified governance, transparent cost attribution and no vendor lock-in on open table formats.`;
    case "we_lag":
      return `${vendor} is ahead here. Be direct: ${ours?.name} lands in ${ours?.roadmap_quarter}. Today customers get the same outcome via ${ours?.description.toLowerCase()} Offer a design review to bridge the gap.`;
    default:
      return `${vendor} announced ${competitor.feature_name} and we have no equivalent on the baseline. Treat as emerging: acknowledge, qualify how central it is to the deal, and route the requirement to product for roadmap scoring.`;
  }
};

const getRecommendedAction = (gap: GapStatus, threat: Severity): RecommendedAction => {
  if (gap === "we_lag") return threat === "high" ? "accelerate_roadmap" : "monitor";
  if (gap === "they_have_only") return threat === "low" ? "monitor" : "competitive_response";
  if (gap === "parity") return "messaging_adjustment";
  return "monitor";
};

export const compareFeatures = (
  competitors: CompetitorFeature[] = COMPETITOR_FEATURES,
  today: Date = new Date()
): Comparison[] => {
  const now = today.toISOString();

  const rows = competitors.map<Comparison>((competitor) => {
    const ours = findMatch(competitor);
    const delta = ours ? daysBetween(ours.shipped_date, competitor.announced_date) : null;

    let gap: GapStatus;
    if (!ours || delta === null) gap = "they_have_only";
    else if (delta > 30) gap = "we_lead";
    else if (delta < -30) gap = "we_lag";
    else gap = "parity";

    const ageDays = daysBetween(competitor.announced_date, now);
    const recent = ageDays < 14;
    const stale = ageDays > 90;

    let threat: Severity;
    if ((recent && competitor.mentioned_count >= 5) || (gap === "we_lag" && !stale)) {
      threat = "high";
    } else if (stale && gap !== "we_lag") {
      threat = "low";
    } else {
      threat = competitor.threat_level === "high" && stale ? "medium" : competitor.threat_level;
    }
    if (gap === "we_lead" && !recent) threat = "low";

    const gtm_priority: Severity =
      threat === "high" ? "high" : gap === "they_have_only" ? "medium" : threat;

    return {
      competitor,
      ours,
      gap_status: gap,
      timeline_delta_days: delta,
      threat,
      gtm_priority,
      suggested_response: generateResponse(gap, competitor, ours),
      recommended_action: getRecommendedAction(gap, threat),
    };
  });

  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return rows.sort(
    (a, b) =>
      rank[a.threat] - rank[b.threat] ||
      b.competitor.announced_date.localeCompare(a.competitor.announced_date)
  );
};

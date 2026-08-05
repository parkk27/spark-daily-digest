import type { Article, DailySummary, TrendItem } from "@/data/mockData";
import type { Recommendation } from "@/hooks/useRecommendations";

/**
 * Frozen demo fixture powering the public /preview surfaces.
 * Shapes match the live data contracts so preview pages can reuse
 * the exact same components as the authenticated experience.
 */

export const SAMPLE_DATE = "2026-08-05";

export const SAMPLE_SUMMARY: DailySummary = {
  date: SAMPLE_DATE,
  summary: {
    topInsight:
      "Open table formats stopped being a differentiator and became table stakes — every major vendor now ships native Iceberg read/write, so competition shifts to catalog governance and query engine economics.",
    highlights: [
      "Databricks details Photon vectorization gains on wide-schema Iceberg scans, narrowing the gap with native warehouse engines.",
      "AWS publishes an EMR Serverless cost teardown showing 38% savings on bursty batch pipelines versus provisioned clusters.",
      "Microsoft Fabric adds bidirectional Delta–Iceberg metadata translation, removing a common migration blocker.",
      "Google Cloud frames BigQuery's managed Iceberg tables as the default for new lakehouse deployments.",
      "Apache Iceberg community lands a materialized-view spec proposal aimed at cross-engine consistency.",
    ],
    trends: [
      "Catalog interoperability is replacing file format choice as the real lock-in surface.",
      "AI workload proximity to the lakehouse is now a primary platform selection criterion.",
      "Serverless elasticity and per-query cost transparency are converging across vendors.",
    ],
    impact: [
      "Format-based differentiation is closing; evaluate platforms on catalog, governance and price-performance instead.",
      "Migration friction between Delta and Iceberg is dropping, raising switching risk for incumbents.",
      "Teams with unclear per-workload cost attribution will lose budget arguments this planning cycle.",
    ],
  },
};

export const SAMPLE_TRENDS: TrendItem[] = [
  { topic: "Apache Iceberg", status: "growing", today: 14, yesterday: 9, change: 5 },
  { topic: "Lakehouse governance", status: "growing", today: 11, yesterday: 7, change: 4 },
  { topic: "AI-native query engines", status: "new", today: 6, yesterday: 0, change: 6 },
  { topic: "Serverless Spark", status: "growing", today: 9, yesterday: 6, change: 3 },
  { topic: "Delta Lake", status: "stable", today: 8, yesterday: 8, change: 0 },
  { topic: "Hive metastore migrations", status: "declining", today: 2, yesterday: 6, change: -4 },
];

export const SAMPLE_ARTICLES: Article[] = [
  {
    title: "Photon on Iceberg: what changed in wide-schema scan performance",
    source: "databricks",
    summary:
      "An architectural walkthrough of vectorized scan improvements and where they do — and do not — beat native warehouse engines.",
    link: "https://www.databricks.com/blog",
    tags: ["iceberg", "performance", "architecture"],
    date: SAMPLE_DATE,
  },
  {
    title: "Cost anatomy of EMR Serverless for bursty batch workloads",
    source: "aws",
    summary:
      "A cost teardown with the assumptions made explicit, including where provisioned clusters still win.",
    link: "https://aws.amazon.com/blogs/big-data/",
    tags: ["cost", "serverless", "emr"],
    date: SAMPLE_DATE,
  },
  {
    title: "Delta and Iceberg metadata translation in Fabric, in practice",
    source: "microsoft",
    summary:
      "Lessons learned enabling bidirectional metadata so teams can migrate incrementally instead of all at once.",
    link: "https://blog.fabric.microsoft.com/",
    tags: ["fabric", "delta", "iceberg", "migration"],
    date: SAMPLE_DATE,
  },
  {
    title: "Why we made managed Iceberg the default for new lakehouses",
    source: "google",
    summary:
      "The reasoning behind treating open formats as the baseline rather than an interoperability escape hatch.",
    link: "https://cloud.google.com/blog/products/data-analytics",
    tags: ["bigquery", "iceberg", "strategy"],
    date: SAMPLE_DATE,
  },
  {
    title: "Materialized views across engines: an Iceberg spec proposal",
    source: "iceberg",
    summary:
      "Community design discussion on keeping derived data consistent when several engines write the same tables.",
    link: "https://iceberg.apache.org/",
    tags: ["iceberg", "open-source", "architecture"],
    date: SAMPLE_DATE,
  },
];

const rec = (r: Omit<Recommendation, "date">): Recommendation => ({ ...r, date: SAMPLE_DATE });

export const SAMPLE_RECOMMENDATIONS: Recommendation[] = [
  rec({
    id: "sample-1",
    section: "act_now",
    title: "Re-baseline your Iceberg price-performance claims this quarter",
    summary:
      "Two vendors published scan-performance numbers this week that invalidate benchmarks older than six months. Refresh the comparison before the next customer deck goes out.",
    owner: "product",
    priority: "high",
    confidence: 84,
    evidence_count: 3,
    evidence: [
      "Databricks Photon vectorization post",
      "BigQuery managed Iceberg positioning",
      "Iceberg scan benchmarks referenced in two vendor blogs",
    ],
    rationale:
      "Multiple independent sources moved the same metric in the same direction within one ingest window.",
    related_vendor: "Databricks",
    related_technologies: ["iceberg", "photon"],
    due_date: null,
  }),
  rec({
    id: "sample-2",
    section: "act_now",
    title: "Publish per-workload cost attribution before planning season",
    summary:
      "Serverless cost teardowns are becoming the standard evaluation artifact. Teams without per-query attribution will struggle to defend spend.",
    owner: "engineering",
    priority: "high",
    confidence: 78,
    evidence_count: 2,
    evidence: ["EMR Serverless cost teardown", "Serverless Spark topic momentum +3"],
    rationale: "Cost transparency signals appeared across both vendor content and trend momentum.",
    related_vendor: "AWS",
    related_technologies: ["emr", "serverless"],
    due_date: null,
  }),
  rec({
    id: "sample-3",
    section: "act_now",
    title: "Close the catalog governance gap in the roadmap narrative",
    summary:
      "With format parity reached, catalog and governance are the remaining differentiators. Make that the centerpiece of the next roadmap review.",
    owner: "leadership",
    priority: "high",
    confidence: 81,
    evidence_count: 3,
    evidence: [
      "Lakehouse governance momentum +4",
      "Fabric metadata translation announcement",
      "Iceberg materialized-view spec proposal",
    ],
    rationale: "Governance signals outpaced format signals for the first time in the tracked window.",
    related_vendor: null,
    related_technologies: ["governance", "catalog"],
    due_date: null,
  }),
  rec({
    id: "sample-4",
    section: "watch",
    title: "Track the Iceberg materialized-view specification",
    summary:
      "Still a proposal, but it would change how derived datasets are maintained across engines. Worth a design spike, not a commitment.",
    owner: "engineering",
    priority: "medium",
    confidence: 62,
    evidence_count: 1,
    evidence: ["Apache Iceberg community spec proposal"],
    rationale: "Single-source signal at proposal stage — high potential impact, low certainty.",
    related_vendor: "Apache Iceberg",
    related_technologies: ["iceberg"],
    due_date: null,
  }),
  rec({
    id: "sample-5",
    section: "watch",
    title: "Monitor AI-native query engine positioning",
    summary:
      "A newly emerging topic with concentrated vendor messaging. Watch whether it converts into shipped capability or stays narrative.",
    owner: "product",
    priority: "medium",
    confidence: 58,
    evidence_count: 2,
    evidence: ["AI-native query engines: new topic, 6 mentions", "Two vendor posts in one window"],
    rationale: "New topic with no prior baseline — momentum is real but unproven.",
    related_vendor: null,
    related_technologies: ["ai", "query-engine"],
    due_date: null,
  }),
  rec({
    id: "sample-6",
    section: "watch",
    title: "Reassess migration messaging as Delta–Iceberg friction drops",
    summary:
      "Lower switching cost cuts both ways. Prepare retention messaging alongside the acquisition story.",
    owner: "sales",
    priority: "medium",
    confidence: 66,
    evidence_count: 2,
    evidence: ["Fabric bidirectional metadata translation", "Delta Lake topic stable at 8"],
    rationale: "Capability change with clear commercial implications, moderate source depth.",
    related_vendor: "Microsoft",
    related_technologies: ["delta", "iceberg"],
    due_date: null,
  }),
  rec({
    id: "sample-7",
    section: "deprioritize",
    title: "Deprioritize Hive metastore migration content",
    summary:
      "Attention has fallen sharply for four consecutive windows. Existing material is sufficient; redirect effort to catalog governance.",
    owner: "product",
    priority: "low",
    confidence: 71,
    evidence_count: 1,
    evidence: ["Hive metastore migrations: declining, -4"],
    rationale: "Sustained decline with no offsetting vendor investment detected.",
    related_vendor: null,
    related_technologies: ["hive"],
    due_date: null,
  }),
];

// Competitive intelligence benchmarks: Microsoft Fabric Spark vs. the market.
// Static for the prototype; shapes are DB-ready for a later migration.

export type Category = "performance" | "cost" | "ai" | "governance";
export type Vendor = "databricks" | "bigquery" | "emr" | "snowflake" | "spark";
export type Position = "leader" | "competitive" | "emerging";
export type Impact = "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";
export type ProductRecommendation =
  | "investigate"
  | "monitor"
  | "validate"
  | "accelerate"
  | "deprioritize";

export interface RelatedArticle {
  title: string;
  link: string;
  source: string;
}

export interface CapabilityBenchmark {
  id: string;
  vendor: Vendor;
  category: Category;
  capability: string;
  competitor_capability: string;
  fabric_capability: string;
  position: Position;
  capability_gap: string;
  fabric_differentiators: string[];
  competitor_differentiators: string[];
  customer_impact: string;
  impact: Impact;
  recommendation: {
    product: string;
    sales: string;
    gtm: string;
    customer_success: string;
  };
  product_recommendation: ProductRecommendation;
  confidence: Confidence;
  confidence_signals: {
    source_count: number;
    last_reviewed: string;
    vendor_confirmed: boolean;
  };
  executive_actions: {
    pm: string;
    sales: string;
    engineering: string;
    leadership: string;
  };
  related_articles: RelatedArticle[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  performance: "Performance",
  cost: "Cost",
  ai: "AI / ML",
  governance: "Governance",
};

export const VENDOR_LABELS: Record<Vendor, string> = {
  databricks: "Databricks",
  bigquery: "Google BigQuery",
  emr: "AWS EMR",
  snowflake: "Snowflake",
  spark: "Apache Spark ecosystem",
};

export const POSITION_LABELS: Record<Position, string> = {
  leader: "Leader",
  competitive: "Competitive",
  emerging: "Emerging",
};

export const RECOMMENDATION_LABELS: Record<ProductRecommendation, string> = {
  investigate: "Investigate",
  monitor: "Monitor",
  validate: "Validate",
  accelerate: "Accelerate",
  deprioritize: "Deprioritize",
};

export const ROLE_LABELS: Record<keyof CapabilityBenchmark["executive_actions"], string> = {
  pm: "PM",
  sales: "Sales",
  engineering: "Engineering",
  leadership: "Leadership",
};

export const BENCHMARKS: CapabilityBenchmark[] = [
  {
    id: "dbx-photon",
    vendor: "databricks",
    category: "performance",
    capability: "Vectorized query execution engine",
    competitor_capability:
      "Photon is a C++ vectorized engine used by default across SQL warehouses and most Spark workloads, with mature adaptive execution and broad workload coverage.",
    fabric_capability:
      "Fabric Spark runs the Native Execution Engine over Delta on OneLake, with vectorized operators enabled per workspace and expanding operator coverage each release.",
    position: "competitive",
    capability_gap:
      "Both deliver native vectorized execution; Databricks covers a wider operator surface today while Fabric closes the gap without a separate warehouse SKU.",
    fabric_differentiators: [
      "Engine enabled without moving data out of OneLake",
      "Same capacity powers Spark, SQL and Power BI",
      "No separate warehouse compute to license",
    ],
    competitor_differentiators: [
      "Broader operator and UDF coverage",
      "Longer production track record at scale",
      "Deeper query-profile tooling",
    ],
    customer_impact:
      "Enterprises benchmarking cost-per-query care that the fast path applies to their real workloads, not a subset — coverage gaps force silent fallbacks that erase the speedup.",
    impact: "high",
    recommendation: {
      product: "Publish an operator-coverage matrix and fallback telemetry so gaps are visible, not surprising.",
      sales: "Lead with total capacity economics rather than per-query benchmark wins.",
      gtm: "Position Fabric as fast analytics without a second compute contract.",
      customer_success: "Run a coverage check on the customer's top ten queries before any bake-off.",
    },
    product_recommendation: "accelerate",
    confidence: "high",
    confidence_signals: { source_count: 5, last_reviewed: "2026-07-22", vendor_confirmed: true },
    executive_actions: {
      pm: "Prioritise the top three unsupported operators seen in fallback telemetry.",
      sales: "Use capacity-level TCO models in every competitive deal.",
      engineering: "Instrument and alert on native-engine fallback rate.",
      leadership: "Fund the engine coverage roadmap through the next two releases.",
    },
    related_articles: [
      {
        title: "Databricks Photon engine overview",
        link: "https://www.databricks.com/product/photon",
        source: "databricks",
      },
      {
        title: "Native execution engine in Fabric Spark",
        link: "https://learn.microsoft.com/fabric/data-engineering/native-execution-engine-overview",
        source: "microsoft",
      },
    ],
  },
  {
    id: "bq-serverless-scale",
    vendor: "bigquery",
    category: "performance",
    capability: "Serverless elastic query scaling",
    competitor_capability:
      "BigQuery scales slots automatically with no cluster concept, so ad-hoc analytical queries start instantly regardless of concurrency.",
    fabric_capability:
      "Fabric Spark uses starter pools and autoscaling capacity to give near-instant session starts, with capacity bursting and smoothing across the tenant.",
    position: "competitive",
    capability_gap:
      "BigQuery still feels more instantly elastic for pure SQL analytics, while Fabric matches it for engineering workloads and adds burst smoothing across all workloads.",
    fabric_differentiators: [
      "One capacity shared by Spark, SQL, and BI",
      "Bursting and smoothing absorb spikes",
      "Predictable capacity units, not slot auctions",
    ],
    competitor_differentiators: [
      "No pool concept to reason about",
      "Very mature concurrency handling",
      "Deep autoscaling maturity for SQL",
    ],
    customer_impact:
      "Platform teams judge elasticity by whether analysts wait during peak hours; unpredictable start times drive shadow compute purchases.",
    impact: "high",
    recommendation: {
      product: "Reduce cold-start variance and expose queue wait time in monitoring.",
      sales: "Demo a live concurrency spike rather than a single warm query.",
      gtm: "Message elasticity as tenant-wide, not per-service.",
      customer_success: "Right-size capacity with smoothing enabled before go-live.",
    },
    product_recommendation: "validate",
    confidence: "high",
    confidence_signals: { source_count: 4, last_reviewed: "2026-07-18", vendor_confirmed: true },
    executive_actions: {
      pm: "Set and publish a session start-time SLO.",
      sales: "Include a concurrency stress demo in the standard deck.",
      engineering: "Cut p95 session start time on starter pools.",
      leadership: "Track capacity-related escalations as a quality metric.",
    },
    related_articles: [
      {
        title: "BigQuery slots and reservations",
        link: "https://cloud.google.com/bigquery/docs/slots",
        source: "google",
      },
      {
        title: "Fabric capacity bursting and smoothing",
        link: "https://learn.microsoft.com/fabric/enterprise/throttling",
        source: "microsoft",
      },
    ],
  },
  {
    id: "emr-tuning",
    vendor: "emr",
    category: "performance",
    capability: "Low-level cluster and runtime tuning",
    competitor_capability:
      "EMR exposes instance types, spot fleets, and Spark runtime flags directly, letting expert teams tune throughput per workload.",
    fabric_capability:
      "Fabric Spark abstracts infrastructure behind pools and environments, exposing node families, autoscale bounds, and Spark configuration through environment items.",
    position: "competitive",
    capability_gap:
      "EMR wins on raw configurability for expert platform teams; Fabric wins on the time it takes an average team to reach a good configuration.",
    fabric_differentiators: [
      "Environments version Spark config and libraries",
      "No cluster lifecycle management",
      "Governance applied consistently across workspaces",
    ],
    competitor_differentiators: [
      "Full instance and spot-fleet control",
      "Arbitrary runtime and JVM tuning",
      "Custom AMI and bootstrap actions",
    ],
    customer_impact:
      "Customers with small platform teams gain more from sensible defaults than from tuning knobs they will never use; large engineering shops feel the opposite.",
    impact: "medium",
    recommendation: {
      product: "Expand advanced configuration escape hatches for expert tenants.",
      sales: "Qualify early whether the buyer values control or operational simplicity.",
      gtm: "Target teams optimising for platform headcount, not peak tuning.",
      customer_success: "Provide tuned environment templates by workload archetype.",
    },
    product_recommendation: "monitor",
    confidence: "medium",
    confidence_signals: { source_count: 3, last_reviewed: "2026-06-30", vendor_confirmed: true },
    executive_actions: {
      pm: "Ship two more supported advanced-config knobs.",
      sales: "Add a control-vs-simplicity qualifying question.",
      engineering: "Publish reference environments for ETL and ML workloads.",
      leadership: "Decide explicitly not to chase full IaaS parity.",
    },
    related_articles: [
      {
        title: "Amazon EMR best practices",
        link: "https://aws.amazon.com/emr/",
        source: "aws",
      },
      {
        title: "Fabric Spark environments",
        link: "https://learn.microsoft.com/fabric/data-engineering/create-and-use-environment",
        source: "microsoft",
      },
    ],
  },
  {
    id: "snow-concurrency",
    vendor: "snowflake",
    category: "performance",
    capability: "Multi-cluster concurrency isolation",
    competitor_capability:
      "Snowflake multi-cluster warehouses scale out transparently under concurrency, isolating workloads from each other with minimal administration.",
    fabric_capability:
      "Fabric isolates workloads by workspace and capacity, with queueing and smoothing keeping background jobs from starving interactive users.",
    position: "emerging",
    capability_gap:
      "Snowflake's workload isolation model is simpler to reason about; Fabric requires deliberate capacity and workspace design to reach the same predictability.",
    fabric_differentiators: [
      "Isolation aligned to organisational workspaces",
      "Shared capacity avoids stranded compute",
      "BI and engineering governed together",
    ],
    competitor_differentiators: [
      "Transparent scale-out per warehouse",
      "Simple, well-understood isolation model",
      "Strong track record with high analyst concurrency",
    ],
    customer_impact:
      "When a nightly pipeline slows a CFO's dashboard, trust in the platform drops faster than any benchmark can restore it.",
    impact: "high",
    recommendation: {
      product: "Make workload isolation a first-class, guided configuration.",
      sales: "Bring capacity architecture into the first technical call.",
      gtm: "Emphasise governed sharing over per-warehouse sprawl.",
      customer_success: "Review capacity layouts quarterly with each major tenant.",
    },
    product_recommendation: "accelerate",
    confidence: "medium",
    confidence_signals: { source_count: 3, last_reviewed: "2026-07-05", vendor_confirmed: false },
    executive_actions: {
      pm: "Design a guided capacity-planning experience.",
      sales: "Attach a capacity architect to enterprise pursuits.",
      engineering: "Improve queueing fairness between background and interactive jobs.",
      leadership: "Treat noisy-neighbour incidents as a top-line reliability metric.",
    },
    related_articles: [
      {
        title: "Snowflake multi-cluster warehouses",
        link: "https://docs.snowflake.com/en/user-guide/warehouses-multicluster",
        source: "snowflake",
      },
    ],
  },
  {
    id: "dbx-serverless-cost",
    vendor: "databricks",
    category: "cost",
    capability: "Consumption model and cost predictability",
    competitor_capability:
      "Databricks bills DBUs per workload with serverless options, giving fine-grained attribution but variable monthly spend across many SKUs.",
    fabric_capability:
      "Fabric bills a single reserved or pay-go capacity that covers Spark, warehouse, real-time, and Power BI, with smoothing across the day.",
    position: "leader",
    capability_gap:
      "Fabric's single-capacity model is materially easier to budget than multi-SKU consumption billing, at the cost of fine-grained per-job attribution.",
    fabric_differentiators: [
      "One capacity covers every workload",
      "Reserved pricing gives a fixed monthly floor",
      "Smoothing prevents spike-driven bill shock",
    ],
    competitor_differentiators: [
      "Precise per-job cost attribution",
      "Mature chargeback tooling",
      "Fine-grained serverless scaling",
    ],
    customer_impact:
      "Finance teams approving multi-year analytics platforms weight budget predictability at least as heavily as unit price.",
    impact: "high",
    recommendation: {
      product: "Strengthen per-workspace chargeback reporting inside capacity metrics.",
      sales: "Model three-year TCO against the customer's current multi-SKU spend.",
      gtm: "Own the predictable-spend narrative in every cost conversation.",
      customer_success: "Deliver a quarterly capacity utilisation and chargeback review.",
    },
    product_recommendation: "accelerate",
    confidence: "high",
    confidence_signals: { source_count: 6, last_reviewed: "2026-07-25", vendor_confirmed: true },
    executive_actions: {
      pm: "Ship workspace-level chargeback exports.",
      sales: "Standardise on a three-year TCO worksheet.",
      engineering: "Improve granularity of capacity consumption telemetry.",
      leadership: "Make predictable spend the flagship cost message.",
    },
    related_articles: [
      {
        title: "Databricks pricing and DBUs",
        link: "https://www.databricks.com/product/pricing",
        source: "databricks",
      },
      {
        title: "Microsoft Fabric capacity licensing",
        link: "https://learn.microsoft.com/fabric/enterprise/licenses",
        source: "microsoft",
      },
    ],
  },
  {
    id: "bq-storage-cost",
    vendor: "bigquery",
    category: "cost",
    capability: "Storage economics and tiering",
    competitor_capability:
      "BigQuery separates storage from compute with automatic long-term storage discounts on untouched partitions.",
    fabric_capability:
      "OneLake stores Delta tables once with shortcuts replacing copies, so the same data serves engineering, warehouse, and BI without duplication.",
    position: "leader",
    capability_gap:
      "Fabric's advantage is eliminating duplicate copies entirely rather than discounting the storage of copies that still exist.",
    fabric_differentiators: [
      "Shortcuts remove cross-system copies",
      "Open Delta format, no proprietary storage lock-in",
      "Direct Lake serves BI without imports",
    ],
    competitor_differentiators: [
      "Automatic long-term storage discounts",
      "Very cheap raw storage pricing",
      "Mature partition-level lifecycle controls",
    ],
    customer_impact:
      "Most enterprise storage bills are inflated by three or four copies of the same table; removing copies beats discounting them.",
    impact: "medium",
    recommendation: {
      product: "Report storage saved through shortcuts as a visible metric.",
      sales: "Audit the prospect's copy sprawl during discovery.",
      gtm: "Frame OneLake as one copy, many engines.",
      customer_success: "Run a shortcut migration workshop in the first 90 days.",
    },
    product_recommendation: "validate",
    confidence: "medium",
    confidence_signals: { source_count: 3, last_reviewed: "2026-06-28", vendor_confirmed: true },
    executive_actions: {
      pm: "Add a copy-reduction metric to OneLake reporting.",
      sales: "Include a data-copy audit in discovery calls.",
      engineering: "Broaden shortcut coverage for external sources.",
      leadership: "Quantify copy reduction in customer value stories.",
    },
    related_articles: [
      {
        title: "BigQuery storage pricing",
        link: "https://cloud.google.com/bigquery/pricing",
        source: "google",
      },
      {
        title: "OneLake shortcuts",
        link: "https://learn.microsoft.com/fabric/onelake/onelake-shortcuts",
        source: "microsoft",
      },
    ],
  },
  {
    id: "emr-spot",
    vendor: "emr",
    category: "cost",
    capability: "Spot and interruption-tolerant compute",
    competitor_capability:
      "EMR runs large batch fleets on spot instances with managed scaling, cutting raw compute cost dramatically for fault-tolerant jobs.",
    fabric_capability:
      "Fabric has no spot equivalent; savings come from reserved capacity, smoothing, and sharing one capacity across workloads.",
    position: "emerging",
    capability_gap:
      "For pure batch at scale, EMR's spot pricing remains the cheapest raw compute available and Fabric does not compete on that axis.",
    fabric_differentiators: [
      "No interruption handling to engineer",
      "Reserved capacity discounts",
      "Cost includes governance and BI serving",
    ],
    competitor_differentiators: [
      "Deep spot discounts on batch fleets",
      "Managed scaling with mixed instance fleets",
      "Granular per-cluster cost control",
    ],
    customer_impact:
      "Cost-driven batch teams will always find cheaper raw compute; the counter-argument is total delivered cost including people and governance.",
    impact: "medium",
    recommendation: {
      product: "Do not chase spot; invest in efficiency per capacity unit.",
      sales: "Reframe raw-compute comparisons as cost per delivered outcome.",
      gtm: "Avoid head-to-head spot price claims.",
      customer_success: "Show utilisation gains rather than instance pricing.",
    },
    product_recommendation: "deprioritize",
    confidence: "medium",
    confidence_signals: { source_count: 3, last_reviewed: "2026-06-20", vendor_confirmed: true },
    executive_actions: {
      pm: "Focus roadmap on throughput per capacity unit.",
      sales: "Use delivered-cost framing when spot pricing comes up.",
      engineering: "Cut idle capacity consumption in long-running sessions.",
      leadership: "Confirm the decision not to pursue spot-style pricing.",
    },
    related_articles: [
      {
        title: "EMR managed scaling and spot",
        link: "https://aws.amazon.com/blogs/big-data/",
        source: "aws",
      },
    ],
  },
  {
    id: "snow-cost-controls",
    vendor: "snowflake",
    category: "cost",
    capability: "Granular spend guardrails",
    competitor_capability:
      "Snowflake offers resource monitors, auto-suspend, and budgets that cap spend per warehouse with clear alerting.",
    fabric_capability:
      "Fabric enforces limits through capacity throttling, surge protection, and capacity metrics alerts at the capacity level.",
    position: "competitive",
    capability_gap:
      "Snowflake's guardrails are finer grained per workload; Fabric's operate at capacity level with clearer tenant-wide ceilings.",
    fabric_differentiators: [
      "Hard tenant ceiling by design",
      "Surge protection for background jobs",
      "Single place to observe all consumption",
    ],
    competitor_differentiators: [
      "Per-warehouse resource monitors",
      "Mature budget alerting",
      "Fine-grained auto-suspend",
    ],
    customer_impact:
      "Platform owners need to promise finance a ceiling and prove it; per-team accountability is the follow-up question.",
    impact: "medium",
    recommendation: {
      product: "Add per-workspace budgets and alerts under the capacity ceiling.",
      sales: "Demonstrate the hard ceiling early in cost conversations.",
      gtm: "Position governed spend, not just low spend.",
      customer_success: "Configure alerts during onboarding, not after the first overage.",
    },
    product_recommendation: "investigate",
    confidence: "medium",
    confidence_signals: { source_count: 2, last_reviewed: "2026-06-12", vendor_confirmed: false },
    executive_actions: {
      pm: "Scope per-workspace budget alerts.",
      sales: "Show surge protection in the cost demo.",
      engineering: "Expose consumption alerts through the standard alerting stack.",
      leadership: "Sponsor a finance-facing cost governance story.",
    },
    related_articles: [
      {
        title: "Snowflake resource monitors",
        link: "https://docs.snowflake.com/en/user-guide/resource-monitors",
        source: "snowflake",
      },
    ],
  },
  {
    id: "dbx-ai-agents",
    vendor: "databricks",
    category: "ai",
    capability: "Agentic and generative AI development",
    competitor_capability:
      "Databricks offers Mosaic AI for agent authoring, evaluation, vector search, and model serving inside the same workspace as the data.",
    fabric_capability:
      "Fabric pairs Data Agents and Copilot with Azure AI Foundry for model hosting, grounding agents in OneLake data and Power BI semantic models.",
    position: "competitive",
    capability_gap:
      "Databricks has a tighter single-product agent toolchain, while Fabric grounds agents in governed business semantics that most competitors lack.",
    fabric_differentiators: [
      "Agents grounded in Power BI semantic models",
      "Copilot across every Fabric workload",
      "Entra identity flows through to the agent",
    ],
    competitor_differentiators: [
      "Integrated agent evaluation tooling",
      "Mature vector search and serving",
      "Strong open-model fine-tuning story",
    ],
    customer_impact:
      "Business users only trust AI answers that match the numbers in their reports, which makes semantic grounding the deciding factor.",
    impact: "high",
    recommendation: {
      product: "Close the agent evaluation and observability gap.",
      sales: "Demo an agent answering with governed semantic-model metrics.",
      gtm: "Own trusted answers rather than raw model breadth.",
      customer_success: "Start every AI engagement from an existing semantic model.",
    },
    product_recommendation: "accelerate",
    confidence: "high",
    confidence_signals: { source_count: 5, last_reviewed: "2026-07-28", vendor_confirmed: true },
    executive_actions: {
      pm: "Ship agent evaluation and tracing in-product.",
      sales: "Standardise the semantic-model grounded AI demo.",
      engineering: "Improve grounding accuracy telemetry.",
      leadership: "Fund the agent observability workstream.",
    },
    related_articles: [
      {
        title: "Mosaic AI agent framework",
        link: "https://www.databricks.com/product/artificial-intelligence",
        source: "databricks",
      },
      {
        title: "Fabric data agents",
        link: "https://learn.microsoft.com/fabric/data-science/concept-data-agent",
        source: "microsoft",
      },
    ],
  },
  {
    id: "bq-ml",
    vendor: "bigquery",
    category: "ai",
    capability: "In-warehouse ML and SQL-native models",
    competitor_capability:
      "BigQuery ML trains and serves models directly from SQL, with Gemini integration for generation and embeddings inside queries.",
    fabric_capability:
      "Fabric supports SynapseML, MLflow tracking, and notebook-based training on Spark, plus AI functions callable from SQL and notebooks.",
    position: "competitive",
    capability_gap:
      "BigQuery makes simple models trivially accessible to SQL analysts; Fabric offers a deeper engineering-grade ML lifecycle.",
    fabric_differentiators: [
      "Full MLflow lifecycle with model registry",
      "Spark-scale feature engineering",
      "Models usable directly in Power BI",
    ],
    competitor_differentiators: [
      "One-line SQL model training",
      "Gemini functions inside queries",
      "Very low barrier for analysts",
    ],
    customer_impact:
      "Analyst-led ML expands the platform's user base far beyond data scientists, which drives seat growth and stickiness.",
    impact: "medium",
    recommendation: {
      product: "Expand SQL-callable AI functions for analyst personas.",
      sales: "Segment the demo by analyst versus data-science buyer.",
      gtm: "Message ML for both analysts and engineers.",
      customer_success: "Run an analyst-focused AI functions enablement session.",
    },
    product_recommendation: "investigate",
    confidence: "medium",
    confidence_signals: { source_count: 3, last_reviewed: "2026-07-02", vendor_confirmed: true },
    executive_actions: {
      pm: "Prioritise the most requested SQL AI functions.",
      sales: "Build an analyst-persona ML demo.",
      engineering: "Reduce friction between notebook models and BI consumption.",
      leadership: "Set a target for analyst-persona AI adoption.",
    },
    related_articles: [
      {
        title: "BigQuery ML overview",
        link: "https://cloud.google.com/bigquery/docs/bqml-introduction",
        source: "google",
      },
    ],
  },
  {
    id: "snow-cortex",
    vendor: "snowflake",
    category: "ai",
    capability: "Managed LLM services over governed data",
    competitor_capability:
      "Snowflake Cortex exposes managed LLM functions, search, and analyst experiences that run inside the customer's governance boundary.",
    fabric_capability:
      "Fabric delivers Copilot experiences and AI functions under Entra governance, with Purview-backed sensitivity labels applied to AI outputs.",
    position: "leader",
    capability_gap:
      "Fabric's advantage is that AI governance reuses the identity, labelling, and compliance stack the enterprise already runs.",
    fabric_differentiators: [
      "Purview sensitivity labels on AI output",
      "Entra Conditional Access applies to AI",
      "Consistent compliance posture across M365",
    ],
    competitor_differentiators: [
      "Simple managed LLM SQL functions",
      "Strong Cortex Analyst experience",
      "Model choice inside one boundary",
    ],
    customer_impact:
      "Regulated buyers block AI rollouts that cannot inherit existing identity and data-protection controls.",
    impact: "high",
    recommendation: {
      product: "Keep AI governance parity ahead of AI feature parity.",
      sales: "Lead regulated-industry conversations with the governance story.",
      gtm: "Position compliant AI as the default, not an add-on.",
      customer_success: "Validate label inheritance during AI pilots.",
    },
    product_recommendation: "validate",
    confidence: "high",
    confidence_signals: { source_count: 4, last_reviewed: "2026-07-20", vendor_confirmed: true },
    executive_actions: {
      pm: "Document AI governance controls end to end.",
      sales: "Prepare a regulated-industry AI governance one-pager.",
      engineering: "Test label propagation across every AI surface.",
      leadership: "Make compliant AI a named strategic pillar.",
    },
    related_articles: [
      {
        title: "Snowflake Cortex AI",
        link: "https://docs.snowflake.com/en/user-guide/snowflake-cortex/overview",
        source: "snowflake",
      },
    ],
  },
  {
    id: "spark-ml-ecosystem",
    vendor: "spark",
    category: "ai",
    capability: "Open-source ML ecosystem compatibility",
    competitor_capability:
      "The open Spark ecosystem gives full freedom over MLlib, PyTorch, Ray, and any library the team can install, with no vendor gating.",
    fabric_capability:
      "Fabric Spark runs standard PySpark with custom library management through environments, keeping notebooks portable to any Spark runtime.",
    position: "competitive",
    capability_gap:
      "Fabric preserves open Spark compatibility while adding managed library governance, at the cost of some install-anything freedom.",
    fabric_differentiators: [
      "Managed, versioned environments",
      "Runtime patched and supported",
      "Portable standard PySpark code",
    ],
    competitor_differentiators: [
      "Unrestricted library installation",
      "Immediate access to new OSS releases",
      "No runtime certification lag",
    ],
    customer_impact:
      "Engineering teams fear lock-in; demonstrable code portability shortens platform decisions considerably.",
    impact: "medium",
    recommendation: {
      product: "Shorten the lag between OSS Spark releases and Fabric runtimes.",
      sales: "Show a notebook running unchanged on open Spark.",
      gtm: "Message open by default, managed where it matters.",
      customer_success: "Include a portability check in architecture reviews.",
    },
    product_recommendation: "monitor",
    confidence: "medium",
    confidence_signals: { source_count: 3, last_reviewed: "2026-06-25", vendor_confirmed: true },
    executive_actions: {
      pm: "Publish a runtime support and OSS version calendar.",
      sales: "Add a portability proof to technical evaluations.",
      engineering: "Automate library compatibility testing.",
      leadership: "Reaffirm the open-format, open-API commitment publicly.",
    },
    related_articles: [
      {
        title: "Apache Spark project",
        link: "https://spark.apache.org/",
        source: "apache",
      },
    ],
  },
  {
    id: "dbx-unity",
    vendor: "databricks",
    category: "governance",
    capability: "Unified catalog and access control",
    competitor_capability:
      "Unity Catalog centralises table, model, and file governance with lineage and fine-grained access control across clouds.",
    fabric_capability:
      "Fabric governs through OneLake, Entra identity, workspace roles, and Purview integration, with lineage across every item type including reports.",
    position: "competitive",
    capability_gap:
      "Unity Catalog is deeper for data-object governance; Fabric extends lineage and labelling all the way into BI artefacts and M365.",
    fabric_differentiators: [
      "Lineage from source to report",
      "Purview labels and DLP inherited",
      "Entra groups already in place",
    ],
    competitor_differentiators: [
      "Mature fine-grained data permissions",
      "Cross-cloud catalog federation",
      "Strong attribute-based access controls",
    ],
    customer_impact:
      "Governance buyers evaluate the whole chain to the dashboard; gaps at the BI edge are where audits actually fail.",
    impact: "high",
    recommendation: {
      product: "Continue closing fine-grained permission gaps at table and column level.",
      sales: "Sell end-to-end lineage rather than catalog features.",
      gtm: "Anchor governance messaging on audit outcomes.",
      customer_success: "Run a lineage-to-report walkthrough with each governance stakeholder.",
    },
    product_recommendation: "accelerate",
    confidence: "high",
    confidence_signals: { source_count: 5, last_reviewed: "2026-07-24", vendor_confirmed: true },
    executive_actions: {
      pm: "Close remaining column and row-level permission gaps.",
      sales: "Use audit-scenario storytelling in governance calls.",
      engineering: "Harden lineage capture for edge item types.",
      leadership: "Position governance as a top-three differentiator.",
    },
    related_articles: [
      {
        title: "Unity Catalog overview",
        link: "https://www.databricks.com/product/unity-catalog",
        source: "databricks",
      },
      {
        title: "Governance in Microsoft Fabric",
        link: "https://learn.microsoft.com/fabric/governance/governance-compliance-overview",
        source: "microsoft",
      },
    ],
  },
  {
    id: "bq-sharing",
    vendor: "bigquery",
    category: "governance",
    capability: "Cross-organisation data sharing",
    competitor_capability:
      "BigQuery Analytics Hub publishes governed data exchanges so partners query shared datasets without copying them.",
    fabric_capability:
      "Fabric shares OneLake data through shortcuts, workspace sharing, and external data sharing governed by Entra B2B.",
    position: "competitive",
    capability_gap:
      "Both avoid copies for sharing; Fabric's model is stronger where partners already exist in Entra, weaker for open public exchanges.",
    fabric_differentiators: [
      "Entra B2B identity for partners",
      "Shortcuts avoid duplication",
      "Sharing governed with internal policy",
    ],
    competitor_differentiators: [
      "Public data exchange marketplace",
      "Mature listing and subscription flow",
      "Strong third-party dataset ecosystem",
    ],
    customer_impact:
      "Supply-chain and partner analytics stall on identity plumbing far more often than on query performance.",
    impact: "medium",
    recommendation: {
      product: "Simplify external sharing setup for non-Entra partners.",
      sales: "Probe for partner-analytics use cases in discovery.",
      gtm: "Message secure sharing without copies.",
      customer_success: "Pilot one partner share within the first quarter.",
    },
    product_recommendation: "investigate",
    confidence: "medium",
    confidence_signals: { source_count: 2, last_reviewed: "2026-06-18", vendor_confirmed: false },
    executive_actions: {
      pm: "Reduce steps required for external data sharing.",
      sales: "Add partner-sharing questions to discovery.",
      engineering: "Improve error messaging on cross-tenant shares.",
      leadership: "Assess whether a data exchange offering is warranted.",
    },
    related_articles: [
      {
        title: "BigQuery Analytics Hub",
        link: "https://cloud.google.com/analytics-hub",
        source: "google",
      },
    ],
  },
  {
    id: "spark-open-table",
    vendor: "spark",
    category: "governance",
    capability: "Open table format interoperability",
    competitor_capability:
      "The open ecosystem lets any engine read Delta and Iceberg tables directly, with Iceberg REST catalogs increasingly standard.",
    fabric_capability:
      "OneLake stores Delta natively and exposes Iceberg interoperability through metadata virtualisation, so external engines read the same tables.",
    position: "competitive",
    capability_gap:
      "Fabric supports both formats without copies, though open-ecosystem catalog federation still moves faster than any single vendor.",
    fabric_differentiators: [
      "One storage layer, both table formats",
      "No proprietary storage format",
      "Direct Lake reads without imports",
    ],
    competitor_differentiators: [
      "Fastest-moving catalog standards",
      "No vendor dependency at all",
      "Wide multi-engine adoption",
    ],
    customer_impact:
      "Open formats are now the default requirement in RFPs; the question is who supports them without a conversion step.",
    impact: "high",
    recommendation: {
      product: "Track Iceberg REST catalog standards closely and stay current.",
      sales: "Answer format questions with the no-copy interoperability story.",
      gtm: "Keep open formats front and centre in platform messaging.",
      customer_success: "Validate external-engine reads during onboarding.",
    },
    product_recommendation: "monitor",
    confidence: "high",
    confidence_signals: { source_count: 4, last_reviewed: "2026-07-15", vendor_confirmed: true },
    executive_actions: {
      pm: "Keep Iceberg interoperability aligned to the current spec.",
      sales: "Prepare an open-format RFP answer block.",
      engineering: "Test third-party engine reads each release.",
      leadership: "Maintain visible participation in open format communities.",
    },
    related_articles: [
      {
        title: "Apache Iceberg",
        link: "https://iceberg.apache.org/",
        source: "apache",
      },
      {
        title: "OneLake table format interoperability",
        link: "https://learn.microsoft.com/fabric/onelake/onelake-overview",
        source: "microsoft",
      },
    ],
  },
  {
    id: "emr-compliance",
    vendor: "emr",
    category: "governance",
    capability: "Security and compliance controls",
    competitor_capability:
      "EMR inherits IAM, KMS, VPC, and Lake Formation controls, giving highly customisable security for teams that own the configuration.",
    fabric_capability:
      "Fabric applies Entra Conditional Access, private links, customer-managed keys, and Purview labels as tenant-wide defaults.",
    position: "leader",
    capability_gap:
      "Fabric delivers enterprise compliance out of the box, where EMR requires the customer to assemble and maintain equivalent controls.",
    fabric_differentiators: [
      "Conditional Access applies to analytics",
      "Purview labelling and DLP built in",
      "Compliance posture shared with M365",
    ],
    competitor_differentiators: [
      "Fully customisable IAM policies",
      "Fine-grained network isolation",
      "Lake Formation permission model",
    ],
    customer_impact:
      "Security review is the longest step in most analytics purchases; inherited controls can remove months from the timeline.",
    impact: "high",
    recommendation: {
      product: "Keep publishing compliance evidence ahead of customer requests.",
      sales: "Engage the security reviewer in week one.",
      gtm: "Make faster security approval an explicit value claim.",
      customer_success: "Ship a prebuilt security review pack with every deployment.",
    },
    product_recommendation: "validate",
    confidence: "high",
    confidence_signals: { source_count: 4, last_reviewed: "2026-07-10", vendor_confirmed: true },
    executive_actions: {
      pm: "Maintain the compliance control matrix per release.",
      sales: "Bring security stakeholders into the first meeting.",
      engineering: "Automate compliance evidence generation.",
      leadership: "Track security-review cycle time as a GTM metric.",
    },
    related_articles: [
      {
        title: "Fabric security overview",
        link: "https://learn.microsoft.com/fabric/security/security-overview",
        source: "microsoft",
      },
    ],
  },
];

const IMPACT_RANK: Record<Impact, number> = { high: 0, medium: 1, low: 2 };
const CONFIDENCE_RANK: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };

export const sortBenchmarks = (rows: CapabilityBenchmark[]): CapabilityBenchmark[] =>
  [...rows].sort(
    (a, b) =>
      IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] ||
      CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
  );

export const filterBenchmarks = (
  rows: CapabilityBenchmark[],
  category: Category | "all",
  vendor: Vendor | "all"
): CapabilityBenchmark[] =>
  rows.filter(
    (r) =>
      (category === "all" || r.category === category) && (vendor === "all" || r.vendor === vendor)
  );

export const countByPosition = (rows: CapabilityBenchmark[]): Record<Position, number> => ({
  leader: rows.filter((r) => r.position === "leader").length,
  competitive: rows.filter((r) => r.position === "competitive").length,
  emerging: rows.filter((r) => r.position === "emerging").length,
});

export const confidenceSummary = (b: CapabilityBenchmark): string => {
  const { source_count, last_reviewed, vendor_confirmed } = b.confidence_signals;
  const reviewed = new Date(last_reviewed).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return `${source_count} sources · reviewed ${reviewed} · ${
    vendor_confirmed ? "vendor confirmed" : "unconfirmed"
  }`;
};

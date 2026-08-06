export interface TourStep {
  id: string;
  route: string;
  target: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    route: "/dashboard",
    target: '[data-tour="nav-dashboard"]',
    title: "Your daily brief",
    body: "Big Data Intelligence Hub tracks the big data ecosystem daily for product, sales and strategy teams. The dashboard opens with today's synthesized brief — top insight, highlights and momentum.",
  },
  {
    id: "executive-intelligence",
    route: "/dashboard",
    target: '[data-tour="executive-intelligence"]',
    title: "Executive intelligence",
    body: "A deterministic read of the ecosystem from the Microsoft Fabric Spark perspective: biggest change, opportunity, risk and the recommended next action.",
  },
  {
    id: "benchmark-context",
    route: "/dashboard",
    target: '[data-tour="benchmark-context"]',
    title: 'What "benchmarked against" means',
    body: "Every insight is written from the Microsoft Fabric Spark point of view and measured against Databricks, BigQuery, AWS EMR, Snowflake and the Apache Spark ecosystem — over the stated analysis window and source count.",
  },
  {
    id: "news",
    route: "/dashboard",
    target: '[data-tour="nav-news"]',
    title: "News feed",
    body: "Every tracked article with signal scoring, source badges and bookmarking — analysis first, release notes filtered out.",
  },
  {
    id: "trends",
    route: "/dashboard",
    target: '[data-tour="nav-trends"]',
    title: "Trends",
    body: "Topic momentum over time: what's growing, what's newly emerging, and what's fading across vendors.",
  },
  {
    id: "compare",
    route: "/dashboard",
    target: '[data-tour="nav-compare"]',
    title: "Compare",
    body: "Filter by category or competitor, then open a capability to see the competitor capability next to the Fabric Spark capability, why it matters, and the recommended next action.",
  },
  {
    id: "radar",
    route: "/dashboard",
    target: '[data-tour="nav-radar"]',
    title: "Action radar",
    body: "Your decision surface: recommendations grouped into act now, watch and deprioritize, each with priority, confidence and an owner. Set a status to work through them.",
  },
  {
    id: "copilot",
    route: "/dashboard",
    target: '[data-tour="nav-copilot"]',
    title: "Ask the copilot",
    body: 'Ask plain questions of the ingested corpus — for example "What changed in Iceberg this week?" or "What should sales prepare for?" — and get grounded, cited answers.',
  },
];

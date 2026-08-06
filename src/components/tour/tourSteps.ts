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
    body: "The dashboard opens with today's synthesized brief — top insight, highlights and momentum, refreshed each ingestion cycle.",
  },
  {
    id: "executive-intelligence",
    route: "/dashboard",
    target: '[data-tour="executive-intelligence"]',
    title: "Executive intelligence",
    body: "A deterministic read of the ecosystem from the Microsoft Fabric Spark perspective: biggest change, opportunity, risk and the recommended next action.",
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
    body: "Benchmark capabilities against Databricks, BigQuery, EMR and Snowflake in a competitive intelligence workspace.",
  },
  {
    id: "radar",
    route: "/dashboard",
    target: '[data-tour="nav-radar"]',
    title: "Action radar",
    body: "Prioritized recommendations derived from the day's signals, ranked by importance and urgency.",
  },
  {
    id: "copilot",
    route: "/dashboard",
    target: '[data-tour="nav-copilot"]',
    title: "Ask the copilot",
    body: "Ask questions about the ingested corpus and get grounded, cited answers in seconds.",
  },
];

export interface Article {
  title: string;
  source: string;
  summary: string;
  link: string;
  tags: string[];
  date?: string;
}

export interface TrendItem {
  topic: string;
  status: string;
  today: number;
  yesterday: number;
  change: number;
}

export interface DailySummary {
  date: string;
  summary: {
    topInsight?: string;
    highlights: string[];
    trends: string[];
    impact: string[];
  };
}

const mockResponse = {
  date: "2026-04-02",
  summary: {
    topInsight: "Iceberg adoption accelerates across all major cloud vendors, signaling convergence on open table formats",
    highlights: [
      "Databricks announced Spark runtime improvements with Photon engine gains",
      "Iceberg adoption increasing across AWS, Google, and Microsoft platforms",
      "Microsoft Fabric Lakehouse adds Delta-Iceberg interoperability",
      "AI integration with data platforms expanding across all vendors",
      "EMR Serverless delivers 40% cost reduction on batch workloads",
    ],
    trends: [
      "Iceberg vs Delta convergence accelerating",
      "AI + data platform integration rising across vendors",
      "Serverless and cost optimization becoming key differentiators",
    ],
    impact: [
      "Shift toward open table formats reduces vendor lock-in",
      "Increased competition between Databricks, AWS, Google, and Microsoft",
      "Cost and performance becoming primary decision factors for platform choice",
    ],
  },
  articles: [
    {
      title: "Databricks improves Spark runtime performance",
      source: "databricks",
      summary: "New Photon engine optimizations reduce latency and improve execution speed across workloads",
      link: "#",
      tags: ["spark4", "databricks", "performance"],
    },
    {
      title: "AWS EMR Serverless reduces batch processing costs",
      source: "aws",
      summary: "New pricing model and auto-scaling deliver up to 40% cost savings for Spark batch jobs",
      link: "#",
      tags: ["emr", "cost", "batch"],
    },
    {
      title: "Microsoft Fabric adds Iceberg support",
      source: "microsoft",
      summary: "Fabric Lakehouse now supports reading and writing Apache Iceberg tables natively",
      link: "#",
      tags: ["fabric", "iceberg"],
    },
    {
      title: "Google BigQuery integrates with Spark for ML pipelines",
      source: "google",
      summary: "New BigQuery-Spark connector enables seamless AI/ML pipeline orchestration",
      link: "#",
      tags: ["bigquery", "ai", "spark"],
    },
  ],
  trends: [
    { topic: "iceberg", status: "growing", today: 5, yesterday: 2, change: 3 },
    { topic: "fabric", status: "new", today: 3, yesterday: 0, change: 3 },
    { topic: "emr", status: "growing", today: 4, yesterday: 2, change: 2 },
    { topic: "ai", status: "stable", today: 3, yesterday: 3, change: 0 },
    { topic: "performance", status: "growing", today: 3, yesterday: 1, change: 2 },
    { topic: "cost", status: "new", today: 2, yesterday: 0, change: 2 },
    { topic: "delta", status: "stable", today: 2, yesterday: 2, change: 0 },
    { topic: "bigquery", status: "new", today: 2, yesterday: 0, change: 2 },
  ],
};

export const dailySummary: DailySummary = {
  date: mockResponse.date,
  summary: mockResponse.summary,
};

export const articles: Article[] = mockResponse.articles.map((a) => ({
  ...a,
  date: mockResponse.date,
}));

export const trends: TrendItem[] = mockResponse.trends;

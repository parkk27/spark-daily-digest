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
}

export interface DailySummary {
  date: string;
  summary: {
    highlights: string[];
    trends: string[];
    impact: string[];
  };
}

const mockResponse = {
  date: "2026-04-02",
  summary: {
    highlights: [
      "Databricks announced Spark runtime improvements",
      "Iceberg adoption increasing across cloud vendors",
      "Spark 4 features gaining traction",
      "AI integration with Spark expanding",
      "Performance optimizations across workloads",
    ],
    trends: [
      "Iceberg gaining momentum",
      "AI + Spark rising",
      "Open table formats increasing",
    ],
    impact: [
      "Shift toward open data formats",
      "Increased vendor competition",
      "Faster query performance expectations",
    ],
  },
  articles: [
    {
      title: "Databricks improves Spark runtime performance",
      source: "databricks",
      summary: "New optimizations reduce latency and improve execution speed",
      link: "#",
      tags: ["spark4"],
    },
    {
      title: "Apache Spark updates roadmap",
      source: "apache",
      summary: "Community discusses next-gen Spark features",
      link: "#",
      tags: ["spark4"],
    },
  ],
  trends: [
    { topic: "iceberg", status: "growing" },
    { topic: "spark4", status: "new" },
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

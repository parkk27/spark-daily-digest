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
    topInsight: "Spark 4.2.0-preview3 release signals the ecosystem is accelerating toward next-gen features",
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
    { topic: "iceberg", status: "growing", today: 5, yesterday: 2, change: 3 },
    { topic: "spark4", status: "new", today: 2, yesterday: 0, change: 2 },
    { topic: "ai", status: "stable", today: 3, yesterday: 3, change: 0 },
    { topic: "performance", status: "growing", today: 3, yesterday: 1, change: 2 },
    { topic: "streaming", status: "declining", today: 1, yesterday: 3, change: -2 },
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

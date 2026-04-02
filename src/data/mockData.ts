export interface Article {
  title: string;
  source: "Databricks" | "Apache" | "Google" | "Microsoft";
  summary: string;
  link: string;
  tags: string[];
  date: string;
}

export interface TrendItem {
  topic: string;
  status: "Growing" | "New" | "Stable" | "Declining";
}

export interface DailySummary {
  date: string;
  summary: {
    highlights: string[];
    trends: string[];
    impact: string[];
  };
}

export const dailySummary: DailySummary = {
  date: "2026-04-02",
  summary: {
    highlights: [
      "Databricks announces Spark 4.0 preview with native Rust UDF support, promising 3x performance gains on analytical workloads.",
      "Apache Iceberg 3.1 released with improved merge-on-read and partition evolution, deepening Spark integration.",
      "Google Cloud launches Dataproc Serverless 2.0 with auto-tuning Spark configs and 40% cost reduction.",
      "Microsoft Fabric adds native Spark Structured Streaming support with exactly-once semantics.",
      "New benchmark shows Photon engine outperforming vanilla Spark SQL by 8x on TPC-DS queries.",
    ],
    trends: [
      "Rust-based UDFs are emerging as the next performance frontier for Spark workloads.",
      "Lakehouse architectures converging around Iceberg as the de facto open table format.",
      "Serverless Spark adoption accelerating, with all major clouds now offering managed options.",
      "AI/ML pipeline integration with Spark becoming table stakes for enterprise data platforms.",
      "Real-time streaming use cases overtaking batch processing in new Spark deployments.",
    ],
    impact: [
      "The Spark 4.0 preview signals a major shift toward polyglot runtime support — teams should start evaluating Rust UDF migration paths.",
      "Iceberg's dominance as the open table format reduces vendor lock-in risk and simplifies multi-cloud strategies.",
      "Serverless Spark eliminates cluster management overhead, freeing data engineers to focus on pipeline logic.",
    ],
  },
};

export const articles: Article[] = [
  {
    title: "Spark 4.0 Preview: Rust UDFs and the Future of Performance",
    source: "Databricks",
    summary: "Databricks unveils Spark 4.0 preview featuring native Rust UDF support, promising dramatic performance improvements for compute-intensive analytical workloads.",
    link: "https://databricks.com/blog/spark-4-preview",
    tags: ["Spark 4", "Rust", "Performance"],
    date: "2026-04-02",
  },
  {
    title: "Apache Iceberg 3.1: Deeper Spark Integration",
    source: "Apache",
    summary: "The latest Iceberg release brings improved merge-on-read performance and seamless partition evolution with enhanced Spark catalog support.",
    link: "https://iceberg.apache.org/releases",
    tags: ["Iceberg", "Open Table Format"],
    date: "2026-04-02",
  },
  {
    title: "Dataproc Serverless 2.0 with Auto-Tuning",
    source: "Google",
    summary: "Google Cloud introduces auto-tuning Spark configurations in Dataproc Serverless 2.0, delivering up to 40% cost reduction on production workloads.",
    link: "https://cloud.google.com/dataproc/docs",
    tags: ["Serverless", "Cost Optimization"],
    date: "2026-04-02",
  },
  {
    title: "Microsoft Fabric Adds Spark Structured Streaming",
    source: "Microsoft",
    summary: "Native Spark Structured Streaming arrives in Microsoft Fabric with exactly-once semantics and deep OneLake integration for real-time analytics.",
    link: "https://learn.microsoft.com/fabric",
    tags: ["Streaming", "Fabric"],
    date: "2026-04-02",
  },
  {
    title: "Photon Engine Benchmark: 8x Faster Than Vanilla Spark SQL",
    source: "Databricks",
    summary: "New independent benchmarks confirm Databricks' Photon engine delivers 8x performance gains on TPC-DS queries compared to open-source Spark SQL.",
    link: "https://databricks.com/blog/photon-benchmark",
    tags: ["Photon", "Performance", "Benchmark"],
    date: "2026-04-01",
  },
  {
    title: "Apache Spark 3.5.2 Maintenance Release",
    source: "Apache",
    summary: "Critical bug fixes and stability improvements for Spark 3.5 branch, including fixes for structured streaming checkpointing edge cases.",
    link: "https://spark.apache.org/releases",
    tags: ["Maintenance", "Stability"],
    date: "2026-04-01",
  },
  {
    title: "BigQuery Spark Procedures GA with ML Integration",
    source: "Google",
    summary: "Google announces general availability of Spark stored procedures in BigQuery, enabling seamless ML model training within the data warehouse.",
    link: "https://cloud.google.com/bigquery/docs/spark",
    tags: ["BigQuery", "ML", "Stored Procedures"],
    date: "2026-03-31",
  },
];

export const trends: TrendItem[] = [
  { topic: "Apache Iceberg", status: "Growing" },
  { topic: "Spark 4.0", status: "New" },
  { topic: "AI + Spark", status: "Stable" },
  { topic: "Rust UDFs", status: "New" },
  { topic: "Serverless Spark", status: "Growing" },
  { topic: "Photon Engine", status: "Growing" },
  { topic: "Delta Lake", status: "Stable" },
  { topic: "Structured Streaming", status: "Stable" },
  { topic: "Spark on Kubernetes", status: "Growing" },
  { topic: "Hudi", status: "Declining" },
];

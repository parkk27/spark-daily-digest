/**
 * Central perspective configuration.
 * Single source of truth: no perspective facts are hardcoded in components,
 * scoring, momentum or edge functions.
 */

export type PerspectiveType = "platform" | "technology";

export interface WeightProfile {
  topic: number;
  competitive: number;
  capability: number;
  entity: number;
  business: number;
}

export interface Perspective {
  id: string;
  name: string;
  display_name: string;
  type: PerspectiveType;
  description: string;
  aliases: string[];
  core_topics: string[];
  related_topics: string[];
  competitors: string[];
  technologies: string[];
  default_weight_profile: WeightProfile;
  is_active: boolean;
}

const BALANCED: WeightProfile = {
  topic: 30,
  competitive: 20,
  capability: 20,
  entity: 15,
  business: 15,
};

export const DEFAULT_PERSPECTIVE_ID = "microsoft-fabric";

export const PERSPECTIVES: Perspective[] = [
  {
    id: "microsoft-fabric",
    name: "microsoft_fabric",
    display_name: "Microsoft Fabric",
    type: "platform",
    description: "Unified analytics platform view: Fabric Spark, OneLake and Lakehouse.",
    aliases: ["fabric", "microsoft fabric", "onelake", "synapse", "microsoft"],
    core_topics: ["fabric", "onelake", "synapse", "spark", "lakehouse"],
    related_topics: ["delta", "iceberg", "governance", "copilot", "power bi", "warehouse"],
    competitors: ["databricks", "snowflake", "bigquery", "emr", "dataproc"],
    technologies: ["spark", "delta", "iceberg", "sql", "ai"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "databricks",
    name: "databricks",
    display_name: "Databricks",
    type: "platform",
    description: "Lakehouse platform view: Databricks runtime, Photon and Unity Catalog.",
    aliases: ["databricks", "photon", "unity catalog", "dbsql"],
    core_topics: ["databricks", "photon", "unity catalog", "delta", "spark"],
    related_topics: ["mlflow", "governance", "streaming", "serverless", "iceberg"],
    competitors: ["fabric", "snowflake", "bigquery", "emr", "dataproc"],
    technologies: ["spark", "delta", "mlflow", "sql", "ai"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "bigquery",
    name: "google_bigquery",
    display_name: "Google BigQuery",
    type: "platform",
    description: "Cloud data warehouse view: BigQuery, BigLake and the agentic data cloud.",
    aliases: ["bigquery", "biglake", "google cloud", "gcp"],
    core_topics: ["bigquery", "biglake", "google"],
    related_topics: ["iceberg", "ai", "gemini", "serverless", "governance"],
    competitors: ["snowflake", "databricks", "fabric", "redshift"],
    technologies: ["sql", "iceberg", "ai"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "aws-emr",
    name: "aws_emr",
    display_name: "AWS EMR",
    type: "platform",
    description: "Managed Spark on AWS: EMR, EMR Serverless and Glue interoperability.",
    aliases: ["emr", "aws", "amazon emr", "glue"],
    core_topics: ["emr", "aws", "glue", "spark"],
    related_topics: ["iceberg", "serverless", "cost", "s3", "athena"],
    competitors: ["databricks", "fabric", "dataproc", "snowflake"],
    technologies: ["spark", "iceberg", "hive"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "dataproc",
    name: "google_dataproc",
    display_name: "Google Dataproc",
    type: "platform",
    description: "Managed Spark and open-source data processing on Google Cloud.",
    aliases: ["dataproc", "google dataproc"],
    core_topics: ["dataproc", "spark", "google"],
    related_topics: ["serverless", "iceberg", "bigquery", "cost"],
    competitors: ["emr", "databricks", "fabric"],
    technologies: ["spark", "flink", "iceberg"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "snowflake",
    name: "snowflake",
    display_name: "Snowflake",
    type: "platform",
    description: "Cloud data platform view: Snowflake warehouse, Snowpark and Polaris.",
    aliases: ["snowflake", "snowpark", "polaris"],
    core_topics: ["snowflake", "snowpark", "polaris"],
    related_topics: ["iceberg", "ai", "governance", "cost"],
    competitors: ["databricks", "bigquery", "fabric"],
    technologies: ["sql", "iceberg", "ai"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "apache-spark",
    name: "apache_spark",
    display_name: "Apache Spark",
    type: "technology",
    description: "Open-source Spark engine: runtime, connectors and ecosystem direction.",
    aliases: ["spark", "apache spark", "spark4", "pyspark"],
    core_topics: ["spark", "pyspark", "structured streaming"],
    related_topics: ["delta", "iceberg", "performance", "connect", "python"],
    competitors: ["flink", "trino", "ray"],
    technologies: ["spark", "streaming", "sql"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "apache-iceberg",
    name: "apache_iceberg",
    display_name: "Apache Iceberg",
    type: "technology",
    description: "Open table format view: Iceberg specification, catalogs and interoperability.",
    aliases: ["iceberg", "apache iceberg"],
    core_topics: ["iceberg", "catalog", "table format"],
    related_topics: ["delta", "hudi", "interoperability", "governance", "rest catalog"],
    competitors: ["delta", "hudi"],
    technologies: ["iceberg", "spark", "trino"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "delta-lake",
    name: "delta_lake",
    display_name: "Delta Lake",
    type: "technology",
    description: "Delta Lake format view: protocol evolution and Iceberg interoperability.",
    aliases: ["delta", "delta lake", "uniform"],
    core_topics: ["delta", "uniform", "table format"],
    related_topics: ["iceberg", "governance", "streaming", "interoperability"],
    competitors: ["iceberg", "hudi"],
    technologies: ["delta", "spark"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
  {
    id: "apache-flink",
    name: "apache_flink",
    display_name: "Apache Flink",
    type: "technology",
    description: "Streaming-first processing view: Flink engine and streaming lakehouse.",
    aliases: ["flink", "apache flink"],
    core_topics: ["flink", "streaming", "real-time"],
    related_topics: ["kafka", "iceberg", "latency", "cdc"],
    competitors: ["spark", "kafka streams"],
    technologies: ["flink", "kafka", "iceberg"],
    default_weight_profile: BALANCED,
    is_active: true,
  },
];

export const ACTIVE_PERSPECTIVES = PERSPECTIVES.filter((p) => p.is_active);

export function getPerspective(id: string | null | undefined): Perspective {
  return (
    ACTIVE_PERSPECTIVES.find((p) => p.id === id) ??
    ACTIVE_PERSPECTIVES.find((p) => p.id === DEFAULT_PERSPECTIVE_ID)!
  );
}

/** Entities tracked for a perspective: its own topics plus its competitors. */
export function perspectiveEntities(p: Perspective): { id: string; name: string; kind: string }[] {
  const own = [...p.core_topics, ...p.related_topics].map((t) => ({
    id: t.toLowerCase(),
    name: t,
    kind: "topic",
  }));
  const rivals = p.competitors.map((c) => ({ id: c.toLowerCase(), name: c, kind: "competitor" }));
  const seen = new Set<string>();
  return [...own, ...rivals].filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

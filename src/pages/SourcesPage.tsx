import { Database } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { useSparkData } from "@/hooks/useSparkData";

const SOURCES = [
  { name: "Databricks Blog", vendor: "Databricks", focus: "Runtime, Photon, governance, AI", reliability: "High" },
  { name: "AWS Big Data Blog", vendor: "AWS", focus: "EMR, Glue, cost and scale patterns", reliability: "High" },
  { name: "Microsoft Fabric Blog", vendor: "Microsoft", focus: "Fabric Spark, OneLake, Delta/Iceberg", reliability: "High" },
  { name: "Google Cloud Blog", vendor: "Google Cloud", focus: "BigQuery, Dataproc, agentic data cloud", reliability: "High" },
  { name: "Transform with Google Cloud", vendor: "Google Cloud", focus: "Strategy and customer transformation", reliability: "Medium" },
  { name: "Apache Iceberg", vendor: "Apache", focus: "Open table format direction", reliability: "High" },
  { name: "Apache Spark", vendor: "Apache", focus: "Engine roadmap and analysis", reliability: "High" },
  { name: "Snowflake Blog", vendor: "Snowflake", focus: "Warehouse, interoperability, pricing", reliability: "Medium" },
];

const SourcesPage = () => {
  const { data } = useSparkData();
  const metrics = data?.metrics;

  return (
    <div className="container max-w-4xl py-10">
      <SeoHead
        title="Source Registry — Big Data Intelligence Hub"
        description="Which sources feed the intelligence pipeline, what they cover and how reliable they are."
        path="/sources"
        noindex
      />
      <div className="flex items-center gap-2 text-primary">
        <Database className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wide">Transparency</span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Source registry</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Every insight in this app traces back to one of these sources. Release-note feeds are
        excluded deliberately — the pipeline favours analysis over announcements.
      </p>

      {metrics && (
        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-4">
          {[
            ["Fetched", metrics.articles_fetched],
            ["After filter", metrics.articles_after_filter],
            ["Duplicates removed", metrics.duplicates_removed],
            ["Run time", `${Math.round(metrics.processing_time_ms / 100) / 10}s`],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 space-y-3">
        {SOURCES.map((s) => (
          <div key={s.name} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">{s.name}</h2>
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {s.reliability} reliability
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.vendor}</p>
            <p className="mt-2 text-sm text-secondary-foreground">{s.focus}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcesPage;

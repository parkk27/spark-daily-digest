import SeoHead from "@/components/SeoHead";

const AboutPage = () => (
  <div className="container max-w-3xl py-14">
    <SeoHead
      title="About — Big Data Intelligence Hub"
      description="Why Big Data Intelligence Hub exists: one signal-dense briefing on the modern data ecosystem for technical leaders."
      path="/about"
    />
    <h1 className="text-3xl font-semibold tracking-tight text-foreground">About</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Executive Intelligence for the Modern Data Ecosystem
    </p>

    <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary-foreground">
      <p>
        The data platform landscape moves faster than any single person can track. Vendors ship
        weekly, open-source projects reshape architectures quarterly, and most of the signal is
        buried in engineering blogs written for practitioners rather than decision makers.
      </p>
      <p>
        Big Data Intelligence Hub reads that landscape for you. An automated pipeline ingests public
        vendor and open-source engineering blogs, filters out release notes and marketing, scores
        what remains for strategic relevance, and summarises it from the perspective of a senior data
        platform leader.
      </p>
      <h2 className="pt-2 text-base font-semibold text-foreground">What we cover</h2>
      <p>
        Apache Spark, Iceberg, Delta Lake, Kafka, Flink, Trino, ClickHouse, DuckDB, Databricks,
        Snowflake, BigQuery, Microsoft Fabric, AWS EMR and the surrounding ecosystem.
      </p>
      <h2 className="pt-2 text-base font-semibold text-foreground">What we do not do</h2>
      <p>
        We use public information only. No proprietary data is collected, scraped from private
        systems, or resold.
      </p>
    </div>
  </div>
);

export default AboutPage;

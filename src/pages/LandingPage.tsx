import { Link } from "react-router-dom";
import { ArrowRight, Zap, Newspaper, TrendingUp, Sparkles, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoHead from "@/components/SeoHead";

const FEATURES = [
  { icon: Newspaper, title: "Daily executive brief", body: "One curated read across the big data ecosystem — analysis, not release notes." },
  { icon: TrendingUp, title: "Trend momentum", body: "See which technologies and vendors are accelerating, emerging or fading." },
  { icon: Sparkles, title: "AI copilot", body: "Ask what changed, why it matters, and what to evaluate next." },
  { icon: Mail, title: "Digest delivery", body: "Daily or weekly briefings shaped around the topics you follow." },
  { icon: ShieldCheck, title: "Public sources only", body: "Vendor engineering blogs and open-source projects — no proprietary data." },
  { icon: Zap, title: "Refreshed continuously", body: "An automated pipeline ingests, filters, scores and summarises every few hours." },
];

const JOURNEY = [
  {
    title: "Read the brief",
    get: "The single biggest change in the ecosystem today.",
    act: "Decide whether it touches your roadmap this quarter.",
    to: "/preview",
    cta: "Open sample brief",
  },
  {
    title: "Check momentum",
    get: "Which topics are accelerating, emerging or fading.",
    act: "Pick the one or two themes worth tracking.",
    to: "/signup",
    cta: "Sign in for trends",
  },
  {
    title: "Open Compare",
    get: "Where Fabric Spark stands against Databricks, BigQuery, EMR and Snowflake.",
    act: "Find the capability gap that matters to your buyer.",
    to: "/preview/compare",
    cta: "See the workspace",
  },
  {
    title: "Work the radar",
    get: "Signals sorted into act now, watch and deprioritize.",
    act: "Log a decision with an owner and a review date.",
    to: "/preview/radar",
    cta: "See the radar",
  },
  {
    title: "Ask the copilot",
    get: "Grounded, cited answers across the ingested corpus.",
    act: "Arm product, sales or strategy with the narrative.",
    to: "/signup",
    cta: "Sign in to ask",
  },
];

const LandingPage = () => (
  <div className="relative overflow-hidden">
    <SeoHead
      title="Big Data Intelligence Hub — Executive Data Intelligence"
      description="Executive intelligence for the modern data ecosystem. Daily briefings, trend momentum and an AI copilot across Spark, Iceberg, Snowflake, BigQuery, Kafka and more."
      path="/"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,hsl(var(--primary)/0.16),transparent_70%)]"
    />

    <section className="container relative max-w-3xl py-20 text-center sm:py-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Prepared by Kunal Parekh
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Updated continuously
      </span>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Big Data Intelligence Hub
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Executive Intelligence for the Modern Data Ecosystem
      </p>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-secondary-foreground">
        Stop reading fifty engineering blogs. Get one signal-dense briefing on what changed across
        the data platform landscape, why it matters, and what to do about it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="gap-1.5">
          <Link to="/preview">
            See today's brief <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/signup">Create free account</Link>
        </Button>
      </div>
    </section>


    <section className="container relative pb-24">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-5">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card/60 p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Ready when you are</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in to unlock the dashboard, news feed, trend intelligence and the copilot.
        </p>
        <Button asChild className="mt-5 gap-1.5">
          <Link to="/signup">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  </div>
);

export default LandingPage;

import {
  Building2,
  Lightbulb,
  Newspaper,
  Radar,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const AUTH_STATS = [
  { value: "50+", label: "Trusted Sources" },
  { value: "500+", label: "Articles Processed" },
  { value: "20+", label: "Technologies Tracked" },
  { value: "Daily", label: "Executive Briefings" },
];

const CAPABILITIES: {
  icon: LucideIcon;
  title: string;
  body: string;
  items?: string[];
}[] = [
  {
    icon: Newspaper,
    title: "Daily Intelligence",
    body: "Receive executive summaries of the latest ecosystem developments.",
  },
  {
    icon: TrendingUp,
    title: "Technology Trends",
    body: "Track Spark, Iceberg, Delta Lake, Fabric, BigQuery, EMR and more.",
  },
  {
    icon: Building2,
    title: "Vendor Intelligence",
    body: "Monitor innovations across:",
    items: ["Microsoft Fabric", "Databricks", "AWS EMR", "Google Cloud", "Apache Foundation"],
  },
  {
    icon: Sparkles,
    title: "AI Copilot",
    body: "Ask natural language questions about ecosystem trends, vendor strategies, and technology evolution.",
  },
  {
    icon: Radar,
    title: "Trend Detection",
    body: "Identify emerging technologies before they become mainstream.",
  },
  {
    icon: Lightbulb,
    title: "Strategic Insights",
    body: "Understand not only what changed, but why it matters.",
  },
];

const AUDIENCE = [
  "Product Managers",
  "Platform Engineers",
  "Solution Architects",
  "Data Leaders",
  "Cloud Engineers",
];

const AuthStoryPanel = () => (
  <section className="animate-fade-in space-y-10" aria-label="About Big Data Intelligence Hub">
    <header className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
          <Zap className="h-5 w-5 text-primary" />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Big Data Intelligence Hub
        </h1>
      </div>
      <p className="max-w-2xl text-base text-secondary-foreground sm:text-lg">
        AI-powered intelligence platform for the modern data ecosystem. Monitor, analyze and
        understand the latest innovations across Spark, Lakehouse technologies, and cloud data
        platforms from one unified workspace.
      </p>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Big Data Intelligence Hub continuously aggregates and analyzes updates from leading big data
        vendors to provide concise executive insights, technology trends, and strategic
        recommendations. Instead of reading dozens of blogs every day, receive a single source of
        truth for the modern data platform ecosystem.
      </p>
    </header>

    <div className="grid gap-3 sm:grid-cols-2">
      {CAPABILITIES.map(({ icon: Icon, title, body, items }) => (
        <article
          key={title}
          className="rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
          {items && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>

    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {AUTH_STATS.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-center backdrop-blur"
        >
          <dt className="sr-only">{stat.label}</dt>
          <dd>
            <span className="block text-2xl font-semibold text-gradient">{stat.value}</span>
            <span className="mt-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>

    <blockquote className="rounded-xl border border-primary/25 bg-primary/10 p-5 text-sm leading-relaxed text-secondary-foreground">
      “Start every morning with a curated executive briefing instead of scanning multiple vendor
      blogs.”
    </blockquote>

    <footer className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-6">
      <span className="text-xs text-muted-foreground">Built for</span>
      {AUDIENCE.map((role) => (
        <span
          key={role}
          className="rounded-full border border-border/70 bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground"
        >
          {role}
        </span>
      ))}
    </footer>
  </section>
);

export default AuthStoryPanel;

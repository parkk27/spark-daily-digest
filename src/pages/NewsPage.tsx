import { ExternalLink, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import SourceBadge from "@/components/SourceBadge";
import { useSparkData } from "@/hooks/useSparkData";
import { useWatchlist } from "@/hooks/usePersonalization";
import { useAuth } from "@/hooks/useAuth";
import SeoHead from "@/components/SeoHead";

const NewsPage = () => {
  const { data, isLoading } = useSparkData();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const articles = data?.allArticles ?? [];

  const topics = user ? watchlist.data ?? [] : [];
  const pinned = topics.length
    ? articles.filter((a) => {
        const hay = `${a.title} ${a.summary} ${a.tags.join(" ")}`.toLowerCase();
        return topics.some((t) => hay.includes(t));
      })
    : [];

  const grouped = articles.reduce<Record<string, typeof articles>>((acc, article) => {
    const d = article.date ?? "unknown";
    (acc[d] ??= []).push(article);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="container max-w-4xl py-8">
      <SeoHead
        title="News Feed — Big Data Intelligence Hub"
        description="Latest news from Databricks, Apache Spark, Iceberg, Delta Lake, Microsoft Fabric, AWS EMR, and Google BigQuery — refreshed daily."
        path="/news"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Big Data News Feed",
          url: "https://bigdata-hub.lovable.app/news",
          description: "Curated daily news from the big data ecosystem.",
        }}
      />
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground opacity-0 animate-fade-in">
        News Feed
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fresh articles in the last 10 days. The next scrape runs every 6 hours.
        </p>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date, di) => (
            <section key={date} className="opacity-0 animate-fade-in" style={{ animationDelay: `${di * 100}ms` }}>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                {date !== "unknown" ? format(parseISO(date), "EEEE, MMMM d, yyyy") : "Recent"}
              </h2>
              <div className="space-y-3">
                {grouped[date].map((article, i) => (
                  <a
                    key={i}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-secondary/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <SourceBadge source={article.source} />
                        {article.tags.map((tag) => (
                          <span key={tag} className="text-xs text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="mb-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-secondary-foreground line-clamp-2">
                        {article.summary}
                      </p>
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;

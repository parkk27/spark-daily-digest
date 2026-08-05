import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { useBookmarks, useBookmarkMutations } from "@/hooks/useBookmarks";

const BookmarksPage = () => {
  const { data = [], isLoading } = useBookmarks();
  const { remove } = useBookmarkMutations();

  return (
    <div className="container max-w-4xl py-10">
      <SeoHead
        title="Bookmarks — Big Data Intelligence Hub"
        description="Your saved articles, benchmarks and recommendations."
        path="/bookmarks"
        noindex
      />
      <div className="flex items-center gap-2 text-primary">
        <Bookmark className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wide">Saved</span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Bookmarks</h1>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />)
        ) : data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing saved yet — use the bookmark icon on articles, benchmarks or recommendations.
          </p>
        ) : (
          data.map((b) => (
            <div
              key={b.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {b.kind}
                  {b.source ? ` · ${b.source}` : ""}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{b.title}</p>
              </div>
              {b.url && (
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-muted-foreground hover:text-primary"
                  aria-label="Open source"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => remove.mutate(b.ref_id)}
                aria-label="Remove bookmark"
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;

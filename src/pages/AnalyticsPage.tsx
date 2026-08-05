import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdmin";

interface EventRow {
  event: string;
  target: string | null;
  created_at: string;
}

const AnalyticsPage = () => {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data = [], isLoading } = useQuery({
    queryKey: ["analytics-events"],
    enabled: isAdmin,
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event, target, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = data.reduce<Record<string, number>>((acc, r) => {
    acc[r.event] = (acc[r.event] ?? 0) + 1;
    return acc;
  }, {});

  if (adminLoading) return <div className="container py-12 text-sm text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Usage analytics are restricted to workspace administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <SeoHead
        title="Usage Analytics — Big Data Intelligence Hub"
        description="Internal usage analytics for the intelligence platform."
        path="/analytics"
        noindex
      />
      <div className="flex items-center gap-2 text-primary">
        <BarChart3 className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wide">Internal</span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Usage analytics</h1>

      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-lg bg-card" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {Object.entries(counts).map(([event, count]) => (
              <div key={event} className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{event}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{count}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold text-foreground">Recent events</h2>
          <div className="mt-3 space-y-1.5">
            {data.slice(0, 50).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{r.event}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.target}</span>
                <span className="text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;

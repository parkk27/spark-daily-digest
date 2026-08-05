import { useMemo, useState } from "react";
import { Radar, Loader2 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import EvidencePopover from "@/components/EvidencePopover";
import BookmarkButton from "@/components/BookmarkButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRecommendations,
  useRecommendationStatus,
  SECTION_LABELS,
  type RecommendationSection,
} from "@/hooks/useRecommendations";
import { useProfile, ROLE_FOCUS_LABELS } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const SECTIONS: RecommendationSection[] = ["act_now", "watch", "deprioritize"];
const STATUSES = ["open", "in_progress", "done", "dismissed"];
const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  dismissed: "Dismissed",
};

const ActionRadarPage = () => {
  const { data: recommendations = [], isLoading } = useRecommendations();
  const { statuses, setStatus } = useRecommendationStatus();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [mineOnly, setMineOnly] = useState(false);
  const [generating, setGenerating] = useState(false);

  const focus = profile?.role_focus ?? "product";
  const visible = useMemo(
    () => (mineOnly ? recommendations.filter((r) => r.owner === focus) : recommendations),
    [recommendations, mineOnly, focus]
  );

  const generate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-recommendations");
    setGenerating(false);
    if (error || !data?.success) {
      toast.error("Could not refresh the radar");
      return;
    }
    toast.success(`Radar refreshed — ${data.count} recommendations`);
    qc.invalidateQueries({ queryKey: ["recommendations"] });
  };

  return (
    <div className="container max-w-5xl py-10">
      <SeoHead
        title="Action Radar — Big Data Intelligence Hub"
        description="Prioritized, owner-assigned recommendations derived from today's big data ecosystem signals."
        path="/radar"
        noindex
      />

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Radar className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">Action radar</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            What to act on next
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every ingested signal scored, prioritized and assigned an owner — so intelligence turns
            into decisions instead of reading.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={mineOnly}
            onClick={() => setMineOnly((v) => !v)}
          >
            {mineOnly ? `Showing ${ROLE_FOCUS_LABELS[focus]}` : "Filter to my role"}
          </Button>
          <Button size="sm" onClick={generate} disabled={generating}>
            {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Refresh radar
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No recommendations yet. Use “Refresh radar” to score today's signals.
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const rows = visible.filter((r) => r.section === section);
            if (!rows.length) return null;
            return (
              <section key={section}>
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  {SECTION_LABELS[section]}{" "}
                  <span className="font-normal text-muted-foreground">({rows.length})</span>
                </h2>
                <div className="space-y-3">
                  {rows.map((r) => {
                    const status = statuses[r.id] ?? "open";
                    return (
                      <article
                        key={r.id}
                        className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                          <BookmarkButton
                            kind="recommendation"
                            refId={r.id}
                            title={r.title}
                            source={r.related_vendor}
                          />
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
                          {r.summary}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="rounded-md border border-border px-2 py-0.5 capitalize">
                            {r.priority} priority
                          </span>
                          <span className="capitalize">Owner: {r.owner}</span>
                          <EvidencePopover
                            confidence={r.confidence}
                            evidence={Array.isArray(r.evidence) ? (r.evidence as string[]) : []}
                            why={r.rationale ?? undefined}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus.mutate({ id: r.id, status: s })}
                              aria-pressed={status === s}
                              className={cn(
                                "rounded-md border px-2 py-1 text-xs transition-colors",
                                status === s
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-secondary/50"
                              )}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionRadarPage;

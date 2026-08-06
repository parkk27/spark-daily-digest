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
import SurfaceCard from "@/components/ui/surface-card";
import MetaChip from "@/components/ui/meta-chip";
import EmptyState from "@/components/ui/empty-state";
import SkeletonCard from "@/components/ui/skeleton-card";


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
            <span className="eyebrow">Action radar</span>
          </div>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
            What to act on next
          </h1>
          <p className="measure mt-2 text-sm text-muted-foreground">
            Every ingested signal scored, prioritized and assigned an owner — a decision surface for
            product, sales and GTM, benchmarked from the Microsoft Fabric Spark perspective.
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
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No recommendations yet"
          description={
            mineOnly
              ? "Nothing is assigned to your role right now. Clear the filter or refresh the radar."
              : "Use “Refresh radar” to score today's signals into prioritized, owner-assigned actions."
          }
          action={
            <Button size="sm" onClick={generate} disabled={generating}>
              {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Refresh radar
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const rows = visible.filter((r) => r.section === section);
            if (!rows.length) return null;
            const actNow = section === "act_now";
            return (
              <section key={section}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {SECTION_LABELS[section]}
                  </h2>
                  <span className="rounded-md border border-border bg-surface-3 px-1.5 py-0.5 text-xs text-muted-foreground">
                    {rows.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {rows.map((r) => {
                    const status = statuses[r.id] ?? "open";
                    return (
                      <SurfaceCard
                        key={r.id}
                        as="article"
                        interactive
                        accent={actNow}
                        raised={actNow}
                        className="p-5"
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
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <MetaChip
                            label="Priority"
                            value={<span className="capitalize">{r.priority}</span>}
                            tone={r.priority === "high" ? "declining" : "neutral"}
                          />
                          <MetaChip label="Confidence" value={`${r.confidence}%`} />
                          <MetaChip
                            label="Owner"
                            value={<span className="capitalize">{r.owner}</span>}
                          />
                          {r.due_date && (
                            <MetaChip
                              label="Due"
                              value={new Date(r.due_date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            />
                          )}
                          <EvidencePopover
                            confidence={r.confidence}
                            evidence={Array.isArray(r.evidence) ? (r.evidence as string[]) : []}
                            why={r.rationale ?? undefined}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus.mutate({ id: r.id, status: s })}
                              aria-pressed={status === s}
                              className={cn(
                                "rounded-md border px-2 py-1 text-xs transition-colors",
                                status === s
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-surface-3"
                              )}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </SurfaceCard>
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

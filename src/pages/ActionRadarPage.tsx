import { useEffect, useMemo, useState } from "react";
import { Radar, Loader2 } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import DecisionWorkspace from "@/components/DecisionWorkspace";
import CompleteActionDialog from "@/components/radar/CompleteActionDialog";
import RadarCard from "@/components/radar/RadarCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRecommendations, useDecisionRecords } from "@/hooks/useRecommendations";
import { signalIdOf } from "@/lib/signalIdentity";
import { useProfile, ROLE_FOCUS_LABELS } from "@/hooks/useProfile";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import SurfaceCard from "@/components/ui/surface-card";
import EmptyState from "@/components/ui/empty-state";
import SkeletonCard from "@/components/ui/skeleton-card";
import { cn } from "@/lib/utils";
import {
  LANES,
  LANE_EMPTY,
  LANE_LABELS,
  OUR_PLATFORM_LABEL,
  emergingThemes,
  isReviewDue,
  laneOf,
  significanceOf,
  type Lane,
} from "@/lib/radarLifecycle";

interface RefreshDelta {
  at: number;
  created: number | null;
  changed: number | null;
  unchanged: number | null;
  escalated: number | null;
}

const ActionRadarPage = () => {
  const { data: recommendations = [], isLoading } = useRecommendations();
  const { decisions } = useDecisionRecords();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const track = useTrackEvent();
  const [mineOnly, setMineOnly] = useState(false);
  const [lane, setLane] = useState<Lane | "all">("all");
  const [reviewsDueOnly, setReviewsDueOnly] = useState(false);
  const [workspaceFor, setWorkspaceFor] = useState<{
    id: string;
    signalKey: string;
    title: string;
    context: React.ReactNode;
  } | null>(null);
  const [completeFor, setCompleteFor] = useState<{ signalKey: string; title: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [delta, setDelta] = useState<RefreshDelta | null>(null);

  const focus = profile?.role_focus ?? "product";

  useEffect(() => {
    track("radar_view");
  }, [track]);

  /** Every signal with its derived lifecycle lane. */
  const laned = useMemo(
    () =>
      recommendations.map((r) => {
        const decision = decisions[signalIdOf(r)];
        return { r, decision, lane: laneOf(r, decision) };
      }),
    [recommendations, decisions]
  );

  const roleScoped = useMemo(
    () => laned.filter((x) => (mineOnly ? x.r.owner === focus : true)),
    [laned, mineOnly, focus]
  );

  const counts = useMemo(() => {
    const base: Record<Lane, number> = {
      act_now: 0,
      needs_review: 0,
      tracking: 0,
      action_in_progress: 0,
      completed: 0,
    };
    for (const x of roleScoped) base[x.lane] += 1;
    const reviewsDue = roleScoped.filter((x) => isReviewDue(x.decision)).length;
    return { ...base, reviewsDue, total: roleScoped.length };
  }, [roleScoped]);

  const visible = useMemo(
    () =>
      roleScoped
        .filter((x) => (lane === "all" ? true : x.lane === lane))
        .filter((x) => (reviewsDueOnly ? isReviewDue(x.decision) : true)),
    [roleScoped, lane, reviewsDueOnly]
  );

  const themes = useMemo(() => emergingThemes(roleScoped.map((x) => x.r)), [roleScoped]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    track("radar_refresh");
    const { data, error } = await supabase.functions.invoke("generate-recommendations");
    setGenerating(false);
    if (error || !data?.success) {
      toast.error("Could not refresh the radar");
      return;
    }
    setDelta({
      at: Date.now(),
      created: typeof data.delta?.created === "number" ? data.delta.created : null,
      changed: typeof data.delta?.changed === "number" ? data.delta.changed : null,
      unchanged: typeof data.delta?.unchanged === "number" ? data.delta.unchanged : null,
      escalated: typeof data.delta?.escalated === "number" ? data.delta.escalated : null,
    });
    toast.success("Radar re-evaluated", {
      description: `${data.count} signals scored against the latest ingestion.`,
    });
    qc.invalidateQueries({ queryKey: ["recommendations"] });
  };

  const openWorkspace = (item: (typeof laned)[number]) => {
    track("radar_item_reviewed", item.r.id);
    setWorkspaceFor({
      id: item.r.id,
      signalKey: signalIdOf(item.r),
      title: item.r.title,
      context: (
        <>
          <p>{item.r.summary}</p>
          <p className="mt-1.5">{significanceOf(item.r)}</p>
        </>
      ),
    });
  };

  const summaryStats: { label: string; value: number; lane?: Lane }[] = [
    { label: "Act now", value: counts.act_now, lane: "act_now" },
    { label: "Need review", value: counts.needs_review, lane: "needs_review" },
    { label: "Tracking", value: counts.tracking, lane: "tracking" },
    { label: "Actions in progress", value: counts.action_in_progress, lane: "action_in_progress" },
    { label: "Reviews due", value: counts.reviewsDue },
  ];

  const completeRecord = completeFor ? decisions[completeFor.signalKey] : undefined;

  return (
    <div className="container max-w-5xl py-10">
      <SeoHead
        title="Action Radar — Big Data Intelligence Hub"
        description="What changed, why it matters to Microsoft Fabric, what needs review and which action follows."
        path="/radar"
        noindex
      />

      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Radar className="h-5 w-5" />
              <span className="eyebrow">Action radar</span>
            </div>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
              Your attention this week
            </h1>
            <p className="measure mt-2 text-sm text-muted-foreground">
              Signals scored from the {OUR_PLATFORM_LABEL} perspective, tracked through review,
              decision, action and outcome. {counts.total} signals in scope.
            </p>
          </div>
          <Button size="sm" onClick={generate} disabled={generating}>
            {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Refresh radar
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summaryStats.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                if (s.lane) {
                  setReviewsDueOnly(false);
                  setLane((v) => (v === s.lane ? "all" : s.lane!));
                  track("radar_filter_status", s.lane);
                } else {
                  setLane("all");
                  setReviewsDueOnly((v) => !v);
                  track("radar_filter_status", "reviews_due");
                }
              }}
              aria-pressed={s.lane ? lane === s.lane : reviewsDueOnly}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                (s.lane ? lane === s.lane : reviewsDueOnly)
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-surface-2 hover:bg-surface-3"
              )}
            >
              <span className="block text-lg font-semibold text-foreground">{s.value}</span>
              <span className="block text-xs text-muted-foreground">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={mineOnly}
            onClick={() => {
              setMineOnly((v) => !v);
              track("radar_filter_role", focus);
            }}
          >
            {mineOnly ? `Showing ${ROLE_FOCUS_LABELS[focus]}` : "Filter to my role"}
          </Button>
          {(lane !== "all" || reviewsDueOnly) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLane("all");
                setReviewsDueOnly(false);
              }}
            >
              Clear lane filter
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {delta
              ? `Radar updated ${Math.max(
                  1,
                  Math.round((Date.now() - delta.at) / 60000)
                )} min ago · New: ${delta.created ?? "unavailable"} · Changed: ${
                  delta.changed ?? "unavailable"
                } · Escalated: ${delta.escalated ?? "unavailable"} · Unchanged: ${
                  delta.unchanged ?? "unavailable"
                } · Resolved: ${counts.completed}`
              : "Refresh delta unavailable until the radar is re-evaluated."}
          </p>
        </div>

        {mineOnly && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide text-foreground">
              {ROLE_FOCUS_LABELS[focus]}
            </span>{" "}
            — {counts.total} relevant signals · {counts.act_now} act now · {counts.needs_review}{" "}
            needs review · {counts.tracking} tracking · {counts.action_in_progress} in progress ·{" "}
            {counts.completed} completed
          </p>
        )}
      </header>

      {themes.length > 0 && (
        <SurfaceCard className="mb-6 p-4">
          <p className="eyebrow text-muted-foreground">Emerging themes</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {themes.map((t) => (
              <div key={t.theme} className="rounded-md border border-border/60 p-3">
                <p className="text-sm font-medium text-foreground">{t.theme}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.count} signals ·{" "}
                  {t.vendors
                    .slice(0, 4)
                    .map((v) => `${v.name}: ${v.count}`)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(lane === "all" ? LANES : [lane]).map((l) => {
            const rows = visible.filter((x) => x.lane === l);
            if (lane === "all" && rows.length === 0 && l !== "act_now" && l !== "needs_review")
              return null;
            return (
              <section key={l}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">{LANE_LABELS[l]}</h2>
                  <span className="rounded-md border border-border bg-surface-3 px-1.5 py-0.5 text-xs text-muted-foreground">
                    {rows.length}
                  </span>
                </div>
                {rows.length === 0 ? (
                  <EmptyState icon={Radar} title={LANE_EMPTY[l]} />
                ) : (
                  <div className="space-y-3">
                    {rows.map((x) => (
                      <RadarCard
                        key={x.r.id}
                        recommendation={x.r}
                        decision={x.decision}
                        lane={x.lane}
                        roleFocus={focus}
                        onReview={() => openWorkspace(x)}
                        onCompleteAction={() =>
                          setCompleteFor({ signalKey: signalIdOf(x.r), title: x.r.title })
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {workspaceFor && (
        <DecisionWorkspace
          open={!!workspaceFor}
          onOpenChange={(o) => !o && setWorkspaceFor(null)}
          recommendationId={workspaceFor.id}
          signalKey={workspaceFor.signalKey}
          signalTitle={workspaceFor.title}
          reviewContext={workspaceFor.context}
          existing={decisions[workspaceFor.signalKey] ?? decisions[workspaceFor.id]}
        />
      )}

      {completeFor && completeRecord && (
        <CompleteActionDialog
          open={!!completeFor}
          onOpenChange={(o) => !o && setCompleteFor(null)}
          record={completeRecord}
          signalTitle={completeFor.title}
          onCompleted={() => track("action_completed", completeFor.signalKey)}
        />
      )}
    </div>
  );
};

export default ActionRadarPage;

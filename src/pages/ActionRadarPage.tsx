import { useMemo, useState } from "react";
import { Radar, Loader2, ArrowUp, AlertTriangle, Minus } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import EvidencePopover from "@/components/EvidencePopover";
import BookmarkButton from "@/components/BookmarkButton";
import DecisionWorkspace from "@/components/DecisionWorkspace";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRecommendations,
  useDecisionRecords,
  DECISION_LABELS,
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

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  competitive: "Competitive",
  customer: "Customer",
  technology: "Technology",
  market: "Market",
  commercial: "Commercial",
  regulatory: "Regulatory",
  ecosystem: "Ecosystem",
};

const PolarityIcon = ({ polarity }: { polarity: string }) => {
  if (polarity === "opportunity")
    return <ArrowUp className="h-3.5 w-3.5 text-growing" aria-label="Opportunity" />;
  if (polarity === "threat")
    return <AlertTriangle className="h-3.5 w-3.5 text-declining" aria-label="Threat" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-label="Neutral" />;
};

const ActionRadarPage = () => {
  const { data: recommendations = [], isLoading } = useRecommendations();
  const { decisions } = useDecisionRecords();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [mineOnly, setMineOnly] = useState(false);
  const [decidedOnly, setDecidedOnly] = useState(false);
  const [workspaceFor, setWorkspaceFor] = useState<{ id: string; title: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const focus = profile?.role_focus ?? "product";
  const visible = useMemo(
    () =>
      recommendations
        .filter((r) => (mineOnly ? r.owner === focus : true))
        .filter((r) => (decidedOnly ? !!decisions[r.id] : true)),
    [recommendations, mineOnly, focus, decidedOnly, decisions]
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
          <Button
            variant="outline"
            size="sm"
            aria-pressed={decidedOnly}
            onClick={() => setDecidedOnly((v) => !v)}
          >
            My decisions
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
                    const decision = decisions[r.id];
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
                            label="Signal"
                            value={
                              <span className="inline-flex items-center gap-1">
                                <PolarityIcon polarity={r.polarity} />
                                {SIGNAL_TYPE_LABELS[r.signal_type] ?? r.signal_type}
                              </span>
                            }
                          />
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
                            breakdown={r.score_breakdown ?? undefined}
                          />
                        </div>
                        <div className="mt-4 border-t border-border-subtle pt-3">
                          {decision ? (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="font-medium text-primary">
                                {DECISION_LABELS[decision.decision]}
                              </span>
                              {decision.reason && (
                                <span className="text-muted-foreground">{decision.reason}</span>
                              )}
                              {decision.review_date && (
                                <span className="text-muted-foreground">
                                  Review{" "}
                                  {new Date(decision.review_date).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                              <button
                                onClick={() => setWorkspaceFor({ id: r.id, title: r.title })}
                                className="ml-auto text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                              >
                                Change decision
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setWorkspaceFor({ id: r.id, title: r.title })}
                            >
                              Take action
                            </Button>
                          )}
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

      {workspaceFor && (
        <DecisionWorkspace
          open={!!workspaceFor}
          onOpenChange={(o) => !o && setWorkspaceFor(null)}
          recommendationId={workspaceFor.id}
          signalTitle={workspaceFor.title}
          existing={decisions[workspaceFor.id]}
        />
      )}
    </div>
  );
};

export default ActionRadarPage;

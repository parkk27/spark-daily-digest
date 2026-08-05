import { Link } from "react-router-dom";
import { Radar, Lock } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import PreviewBanner from "@/components/PreviewBanner";
import EvidencePopover from "@/components/EvidencePopover";
import { Button } from "@/components/ui/button";
import { SECTION_LABELS, type RecommendationSection } from "@/hooks/useRecommendations";
import { SAMPLE_RECOMMENDATIONS } from "@/data/sampleData";

const SECTIONS: RecommendationSection[] = ["act_now", "watch", "deprioritize"];
const STATUSES = ["Open", "In progress", "Done", "Dismissed"];

const PreviewRadarPage = () => (
  <>
    <SeoHead
      title="Sample Action Radar — Big Data Intelligence Hub"
      description="An example of prioritized, owner-assigned recommendations derived from big data ecosystem signals: what to act on now, what to watch, and what to deprioritize."
      path="/preview/radar"
    />
    <PreviewBanner />
    <div className="container max-w-5xl py-10">
      <header className="mb-6">
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
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" aria-hidden="true" />
          Sign in to manage your own radar
        </p>
        <Button asChild size="sm">
          <Link to="/signin">Sign in</Link>
        </Button>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const rows = SAMPLE_RECOMMENDATIONS.filter((r) => r.section === section);
          if (!rows.length) return null;
          return (
            <section key={section}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                {SECTION_LABELS[section]}{" "}
                <span className="font-normal text-muted-foreground">({rows.length})</span>
              </h2>
              <div className="space-y-3">
                {rows.map((r) => (
                  <article key={r.id} className="rounded-lg border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
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
                        evidence={r.evidence as string[]}
                        why={r.rationale ?? undefined}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled
                          className="cursor-not-allowed rounded-md border border-border px-2 py-1 text-xs text-muted-foreground opacity-60"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  </>
);

export default PreviewRadarPage;

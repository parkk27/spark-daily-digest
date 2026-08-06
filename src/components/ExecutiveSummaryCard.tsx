import { Compass, Newspaper, BarChart3, Radar, Sparkles, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ExecutiveIntelligence } from "@/lib/executive";
import EvidencePopover from "@/components/EvidencePopover";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ROWS: { key: keyof ExecutiveIntelligence; label: string }[] = [
  { key: "mostImportantChange", label: "Most important ecosystem change" },
  { key: "topOpportunity", label: "Top opportunity" },
  { key: "topCompetitiveRisk", label: "Highest competitive risk" },
  { key: "highestPriorityAction", label: "Recommended immediate action" },
  { key: "innovationLeader", label: "Current innovation leader" },
  { key: "marketDirection", label: "Market direction" },
  { key: "strategicOutlook", label: "Strategic outlook" },
];

const ContextItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-xs leading-relaxed text-foreground">{value}</p>
  </div>
);

const ExecutiveSummaryCard = ({ intel }: { intel: ExecutiveIntelligence }) => {
  const navigate = useNavigate();

  const stub = (what: string) =>
    toast({ title: `${what} coming soon`, description: "This action is not wired up yet." });

  return (
    <section
      data-tour="executive-intelligence"
      className="rounded-lg border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="h-4 w-4" />
          <h2 className="text-xs font-medium uppercase tracking-wide">Executive intelligence</h2>
        </div>
        <EvidencePopover
          title="How this summary was built"
          confidence={intel.confidence}
          evidence={intel.evidence}
          why="Derived deterministically from today's ingested articles and tracked topic momentum — no free-form speculation."
        />
      </div>

      <div className="mb-6 grid gap-4 rounded-md border border-border/60 bg-secondary/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <ContextItem label="Perspective" value={intel.perspective} />
        <ContextItem label="Benchmarked against" value={intel.benchmarkVendors.join(", ")} />
        <ContextItem label="Analysis window" value={intel.analysisWindowLabel} />
        <ContextItem
          label="Sources / freshness"
          value={`${intel.sourceCount} sources · updated ${intel.lastRefreshedLabel} · ${intel.confidence}% confidence`}
        />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {ROWS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground">{intel[key] as string}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button variant="secondary" size="sm" onClick={() => navigate("/news")}>
          <Newspaper className="mr-1.5 h-3.5 w-3.5" /> Supporting articles
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate("/compare")}>
          <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Competitive comparison
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate("/radar")}>
          <Radar className="mr-1.5 h-3.5 w-3.5" /> Action radar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate("/copilot")}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask copilot
        </Button>
        <Button variant="ghost" size="sm" onClick={() => stub("Export brief")}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export brief
        </Button>
        <Button variant="ghost" size="sm" onClick={() => stub("Share")}>
          <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
        </Button>
      </div>
    </section>
  );
};

export default ExecutiveSummaryCard;

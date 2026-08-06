import {
  Compass,
  Newspaper,
  BarChart3,
  Radar,
  Sparkles,
  Download,
  Share2,
  AlertTriangle,
  Target,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ExecutiveIntelligence } from "@/lib/executive";
import EvidencePopover from "@/components/EvidencePopover";
import { Button } from "@/components/ui/button";
import MetaChip from "@/components/ui/meta-chip";
import SurfaceCard from "@/components/ui/surface-card";
import { toast } from "@/hooks/use-toast";

const LEAD_ROWS: {
  key: keyof ExecutiveIntelligence;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "mostImportantChange", label: "Most important ecosystem change", icon: Zap },
  { key: "topOpportunity", label: "Top opportunity", icon: Target },
  { key: "topCompetitiveRisk", label: "Highest competitive risk", icon: AlertTriangle },
];

const SECONDARY_ROWS: { key: keyof ExecutiveIntelligence; label: string }[] = [
  { key: "highestPriorityAction", label: "Recommended immediate action" },
  { key: "innovationLeader", label: "Current innovation leader" },
  { key: "marketDirection", label: "Market direction" },
  { key: "strategicOutlook", label: "Strategic outlook" },
];

const ExecutiveSummaryCard = ({ intel }: { intel: ExecutiveIntelligence }) => {
  const navigate = useNavigate();

  const stub = (what: string) =>
    toast({ title: `${what} coming soon`, description: "This action is not wired up yet." });

  return (
    <SurfaceCard
      as="section"
      raised
      data-tour="executive-intelligence"
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-6 py-5">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="eyebrow">Executive intelligence</span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold text-foreground">
            Where the ecosystem moved, seen from {intel.perspective}
          </h2>
        </div>
        <EvidencePopover
          title="How this summary was built"
          confidence={intel.confidence}
          evidence={intel.evidence}
          why="Derived deterministically from today's ingested articles and tracked topic momentum — no free-form speculation."
        />
      </div>

      <div
        data-tour="benchmark-context"
        className="flex flex-wrap gap-2 border-b border-border-subtle bg-surface-1/40 px-6 py-4"
      >
        <MetaChip label="Perspective" value={intel.perspective} tone="primary" />
        <MetaChip label="Benchmarked against" value={intel.benchmarkVendors.join(" · ")} />
        <MetaChip label="Analysis window" value={intel.analysisWindowLabel} />
        <MetaChip label="Sources" value={intel.sourceCount} />
        <MetaChip label="Updated" value={intel.lastRefreshedLabel} />
        <MetaChip label="Confidence" value={`${intel.confidence}%`} />
      </div>

      <div className="grid gap-px bg-border-subtle sm:grid-cols-3">
        {LEAD_ROWS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="bg-surface-2 px-6 py-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <p className="eyebrow">{label}</p>
            </div>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground">
              {intel[key] as string}
            </p>
          </div>
        ))}
      </div>

      <dl className="grid gap-5 border-t border-border-subtle px-6 py-5 sm:grid-cols-2">
        {SECONDARY_ROWS.map(({ key, label }) => (
          <div key={key}>
            <dt className="eyebrow text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-secondary-foreground">
              {intel[key] as string}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-border-subtle bg-surface-1/40 px-6 py-4">
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
        <span className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => stub("Export brief")}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export brief
          </Button>
          <Button variant="ghost" size="sm" onClick={() => stub("Share")}>
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
        </span>
      </div>
    </SurfaceCard>
  );
};

export default ExecutiveSummaryCard;

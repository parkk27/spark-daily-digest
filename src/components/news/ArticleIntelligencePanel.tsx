import type { ArticleIntelligence } from "@/lib/decisionIntelligence";
import { OWNER_LABELS } from "@/lib/decisionIntelligence";
import EvidencePopover from "@/components/EvidencePopover";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<string, string> = {
  high: "text-status-growing",
  medium: "text-status-new",
  low: "text-muted-foreground",
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn("text-xs font-medium capitalize", LEVEL_CLASS[value])}>{value}</p>
  </div>
);

const ArticleIntelligencePanel = ({ intel }: { intel: ArticleIntelligence }) => (
  <div className="mt-3 rounded-md border border-border/70 bg-secondary/20 p-3">
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Importance {intel.importance}/10
      </span>
      <span className="text-xs text-muted-foreground">{intel.timeline}</span>
      <span className="text-xs text-muted-foreground">Owner: {OWNER_LABELS[intel.owner]}</span>
      <EvidencePopover confidence={intel.confidence} evidence={intel.evidence} why={intel.why} />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label="Strategic" value={intel.strategic_impact} />
      <Metric label="Customer" value={intel.customer_impact} />
      <Metric label="Complexity" value={intel.engineering_complexity} />
      <Metric label="Commercial" value={intel.commercial_impact} />
    </div>
    <p className="mt-3 text-xs leading-relaxed text-secondary-foreground">
      <span className="font-medium text-foreground">Next action: </span>
      {intel.next_action}
    </p>
  </div>
);

export default ArticleIntelligencePanel;

import { Compass } from "lucide-react";
import type { ExecutiveIntelligence } from "@/lib/executive";
import EvidencePopover from "@/components/EvidencePopover";

const ROWS: { key: keyof ExecutiveIntelligence; label: string }[] = [
  { key: "mostImportantChange", label: "Most important change" },
  { key: "topOpportunity", label: "Top opportunity" },
  { key: "topCompetitiveRisk", label: "Top competitive risk" },
  { key: "highestPriorityAction", label: "Highest-priority action" },
  { key: "vendorLeadingInnovation", label: "Vendor leading innovation" },
  { key: "marketDirection", label: "Market direction" },
  { key: "strategicOutlook", label: "Strategic outlook" },
];

const ExecutiveSummaryCard = ({ intel }: { intel: ExecutiveIntelligence }) => (
  <section className="rounded-lg border border-border bg-card p-6">
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
  </section>
);

export default ExecutiveSummaryCard;

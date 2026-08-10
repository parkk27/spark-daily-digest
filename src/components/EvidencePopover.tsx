import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  title?: string;
  confidence?: number;
  evidence: string[];
  why?: string;
  breakdown?: Record<string, number>;
}

const FACTOR_LABELS: Record<string, string> = {
  strategic_relevance: "Strategic relevance",
  customer_impact: "Customer impact",
  competitive_intensity: "Competitive intensity",
  momentum: "Momentum",
  evidence_confidence: "Evidence confidence",
  urgency: "Urgency",
};

/** Explainability surface: why a score exists and what backs it. */
const EvidencePopover = ({ title = "Why this score", confidence, evidence, why, breakdown }: Props) => (
  <Popover>
    <PopoverTrigger
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      aria-label={title}
    >
      <Info className="h-3.5 w-3.5" />
      Why
    </PopoverTrigger>
    <PopoverContent align="start" className="w-80 text-xs">
      <p className="font-semibold text-foreground">{title}</p>
      {typeof confidence === "number" && (
        <p className="mt-1 text-muted-foreground">Confidence: {confidence}%</p>
      )}
      {why && <p className="mt-2 leading-relaxed text-secondary-foreground">{why}</p>}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <dl className="mt-3 space-y-1 border-t border-border-subtle pt-2">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{FACTOR_LABELS[key] ?? key}</dt>
              <dd className="font-medium text-foreground">{Math.round(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <ul className="mt-2 space-y-1">
        {evidence.map((e) => (
          <li key={e} className="flex gap-2 text-muted-foreground">
            <span className="text-primary">·</span>
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </PopoverContent>
  </Popover>
);

export default EvidencePopover;

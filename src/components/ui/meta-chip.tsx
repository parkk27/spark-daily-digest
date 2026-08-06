import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "growing" | "stable" | "declining";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-surface-3 text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  growing: "border-status-growing/30 bg-status-growing/10 text-status-growing",
  stable: "border-status-stable/30 bg-status-stable/10 text-status-stable",
  declining: "border-status-declining/30 bg-status-declining/10 text-status-declining",
};

interface MetaChipProps {
  label?: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tone?: Tone;
  className?: string;
}

const MetaChip = ({ label, value, icon: Icon, tone = "neutral", className }: MetaChipProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
      TONES[tone],
      className
    )}
  >
    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
    {label && <span className="text-muted-foreground/80">{label}</span>}
    <span className="text-foreground/90">{value}</span>
  </span>
);

export default MetaChip;

import { cn } from "@/lib/utils";

const sourceColors: Record<string, string> = {
  Databricks: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Apache: "bg-red-500/15 text-red-400 border-red-500/30",
  Google: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Microsoft: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const SourceBadge = ({ source }: { source: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
      sourceColors[source] ?? "bg-secondary text-secondary-foreground border-border"
    )}
  >
    {source}
  </span>
);

export default SourceBadge;

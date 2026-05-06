import { cn } from "@/lib/utils";

const sourceColors: Record<string, string> = {
  databricks: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  apache: "bg-red-500/15 text-red-400 border-red-500/30",
  google: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  microsoft: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  aws: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "google-transform": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "google-next": "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const SourceBadge = ({ source }: { source: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
      sourceColors[source.toLowerCase()] ?? "bg-secondary text-secondary-foreground border-border"
    )}
  >
    {source}
  </span>
);

export default SourceBadge;

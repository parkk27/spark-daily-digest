import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

const statusStyles: Record<string, string> = {
  growing: "bg-status-growing/15 text-status-growing border-status-growing/30",
  new: "bg-status-new/15 text-status-new border-status-new/30",
  stable: "bg-status-stable/15 text-status-stable border-status-stable/30",
  declining: "bg-status-declining/15 text-status-declining border-status-declining/30",
};

const statusIcons: Record<string, React.ElementType> = {
  growing: TrendingUp,
  new: Sparkles,
  stable: Minus,
  declining: TrendingDown,
};

const StatusBadge = ({ status, change }: { status: string; change?: number }) => {
  const Icon = statusIcons[status.toLowerCase()];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status.toLowerCase()] ?? "bg-secondary text-secondary-foreground border-border"
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {status}
      {change !== undefined && change !== 0 && (
        <span className="ml-0.5 opacity-70">
          {change > 0 ? `+${change}` : change}
        </span>
      )}
    </span>
  );
};

export default StatusBadge;

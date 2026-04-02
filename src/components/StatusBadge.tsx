import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  growing: "bg-status-growing/15 text-status-growing border-status-growing/30",
  new: "bg-status-new/15 text-status-new border-status-new/30",
  stable: "bg-status-stable/15 text-status-stable border-status-stable/30",
  declining: "bg-status-declining/15 text-status-declining border-status-declining/30",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
      statusStyles[status.toLowerCase()] ?? "bg-secondary text-secondary-foreground border-border"
    )}
  >
    {status}
  </span>
);

export default StatusBadge;

import { cn } from "@/lib/utils";

type Status = "Growing" | "New" | "Stable" | "Declining";

const statusStyles: Record<Status, string> = {
  Growing: "bg-status-growing/15 text-status-growing border-status-growing/30",
  New: "bg-status-new/15 text-status-new border-status-new/30",
  Stable: "bg-status-stable/15 text-status-stable border-status-stable/30",
  Declining: "bg-status-declining/15 text-status-declining border-status-declining/30",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      statusStyles[status]
    )}
  >
    {status}
  </span>
);

export default StatusBadge;

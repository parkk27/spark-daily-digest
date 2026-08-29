import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  REMINDER_LABELS,
  activeReminders,
  dueReminders,
  reminderId,
  readDismissed,
  writeDismissed,
  type Reminder,
} from "@/lib/radarReminders";
import type { DecisionRecord, Recommendation } from "@/hooks/useRecommendations";

interface Props {
  recommendations: Recommendation[];
  decisions: Record<string, DecisionRecord>;
  onOpenSignal: (reminder: Reminder) => void;
}

/** In-app reminders for reviews and actions that have come due. No email involved. */
const NotificationsBell = ({ recommendations, decisions, onOpenSignal }: Props) => {
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed());
  const [open, setOpen] = useState(false);

  const reminders = useMemo(
    () => activeReminders(dueReminders(recommendations, decisions), dismissed),
    [recommendations, decisions, dismissed]
  );

  const dismiss = (r: Reminder) => {
    const next = [...dismissed, reminderId(r)];
    setDismissed(next);
    writeDismissed(next);
  };

  const dismissAll = () => {
    const next = [...dismissed, ...reminders.map(reminderId)];
    setDismissed(next);
    writeDismissed(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          aria-label={`Reminders (${reminders.length})`}
        >
          <Bell className="h-4 w-4" />
          {reminders.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-declining px-1 text-[0.65rem] font-semibold text-background">
              {reminders.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
          <p className="text-xs font-semibold text-foreground">Reminders</p>
          {reminders.length > 0 && (
            <button
              onClick={dismissAll}
              className="text-[0.7rem] text-muted-foreground hover:text-foreground"
            >
              Dismiss all
            </button>
          )}
        </div>

        {reminders.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            Nothing due. Reviews and actions appear here on their due date.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border-subtle overflow-y-auto">
            {reminders.map((r) => (
              <li key={reminderId(r)} className="px-3 py-2.5">
                <p className="text-[0.7rem] font-medium uppercase tracking-wide text-status-declining">
                  {REMINDER_LABELS[r.kind]}
                  {r.daysOverdue > 0 ? ` · ${r.daysOverdue}d` : ""}
                </p>
                <p className="mt-0.5 text-xs text-foreground">{r.title}</p>
                <div className="mt-1.5 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setOpen(false);
                      onOpenSignal(r);
                    }}
                  >
                    Review now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => dismiss(r)}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;

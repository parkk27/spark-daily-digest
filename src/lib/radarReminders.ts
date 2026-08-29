/**
 * Deterministic in-app reminders for signals whose review or action date has arrived.
 *
 * Nothing here schedules email — reminders are derived on read from data that already
 * exists on `decision_records`, so they stay correct without a background job.
 */

import type { DecisionRecord, Recommendation } from "@/hooks/useRecommendations";
import { signalIdOf } from "@/lib/signalIdentity";

export type ReminderKind = "review_overdue" | "review_today" | "action_overdue";

export interface Reminder {
  signalKey: string;
  recommendationId: string;
  title: string;
  kind: ReminderKind;
  /** ISO date the reminder is anchored to — used so a dismissal expires when the date moves. */
  dueDate: string;
  daysOverdue: number;
}

export const REMINDER_LABELS: Record<ReminderKind, string> = {
  review_overdue: "Review overdue",
  review_today: "Review due today",
  action_overdue: "Action past due",
};

const CLOSED = ["resolved", "dismissed", "completed"];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const dayDiff = (isoDate: string, today: Date): number | null => {
  const due = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((startOfDay(today).getTime() - startOfDay(due).getTime()) / 86400000);
};

/** Reminders for every open decision whose review or action date has come due. */
export const dueReminders = (
  recommendations: Recommendation[],
  decisions: Record<string, DecisionRecord>,
  today: Date = new Date()
): Reminder[] => {
  const seen = new Set<string>();
  const out: Reminder[] = [];

  for (const r of recommendations) {
    const key = signalIdOf(r);
    if (seen.has(key)) continue;
    const d = decisions[key] ?? decisions[r.id];
    if (!d) continue;
    if (d.completed_at || CLOSED.includes(d.status)) continue;
    seen.add(key);

    const push = (kind: ReminderKind, dueDate: string, daysOverdue: number) =>
      out.push({ signalKey: key, recommendationId: r.id, title: r.title, kind, dueDate, daysOverdue });

    if (d.review_date) {
      const diff = dayDiff(d.review_date, today);
      if (diff !== null && diff > 0) push("review_overdue", d.review_date, diff);
      else if (diff === 0) push("review_today", d.review_date, 0);
    }

    if (d.action_due_date && !d.outcome) {
      const diff = dayDiff(d.action_due_date, today);
      if (diff !== null && diff > 0) push("action_overdue", d.action_due_date, diff);
    }
  }

  return out.sort((a, b) => b.daysOverdue - a.daysOverdue);
};

export const reminderId = (r: Reminder) => `${r.signalKey}|${r.kind}|${r.dueDate}`;

const STORAGE_KEY = "radar.reminders.dismissed";

export const readDismissed = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
};

export const writeDismissed = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    /* storage unavailable — reminders simply reappear */
  }
};

/** Dismissals are keyed by the due date, so a rescheduled review reminds again. */
export const activeReminders = (reminders: Reminder[], dismissed: string[]): Reminder[] => {
  const set = new Set(dismissed);
  return reminders.filter((r) => !set.has(reminderId(r)));
};

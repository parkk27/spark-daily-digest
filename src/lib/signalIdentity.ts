/**
 * Stable, deterministic identity for a signal.
 *
 * Recommendation UUIDs are regenerated whenever the radar is refreshed, so they must
 * never be used as the business identity of a signal. The signal key is derived from
 * the canonical source plus the normalized article identity (URL path when available,
 * otherwise the article title) and stays constant across refreshes.
 */

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

/** Canonical path identity for a link: host + pathname, without query/hash/trailing slash. */
export const canonicalUrlIdentity = (url: string): string | null => {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return slugify(`${u.hostname.replace(/^www\./, "")}${path}`);
  } catch {
    return null;
  }
};

export const buildSignalKey = (
  source: string | null | undefined,
  titleOrUrl: string,
  url?: string | null
): string => {
  const src = slugify(source ?? "unknown") || "unknown";
  const fromUrl = url ? canonicalUrlIdentity(url) : null;
  return `${src}:${fromUrl || slugify(titleOrUrl) || "untitled"}`;
};

/** Identity used by the client for a recommendation row. */
export const signalIdOf = (r: { signal_key?: string | null; id: string }): string =>
  r.signal_key || r.id;

export const RESOLVED_STATUSES = ["resolved", "dismissed"] as const;

export type ReviewState = "none" | "scheduled" | "overdue";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** A decision needs review when its review date has passed and it is still unresolved. */
export const reviewState = (
  reviewDate: string | null | undefined,
  status: string | null | undefined,
  today: Date = new Date()
): ReviewState => {
  if (!reviewDate) return "none";
  if (status && (RESOLVED_STATUSES as readonly string[]).includes(status)) return "none";
  const due = new Date(`${reviewDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return "none";
  return due < startOfDay(today) ? "overdue" : "scheduled";
};

/** Extend a review date by N days, counting from today when the date is already past. */
export const addDays = (
  dateStr: string | null | undefined,
  days: number,
  today: Date = new Date()
): string => {
  const parsed = dateStr ? new Date(`${dateStr}T00:00:00`) : null;
  const base =
    parsed && !Number.isNaN(parsed.getTime()) && parsed > startOfDay(today)
      ? parsed
      : startOfDay(today);
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(
    next.getDate()
  ).padStart(2, "0")}`;
};

/**
 * Single source of truth for every URL the app builds.
 *
 * The same build must work on local dev, Lovable preview, Vercel preview,
 * production and future custom domains, so nothing here hardcodes a host:
 * values come from environment variables, and fall back to the origin the app
 * is actually being served from.
 */

const env = import.meta.env as Record<string, string | undefined>;

const clean = (v?: string) => v?.trim().replace(/\/+$/, "") || undefined;

const CONFIGURED_APP_URL = clean(env.VITE_APP_URL);
const CONFIGURED_SITE_URL = clean(env.VITE_PUBLIC_SITE_URL);

const currentOrigin = (): string =>
  typeof window === "undefined" ? "" : window.location.origin;

/**
 * Ephemeral hosts (local dev, per-branch previews) must keep their own origin,
 * otherwise auth redirects would bounce testers to production. Detected by
 * shape, not by a list of provider names.
 */
const isEphemeralHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (/^(\[::1\]|127(\.\d+){3})$/.test(h)) return true;
  if (!h.includes(".")) return true; // bare hostnames, incl. local dev
  // preview-style subdomains: long hashed or "preview"-prefixed labels
  const label = h.split(".")[0];
  return /(^|-)preview(--|-|$)/.test(label) || /^[0-9a-f]{8,}(-|$)/.test(label);
};

/** Base origin of this deployment. */
export const APP_URL: string =
  (isEphemeralHost() ? currentOrigin() : CONFIGURED_APP_URL || currentOrigin()) ||
  CONFIGURED_APP_URL ||
  "";

/** Backend / database origin. */
export const SUPABASE_URL: string = clean(env.VITE_SUPABASE_URL) ?? "";

/** Base URL for backend function calls. */
export const API_URL: string =
  clean(env.VITE_API_URL) ?? (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : "");

/** Where auth providers and magic links return the user. */
export const AUTH_CALLBACK_URL = `${APP_URL}/auth/callback`;

/**
 * Stable public address used for canonical tags, og:url and JSON-LD. Previews
 * must not advertise themselves as canonical, so this is configuration-driven
 * and only falls back to the runtime origin when unset.
 */
export const SITE_URL: string = CONFIGURED_SITE_URL ?? CONFIGURED_APP_URL ?? APP_URL;

/** Absolute URL on this deployment from a same-origin path. */
export const appUrl = (path: string): string =>
  `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Absolute canonical (SEO) URL from a same-origin path. */
export const siteUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const isSafePath = (p: string) => /^\/(?!\/)/.test(p);

/** Auth callback URL, optionally preserving an intended same-origin path. */
export const authCallbackUrl = (next?: string | null): string =>
  next && isSafePath(next)
    ? `${AUTH_CALLBACK_URL}?next=${encodeURIComponent(next)}`
    : AUTH_CALLBACK_URL;

/**
 * Startup sanity check. Warns loudly in the console when the environment looks
 * misconfigured; never throws, never blocks rendering.
 */
export function validateConfig(): void {
  const problems: string[] = [];

  if (!SUPABASE_URL) problems.push("VITE_SUPABASE_URL is not defined — backend calls will fail.");
  if (!clean(env.VITE_SUPABASE_PUBLISHABLE_KEY))
    problems.push("VITE_SUPABASE_PUBLISHABLE_KEY is not defined — auth will fail.");

  if (!APP_URL) {
    problems.push("APP_URL could not be resolved — set VITE_APP_URL.");
  } else if (!/^https?:\/\/[^/]+$/.test(APP_URL)) {
    problems.push(`APP_URL is not a valid origin: "${APP_URL}".`);
  }

  const origin = currentOrigin();
  if (origin && APP_URL && APP_URL !== origin) {
    problems.push(
      `Redirect base (${APP_URL}) differs from the current origin (${origin}). ` +
        "Auth links will return users to the configured origin — add this origin to " +
        "the backend redirect allow-list, or unset VITE_APP_URL for this deployment.",
    );
  }

  if (!problems.length) return;

  // eslint-disable-next-line no-console
  console.warn(
    `[config] ${problems.length} configuration issue(s) detected:\n- ${problems.join("\n- ")}`,
  );
}

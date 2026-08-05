/**
 * Canonical application origin used for every auth redirect.
 *
 * Auth redirect targets must be prefix-matched by the backend allow-list, so we
 * never derive production links from whatever origin the browser happens to be
 * on (previews, branch deploys, mirrors). VITE_APP_URL pins the canonical host;
 * we fall back to the current origin for local development.
 */
const CONFIGURED = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();

const isLocal = () =>
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

export function appOrigin(): string {
  if (typeof window === "undefined") return CONFIGURED ?? "";
  if (isLocal() || !CONFIGURED) return window.location.origin;
  return CONFIGURED.replace(/\/+$/, "");
}

/** Builds an absolute URL on the canonical origin from a same-origin path. */
export function appUrl(path: string): string {
  return `${appOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

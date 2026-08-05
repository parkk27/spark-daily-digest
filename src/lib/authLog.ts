/**
 * Structured auth logging.
 *
 * Signed-out analytics inserts are rejected by row-level security, so auth
 * telemetry is emitted to the console instead. Full error objects are logged in
 * development only; production keeps the event name and a safe reason code.
 */

export type AuthEvent =
  | "otp_request"
  | "otp_success"
  | "otp_failure"
  | "oauth_start"
  | "oauth_callback"
  | "session_restored"
  | "session_expired";

const isDev = import.meta.env.DEV;

export function authLog(event: AuthEvent, detail: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.info(`[auth] ${event}`, { ts: new Date().toISOString(), ...detail });
}

export function authLogError(event: AuthEvent, error: unknown, detail: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.error(`[auth] ${event}`, { ts: new Date().toISOString(), ...detail });
  if (isDev) {
    // eslint-disable-next-line no-console
    console.error("[auth] raw error", error);
  }
}

/**
 * Reads auth callback failures. The backend appends them either as query params
 * or in the URL fragment, depending on the flow.
 */
export function readCallbackError(): { code: string; description: string } | null {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const get = (key: string) => query.get(key) ?? hash.get(key);
  const code = get("error_code") ?? get("error");
  if (!code) return null;
  return { code, description: get("error_description") ?? "" };
}

/** Strips auth error params so a refresh doesn't re-show the message. */
export function clearCallbackError() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  ["error", "error_code", "error_description"].forEach((k) => url.searchParams.delete(k));
  url.hash = "";
  window.history.replaceState({}, "", url.toString());
}

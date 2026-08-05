/** Maps backend auth errors to safe, user-friendly copy. Never expose raw errors. */

export const AUTH_MESSAGES = {
  googleUnavailable: "Google Sign In is temporarily unavailable.",
  callbackFailed: "Authentication couldn't be completed.",
  generic:
    "We couldn't complete your sign in. Please try again or choose another sign-in method.",
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  invalidEmail: "Enter a valid email address.",
  expired: "Your session has expired. Please sign in again.",
  expiredLink:
    "That sign-in link has expired or was already used. Request a fresh link below.",
} as const;


export function friendlyAuthError(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  const m = raw.toLowerCase();

  if (!m) return AUTH_MESSAGES.generic;
  if (m.includes("provider") || m.includes("oauth secret") || m.includes("not enabled"))
    return AUTH_MESSAGES.googleUnavailable;
  if (m.includes("callback") || m.includes("redirect") || m.includes("state"))
    return AUTH_MESSAGES.callbackFailed;
  if (m.includes("rate limit") || m.includes("too many") || m.includes("429"))
    return AUTH_MESSAGES.rateLimited;
  if (m.includes("invalid email") || m.includes("valid email"))
    return AUTH_MESSAGES.invalidEmail;
  return AUTH_MESSAGES.generic;
}

/** Non-sensitive reason code for analytics. */
export function authErrorCode(error: unknown): string {
  const msg = friendlyAuthError(error);
  const entry = Object.entries(AUTH_MESSAGES).find(([, v]) => v === msg);
  return entry?.[0] ?? "generic";
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

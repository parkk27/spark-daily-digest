# Authentication Audit — Big Data Intelligence Hub

End-to-end audit completed before any code change. Findings below are verified against the live auth configuration, the sign-in page, the session hook and the environment file — not inferred.

## Audit report

### 1. Magic Link emails: no sender domain configured (primary root cause)

- **Root cause:** The project has no email sending domain (`not_started`). All magic-link emails go out through the shared default Lovable sender, which is subject to a low per-hour auth-email cap and much weaker deliverability (shared IP reputation, no SPF/DKIM aligned to your brand). Result: some links arrive, some are throttled with a rate-limit error, some land in spam/quarantine — exactly the "inconsistent delivery" symptom.
- **Affected:** backend email configuration (no app files).
- **Risk:** High. Users cannot sign in reliably; passwordless is the only email method offered.
- **Fix:** Set up a sender domain you own, then raise the hourly auth-email limit to match real signup volume.
- **Verify:** Domain shows verified; send a link to Gmail + Outlook; delivery log shows `sent` with your domain in the From header.

### 2. Production redirect allow-list does not include the Vercel domain

- **Root cause:** Site URL is `https://bigdata-hub.lovable.app`. The redirect allow-list contains `https://vercel.com/**` (the Vercel dashboard, not your app) but **not** `https://bigdata-hub.vercel.app/**`. A magic link requested from the Vercel deployment sends `emailRedirectTo` pointing at `bigdata-hub.vercel.app`; because that URL is not allow-listed, the auth server silently falls back to the Site URL, so the user lands on the Lovable domain with the code and never gets a session on Vercel — reading as "the link didn't work".
- **Affected:** auth redirect configuration; `src/pages/AuthPage.tsx` (builds `emailRedirectTo` from `window.location.origin`).
- **Risk:** High.
- **Fix:** Decide the single canonical production origin, then align Site URL + allow-list to it. Add `https://bigdata-hub.vercel.app/**` to the allow-list and remove the stale `https://vercel.com/**` entry.
- **Verify:** Request a link on the Vercel domain; the emailed URL host is the Vercel host and lands signed in on `/dashboard`.

### 3. Google OAuth on Vercel uses the managed broker

- **Root cause:** `handleGoogle` calls the managed Lovable OAuth helper with `redirect_uri: window.location.origin`. The managed broker endpoints only exist on Lovable-hosted origins, which is why the earlier `/~oauth/initiate` 404 appeared on Vercel.
- **Affected:** `src/pages/AuthPage.tsx`, `src/integrations/lovable/index.ts`.
- **Risk:** High if Vercel stays the production host; none if production is the Lovable domain.
- **Fix:** Depends on the canonical-host decision (question below). Keep managed OAuth on the Lovable domain, or switch that call to direct provider OAuth with your own Google credentials for Vercel.
- **Verify:** Google sign-in completes on the production host and returns to `/dashboard`.

### 4. GitHub and Microsoft OAuth are not available

- **Root cause:** The managed backend supports Email, Phone, Google, Apple and SAML SSO only. GitHub/Microsoft were previously removed from the UI for this reason.
- **Risk:** Low (scope clarity).
- **Fix:** Out of scope unless you want to move to a self-managed backend connection. Report only.

### 5. Session management is correct, with one gap

- **Verified good:** `persistSession: true` and `autoRefreshToken: true` in the client; `detectSessionInUrl` defaults to on, so the magic-link code exchange happens automatically — no manual `exchangeCodeForSession` needed. `useAuth` registers `onAuthStateChange` before `getSession()`, tracks expiry, and syncs across tabs. `AuthPage` redirects an already-restored session straight to the destination, so users are not asked to log in twice.
- **Gap:** if the code exchange fails (expired or already-used link), the user is dropped on `/signin` with no explanation.
- **Fix:** Surface a specific "this link expired or was already used — request a new one" state when an error comes back in the callback URL.
- **Verify:** Click a link twice; the second click shows the expired-link message rather than a blank sign-in form.

### 6. Sign-out redirect and error handling

- **Verified good:** raw errors are already mapped to friendly copy through `src/lib/authErrors.ts`; the rate-limit case has its own message.
- **Gap:** friendly messages are shown but the underlying error object is never logged, so failures cannot be diagnosed from the console.
- **Fix:** Log the full error in development alongside the friendly message.

### 7. Auth telemetry is silently discarded

- **Root cause:** `AuthPage` writes analytics rows for OTP request/success/failure and OAuth start, but those inserts run signed-out and the table only permits inserts where the row belongs to the current user. Every pre-sign-in auth event is rejected and the failure is swallowed.
- **Affected:** `src/pages/AuthPage.tsx`.
- **Risk:** Medium — you currently have no record of magic-link failures.
- **Fix:** Replace the pre-auth analytics writes with structured console logging (OTP request, OTP success, OTP failure, OAuth start, OAuth callback, session restored, session expired), keeping database analytics for signed-in events only.

### 8. Environment variables

- **Present and correct:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
- **Missing:** `VITE_APP_URL` does not exist anywhere in the project; the app derives every redirect from `window.location.origin`. That is fine for a single-host deployment but produces wrong links when a user hits a preview/branch URL. If you want one canonical production origin, introduce `VITE_APP_URL` and use it for `emailRedirectTo` and the OAuth `redirect_uri`.

## Proposed fixes (pending your answers)

1. Set up the email sender domain, then raise the hourly auth-email limit.
2. Align Site URL and redirect allow-list to the chosen canonical production origin; drop the stale `vercel.com` entry.
3. Add `VITE_APP_URL` and use it (falling back to `window.location.origin`) for `emailRedirectTo` and the Google `redirect_uri`.
4. Add an expired/used-link state on `/signin` driven by callback error params.
5. Replace failing pre-auth analytics inserts with structured, development-only console logging across the seven listed events.
6. Keep the Google path as-is on Lovable hosting, or move to direct provider OAuth if Vercel is canonical.

No UI redesign — only the expired-link message and error surfacing change visually.

## Technical notes

- Magic link uses PKCE; the code exchange is handled by `detectSessionInUrl`. Do not add a manual `exchangeCodeForSession` call — it would double-consume the code.
- `emailRedirectTo` and the OAuth `redirect_uri` must both be prefix-matched by an allow-list entry or the auth server falls back to Site URL.
- `src/integrations/supabase/client.ts` is generated and must not be edited; the canonical-origin logic goes in `AuthPage`/a small helper.

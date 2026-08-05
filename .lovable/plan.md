# Authentication Audit — Big Data Intelligence Hub

End-to-end audit completed before any code change. Findings are verified against the live auth configuration, the sign-in page, the session hook and the environment file — not inferred.

**Decisions taken:** canonical production origin is `https://bigdata-hub.lovable.app`; a sender domain will be set up.

## Audit report

### 1. Magic Link emails: no sender domain configured (primary root cause)

- **Root cause:** The project has no email sending domain (`not_started`). All magic-link emails go out through the shared default Lovable sender, subject to a low per-hour auth-email cap and much weaker deliverability (shared reputation, no SPF/DKIM aligned to your brand). Some links arrive, some are throttled, some land in spam — exactly the "inconsistent delivery" symptom.
- **Affected:** backend email configuration (no app files).
- **Risk:** High — passwordless email is the only non-Google sign-in method.
- **Fix:** Set up your sender domain, provision the email queue infrastructure, scaffold branded auth email templates, then raise the hourly auth-email limit to match real signup volume.
- **Verify:** Domain verified; test link to Gmail + Outlook arrives from your domain; send log shows `sent`.

### 2. Redirect allow-list contains a stale, wrong Vercel entry

- **Root cause:** Site URL is `https://bigdata-hub.lovable.app` (correct), but the allow-list includes `https://vercel.com/**` — the Vercel dashboard, not an app origin. Any link requested from a Vercel deployment resolves back to the Site URL, so the session never lands where the user started.
- **Affected:** auth redirect configuration; `src/pages/AuthPage.tsx` (derives `emailRedirectTo` from `window.location.origin`).
- **Risk:** Medium now that Lovable is canonical — but it silently breaks anyone still opening the Vercel deployment.
- **Fix:** Remove the `vercel.com` allow-list entries and stop deriving production redirects from whatever origin the browser happens to be on.
- **Verify:** Magic link requested on the production site returns to `bigdata-hub.lovable.app` signed in.

### 3. Google OAuth — correct for the chosen host

- The managed Lovable OAuth helper only works on Lovable-hosted origins; with `bigdata-hub.lovable.app` as canonical, the current implementation is correct and needs no change. The earlier `/~oauth/initiate` 404 was the Vercel deployment, which is now non-canonical.

### 4. GitHub and Microsoft OAuth are not available

- The managed backend supports Email, Phone, Google, Apple and SAML SSO only. Already removed from the UI. Report only, no action.

### 5. Session management is sound, with one gap

- **Verified good:** `persistSession` and `autoRefreshToken` enabled; `detectSessionInUrl` defaults on, so the magic-link PKCE exchange happens automatically — no manual `exchangeCodeForSession` needed. `useAuth` registers `onAuthStateChange` before `getSession()`, tracks expiry and syncs across tabs; `AuthPage` redirects a restored session straight to the destination, so nobody logs in twice.
- **Gap:** if the exchange fails (expired or reused link), the user lands on `/signin` with no explanation.
- **Fix:** Read the error params the auth server appends to the callback URL and show a specific "this link expired or was already used" state with a resend action.

### 6. Error handling

- **Good:** raw errors already map to friendly copy via `src/lib/authErrors.ts`, including the rate-limit case.
- **Gap:** the underlying error object is never logged, so failures cannot be diagnosed from the console.
- **Fix:** log the full error in development alongside the friendly message.

### 7. Auth telemetry is silently discarded

- **Root cause:** `AuthPage` writes analytics rows for OTP request/success/failure and OAuth start, but those inserts run signed-out and the table only permits rows owned by the current user. Every pre-sign-in auth event is rejected and swallowed.
- **Risk:** Medium — you currently have no record of magic-link failures.
- **Fix:** replace pre-auth analytics writes with structured console logging; keep database analytics for signed-in events only.

### 8. Environment variables

- **Present and correct:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
- **Missing:** `VITE_APP_URL` does not exist; every redirect is derived from `window.location.origin`, so preview/branch/Vercel origins generate links that don't match the allow-list.

## Fix plan

1. **Email delivery** — run the sender-domain setup dialog, provision email infrastructure, scaffold and brand the auth email templates (dark executive theme, matching the app's tokens), deploy the auth email hook, then raise the hourly auth-email rate limit.
2. **Canonical origin** — add `VITE_APP_URL=https://bigdata-hub.lovable.app` and a small `authOrigin()` helper that prefers it and falls back to `window.location.origin`; use it for `emailRedirectTo` and the Google `redirect_uri`.
3. **Allow-list cleanup** — remove the stale `https://vercel.com/**` entries so only real app origins remain.
4. **Expired-link state** — `/signin` detects `error`/`error_code` params from the callback and shows a clear expired-or-reused message with a resend button.
5. **Structured logging** — dev-only, prefixed console logs for: OTP request, OTP success, OTP failure, OAuth start, OAuth callback, session restored, session expired; full error objects logged next to friendly messages.
6. **Telemetry** — drop the failing signed-out inserts.

No visual redesign: the only UI change is the new expired-link message.

## Technical notes

- Do not add a manual `exchangeCodeForSession` — `detectSessionInUrl` already consumes the code; calling both double-consumes it.
- `emailRedirectTo` and the OAuth `redirect_uri` must be prefix-matched by an allow-list entry or the server silently falls back to Site URL.
- `src/integrations/supabase/client.ts` is generated and must not be edited; the origin helper lives in `src/lib/`.
- Auth email templates are scaffolded, not hand-written, and the hook must keep its required name.

## Verification

- Request a magic link on production: email arrives from your domain, link signs in and lands on `/dashboard`.
- Click the same link twice: second click shows the expired-link message.
- Google sign-in completes and returns to `/dashboard`.
- Refresh and reopen a second tab: session restores with no second login.
- Console shows the seven structured auth events in development.

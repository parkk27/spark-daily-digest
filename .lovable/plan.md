# Authentication UX Simplification — Google first, magic link fallback

Goal: change sign-in from "email → inbox → link → return" to "Google → in", while keeping the email magic link as a reliable fallback. No changes to News, Trends, Compare, Radar, Copilot, scoring or ingestion.

## What changes for users

```text
/signin
  [ Continue with Google ]        <- primary
  ──── or continue with email ────
  [ you@company.com ]
  [ Send magic link ]
  By continuing, you agree to the Terms and Privacy Policy.
```

- Google becomes the primary, full-width button at the top with the Google mark; email drops to the secondary position and the button reads "Send magic link".
- Headline copy on the card: "Big Data Intelligence Hub" / "Executive intelligence for the modern data ecosystem." / "Turn technology, market and competitive signals into insights, decisions and actions."
- Sent state keeps the existing "Check your email" panel with Resend (30s cooldown) and Change email.
- Microsoft is out of scope for this pass, per your answer — no Microsoft button is added.
- No password field, no Sign in / Sign up split (already true today).

## Already working — left alone

- Route protection (`RequireAuth`) already redirects unauthenticated users to `/signin?next=...`, waits on the auth loading state (no protected-content flash), and returns them to the intended page after sign-in.
- Navbar already renders public links when signed out and product links when signed in.
- Session persistence, auto refresh, cross-tab sync, expired-session messaging and sign-out already exist in `useAuth`.
- Magic link, expired-link recovery copy and the friendly error mapping already exist.
- Profiles, roles, bookmarks, decision records and RLS are untouched — no migration in this plan.

## Callback route

Today OAuth and magic links return to `/signin`, which detects the session and forwards to the intended page. This plan adds a dedicated `/auth/callback` route as requested: a minimal page that waits for the session, then redirects to the stored destination or `/dashboard`, and on error forwards to `/signin` with the mapped message. `/signin` keeps its current handling so links already in inboxes still work.

## Redirects (environment-driven, both domains)

`src/config.ts` already resolves the origin from the environment with a runtime-origin fallback, so localhost, Lovable and Vercel each redirect to themselves. The callback URL constant moves from `/signin` to `/auth/callback`.

Both origins must be in the backend redirect allow-list:
- `https://bigdata-hub.lovable.app/**`
- `https://bigdata-hub.vercel.app/**`
- `http://localhost:8080/**`

## Google provider configuration

Google will be enabled with Lovable-managed credentials in the same change, so no Google Cloud console work is required from you and no secret ever reaches the frontend. Sign-in uses `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })` — the standard backend flow, which works on Vercel as well as Lovable.

## Analytics

Lightweight, using the existing console-based `authLog` (signed-out inserts are blocked by RLS, so no new table): `auth_view`, `google_signin_started/success/failure`, `magic_link_requested/success/failure`, `session_restored`, `sign_out`. No tokens, emails-in-links or secrets are logged.

## Technical notes

- `src/pages/AuthPage.tsx` — reorder to Google-primary, add Google mark + spec copy and terms line, rename the email CTA, keep sent/resend/change-email states.
- `src/pages/AuthCallback.tsx` (new) + route in `src/App.tsx`; `/auth` keeps redirecting to `/signin`.
- `src/config.ts` — `AUTH_CALLBACK_URL` points at `/auth/callback`.
- `src/lib/authErrors.ts` — add cancelled-OAuth and network-failure messages to the existing map.
- `src/lib/authLog.ts` — extend the event union with the events above.
- Configure Social Login (Google, managed) run in the same change so the provider is live.

## Verification

Playwright + manual checks for: signed-out `/radar` → `/signin` → back to `/radar`; refresh keeps session; sign-out clears session and blocks back navigation; expired link shows recovery copy; cancelled OAuth returns cleanly; no protected-content flash. Google end-to-end needs a real Google account, so I'll confirm the provider is enabled and the redirect resolves, and report anything I could not exercise myself.

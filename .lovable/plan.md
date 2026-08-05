# Authentication Experience v2

Passwordless-first sign-in with managed Google, reliable sessions, and friendly errors. No branding or layout changes — the split-screen dark page stays.

## What changes for users

```text
Landing -> Sign in -> [email] Continue -> "Check your email" -> click link -> Dashboard
                   -> Continue with Google -> Dashboard
```

- One email field, auto-focused, Enter to submit, button disabled while sending.
- After sending: a confirmation state showing the address, a 15-minute expiry note, Resend (with a 30s cooldown) and Change email.
- Google is the only social button. Microsoft and GitHub buttons are removed.
- Password fields removed everywhere. Existing password accounts sign in by magic link — same account, nothing lost.
- Already signed in? The sign-in page redirects straight to the dashboard instead of showing a form.
- Returning visitor with an expired session sees "Your session has expired. Please sign in again." and lands back where they were headed after signing in.
- Footer under the auth card: Privacy, Terms, Support.

## Reliability and errors

- Google switches to Lovable's managed credentials, which fixes the current "missing OAuth secret" failure. The button uses the managed sign-in helper.
- Trade-off to be aware of: the managed Google flow only works on Lovable-served domains (`bigdata-hub.lovable.app` or a custom domain connected in Lovable). It will not work on the Vercel deployment — Vercel visitors should use the email magic link, or the app should be served from Lovable.
- No raw backend errors reach the screen. Mapped messages:
  - provider misconfigured -> "Google Sign In is temporarily unavailable."
  - callback/OAuth failure -> "Authentication couldn't be completed." with Retry and Use email instead.
  - anything else -> "We couldn't complete your sign in. Please try again or choose another sign-in method."
- Duplicate submits blocked; every action has explicit loading, success and failure states.

## Sessions

- Sessions already persist in browser storage with automatic token refresh; this keeps that and adds cross-tab sync so signing out in one tab signs out everywhere.
- Expired-session detection routes to sign-in with the message above and preserves the intended destination.
- "Remember me" is removed as a checkbox since sessions persist by default — no behaviour is lost.

## Analytics

Sign-in events recorded to the existing analytics table: magic link sent, magic link completed, Google started/succeeded/failed, session restored, session expired, auth error (with a non-sensitive reason code).

## Technical notes

- `src/pages/AuthPage.tsx`: rewritten right panel — single email step plus sent-confirmation step, no tabs, no password, no Microsoft/GitHub. Left `AuthStoryPanel` untouched.
- New `src/lib/authErrors.ts` maps backend error codes to the user-facing strings above.
- New `src/components/auth/AuthFooterLinks.tsx` for Privacy / Terms / Support.
- Google: `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` via `src/integrations/lovable/index.ts`, plus the Configure Social Login tool run in the same change so the provider is active. Intended destination is stored separately and applied after the session hydrates.
- `src/hooks/useAuth.tsx`: add cross-tab storage sync and an expiry signal consumed by `RequireAuth`.
- `/signup` keeps routing to the same page; the copy adapts.
- No database migration. Profile onboarding (name, company, role) and enterprise SSO from the spec are deliberately out of scope for this pass — say the word and I'll queue them next.

# Fix Google sign-in on the Vercel deployment

## What's broken

On `bigdata-hub.vercel.app`, the Google button sends the browser to
`/~oauth/initiate?provider=google&...`. That path is served by Lovable's hosting proxy, not by the app
bundle, so Vercel returns a 404. The same code works on `bigdata-hub.lovable.app` because Lovable
intercepts `/~oauth/*` there.

You chose to keep Vercel, using your own Google OAuth credentials — so the app must stop using the
Lovable OAuth broker and go straight to the backend auth provider instead.

## Fix

1. Replace the broker call in `src/pages/AuthPage.tsx` (`handleGoogle`) with the standard backend
   OAuth call: `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`.
   The provider then redirects to the backend auth callback and back to the app — no `/~oauth/*`
   path is involved, so it works on Vercel, Lovable, and any custom domain.
2. `redirectTo` stays a public same-origin URL (`window.location.origin`), with the intended
   destination kept in the existing `next` query param and applied after the session hydrates.
   No change to `RequireAuth`, `useAuth`, magic link, password sign-in, or the page design.
3. Remove the now-unused `lovable.auth` import from the auth page. `src/integrations/lovable/index.ts`
   is auto-generated and stays untouched.

## Configuration you'll do (outside the code)

1. In Google Cloud Console → Credentials, create (or reuse) a **Web application** OAuth client.
   - Authorized redirect URI: the backend auth callback URL shown in Cloud → Users → Auth Settings →
     Google. I'll surface the exact value when we implement.
   - Consent screen authorized domains: your Vercel domain plus `bigdata-hub.lovable.app`.
2. Paste the client ID and secret into Cloud → Users → Auth Settings → Google (BYO credentials mode).
3. Add both origins to the auth redirect allow-list: `https://bigdata-hub.vercel.app` and
   `https://bigdata-hub.lovable.app`, so post-login redirects aren't dropped.

## Notes

- Until step 2 is done, Google sign-in will error with "Unsupported provider" — the code change and
  the credential setup need to land together.
- Email/password and magic link already work on Vercel and are unaffected.
- Magic-link and password-reset emails redirect to whichever origin the user started from, so both
  domains need to be in the allow-list above.

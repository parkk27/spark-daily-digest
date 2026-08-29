# Fix Google sign-in ("missing OAuth secret")

## What went wrong

The sign-in button calls the backend auth provider directly:

```text
supabase.auth.signInWithOAuth({ provider: "google", ... })
  -> https://<backend>/auth/v1/authorize?provider=google
  -> 400 {"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}
```

Backend auth logs confirm two `/authorize` 400s with `missing OAuth secret` at the
time of the failed attempt.

Google is *enabled* on the project, but it is enabled in **Lovable-managed** mode.
Managed mode does not store a client ID/secret on the direct `/authorize` endpoint —
the credentials live in Lovable's OAuth broker, which is only reached through the
managed helper (`lovable.auth.signInWithOAuth`, via the `/~oauth/*` path). So the
direct call always finds an empty secret and rejects the request.

This regressed earlier when the Google handler was switched from the managed helper
to the direct call to work around a Vercel 404 on `/~oauth/initiate`.

## The fix

1. `src/pages/AuthPage.tsx` — `handleGoogle` calls the managed helper again:
   `lovable.auth.signInWithOAuth("google", { redirect_uri: <same-origin callback> })`,
   handling its `redirected` / `error` / tokens-set results. The intended
   destination stays in the existing `next` handling and is applied after the
   session hydrates, so `/auth/callback` and `RequireAuth` are unchanged.
2. Errors keep going through `friendlyAuthError`, plus the existing
   `google_signin_started/success/failure` logging.
3. No changes to magic link, session handling, route protection, or any product page.

## About Vercel (you said both hosts matter)

The managed broker is served by Lovable's hosting proxy. On `bigdata-hub.lovable.app`
and on custom domains attached to this Lovable project it works. On a raw
`bigdata-hub.vercel.app` deployment the `/~oauth/*` path is not intercepted, so
Google cannot work there in managed mode — that is the 404 the earlier change tried
to fix.

So one of these has to be true for Vercel:

- **Recommended:** point the domain at the Lovable project (Lovable hosting or a
  Lovable custom domain) — then one managed flow covers every host, no credentials
  to manage, and this plan is the whole fix.
- **Otherwise:** create your own Google Cloud OAuth web client and paste the client
  ID/secret into Cloud → Users → Auth Settings → Google. Once BYO credentials exist,
  the direct call works on any host, and I can keep the direct call instead of the
  managed helper. Until then Vercel Google sign-in will keep failing.

The plan below implements the managed fix now (unblocking the Lovable demo path),
and the app keeps a graceful, readable error on any host where the broker is not
reachable rather than a raw JSON error page.

## Verification

- Build + existing unit tests.
- Playwright on the preview: `/signin` renders, the Google button initiates the
  broker flow instead of hitting `/auth/v1/authorize` (no `missing OAuth secret`).
- Magic link still sends and returns through `/auth/callback` with `next` preserved.
- Final Google round-trip needs a real Google account on the published URL — I'll
  confirm the initiation and report anything I cannot exercise myself.

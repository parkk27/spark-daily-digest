# Environment & auth configuration for any deployment

Goal: one runtime config module drives every URL the app builds, so the same build works on localhost, Lovable preview, Vercel preview, production, and future custom domains — with no hardcoded hosts.

## 1. New `src/config.ts`

Single source of truth, replacing `src/lib/appOrigin.ts`:

- `APP_URL` — resolved base origin, in priority order:
  1. `VITE_APP_URL` when set **and** the app is running on a non-ephemeral host,
  2. otherwise `window.location.origin` (covers localhost, Lovable preview, Vercel preview deploys, custom domains).
  Ephemeral/preview hosts always keep their own origin so testing works where the user actually is.
- `API_URL` — backend functions base (derived from `SUPABASE_URL`, overridable by `VITE_API_URL`).
- `SUPABASE_URL` — from `VITE_SUPABASE_URL`.
- `AUTH_CALLBACK_URL` — `${APP_URL}/signin`, with a `authCallbackUrl(next?)` helper that appends a validated same-origin `next`.
- `appUrl(path)` — absolute URL on `APP_URL` (kept, re-exported so existing imports keep working).

`src/lib/appOrigin.ts` becomes a thin re-export of `config.ts` so nothing breaks, then its callers are updated.

## 2. Authentication

`src/pages/AuthPage.tsx`:
- Magic-link `emailRedirectTo` uses `authCallbackUrl(next)`.
- Google OAuth `redirect_uri` uses `APP_URL`.
No behaviour change beyond sourcing URLs from config.

## 3. Startup validation (dev-visible, never fatal)

A `validateConfig()` run once at app start (`src/main.tsx`) that logs a grouped `[config]` warning when:
- `SUPABASE_URL` or the publishable key is missing,
- `VITE_APP_URL` is set but its origin differs from the current origin on a production-looking host (redirect/allow-list mismatch risk),
- `APP_URL` is not a valid absolute https/http origin.

Warnings only — the app never blocks on this. In production builds the check runs but stays silent unless something is actually broken.

## 4. Removing hardcoded hosts

Replace the literal `https://bigdata-hub.lovable.app` in:
- `src/components/SeoHead.tsx`
- `src/lib/shareCard.ts`
- `src/components/share/TrendCard.tsx` (footer label → hostname of the canonical site URL)
- JSON-LD `url` fields in `HomePage.tsx`, `NewsPage.tsx`, `TrendsPage.tsx`

**One deliberate exception:** SEO canonical tags, `og:url`, sitemap and JSON-LD must point at one stable public address, not whatever origin a preview happens to use — otherwise previews would advertise themselves as canonical and split ranking. These will read a dedicated `VITE_PUBLIC_SITE_URL` env value (defaulting to `APP_URL`), so the value is configuration rather than a literal in the code, and preview builds can leave it unset.

No `localhost`, `vercel.com`, or `lovable.app` string will remain in application code — only host-shape detection for choosing between configured and runtime origin.

## 5. Environment

`.env` gains `VITE_PUBLIC_SITE_URL=https://bigdata-hub.lovable.app`; existing `VITE_APP_URL` stays. Both are optional at runtime — absence falls back to the current origin.

## Notes

- The backend redirect allow-list still has to include each origin you want links to return to (Vercel preview URLs and future custom domains). Code can't grant that; I'll list the exact entries to add after implementing.
- `src/integrations/supabase/client.ts` is generated and untouched.

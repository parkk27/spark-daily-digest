# Harden the admin secrets page

The review is done — the secrets and admin logic are documented above. Since no specific change was requested, here is the smallest worthwhile follow-up: make the admin area consistently gated and make the secrets list reflect reality instead of a hardcoded array.

## 1. Shared admin route guard

Add `src/components/RequireAdmin.tsx`:
- Uses `useAuth` and `useIsAdmin`.
- Redirects signed-out users to `/auth`, shows a skeleton while loading.
- Renders children only for admins; otherwise renders the "Claim admin access" card.

Wrap `/admin/environment` in `App.tsx` with it, so any future `/admin/*` page inherits the same gate. Move the claim-admin logic out of `EnvironmentSetupPage.tsx` and into the guard, leaving the page as pure content.

## 2. Live backend secret status

Today `backendRows` in `EnvironmentSetupPage.tsx` is a hardcoded list, so it can drift from what is actually configured (for example `OPENAI_API_KEY` is listed but not configured).

Add an admin-only edge function `list-secret-status`:
- Validates the caller's JWT, then confirms the caller has the `admin` role via a service-role query on `user_roles`.
- Returns, for a fixed allowlist of secret names, only `{ name, configured: boolean }` — derived from `Deno.env.get(name) !== undefined`. Values are never returned, logged, or echoed.

The page fetches this and shows a "Configured" / "Not configured" badge per secret, keeping the existing description and "how to manage" columns.

## Notes

- No public values change; `VITE_SUPABASE_URL` and the publishable key stay in the frontend table as they are meant to ship in the browser.
- No new secrets are needed.

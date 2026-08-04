# Remove the Setup page from the app (keep the code)

Goal: the Setup / Environment page is no longer reachable in the app, but all of its code stays in the repo so it can be restored later.

## Changes

1. `src/App.tsx` — remove the `/admin/environment` route and its import.
2. `src/components/Navbar.tsx` — remove the "Setup" nav link and the `useIsAdmin` usage that only powers it.

## Kept untouched

- `src/pages/EnvironmentSetupPage.tsx` (full page code, including the documented key list)
- `src/hooks/useAdmin.ts`
- `supabase/functions/bootstrap-admin/index.ts` and the `admin` role / `user_roles` table

Result: navigating to `/admin/environment` falls through to the 404 page; nothing else in the app changes.

# Secrets and Environment Setup page

## Goal

Add an admin-only `/admin/environment` page that explains every secret and environment variable used by the app, shows the retrievable public values, and clearly labels which ones must stay backend-only.

## Decisions

- **Audience**: admin-only.
- **Route**: `/admin/environment`.
- **Navigation**: link in the main navbar, visible only to users with the `admin` role.
- **Access**: gated by `public.user_roles` (`role = 'admin'`). A one-time bootstrap edge function lets the first signed-in user claim admin access without needing backend console access.

## What I will change

### Frontend

1. **New hook**: `src/hooks/useAdmin.ts`
   - Queries `public.user_roles` for `role = 'admin'` where `user_id = auth.uid()`.
   - Returns `{ isAdmin, loading, error }`.

2. **New page**: `src/pages/EnvironmentSetupPage.tsx`
   - Uses `useAdmin` to require admin access.
   - Redirects unauthenticated users to `/auth`.
   - Shows a "Claim admin access" button that calls the `bootstrap-admin` edge function if no admin exists yet.
   - Displays a table of variables grouped by visibility:
     - **Public frontend variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (also shown as `SUPABASE_ANON_KEY`), and `VITE_SUPABASE_PROJECT_ID`. Values read directly from `import.meta.env`.
     - **Backend-only secrets**: `SUPABASE_SERVICE_ROLE_KEY`, `FIRECRAWL_API_KEY`, `GOOGLE_SEARCH_CONSOLE_API_KEY`, `LOVABLE_API_KEY`, `OPENAI_API_KEY`. Values are never shown; status badges explain the source and how to update or rotate each one.
   - Includes copy-to-clipboard buttons for the public values.
   - Adds a short explanation of why public Supabase keys are safe and why the rest stay server-side.
   - Uses `SeoHead` with a new `noindex` flag to prevent indexing of the admin page.

3. **Update `SeoHead.tsx`** to accept an optional `noindex` prop that renders `<meta name="robots" content="noindex, nofollow" />`.

4. **Update `App.tsx`**: add `<Route path="/admin/environment" element={<EnvironmentSetupPage />} />`.

5. **Update `Navbar.tsx`**: add a "Setup" link with a `Shield`/`Key` icon to the main nav, rendered only when `isAdmin`.

### Backend

6. **New edge function**: `supabase/functions/bootstrap-admin/index.ts`
   - Verifies the caller via the `Authorization` JWT.
   - Uses the service-role key to check if any row exists in `public.user_roles` with `role = 'admin'`.
   - If none, inserts the current user's id as `admin`.
   - If an admin already exists, returns `{ bootstrapped: false, reason: "admin-exists" }`.
   - This provides a safe, one-time way for the project owner to claim admin access.

## Follow-up

- After the page is live, sign in and click **Claim admin access** to unlock the Setup link.
- If you want to assign admin to other users later, we can add a user-management UI in a later phase.

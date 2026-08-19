# Demo Readiness & Publish Plan

Goal: Make the live Big Data Intelligence Hub bulletproof for a presentation where attendees will visit the site, within the next 90 minutes.

## 1. Pre-publish verification (read-only checks)

Run these before any code changes so we know the baseline:

- **Build**: `bun run build` must pass with zero TypeScript errors.
- **Unit tests**: `bunx vitest run` must pass (especially `signalIdentity.test.ts`).
- **Public routes**: Visit `/`, `/preview`, `/preview/compare`, `/preview/radar`, `/card/:id` on the preview URL.
- **Auth routes**: Verify `/signin` loads and Google + Magic Link buttons are present.
- **Protected routes**: Sign in and verify `/dashboard`, `/news`, `/trends`, `/radar`, `/compare`, `/copilot` load live data.
- **Edge functions**: Confirm `spark-scrape`, `spark-trend-insights`, `generate-recommendations`, and `spark-copilot` respond without 5xx.
- **Data freshness**: Check that Home, News, and Trends show recent dates, not stale content.

## 2. Demo hardening (only if verification reveals issues)

Fix only what is broken, in priority order:

1. **Public preview must work without login** — attendees will land on `/` and likely click "See today's brief". Ensure `/preview` and its sub-routes render with sample data and no auth gate.
2. **Login must be one-click simple** — keep Google OAuth and Magic Link. Verify the Google OAuth redirect works on the published origin (`bigdata-hub.lovable.app`). If Magic Link is used in the demo, confirm the email arrives promptly and the link returns to the correct origin.
3. **No broken links or 404s** — test every primary nav item, footer link, and CTA.
4. **Performance** — ensure the landing page and preview pages render in < 3s. If the dashboard is slow, add a skeleton/loading state or demo from a pre-warmed tab.
5. **Badge/visibility** — check publish visibility is `public` so attendees do not hit a workspace login wall. If the "Edit with Lovable" badge is visible on a paid plan, hide it for a cleaner demo.

## 3. Publish

- Run a security scan first (required before `preview_ui--publish`).
- If no critical findings block it, publish the latest commit.
- Confirm the live URL: `https://bigdata-hub.lovable.app`.

## 4. Post-publish smoke test

From the published URL (not preview):

- Open `/` in an incognito window.
- Click "See today's brief" → `/preview` loads.
- Click "Create free account" → `/signin` loads.
- Sign in with Google or Magic Link.
- Visit `/dashboard`, `/news`, `/trends`, `/radar`, `/compare`, `/copilot` and confirm data loads.
- Test a share card (`/card/:id`) if showing it.

## 5. Demo contingency

- Keep the preview URL ready as a fallback if the published build has issues.
- If live data is slow, have a pre-signed-in browser tab open for the protected pages.
- If auth fails, fall back to screen-sharing the protected experience while attendees browse `/preview`.

## Deliverables

- Clean build + passing tests.
- Published live site at `https://bigdata-hub.lovable.app`.
- A short go/no-go report listing any issues found and whether they were fixed or require a fallback.

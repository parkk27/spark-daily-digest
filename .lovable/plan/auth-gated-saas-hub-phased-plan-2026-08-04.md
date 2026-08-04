# Auth-Gated SaaS Hub — Phased Plan

Turn the hub into a gated product: a public landing page plus legal/marketing pages, and every intelligence page behind sign-in. Existing dashboard, news, trends and copilot behaviour stay as-is — only access, onboarding, personalization and analytics are added. Compare is out of scope for now.

## Phase 1 — Route split and access control

- New public landing page at `/` selling the product ("Executive Intelligence for the Modern Data Ecosystem"), with sign-in / create-account CTAs.
- Today's dashboard moves to `/dashboard`; News, Trends and Copilot become protected routes.
- `/signin` and `/signup` become the auth entry points (current `/auth` redirects there, logic untouched).
- Protected route wrapper: while the session loads, show a skeleton; if signed out, show a friendly gate card — "Please sign in to access Big Data Intelligence Hub" with Sign In / Create Account buttons — and redirect to `/signin?next=<path>`.
- Public pages: Landing, Sign in, Sign up, About, Contact, Privacy Policy, Terms of Service.
- Two navbars: public (Home, About, Sign in, Sign up) and authenticated (Dashboard, News, Trends, Copilot, Bookmarks, plus an account menu with Profile, Settings, Logout).
- Protected pages lazy-loaded so the landing page stays fast.

## Phase 2 — Onboarding and profile

- Database: extend the profile with full name, role, company; add onboarding-completed flag; store primary interests (Spark, Iceberg, Delta Lake, Fabric, EMR, BigQuery, Snowflake, Kafka, and more), digest frequency (daily / weekly / alerts only) and preferred topics on existing preferences.
- New tables for bookmarks, reading history and recently viewed articles, each owned by one user with row-level ownership rules.
- Onboarding wizard shown once after first login (4 steps: identity, interests, digest frequency, topics), skippable, saved to the profile.
- `/profile` page: identity, saved topics, bookmarks, reading history, digest and notification preferences, and placeholder cards for subscription and API usage.
- Empty states across dashboard/news/trends for brand-new users: popular technologies, trending articles, suggested topics.
- Bookmark action on article cards, backed by the new bookmarks table.

## Phase 3 — Session hygiene and security

- Persistent sessions with automatic token refresh, a configurable idle timeout, and a graceful "session expired" redirect that preserves the intended page.
- Secure logout that clears local state and cached profile.
- Row-level security and explicit grants on every new table, scoped to the owner.
- Audit log table capturing sign-ins, sign-outs, failed sign-ins and privileged actions; written server-side.
- Privileged reads/writes stay in backend functions; the browser only ever uses the publishable key.
- Note: the backend has no standard rate-limiting primitive, so rate limiting is deferred rather than hand-rolled.

## Phase 4 — Usage analytics

- `analytics_events` table (user, event name, properties, occurred_at) plus a `user_sessions` table for login count and session duration.
- Client tracking hook recording: signup, login, logout, page views, searches, copilot questions, topic views, bookmarks, digest subscription changes.
- Server-side rollup function producing daily/monthly active users, retention and most-viewed topics.
- Users only ever read their own events; aggregate reads are admin-only.

## Phase 5 — Digest subscriptions and notifications

- Digest preferences (daily / weekly / breaking alerts / custom topics), pause switch, and digest history visible on the profile.
- Notification centre scaffold: digest delivered, breaking news, saved searches, vendor alerts, system messages — stored per user, unread badge in the navbar.
- Actual email delivery stays blocked on a sender domain; the UI and data model ship ready for it.

## Phase 6 — Admin foundation and metrics

- Admin-only area (existing `admin` role and role-check function) for: source management (enable/disable, crawl status), failed jobs, user list, and the analytics dashboard.
- Analytics dashboard surfaces registered users, DAU/WAU, popular technologies, vendor interest, copilot usage, trend views, bookmarks, retention and pipeline cost tracking.

## Later (designed for, not built now)

Organizations and teams, richer role-based access, enterprise SSO, API access, billing and subscriptions, white-label and custom domains. Schemas in earlier phases leave room for an organization owner without adding it yet.

---

## Technical notes

- Route protection is a `RequireAuth` wrapper around protected route elements, driven by the existing auth context; server-side ownership is enforced by row-level policies, not the wrapper.
- Every new table follows create → grant → enable row level security → policies in one migration, scoped to `auth.uid()`. The public snapshots table keeps its public read access so the landing page and existing pipeline are unaffected.
- Profile is cached in the query client and hydrated once per session to avoid blocking renders.
- Analytics writes are fire-and-forget inserts from the client for user-visible events, and server-side inserts for anything trust-sensitive.
- Existing pipeline, copilot and trends logic is untouched; pages are only moved and wrapped.

## Sequencing

Each phase ships and is verified before the next. This session covers **Phase 1** only; I'll check in before Phase 2.

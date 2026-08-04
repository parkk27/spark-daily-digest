# Redesign the Sign In Page

Turn `/auth` from a bare form into a split-screen SaaS landing + auth experience, keeping the existing dark theme and every existing auth call unchanged.

## Layout

```text
Desktop (lg+)                          Mobile
+---------------------+------------+   +------------------+
| Story panel  (60%)  | Auth (40%) |   | Auth card        |
| brand, capabilities | sticky,    |   | trust indicators |
| stats, callout      | centered   |   | story panel      |
+---------------------+------------+   +------------------+
```

On mobile the auth card comes first so signing in stays one tap away; the story content stacks below it.

## Left panel (storytelling)

- Brand lockup: Zap mark + "Big Data Intelligence Hub", subtitle and description exactly as specified.
- Six capability cards in a 2-column grid (1 column on small screens), each with a Lucide icon: Daily Intelligence (Newspaper), Technology Trends (TrendingUp), Vendor Intelligence (Building2, with the vendor list), AI Copilot (Sparkles), Trend Detection (Radar), Strategic Insights (Lightbulb). Glass-style cards with subtle border, hover lift.
- Stats strip: 50+ Trusted Sources, 500+ Articles Processed, 20+ Technologies Tracked, Daily Executive Briefings — driven by a single exported `AUTH_STATS` array so values are easy to update later.
- Callout card with the curated-briefing quote, accent-tinted background.
- Footer line: "Built for" + pill chips (Product Managers, Platform Engineers, Solution Architects, Data Leaders, Cloud Engineers).

## Right panel (authentication)

- "Welcome back" heading over the existing Tabs (Sign in / Create account), same fields, same handlers.
- Additions that are pure UI or thin wrappers on existing auth: a "Remember me" checkbox, a "Forgot password?" link that sends a reset email, and the existing magic-link button. Google sign-in stays wired as today; Microsoft and GitHub render as disabled "coming soon" buttons.
- Trust indicators under the card: public information only, no proprietary data collected, secure authentication (worded as "secure authentication on our managed backend").
- Panel is sticky on desktop so it stays in view while the story scrolls.

## Visual style

Existing dark tokens only — no new hardcoded colors. Add a couple of reusable tokens to `index.css` (auth aurora gradient, glass surface, soft shadow) and matching Tailwind entries. Subtle radial gradient backdrop, `animate-fade-in` on section entry, gentle hover transitions. No decorative excess.

## Technical notes

- All work lives in `src/pages/AuthPage.tsx`, split into small presentational components under `src/components/auth/` (`AuthStoryPanel`, `CapabilityCard`, `StatsStrip`, `TrustIndicators`, `AuthFooterAudience`), plus token additions in `src/index.css` / `tailwind.config.ts`.
- `handleSignIn`, `handleSignUp`, `handleMagicLink`, `handleGoogle`, the redirect effect and routing are untouched. "Remember me" is presentational state only (sessions already persist). "Forgot password" is the one new auth call: `supabase.auth.resetPasswordForEmail` — say the word if you'd rather leave it as a placeholder link.
- SEO head stays as-is; headings kept to a single H1 with semantic sections and keyboard-reachable controls.

# Landing page: attribution + guided journey

Three changes on the public landing page (`/`), keeping the current dark, Notion/Stripe-style card aesthetic.

## 1. Remove the demo caveat
Delete the line "No sign-up required to explore the demo." under the hero buttons.

## 2. Author attribution at the top
Add a small line above the hero heading, in the existing pill/badge style:
"Prepared by Kunal Parekh" — muted, uppercase-tracking, sitting next to or just above the "Updated continuously" chip so it reads as authorship, not a marketing claim.

## 3. Guided journey: how to act on what you receive
New section between the feature grid and the closing CTA, in the spirit of the Robin PM reference (a decision-oriented walkthrough that ends in an outcome, not a feature list). Five numbered steps, each with a one-line "what you get" and a one-line "what you do next":

```text
1. Read the brief      → the single biggest change today        → decide if it touches your roadmap
2. Check momentum      → which topics are accelerating/fading   → pick the one or two worth tracking
3. Open Compare        → where Fabric Spark stands vs. rivals   → find the gap that matters to your buyer
4. Work the Radar      → act now / watch / deprioritize         → log a decision with an owner
5. Ask the Copilot     → grounded answers with citations        → arm sales, product or strategy
```

Rendered as a vertical numbered list of cards on desktop (step index in a circle, title, the two lines), stacking on mobile. Each step links to its public preview route where one exists (`/preview`, `/preview/compare`, `/preview/radar`) and to `/signup` otherwise, so a visitor can follow the path live.

Section closes with a single line reinforcing the outcome: intelligence becomes a logged decision, not more reading.

## Technical notes
- Only `src/pages/LandingPage.tsx` changes; steps defined as a local const array like the existing `FEATURES`.
- Semantic tokens only (`text-muted-foreground`, `border-border`, `bg-card`, `text-primary`); no hardcoded colors.
- Single `h1` preserved; journey steps use `h2`/`h3` correctly for SEO.

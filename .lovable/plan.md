# Big Data Intelligence Hub v3 — Strategic Intelligence Platform

Turn the app from "what happened" into "why it matters / what to do next", keeping the current dark, card-based visual design. Delivered in 5 phases so each one ships something usable.

## Current state (verified)

- Pages today: Dashboard, News, Trends, Compare, Copilot, Settings + public pages. No Bookmarks, Sources, Profile, or Action Radar.
- Compare already benchmarks Fabric Spark vs Databricks / BigQuery / EMR / Snowflake / Apache Spark with position, differentiators, customer impact, confidence and role actions — from a hand-written file (`src/data/features.ts`), not from live data.
- Database has: profiles, user_roles, user_preferences, watchlists, saved_searches, spark_daily_snapshots. No tables for recommendations, bookmarks, sources, or analytics.
- Copilot is a streaming chat grounded in the last 7 daily snapshots.

## Phase 1 — Navigation, Executive Summary, Decision Intelligence

- Add the full nav: Dashboard, News, Trends, Competitive Intelligence, Action Radar, AI Copilot, Bookmarks, Sources, Profile, Settings (overflow menu on small screens so the bar stays clean).
- Executive Summary card at the top of Dashboard: Most Important Change Today, Top Opportunity, Top Competitive Risk, Highest Priority Action, Vendor Leading Innovation, Market Direction, Strategic Outlook.
- Decision Intelligence per article: importance, confidence, strategic / customer / commercial impact, engineering complexity, recommended next action, suggested owner, evidence summary, timeline. Generated in the daily pipeline and stored in the snapshot; shown as a compact expandable block on each news card.
- Explainability pattern used everywhere from here on: every AI output carries why-generated, supporting evidence, contributing sources, confidence.

## Phase 2 — Action Radar

- New page that converts intelligence into prioritized, owned actions.
- Sections: High Priority This Week, PM / Engineering / Sales / GTM actions, Leadership Watchlist, Roadmap Review Candidates, Emerging Opportunities, Competitive Risks, Customer Signals, Technology Bets.
- Each recommendation: title, summary, owner, priority, confidence, evidence count, related vendor, related technologies, suggested due date, status (New / Investigating / Accepted / Completed / Dismissed).
- Recommendations are generated daily from snapshots plus competitive benchmarks; users can change status, and status changes persist per user.

## Phase 3 — Competitive Intelligence upgrade

- Rename Compare to Competitive Intelligence; remove any "Our Baseline" wording in favour of "Fabric Spark Capability" vs "Competitor Capability".
- Extend each benchmark card with the missing fields: capability gap, strategic importance, evidence sources, GTM action, roadmap implication, suggested customer messaging, related trends, recent vendor activity.
- Link benchmarks to live data: supporting articles and recent vendor activity pulled from recent snapshots by vendor and topic, so cards stay current instead of static.

## Phase 4 — Trend Intelligence, Bookmarks, Sources, Profile

- Trends page adds: innovation velocity, market attention, predictive trends, opportunity signals, threat signals, alongside existing growth / emerging / declining / vendor momentum.
- Bookmarks: save articles, benchmarks and recommendations; per-user list with notes.
- Sources: transparency page listing every ingested source, category, last fetch, article counts and reliability, plus per-source signal contribution.
- Profile: display name, avatar, role (PM / Engineering / Sales / GTM / Leadership) — role drives default filtering on Action Radar and Dashboard.

## Phase 5 — Copilot depth, Analytics, Future-ready architecture

- Copilot gains task modes: compare vendors, explain a trend, executive summary, PM recommendations, GTM messaging, battlecards, roadmap actions — each grounded only in platform data with visible evidence.
- Analytics (admin view): engagement, most viewed comparisons, most accepted recommendations, common technologies, active competitors, action completion rate, recommendation acceptance rate, average confidence.
- Architecture prepared for future integrations: role-based access already in place, plus workspace-scoped IDs on new tables, a versioned read API surface, and an outbound event hook so Slack / Teams / Jira / Azure DevOps / Salesforce / email / webhooks can be added later without reshaping data.

## Technical notes

- New tables: `recommendations`, `recommendation_status` (per-user), `bookmarks`, `sources`, `article_intelligence`, `analytics_events`, plus `workspace_id` columns reserved on new tables. RLS + GRANTs on all of them; recommendations readable by all authenticated users, status/bookmarks scoped to `auth.uid()`.
- New edge functions: `generate-recommendations` (daily, writes Action Radar items), `score-articles` (Decision Intelligence fields during ingestion). Existing `spark-scrape` and `spark-trend-insights` extended rather than replaced.
- Copilot context expands to include recommendations and benchmark data; modes are prompt presets, not separate functions.
- Frontend: new pages under `src/pages`, shared explainability component (`EvidencePopover`) reused across article, benchmark and recommendation cards. Existing tokens and card styling reused — no new visual language.
- AI calls stay on Lovable AI with the current Gemini Flash default; scoring runs in batch during ingestion to keep cost predictable.

## Scope note

Enterprise SSO, team workspaces, public API, and the Slack/Teams/Jira/Salesforce integrations are prepared for architecturally in Phase 5 but not built — they are separate follow-on work.

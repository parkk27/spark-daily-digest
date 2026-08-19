# Presentation Script — "From Problem to Production"

Deliverable: a single speaker script file, `/mnt/documents/presentation-script.md`, that follows your Gamma deck section by section and tells the story of how this application was actually built.

No app code changes.

## Structure of the script

One block per deck slide/section, each with:
- **Slide cue** — what's on screen
- **Say** — the spoken script, written in first person, conversational, not read-aloud-stiff
- **Timing** — target minutes
- **Room interaction** — where you pause and ask the audience

Sections mirrored from the deck:

1. Intro + facilitator (Kunal Parekh, Microsoft, VLDB 2024, vibe-coded portfolio)
2. The core question — idea to working product in days
3. Traditional path vs AI-native path (prototype ⇄ test loop)
4. The scenario + "Ask the room": 50+ signals before 9am
5. Volume / context / action problems, the decision funnel
6. Section 01 — Start with the problem (5 failure modes)
7. Section 02 — Job to be done, and what NOT to build
8. Section 03 — Product hypothesis, the five surfaces
9. Section 04 — AI-native PM workflow and the stack I did NOT build first
10. Section 05 — Prototype as a question
11. Section 06 — Productionization (prototype vs production table)
12. Version history v0 → v6, and the phase-by-phase build flow (Phase 0–7)
13. The Master Prompt — five inputs, why it generalizes
14. Section 07 — What AI changed for the PM (six lessons)
15. Section 08 — What's next
16. Three questions every PM should ask
17. **Live demo** — News → Trends → Compare → Executive Intelligence → Action Radar → one signal to a recorded decision
18. The biggest demo moment (Databricks serverless economics threat card)
19. Information → Intelligence → Decision → Action → Outcome
20. Close + Q&A

## What makes this script specific to your build

The script won't stay abstract at the build sections — it will name the real things in this project, so the "how I built it" story is concrete:

- Signal ingestion: scheduled scraping of vendor/ecosystem blogs, dedupe, two-tier relevance filtering (strict tier for the executive brief, relaxed tier for the news feed), AI summarization.
- Scoring: deterministic, explainable six-factor breakdown (strategic relevance, customer impact, competitive intensity, momentum, evidence confidence, urgency) — not a black-box score.
- Signal classification: seven signal types plus opportunity / threat / neutral polarity, from the Microsoft Fabric Spark perspective, benchmarked against Databricks, BigQuery, AWS EMR, Snowflake, Apache Spark.
- Trends: 30-day momentum — growing, emerging, declining.
- Action Radar 2.0: decisions stored as decision records with reason, stakeholders, next step and review date — plus append-only decision history and a stable signal key so decisions survive a radar refresh. This is the concrete answer to "what happens after the AI recommends something".
- Production hardening: auth (Google + magic link), row-level security, secret management, scheduled refresh, public no-login preview, guided product tour.

## Demo runbook (appendix in the same file)

- Exact click path, in order, with the URL for each step and one line to say on each screen.
- Pre-flight checklist: sign in beforehand in a second tab, warm the dashboard, confirm the day's data is fresh.
- Fallbacks: if live data or auth misbehaves, switch to the public preview routes; if network fails, narrate from the screenshots.
- Two backup answers for likely questions: "how much did it cost / how long did it take" and "how do you stop the AI hallucinating".

## Question before I write it

The default is a 30-minute talk with roughly 18 minutes of narrative and 10 minutes of live demo, delivered in person. If your slot is different, tell me the length and I'll scale the timings.

# Hosting the frontend on Vercel

## What you actually need

Only two values, and both are public by design:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://dpjzypvarubkomehrwht.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the anon key already in the project `.env` |
| `VITE_SUPABASE_PROJECT_ID` | `dpjzypvarubkomehrwht` (optional) |

These are meant to ship in the browser bundle; Row Level Security protects the data.

The other three keys stay where they are and must never go into Vercel:

- `FIRECRAWL_API_KEY` — connector-managed, write-only, used only by the scrape edge function.
- `LOVABLE_API_KEY` — auto-provisioned, write-only, used by the copilot / trend-insight / email functions.
- `OPENAI_API_KEY` — not configured at all; the app calls the Lovable AI gateway instead.

All edge functions keep running on Lovable Cloud regardless of where the frontend is hosted. The Vercel build only needs to reach them over HTTPS, which it already does.

## Steps

1. Push the project to GitHub (Chat input + → GitHub → Connect project) so Vercel can import it.
2. In Vercel: New Project → import the repo. Framework preset Vite, build command `npm run build`, output dir `dist`.
3. Add the two `VITE_` env vars above under Vercel → Settings → Environment Variables (Production + Preview).
4. Add a SPA rewrite so deep links don't 404 — create `vercel.json` at the project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

5. Deploy, then point your custom domain at the Vercel deployment in Vercel → Domains.

## Follow-up items after the first Vercel deploy

- Auth redirect URLs: add the Vercel domain to the backend's allowed redirect URLs, otherwise Google sign-in and magic links bounce back to the Lovable URL.
- CORS: the edge functions already send `Access-Control-Allow-Origin: *`, so no change needed.
- `public/sitemap.xml`, `public/robots.txt`, and the canonical URLs in `SeoHead` currently reference `bigdata-hub.lovable.app`. Update them to the new domain so search engines index the right host.

## What I will change in the codebase

Only two things, both frontend/config:

1. Add `vercel.json` with the SPA rewrite.
2. Optionally swap the hardcoded `bigdata-hub.lovable.app` origin in the SEO files/component for the new domain — tell me the domain and I will do it in the same pass.

Note: hosting on Vercel is optional. A custom domain can be attached directly in Lovable (Project Settings → Domains) with no second host involved.

// Generates one-sentence "why it matters" insights for trending topics.
// Stateless: takes trends + articles, returns { insights: { topic, why }[] }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface Trend { topic: string; status: string; today: number; yesterday: number; change: number }
interface Article { title: string; source?: string; summary?: string; tags?: string[] }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { trends, articles } = await req.json() as { trends: Trend[]; articles: Article[] };
    if (!Array.isArray(trends) || trends.length === 0) {
      return new Response(JSON.stringify({ insights: [] }), { headers: corsHeaders });
    }

    // Pick the topics that matter for insight generation (movers + new + declining)
    const topics = [...trends]
      .filter((t) => t.status !== "stable" || Math.abs(t.change) > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 12);

    // Build compact per-topic article evidence (tag match, title only, max 4)
    const evidence = topics.map((t) => {
      const matched = (articles ?? [])
        .filter((a) => (a.tags ?? []).some((tag) => tag.toLowerCase().includes(t.topic.toLowerCase())))
        .slice(0, 4)
        .map((a) => ({ title: a.title, source: a.source }));
      return { topic: t.topic, status: t.status, change: t.change, today: t.today, yesterday: t.yesterday, articles: matched };
    });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: corsHeaders });
    }

    const system = `You are a Senior Data Platform Product Leader writing executive briefings about the big data ecosystem (Spark, Iceberg, Delta, Fabric, EMR, BigQuery, Databricks, Snowflake, etc.).

For each topic, return ONE sentence (max 22 words) explaining WHY it is trending today, grounded ONLY in the provided article evidence. Focus on architectural shifts, vendor strategy, or competitive implications. No fluff, no tutorials, no hedging.

If a topic has no article evidence, infer the strategic angle from its status (new = early signal, declining = losing mindshare) in ≤15 words.

Return strict JSON: {"insights":[{"topic":"...","why":"..."}]}`;

    const userPrompt = `Topics with evidence:\n${JSON.stringify(evidence, null, 2)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      return new Response(JSON.stringify({ insights: [], error: `gateway ${resp.status}` }), { headers: corsHeaders });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { insights?: { topic: string; why: string }[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    return new Response(JSON.stringify({ insights: parsed.insights ?? [] }), { headers: corsHeaders });
  } catch (e) {
    console.error("spark-trend-insights error", e);
    return new Response(JSON.stringify({ insights: [], error: String(e) }), { status: 200, headers: corsHeaders });
  }
});

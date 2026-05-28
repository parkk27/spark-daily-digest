import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_DOMAINS = [
  "spark", "apache spark", "iceberg", "delta", "delta lake",
  "fabric", "lakehouse", "emr", "aws", "bigquery", "google cloud",
  "databricks", "microsoft", "snowflake", "data platform", "data engineering",
  "etl", "elt", "pipeline", "warehouse", "streaming", "kafka", "flink",
];

function trimContext(snapshots: any[]) {
  if (!snapshots?.length) return null;
  const [latest, ...rest] = snapshots;
  return {
    latest: {
      date: latest.date,
      summary: latest.summary?.summary ?? latest.summary,
      trends: latest.summary?.trends ?? [],
      articles: (latest.summary?.all_articles ?? latest.summary?.articles ?? [])
        .slice(0, 25)
        .map((a: any) => ({
          title: a.title,
          source: a.source,
          summary: a.summary,
          tags: a.tags,
          link: a.link,
        })),
    },
    history: rest.slice(0, 6).map((s) => ({
      date: s.date,
      trends: (s.summary?.trends ?? []).slice(0, 10),
      headlines: (s.summary?.all_articles ?? s.summary?.articles ?? [])
        .slice(0, 8)
        .map((a: any) => ({ title: a.title, source: a.source })),
    })),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: snapshots } = await supabase
      .from("spark_daily_snapshots")
      .select("date, summary")
      .order("date", { ascending: false })
      .limit(7);

    const context = trimContext(snapshots ?? []);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });

    const system = `You are the Big Data Hub Copilot — a senior data platform analyst and strategic ecosystem advisor for executives.

SCOPE — answer ONLY about the modern big data ecosystem:
${ALLOWED_DOMAINS.join(", ")}.

RULES:
- Ground every answer in the provided INTELLIGENCE CONTEXT (recent snapshots, summaries, trends, articles). Do NOT invent facts or use outside knowledge.
- If the context has no relevant information for the question, reply exactly: "No relevant ecosystem data available for that question yet."
- Refuse off-topic, coding, or general-knowledge questions with: "I'm focused on big data ecosystem intelligence — try asking about Spark, Iceberg, Delta, Fabric, EMR, BigQuery, or Databricks."
- Tone: concise, executive briefing. Insight-first, not tutorial.
- Format: short bold takeaway line, then 2–5 tight bullets. Reference article titles or vendor names when citing. Note momentum (growing/new/declining) when discussing trends.
- When comparing vendors, surface competitive patterns and strategic implications.
- Prioritize the LATEST snapshot; use HISTORY only for momentum/comparison.

INTELLIGENCE CONTEXT (JSON):
${JSON.stringify(context, null, 2)}`;

    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    console.error("spark-copilot error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

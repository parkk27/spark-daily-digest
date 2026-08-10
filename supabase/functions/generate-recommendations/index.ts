import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Owner = "product" | "engineering" | "sales" | "gtm" | "leadership";

type SignalType =
  | "competitive" | "customer" | "technology" | "market" | "commercial" | "regulatory" | "ecosystem";

const SIGNALS: { re: RegExp; weight: number; label: string; owner: Owner; signalType: SignalType }[] = [
  { re: /pricing|cost|tco|serverless|savings/i, weight: 3, label: "Commercial / pricing signal", owner: "product", signalType: "commercial" },
  { re: /architecture|design|lessons|migration|case study/i, weight: 3, label: "Architectural analysis", owner: "engineering", signalType: "technology" },
  { re: /benchmark|performance|latency|throughput|photon/i, weight: 2, label: "Performance evidence", owner: "engineering", signalType: "technology" },
  { re: /governance|catalog|lineage|security|compliance/i, weight: 2, label: "Governance relevance", owner: "leadership", signalType: "regulatory" },
  { re: /agent|ai|ml|llm|copilot|genai/i, weight: 3, label: "AI ecosystem movement", owner: "product", signalType: "technology" },
  { re: /iceberg|delta|open table|interoperab/i, weight: 3, label: "Open format convergence", owner: "product", signalType: "ecosystem" },
  { re: /general availability|launch|announce/i, weight: 1, label: "Vendor announcement", owner: "gtm", signalType: "market" },
  { re: /customer|adoption|enterprise/i, weight: 2, label: "Customer signal", owner: "sales", signalType: "customer" },
];

const OFFICIAL = ["databricks", "aws", "microsoft", "google", "snowflake", "iceberg", "spark"];
/** Named competitors — Microsoft/Fabric is our own platform, never a competitive threat. */
const COMPETITORS = ["databricks", "aws", "google", "snowflake"];
const COMPETITIVE_PATTERNS = /pricing|performance|benchmark|customer/i;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: snap } = await supabase
      .from("spark_daily_snapshots")
      .select("date, summary")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap) {
      return new Response(JSON.stringify({ success: false, error: "no snapshot" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const s: any = snap.summary ?? {};
    const articles: any[] = s.all_articles ?? s.articles ?? [];
    const trends: any[] = s.trends ?? [];

    const rows = articles.map((a) => {
      const hay = `${a.title} ${a.summary} ${(a.tags ?? []).join(" ")}`;
      const matched = SIGNALS.filter((sig) => sig.re.test(hay));
      const official = OFFICIAL.some((o) => String(a.source ?? "").toLowerCase().includes(o));
      const depth = Math.min(3, Math.round(String(a.summary ?? "").length / 120));
      const score = Math.min(10, matched.reduce((n, m) => n + m.weight, 0) + depth + (official ? 2 : 0));
      const owner = matched[0]?.owner ?? "product";
      const section = score >= 7 ? "act_now" : score >= 4 ? "watch" : "deprioritize";
      const boost = trends.some((t) => hay.toLowerCase().includes(String(t.topic).toLowerCase()) && t.status !== "declining");

      const src = String(a.source ?? "").toLowerCase();
      const competitor = official && COMPETITORS.some((c) => src.includes(c)) && !/microsoft|fabric/.test(src);
      const competitiveMove = competitor && matched.some((m) => COMPETITIVE_PATTERNS.test(m.label));

      const signal_type: SignalType = competitor && !matched.length
        ? "competitive"
        : (matched[0]?.signalType ?? (competitor ? "competitive" : "market"));

      const polarity = competitor ? "threat" : boost ? "opportunity" : "neutral";

      const weightSum = matched.reduce((n, m) => n + m.weight, 0);
      const priority = score >= 8 ? "high" : score >= 5 ? "medium" : "low";
      const score_breakdown = {
        strategic_relevance: clamp((weightSum / 12) * 100),
        customer_impact: matched.some((m) => m.signalType === "customer") ? 90 : 25,
        competitive_intensity: competitiveMove ? 95 : competitor ? 75 : signal_type === "competitive" ? 60 : 20,
        momentum: boost ? 85 : 35,
        evidence_confidence: clamp((official ? 60 : 25) + matched.length * 8),
        urgency: priority === "high" ? 90 : priority === "medium" ? 60 : 30,
      };

      return {
        date: snap.date,
        section,
        title: a.title,
        summary: a.summary,
        owner,
        priority,
        signal_type,
        polarity,
        score_breakdown,
        confidence: Math.min(97, 45 + (official ? 25 : 5) + matched.length * 6 + (boost ? 5 : 0)),
        evidence_count: matched.length + (official ? 1 : 0),
        evidence: [
          `Source: ${a.source}${official ? " (official vendor blog)" : ""}`,
          ...matched.map((m) => m.label),
          ...(boost ? ["Matches an active topic trend"] : []),
        ],
        rationale: `Deterministic score ${score}/10 from ${matched.length} matched signal(s), source reliability and analysis depth.`,
        related_vendor: a.source ?? null,
        related_technologies: a.tags ?? [],
        due_date: null,
      };
    });

    await supabase.from("recommendations").delete().eq("date", snap.date);
    const { error } = await supabase.from("recommendations").insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: rows.length, date: snap.date }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendations", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

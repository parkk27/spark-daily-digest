import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const slugify = (v: string) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

/** Promotes a Compare capability gap into an Action Radar signal (authenticated users only). */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await anon.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const vendor = String(body.vendor ?? "").slice(0, 80);
    const capability = String(body.capability ?? "").slice(0, 160);
    const gap = String(body.gap ?? "").slice(0, 1000);
    const impact = String(body.impact ?? "").slice(0, 1000);
    const confidence = Number.isFinite(body.confidence) ? Number(body.confidence) : 70;
    if (!vendor || !capability) {
      return new Response(JSON.stringify({ success: false, error: "vendor and capability are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const row = {
      date: new Date().toISOString().slice(0, 10),
      signal_key: `compare:${slugify(vendor)}-${slugify(capability)}`,
      section: "watch",
      title: `${capability} — capability gap vs. ${vendor}`,
      summary: gap || `Capability comparison against ${vendor} for ${capability}.`,
      owner: "product",
      priority: "medium",
      signal_type: "competitive",
      polarity: "threat",
      score_breakdown: {
        strategic_relevance: 70,
        customer_impact: 60,
        competitive_intensity: 85,
        momentum: 40,
        evidence_confidence: Math.max(0, Math.min(100, confidence)),
        urgency: 60,
      },
      confidence: Math.max(0, Math.min(100, confidence)),
      evidence_count: 1,
      evidence: [`Compare benchmark: ${vendor} — ${capability}`, impact].filter(Boolean),
      rationale: "Promoted from the Compare workspace as a tracked capability gap.",
      related_vendor: vendor,
      related_technologies: [],
      due_date: null,
    };

    const { error } = await admin
      .from("recommendations")
      .upsert([row], { onConflict: "date,signal_key" });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, signal_key: row.signal_key }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("add-radar-signal", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

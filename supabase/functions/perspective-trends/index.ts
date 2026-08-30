import { createClient } from "npm:@supabase/supabase-js@2";
import { getPerspective, DEFAULT_PERSPECTIVE_ID } from "../_shared/perspectives.ts";
import {
  computePerspectiveTrends,
  MOMENTUM_CONFIG,
  type MomentumSignal,
} from "../_shared/momentum.ts";
import { perspectiveRelevance, strategicImpact } from "../_shared/perspectiveScoring.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OFFICIAL = ["databricks", "aws", "microsoft", "google", "snowflake", "iceberg", "spark"];
const CACHE_MS = 1000 * 60 * 60 * 6;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const started = Date.now();
  try {
    let perspectiveId = DEFAULT_PERSPECTIVE_ID;
    try {
      const body = await req.json();
      if (typeof body?.perspective_id === "string" && body.perspective_id.length <= 64) {
        perspectiveId = body.perspective_id;
      }
    } catch { /* empty body → default perspective */ }

    const perspective = getPerspective(perspectiveId);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Serve the cache when it is fresh (recompute at most every 6 hours).
    const { data: cached } = await supabase
      .from("perspective_trend_snapshots")
      .select("*")
      .eq("perspective_id", perspective.id)
      .order("window_end", { ascending: false })
      .limit(200);

    if (cached?.length) {
      const newest = cached.reduce((a, b) => (a.created_at > b.created_at ? a : b));
      if (Date.now() - Date.parse(newest.created_at) < CACHE_MS) {
        console.log(JSON.stringify({ fn: "perspective-trends", perspective: perspective.id, cache: "hit", rows: cached.length }));
        return json({ success: true, cached: true, perspective: perspective.id, trends: cached });
      }
    }

    // 2. Rolling 60-day signal history from daily snapshots.
    const { data: snaps, error: snapErr } = await supabase
      .from("spark_daily_snapshots")
      .select("date, summary")
      .order("date", { ascending: false })
      .limit(MOMENTUM_CONFIG.window_days * 2 + 1);
    if (snapErr) throw snapErr;
    if (!snaps?.length) return json({ success: false, error: "no snapshots", trends: [] }, 404);

    const signals: MomentumSignal[] = [];
    for (const snap of snaps) {
      const s: any = snap.summary ?? {};
      const articles: any[] = s.all_articles ?? s.articles ?? [];
      for (const a of articles) {
        const src = String(a.source ?? "").toLowerCase();
        signals.push({
          id: "",
          date: a.date ?? snap.date,
          title: a.title,
          summary: a.summary,
          source: a.source ?? null,
          url: a.link ?? a.url ?? null,
          tags: a.tags ?? [],
          official: OFFICIAL.some((o) => src.includes(o)),
          competitive: perspective.competitors.some((c) => src.includes(c.toLowerCase())),
        });
      }
    }

    // 3. Strategic relevance / impact per entity from existing recommendation scores.
    const { data: recs } = await supabase
      .from("recommendations")
      .select("title, summary, source:related_vendor, related_technologies, score_breakdown")
      .order("date", { ascending: false })
      .limit(500);

    const agg = new Map<string, { rel: number[]; imp: number[]; comp: number[] }>();
    for (const r of recs ?? []) {
      const rel = perspectiveRelevance(r as any, perspective).score;
      const imp = strategicImpact((r as any).score_breakdown);
      const comp = Number((r as any).score_breakdown?.competitive_intensity ?? 0);
      const text = `${r.title ?? ""} ${r.summary ?? ""} ${(r.related_technologies ?? []).join(" ")}`.toLowerCase();
      for (const t of [...perspective.core_topics, ...perspective.related_topics, ...perspective.competitors]) {
        if (!text.includes(t.toLowerCase())) continue;
        const key = t.toLowerCase();
        const e = agg.get(key) ?? { rel: [], imp: [], comp: [] };
        e.rel.push(rel);
        e.imp.push(imp);
        e.comp.push(comp);
        agg.set(key, e);
      }
    }
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

    const today = snaps[0].date as string;
    const trends = computePerspectiveTrends(perspective, signals, {
      today,
      strategicRelevance: (id) => avg(agg.get(id)?.rel ?? []),
      impactScore: (id) => avg(agg.get(id)?.imp ?? []),
      competitiveIntensity: (id) => avg(agg.get(id)?.comp ?? []) || undefined as unknown as number,
    });

    const lowData = trends.filter((t) => t.momentum_direction === "LOW_DATA").length;
    console.log(JSON.stringify({
      fn: "perspective-trends", perspective: perspective.id, cache: "miss",
      signals: signals.length, entities: trends.length, low_data: lowData, ms: Date.now() - started,
    }));

    const rows = trends.map((t) => ({
      perspective_id: t.perspective_id,
      entity_id: t.entity_id,
      entity_name: t.entity_name,
      entity_kind: t.entity_kind,
      window_start: t.window_start,
      window_end: t.window_end,
      current_activity: t.current_activity,
      baseline_activity: t.baseline_activity,
      momentum_percent: t.momentum_percent,
      momentum_direction: t.momentum_direction,
      trend_confidence: t.trend_confidence,
      top_drivers: t.top_drivers,
      strategic_relevance: t.strategic_relevance,
      competitive_intensity: t.competitive_intensity,
      impact_score: t.impact_score,
      rationale: t.rationale,
      created_at: new Date().toISOString(),
    }));

    const { error: upErr } = await supabase
      .from("perspective_trend_snapshots")
      .upsert(rows, { onConflict: "perspective_id,entity_id,window_end" });
    if (upErr) console.error("perspective-trends upsert", upErr.message);

    return json({ success: true, cached: false, perspective: perspective.id, trends });
  } catch (e) {
    console.error("perspective-trends", e);
    return json({ success: false, error: String(e), trends: [] }, 500);
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function getLatestSummary(): Promise<{
  date: string;
  summary: Record<string, unknown>;
} | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;

  const resp = await fetch(
    `${url}/rest/v1/spark_daily_snapshots?order=date.desc&limit=1&select=date,summary`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows[0] ?? null;
}

function buildEmailHtml(date: string, summary: Record<string, any>): string {
  const highlights = (summary.highlights || []) as string[];
  const trends = (summary.trends || []) as string[];
  const impact = (summary.impact || []) as string[];
  const topInsight = summary.topInsight || '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#e0e0e0;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#f97316;font-size:22px;margin:0;">⚡ Spark Intelligence Brief</h1>
    <p style="color:#888;font-size:13px;margin:6px 0 0;">${date}</p>
  </div>

  ${topInsight ? `
  <div style="background:#1a1a2e;border:1px solid #f9731640;border-radius:8px;padding:16px;margin-bottom:20px;">
    <p style="color:#f97316;font-weight:bold;font-size:14px;margin:0 0 6px;">🔥 Top Insight</p>
    <p style="font-size:14px;line-height:1.5;margin:0;color:#d0d0d0;">${topInsight}</p>
  </div>` : ''}

  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:16px;">
    <p style="color:#f97316;font-weight:bold;font-size:14px;margin:0 0 10px;">💡 Key Highlights</p>
    ${highlights.map(h => `<p style="font-size:13px;line-height:1.5;margin:0 0 8px;color:#ccc;">• ${h}</p>`).join('')}
  </div>

  ${trends.length ? `
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:16px;">
    <p style="color:#f97316;font-weight:bold;font-size:14px;margin:0 0 10px;">📈 Emerging Trends</p>
    ${trends.map(t => `<p style="font-size:13px;line-height:1.5;margin:0 0 8px;color:#ccc;">• ${t}</p>`).join('')}
  </div>` : ''}

  ${impact.length ? `
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:16px;">
    <p style="color:#f97316;font-weight:bold;font-size:14px;margin:0 0 10px;">✨ Why It Matters</p>
    ${impact.map(i => `<p style="font-size:13px;line-height:1.5;margin:0 0 8px;color:#ccc;">• ${i}</p>`).join('')}
  </div>` : ''}

  <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #222;">
    <p style="font-size:11px;color:#666;">Big Data Intelligence Hub • Daily Brief</p>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let recipientEmail = 'test@example.com';
    try {
      const body = await req.json();
      if (body?.email) recipientEmail = body.email;
    } catch { /* use default */ }

    // Get latest summary from DB
    const snapshot = await getLatestSummary();
    if (!snapshot) {
      return new Response(
        JSON.stringify({ success: false, error: 'No summary data available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = buildEmailHtml(snapshot.date, snapshot.summary as Record<string, any>);

    // Use AI gateway to format a plain-text version for logging
    console.log(`Email prepared for ${recipientEmail}, date: ${snapshot.date}`);
    console.log(`Email HTML length: ${emailHtml.length} chars`);

    // For now, return the email content as a preview (actual sending requires email service setup)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email brief generated successfully',
        preview: {
          to: recipientEmail,
          subject: `⚡ Spark Intelligence Brief — ${snapshot.date}`,
          date: snapshot.date,
          htmlLength: emailHtml.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Send email error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate email brief' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

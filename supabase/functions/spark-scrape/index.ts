const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Observability Metrics ──
interface PipelineMetrics {
  articles_fetched: number;
  articles_after_filter: number;
  duplicates_removed: number;
  summary_generated: boolean;
  used_fallback: boolean;
  processing_time_ms: number;
}

// ── Source Configuration ──
// Mix of landing pages + date-ordered feeds/category pages so the scraper sees
// fresh content as vendors publish, not just sticky "featured" hero posts.
const SOURCES = [
  { name: 'databricks', url: 'https://www.databricks.com/blog', weight: 1.0 },
  { name: 'databricks-eng', url: 'https://www.databricks.com/blog/category/engineering', weight: 1.0 },
  { name: 'google', url: 'https://cloud.google.com/blog/products/data-analytics', weight: 0.9 },
  { name: 'microsoft', url: 'https://azure.microsoft.com/en-us/blog/category/analytics/', weight: 0.9 },
  { name: 'aws', url: 'https://aws.amazon.com/blogs/big-data/feed/', weight: 0.9 },
  { name: 'iceberg', url: 'https://iceberg.apache.org/blogs/', weight: 0.95 },
  { name: 'iceberg-releases', url: 'https://github.com/apache/iceberg/releases', weight: 1.0 },
  { name: 'delta', url: 'https://delta.io/blog/', weight: 0.95 },
  { name: 'spark', url: 'https://spark.apache.org/news/', weight: 1.0 },
  { name: 'dataproc', url: 'https://cloud.google.com/dataproc/docs/release-notes', weight: 0.85 },
];

// ── Topic Tagging ──
const TOPIC_TAGS: Record<string, string> = {
  'apache spark': 'spark', 'spark 4': 'spark4', 'spark4': 'spark4',
  'spark 3': 'spark', 'pyspark': 'spark',
  'iceberg': 'iceberg', 'delta lake': 'delta', 'delta': 'delta',
  'open table': 'iceberg', 'hudi': 'iceberg',
  'databricks': 'databricks', 'fabric': 'fabric', 'microsoft fabric': 'fabric',
  'fabric lakehouse': 'fabric', 'bigquery': 'bigquery', 'dataproc': 'bigquery',
  'amazon emr': 'emr', 'emr serverless': 'emr', 'emr on eks': 'emr',
  'emr studio': 'emr', 'azure synapse': 'fabric',
  'structured streaming': 'streaming', 'streaming': 'streaming',
  'real-time': 'streaming', 'kinesis': 'streaming', 'kafka': 'streaming',
  'batch': 'batch', 'etl': 'batch',
  'machine learning': 'ai', 'mlflow': 'ai', 'artificial intelligence': 'ai',
  ' ai ': 'ai', 'ai-powered': 'ai', 'llm': 'ai', 'genai': 'ai', 'generative ai': 'ai',
  'performance': 'performance', 'optimization': 'performance',
  'latency': 'performance', 'benchmark': 'performance',
  'cost': 'cost', 'pricing': 'cost', 'cost-effective': 'cost',
  'governance': 'governance', 'unity catalog': 'governance',
  'lake formation': 'governance', 'security': 'governance',
  'photon': 'databricks', 'lakehouse': 'fabric', 'data lake': 'fabric',
  'serverless': 'emr', 'sql': 'spark', 'kubernetes': 'streaming',
  'k8s': 'streaming', 'aws glue': 'batch', 'glue etl': 'batch',
};

function extractTags(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set<string>();
  for (const [keyword, tag] of Object.entries(TOPIC_TAGS)) {
    if (lower.includes(keyword)) found.add(tag);
  }
  return found.size > 0 ? [...found] : ['spark'];
}

// ── Filtering ──
const AWS_RELEVANCE_KEYWORDS = [
  'apache spark', 'spark', 'amazon emr', 'emr serverless', 'emr on eks',
  'emr studio', 'pyspark', 'iceberg', 'hudi', 'delta lake',
  'spark sql', 'spark streaming', 'glue etl', 'aws glue',
  'lake formation', 'data lake', 'lakehouse', 'bigquery', 'dataproc',
];

const EXCLUDE_PATTERNS = [
  /get started with/i, /introduction to/i,
  /what is (amazon|apache|azure|google)/i, /beginner/i,
  /^\s*tutorial:/i, /how to get started/i, /beginner.?s? guide/i, /step.by.step/i,
];

const NOISE_PATTERNS = [
  /skip to (main )?content/i,
  /cookie/i, /subscribe/i, /newsletter/i, /sign up/i, /log ?in/i,
  /privacy policy/i, /terms of (service|use)/i, /follow us/i,
  /share (on|this)/i, /related (posts|articles)/i, /read more/i,
  /load more/i, /pagination/i, /^\s*menu\s*$/i, /navigation/i,
  /footer/i, /sidebar/i, /advertisement/i, /sponsored/i,
  /\bdf\b.*=.*spark\./i, /\.show\(\)/i, /\.filter\(/i, /\.select\(/i,
  /import \w+/i, /def \w+\(/i, /val \w+ =/i,
  /!\[.*?\]\(.*?\)/i,
];

const LOW_SIGNAL_PATTERNS = [
  /tutorial/i, /how to get started/i, /beginner.?s? guide/i,
  /step.by.step/i, /what is .{3,20}\?/i, /introduction to/i,
];

interface ScrapedArticle {
  title: string;
  source: string;        // display source (rolled-up vendor name)
  rawSource: string;     // original feed name (for cap counting)
  summary: string;
  link: string;
  tags: string[];
  date: string;
  publishedAt?: string;  // ISO date if extractable from markdown
  ageDays?: number;
  weight: number;
  signalScore: number;
}

// Roll up multiple feeds from same vendor for display + per-source diversity caps
function displaySource(rawSource: string): string {
  if (rawSource.startsWith('databricks')) return 'databricks';
  if (rawSource.startsWith('iceberg')) return 'iceberg';
  if (rawSource === 'dataproc') return 'google';
  return rawSource;
}

function isRelevantForAws(title: string, summary: string): boolean {
  const combined = `${title} ${summary}`.toLowerCase();
  if (!AWS_RELEVANCE_KEYWORDS.some((kw) => combined.includes(kw))) return false;
  if (EXCLUDE_PATTERNS.some((p) => p.test(`${title} ${summary}`))) return false;
  return true;
}

function isNoise(title: string, summary: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(`${title} ${summary}`));
}

function computeSignalScore(title: string, summary: string, sourceWeight: number): number {
  const combined = `${title} ${summary}`.toLowerCase();
  let score = sourceWeight * 5;
  const highSignal = [
    'launch', 'announce', 'release', 'general availability', 'ga ',
    'performance', 'improvement', 'optimization', 'breaking change',
    'architecture', 'strategic', 'acquisition', 'partnership',
    'benchmark', 'preview', 'roadmap', 'milestone', 'competitive',
    'cost reduction', 'scalability', 'migration',
  ];
  for (const kw of highSignal) {
    if (combined.includes(kw)) score += 2;
  }
  if (LOW_SIGNAL_PATTERNS.some((p) => p.test(combined))) score -= 3;
  if (title.length < 15) score -= 2;
  if (summary.length < 30) score -= 1;
  return Math.max(0, score);
}

// ── Date extraction ──
// Vendor blog cards usually contain a publication date near the title.
// Supported formats: "Apr 19, 2026", "April 19, 2026", "2026-04-19", "19 Apr 2026".
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function extractPublishedDate(section: string): string | undefined {
  // ISO: 2026-04-19
  const iso = section.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // "Apr 19, 2026" or "April 19, 2026"
  const us = section.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})\b/i);
  if (us) {
    const m = MONTHS[us[1].toLowerCase().slice(0, 3)];
    const d = new Date(Date.UTC(parseInt(us[3]), m, parseInt(us[2])));
    return d.toISOString().split('T')[0];
  }

  // "19 Apr 2026"
  const eu = section.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(20\d{2})\b/i);
  if (eu) {
    const m = MONTHS[eu[2].toLowerCase().slice(0, 3)];
    const d = new Date(Date.UTC(parseInt(eu[3]), m, parseInt(eu[1])));
    return d.toISOString().split('T')[0];
  }

  return undefined;
}

function ageInDays(isoDate: string): number {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / 86400000));
}

// ── Deduplication ──
function deduplicateArticles(articles: ScrapedArticle[]): { result: ScrapedArticle[]; removed: number } {
  const seen = new Map<string, ScrapedArticle>();
  let removed = 0;

  for (const article of articles) {
    const normalized = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    let isDupe = false;
    for (const [key, existing] of seen) {
      if (normalized === key) {
        if (article.signalScore > existing.signalScore) seen.set(key, article);
        isDupe = true;
        removed++;
        break;
      }
      const words1 = new Set(normalized.split(' '));
      const words2 = new Set(key.split(' '));
      const intersection = [...words1].filter((w) => words2.has(w) && w.length > 3);
      const overlap = intersection.length / Math.min(words1.size, words2.size);
      if (overlap > 0.7) {
        if (article.signalScore > existing.signalScore) {
          seen.delete(key);
          seen.set(normalized, article);
        }
        isDupe = true;
        removed++;
        break;
      }
    }
    if (!isDupe) seen.set(normalized, article);
  }

  return { result: [...seen.values()], removed };
}

function cleanSummaryText(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/[#*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Markdown Extraction ──
function extractArticlesFromMarkdown(
  markdown: string, sourceName: string, sourceUrl: string, sourceWeight: number
): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  const today = new Date().toISOString().split('T')[0];
  const sections = markdown.split(/\n#{1,3}\s+/).filter(Boolean);

  for (const section of sections.slice(0, 8)) {
    const lines = section.trim().split('\n').filter(Boolean);
    if (lines.length === 0) continue;

    const title = cleanSummaryText(lines[0]).trim();
    if (title.length < 10 || title.length > 200) continue;

    const linkMatch = section.match(/\[([^\]]*)\]\(([^)]+)\)/);
    let link = linkMatch ? linkMatch[2] : sourceUrl;
    if (link.startsWith('/')) {
      const base = new URL(sourceUrl);
      link = `${base.origin}${link}`;
    }

    const summaryRaw = lines.slice(1, 4).join(' ');
    const summary = cleanSummaryText(summaryRaw).slice(0, 200) || title;

    if (isNoise(title, summary)) continue;
    if ((sourceName === 'aws' || sourceName === 'dataproc') && !isRelevantForAws(title, summary)) continue;
    if (EXCLUDE_PATTERNS.some((p) => p.test(`${title} ${summary}`))) continue;

    const tags = extractTags(`${title} ${summary}`);
    const signalScore = computeSignalScore(title, summary, sourceWeight);
    if (signalScore < 3) continue;

    articles.push({ title, source: sourceName, summary, link, tags, date: today, weight: sourceWeight, signalScore });
  }

  return articles;
}

// ── AI Summarization (optimised: flash-lite for cost, tight prompt) ──
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function aiSummarize(articles: ScrapedArticle[]): Promise<{
  highlights: string[];
  trends: string[];
  impact: string[];
  topInsight: string;
} | null> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableKey) return null;

  // Compact article representation to minimise tokens
  const articleText = articles
    .slice(0, 10)
    .map((a, i) => `${i + 1}.[${a.source}] ${a.title} — ${a.summary.slice(0, 100)} [${a.tags.join(',')}]`)
    .join('\n');

  const prompt = `Analyze these big data ecosystem updates. Return JSON only.

${articleText}

JSON format:
{"topInsight":"one sentence key takeaway","highlights":["max 5 high-signal items"],"trends":["3-4 cross-article patterns"],"impact":["max 3 strategic implications"]}

Rules: cluster similar updates, skip tutorials/marketing, focus on product launches, perf improvements, architecture changes. Be concise.`;

  try {
    const resp = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      console.error(`AI summarization failed: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.highlights || !Array.isArray(parsed.highlights) || parsed.highlights.length === 0) return null;

    return {
      topInsight: parsed.topInsight || '',
      highlights: parsed.highlights.slice(0, 5),
      trends: parsed.trends?.slice(0, 4) || [],
      impact: parsed.impact?.slice(0, 3) || [],
    };
  } catch (err) {
    console.error('AI summarization error:', err);
    return null;
  }
}

// ── Trend Detection ──
function deriveTrends(
  articles: ScrapedArticle[],
  previousTagCounts?: Record<string, number>
): { topic: string; status: string; today: number; yesterday: number; change: number }[] {
  const tagCount: Record<string, number> = {};
  for (const a of articles) {
    for (const t of a.tags) {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }

  const allTopics = new Set([
    ...Object.keys(tagCount),
    ...(previousTagCounts ? Object.keys(previousTagCounts) : []),
  ]);

  return [...allTopics]
    .map((topic) => {
      const today = tagCount[topic] || 0;
      const yesterday = previousTagCounts?.[topic] ?? 0;
      const change = today - yesterday;
      let status: string;
      if (!previousTagCounts) {
        status = today >= 3 ? 'growing' : today >= 2 ? 'stable' : 'new';
      } else if (yesterday === 0 && today > 0) {
        status = 'new';
      } else if (today === 0 && yesterday > 0) {
        status = 'declining';
      } else if (change >= 2) {
        status = 'growing';
      } else if (change <= -2) {
        status = 'declining';
      } else {
        status = 'stable';
      }
      return { topic, status, today, yesterday, change };
    })
    .filter((t) => t.today > 0 || t.yesterday > 0)
    .sort((a, b) => b.today - a.today)
    .slice(0, 10);
}

// ── Fallback Summary ──
function fallbackSummary(articles: ScrapedArticle[]) {
  return {
    topInsight: articles[0]?.title || 'No significant updates today',
    highlights: articles.slice(0, 5).map((a) => a.title),
    trends: deriveTrends(articles).slice(0, 3).map((t) => `${t.topic} is ${t.status}`),
    impact: [
      articles.length > 5 ? 'High activity across the big data ecosystem' : 'Moderate activity in the big data ecosystem',
      'Continued focus on performance and open formats',
      'Growing integration between AI and data platforms',
    ],
  };
}

// ── Supabase helpers ──
function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return { url, key };
}

async function loadPreviousSnapshot(): Promise<{
  tag_counts?: Record<string, number>;
  summary?: Record<string, unknown>;
  article_count?: number;
  date?: string;
} | undefined> {
  const sb = getSupabaseClient();
  if (!sb) return undefined;
  try {
    const resp = await fetch(
      `${sb.url}/rest/v1/spark_daily_snapshots?order=date.desc&limit=1&select=tag_counts,summary,article_count,date`,
      { headers: { 'apikey': sb.key, 'Authorization': `Bearer ${sb.key}` } }
    );
    if (!resp.ok) return undefined;
    const rows = await resp.json();
    return rows[0] || undefined;
  } catch { return undefined; }
}

async function saveSnapshot(date: string, tagCounts: Record<string, number>, articleCount: number, summary: Record<string, unknown>) {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    await fetch(`${sb.url}/rest/v1/spark_daily_snapshots`, {
      method: 'POST',
      headers: {
        'apikey': sb.key, 'Authorization': `Bearer ${sb.key}`,
        'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ date, tag_counts: tagCounts, article_count: articleCount, summary }),
    });
  } catch (err) { console.error('Failed to save snapshot:', err); }
}

// ── Main Handler ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const metrics: PipelineMetrics = {
    articles_fetched: 0,
    articles_after_filter: 0,
    duplicates_removed: 0,
    summary_generated: false,
    used_fallback: false,
    processing_time_ms: 0,
  };

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting big data ecosystem scrape...');

    // Step 1: Ingest — fetch from all sources in parallel
    const scrapePromises = SOURCES.map(async (source) => {
      try {
        console.log(`Scraping ${source.name}: ${source.url}`);
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: source.url,
            formats: ['markdown'],
            onlyMainContent: true,
            maxAge: 3600000, // Re-scrape if cache > 1 hour (ensures freshness)
          }),
        });
        if (!response.ok) {
          console.error(`Failed to scrape ${source.name}: ${response.status}`);
          return [];
        }
        const data = await response.json();
        const markdown = data.data?.markdown || data.markdown || '';
        return extractArticlesFromMarkdown(markdown, source.name, source.url, source.weight);
      } catch (err) {
        console.error(`Error scraping ${source.name}:`, err);
        return [];
      }
    });

    const results = await Promise.all(scrapePromises);
    let allArticles = results.flat();
    metrics.articles_fetched = allArticles.length;

    console.log(`Scraped ${allArticles.length} raw articles`);

    // Load previous snapshot (needed for trends AND fallback)
    const previousSnapshot = await loadPreviousSnapshot();

    // Step 2-5: Filter, Deduplicate, Tag, Sort
    if (allArticles.length === 0) {
      // ── Fallback: use previous day's data ──
      console.log('No articles fetched, falling back to previous snapshot');
      metrics.used_fallback = true;

      if (previousSnapshot?.summary) {
        const today = new Date().toISOString().split('T')[0];
        const prevSummary = previousSnapshot.summary as { topInsight?: string; highlights?: string[]; trends?: string[]; impact?: string[] };
        metrics.processing_time_ms = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: {
            date: previousSnapshot.date || today,
            summary: prevSummary,
            articles: [],
            trends: deriveTrends([], previousSnapshot.tag_counts as Record<string, number>),
          },
          metrics,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // No previous snapshot either — return minimal valid response
      metrics.processing_time_ms = Date.now() - startTime;
      return new Response(JSON.stringify({
        success: true,
        data: {
          date: new Date().toISOString().split('T')[0],
          summary: {
            topInsight: 'No significant updates detected today across the big data ecosystem',
            highlights: ['Monitoring Spark, Iceberg, Delta Lake, Fabric, EMR, and BigQuery for updates'],
            trends: ['All tracked topics stable'],
            impact: ['No major ecosystem shifts detected today'],
          },
          articles: [],
          trends: [],
        },
        metrics,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Deduplicate
    const { result: dedupedArticles, removed } = deduplicateArticles(allArticles);
    metrics.duplicates_removed = removed;

    // Sort by signal score, cap at 10
    const finalArticles = dedupedArticles
      .sort((a, b) => b.signalScore - a.signalScore)
      .slice(0, 10);
    metrics.articles_after_filter = finalArticles.length;

    // Step 6: Trend detection
    const trends = deriveTrends(finalArticles, previousSnapshot?.tag_counts as Record<string, number> | undefined);

    // Step 7: AI Summarization
    const aiSummary = await aiSummarize(finalArticles);
    const summary = aiSummary || fallbackSummary(finalArticles);
    metrics.summary_generated = !!aiSummary;

    // Step 8: Save snapshot
    const today = new Date().toISOString().split('T')[0];
    const tagCounts: Record<string, number> = {};
    for (const a of finalArticles) {
      for (const t of a.tags) { tagCounts[t] = (tagCounts[t] || 0) + 1; }
    }
    await saveSnapshot(today, tagCounts, finalArticles.length, summary);

    // Clean response (remove internal fields)
    const cleanArticles = finalArticles.map(({ weight: _w, signalScore: _s, ...rest }) => rest);
    metrics.processing_time_ms = Date.now() - startTime;

    console.log(`Returning ${cleanArticles.length} articles, ${trends.length} trends | metrics: fetched=${metrics.articles_fetched} filtered=${metrics.articles_after_filter} deduped=${metrics.duplicates_removed} ai=${metrics.summary_generated}`);

    return new Response(JSON.stringify({
      success: true,
      data: { date: today, summary, articles: cleanArticles, trends },
      metrics,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Scrape error:', error);
    metrics.processing_time_ms = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg, metrics }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

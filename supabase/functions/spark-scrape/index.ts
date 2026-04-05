const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Source Configuration with Weights ──
const SOURCES = [
  { name: 'databricks', url: 'https://www.databricks.com/blog', weight: 1.0 },
  { name: 'apache', url: 'https://spark.apache.org/', weight: 1.0 },
  { name: 'google', url: 'https://cloud.google.com/blog/products/data-analytics', weight: 0.9 },
  { name: 'microsoft', url: 'https://azure.microsoft.com/en-us/blog/', weight: 0.9 },
  { name: 'aws', url: 'https://aws.amazon.com/blogs/big-data/', weight: 0.85 },
];

// ── Topic Tagging ──
const TOPIC_TAGS: Record<string, string> = {
  'iceberg': 'iceberg',
  'delta lake': 'delta-lake',
  'delta': 'delta-lake',
  'spark 4': 'spark4',
  'spark4': 'spark4',
  'spark 3': 'spark3',
  'machine learning': 'ml',
  'mlflow': 'ml',
  'artificial intelligence': 'ai',
  ' ai ': 'ai',
  'ai-powered': 'ai',
  'llm': 'ai',
  'genai': 'ai',
  'generative ai': 'ai',
  'performance': 'performance',
  'optimization': 'performance',
  'latency': 'performance',
  'open table': 'open-table-format',
  'hudi': 'open-table-format',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'photon': 'photon',
  'unity catalog': 'unity-catalog',
  'governance': 'governance',
  'structured streaming': 'streaming',
  'streaming': 'streaming',
  'real-time': 'streaming',
  'security': 'security',
  'lakehouse': 'lakehouse',
  'data lake': 'lakehouse',
  'serverless': 'serverless',
  'sql': 'sql',
  'pyspark': 'pyspark',
  'databricks': 'databricks',
  'azure synapse': 'azure',
  'bigquery': 'gcp',
  'dataproc': 'gcp',
};

function extractTags(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set<string>();
  for (const [keyword, tag] of Object.entries(TOPIC_TAGS)) {
    if (lower.includes(keyword)) found.add(tag);
  }
  return found.size > 0 ? [...found] : ['spark'];
}

// ── Signal Filtering ──
const NOISE_PATTERNS = [
  /skip to (main )?content/i,
  /cookie/i,
  /subscribe/i,
  /newsletter/i,
  /sign up/i,
  /log ?in/i,
  /privacy policy/i,
  /terms of (service|use)/i,
  /follow us/i,
  /share (on|this)/i,
  /related (posts|articles)/i,
  /read more/i,
  /load more/i,
  /pagination/i,
  /^\s*menu\s*$/i,
  /navigation/i,
  /footer/i,
  /sidebar/i,
  /advertisement/i,
  /sponsored/i,
];

const LOW_SIGNAL_PATTERNS = [
  /tutorial/i,
  /how to get started/i,
  /beginner.?s? guide/i,
  /step.by.step/i,
  /what is .{3,20}\?/i,
  /introduction to/i,
];

interface ScrapedArticle {
  title: string;
  source: string;
  summary: string;
  link: string;
  tags: string[];
  date: string;
  weight: number;
  signalScore: number;
}

function isNoise(title: string, summary: string): boolean {
  const combined = `${title} ${summary}`;
  return NOISE_PATTERNS.some((p) => p.test(combined));
}

function computeSignalScore(title: string, summary: string, sourceWeight: number): number {
  const combined = `${title} ${summary}`.toLowerCase();
  let score = sourceWeight * 5;

  // High-signal keywords boost score
  const highSignal = [
    'launch', 'announce', 'release', 'general availability', 'ga ',
    'performance', 'improvement', 'optimization', 'breaking change',
    'architecture', 'strategic', 'acquisition', 'partnership',
    'benchmark', 'preview', 'roadmap', 'milestone',
  ];
  for (const kw of highSignal) {
    if (combined.includes(kw)) score += 2;
  }

  // Low-signal keywords reduce score
  if (LOW_SIGNAL_PATTERNS.some((p) => p.test(combined))) score -= 3;

  // Penalize very short or generic content
  if (title.length < 15) score -= 2;
  if (summary.length < 30) score -= 1;

  return Math.max(0, score);
}

// ── Deduplication ──
function deduplicateArticles(articles: ScrapedArticle[]): ScrapedArticle[] {
  const seen = new Map<string, ScrapedArticle>();

  for (const article of articles) {
    // Normalize title for comparison
    const normalized = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check for exact or near-duplicate
    let isDupe = false;
    for (const [key, existing] of seen) {
      if (normalized === key) {
        // Keep the one with higher signal score
        if (article.signalScore > existing.signalScore) {
          seen.set(key, article);
        }
        isDupe = true;
        break;
      }
      // Simple word overlap check for near-dupes
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
        break;
      }
    }

    if (!isDupe) {
      seen.set(normalized, article);
    }
  }

  return [...seen.values()];
}

// ── Markdown Extraction ──
function extractArticlesFromMarkdown(
  markdown: string,
  sourceName: string,
  sourceUrl: string,
  sourceWeight: number
): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  const today = new Date().toISOString().split('T')[0];

  const sections = markdown.split(/\n#{1,3}\s+/).filter(Boolean);

  for (const section of sections.slice(0, 8)) {
    const lines = section.trim().split('\n').filter(Boolean);
    if (lines.length === 0) continue;

    const title = lines[0]
      .replace(/\[([^\]]+)\]\([^)]+\)/, '$1')
      .replace(/[#*`]/g, '')
      .trim();

    if (title.length < 10 || title.length > 200) continue;

    const linkMatch = section.match(/\[([^\]]*)\]\(([^)]+)\)/);
    let link = linkMatch ? linkMatch[2] : sourceUrl;
    if (link.startsWith('/')) {
      const base = new URL(sourceUrl);
      link = `${base.origin}${link}`;
    }

    const summaryLines = lines
      .slice(1, 4)
      .join(' ')
      .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/[#*`]/g, '')
      .trim();
    const summary = summaryLines.length > 0 ? summaryLines.slice(0, 200) : title;

    // Filter noise
    if (isNoise(title, summary)) continue;

    const tags = extractTags(`${title} ${summary}`);
    const signalScore = computeSignalScore(title, summary, sourceWeight);

    // Only keep articles with decent signal
    if (signalScore < 3) continue;

    articles.push({ title, source: sourceName, summary, link, tags, date: today, weight: sourceWeight, signalScore });
  }

  return articles;
}

// ── AI Summarization ──
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function aiSummarize(articles: ScrapedArticle[]): Promise<{
  highlights: string[];
  trends: string[];
  impact: string[];
  topInsight: string;
} | null> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableKey) {
    console.warn('LOVABLE_API_KEY not set, skipping AI summarization');
    return null;
  }

  const articleText = articles
    .slice(0, 15)
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title}: ${a.summary} (tags: ${a.tags.join(', ')})`)
    .join('\n');

  const prompt = `You are a senior data platform product leader analyzing today's Apache Spark ecosystem updates.

Here are today's articles:
${articleText}

Respond in this exact JSON format:
{
  "topInsight": "One sentence: the single most important takeaway from today's updates",
  "highlights": ["highlight 1", "highlight 2", ...max 5, high-signal only],
  "trends": ["cross-article pattern 1", "pattern 2", ...max 4],
  "impact": ["strategic implication 1", "implication 2", ...max 3]
}

Rules:
- Only include HIGH-IMPACT updates (product launches, major improvements, architecture changes, strategic announcements)
- Skip tutorials, marketing fluff, minor blog posts, repetitive announcements
- Be concise, avoid repetition, focus on industry impact
- Identify cross-article patterns for trends
- For impact, explain WHY it matters to data engineering leaders`;

  try {
    const resp = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a concise data engineering analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      console.error(`AI summarization failed: ${resp.status}`);
      const body = await resp.text();
      console.error(`AI response: ${body}`);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    // Quality check
    if (!parsed.highlights || !Array.isArray(parsed.highlights) || parsed.highlights.length === 0) {
      console.error('AI returned invalid summary structure');
      return null;
    }

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

// ── Trend Detection with History ──
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

  // Merge all topics from today and yesterday
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

// ── Fallback Summary (no AI) ──
function fallbackSummary(articles: ScrapedArticle[]) {
  return {
    topInsight: articles[0]?.title || 'No significant updates today',
    highlights: articles.slice(0, 5).map((a) => a.title),
    trends: deriveTrends(articles)
      .slice(0, 3)
      .map((t) => `${t.topic} is ${t.status}`),
    impact: [
      articles.length > 5
        ? 'High activity across the Spark ecosystem'
        : 'Moderate activity in the Spark ecosystem',
      'Continued focus on performance and open formats',
      'Growing integration between AI and data engineering',
    ],
  };
}

// ── Supabase client for history ──
function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return { url, key };
}

async function loadPreviousTagCounts(): Promise<Record<string, number> | undefined> {
  const sb = getSupabaseClient();
  if (!sb) return undefined;

  try {
    const resp = await fetch(
      `${sb.url}/rest/v1/spark_daily_snapshots?order=date.desc&limit=1&select=tag_counts`,
      {
        headers: {
          'apikey': sb.key,
          'Authorization': `Bearer ${sb.key}`,
        },
      }
    );
    if (!resp.ok) return undefined;
    const rows = await resp.json();
    return rows[0]?.tag_counts || undefined;
  } catch {
    return undefined;
  }
}

async function saveSnapshot(
  date: string,
  tagCounts: Record<string, number>,
  articleCount: number,
  summary: Record<string, unknown>
) {
  const sb = getSupabaseClient();
  if (!sb) return;

  try {
    await fetch(`${sb.url}/rest/v1/spark_daily_snapshots`, {
      method: 'POST',
      headers: {
        'apikey': sb.key,
        'Authorization': `Bearer ${sb.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ date, tag_counts: tagCounts, article_count: articleCount, summary }),
    });
  } catch (err) {
    console.error('Failed to save snapshot:', err);
  }
}

// ── Main Handler ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting Spark ecosystem scrape...');

    // Scrape all sources in parallel
    const scrapePromises = SOURCES.map(async (source) => {
      try {
        console.log(`Scraping ${source.name}: ${source.url}`);
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: source.url,
            formats: ['markdown'],
            onlyMainContent: true,
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

    console.log(`Scraped ${allArticles.length} raw articles`);

    // Quality check
    if (allArticles.length === 0) {
      console.warn('No articles fetched — returning error');
      return new Response(
        JSON.stringify({ success: false, error: 'No data fetched from any source' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate
    allArticles = deduplicateArticles(allArticles);
    console.log(`After dedup: ${allArticles.length} articles`);

    // Sort by signal score (weighted)
    allArticles.sort((a, b) => b.signalScore - a.signalScore);

    // Load previous data for trend comparison
    const previousTagCounts = await loadPreviousTagCounts();

    // Compute trends
    const trends = deriveTrends(allArticles, previousTagCounts);

    // AI-powered summarization with fallback
    const aiSummary = await aiSummarize(allArticles);
    const summary = aiSummary || fallbackSummary(allArticles);

    const today = new Date().toISOString().split('T')[0];

    // Save snapshot for future trend detection
    const tagCounts: Record<string, number> = {};
    for (const a of allArticles) {
      for (const t of a.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    await saveSnapshot(today, tagCounts, allArticles.length, summary);

    // Strip internal fields before sending
    const cleanArticles = allArticles.map(({ weight: _w, signalScore: _s, ...rest }) => rest);

    const responseData = {
      success: true,
      data: {
        date: today,
        summary,
        articles: cleanArticles,
        trends,
      },
    };

    console.log(`Returning ${cleanArticles.length} articles, ${trends.length} trends`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scrape error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
  { name: 'databricks-oss', url: 'https://www.databricks.com/blog/category/open-source', weight: 1.0 },
  { name: 'google', url: 'https://cloud.google.com/blog/products/data-analytics', weight: 0.9 },
  { name: 'microsoft', url: 'https://azure.microsoft.com/en-us/blog/category/analytics/', weight: 0.9 },
  { name: 'aws', url: 'https://aws.amazon.com/blogs/big-data/feed/', weight: 0.9 },
  { name: 'iceberg', url: 'https://iceberg.apache.org/blogs/', weight: 0.95 },
  { name: 'delta', url: 'https://delta.io/blog/', weight: 0.95 },
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
  return rawSource;
}

// ── Release-note rejection patterns ──
// Strip out version dumps, changelogs, and bare "X.Y.Z released" announcements
// so the feed favors analysis posts (deep dives, case studies, architecture).
const RELEASE_NOTE_PATTERNS = [
  /^(release notes?|changelog|what.?s new in)/i,
  /\b(v?\d+\.\d+(\.\d+)?)\s*(released|available|now ga|is out)\b/i,
  /\brelease\s+v?\d+\.\d+/i,
  /\b(patch|hotfix|bugfix)\s+release\b/i,
  /^(version\s+\d+|tag\s+v?\d+)/i,
  /\bgithub\.com\/.+\/releases\//i,
];

// Analytical phrases — strong signal that a post offers strategic insight.
const ANALYSIS_KEYWORDS = [
  'lessons learned', 'deep dive', 'under the hood', 'how we', 'why we',
  'case study', 'benchmark results', 'architecture', 'design', 'comparison',
  ' vs ', 'tradeoff', 'best practices', 'pattern', 'strategy', 'analysis',
  'insights', 'inside', 'evolution', 'journey',
];

// ── Link validation ──
// Reject links that aren't actual blog posts: source landing pages,
// category/tag/author/archive listings, feeds, and assets.
const SOURCE_URLS = new Set([
  'https://www.databricks.com/blog',
  'https://www.databricks.com/blog/category/engineering',
  'https://www.databricks.com/blog/category/open-source',
  'https://cloud.google.com/blog/products/data-analytics',
  'https://azure.microsoft.com/en-us/blog/category/analytics/',
  'https://aws.amazon.com/blogs/big-data/feed/',
  'https://iceberg.apache.org/blogs/',
  'https://delta.io/blog/',
]);

const NON_POST_PATH_PATTERNS = [
  /\/category\//i, /\/categories\//i,
  /\/tag\//i, /\/tags\//i,
  /\/author\//i, /\/authors\//i,
  /\/page\/\d+/i, /\/archive\//i, /\/archives\//i,
  /\/feed\/?$/i, /\/rss\/?$/i, /\.xml$/i, /\.rss$/i,
];

const ASSET_EXT_PATTERN = /\.(png|jpe?g|gif|svg|webp|mp4|webm|pdf|zip)(\?|#|$)/i;

function isBlogPostLink(link: string | undefined, sourceUrl: string): boolean {
  if (!link || typeof link !== 'string') return false;
  const trimmed = link.trim();
  if (!trimmed || trimmed.startsWith('#')) return false;
  // Must be http(s)
  if (!/^https?:\/\//i.test(trimmed)) return false;

  // Strip trailing slash for landing-page comparison
  const normalized = trimmed.replace(/\/+$/, '');
  if (SOURCE_URLS.has(trimmed) || SOURCE_URLS.has(`${normalized}/`)) return false;
  const sourceNormalized = sourceUrl.replace(/\/+$/, '');
  if (normalized === sourceNormalized) return false;

  if (ASSET_EXT_PATTERN.test(trimmed)) return false;
  if (NON_POST_PATH_PATTERNS.some((p) => p.test(trimmed))) return false;

  return true;
}

function isReleaseNote(title: string, summary: string, link: string): boolean {
  const hay = `${title} ${summary}`;
  if (RELEASE_NOTE_PATTERNS.some((p) => p.test(hay))) return true;
  if (/github\.com\/.+\/releases\//i.test(link)) return true;
  return false;
}

function hasAnalysisSignal(title: string, summary: string): boolean {
  const combined = `${title} ${summary}`.toLowerCase();
  return ANALYSIS_KEYWORDS.some((kw) => combined.includes(kw));
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
    'launch', 'announce', 'performance', 'improvement', 'optimization',
    'breaking change', 'architecture', 'strategic', 'acquisition',
    'partnership', 'benchmark', 'preview', 'roadmap', 'milestone',
    'competitive', 'cost reduction', 'scalability', 'migration',
  ];
  for (const kw of highSignal) {
    if (combined.includes(kw)) score += 2;
  }
  // Strong analytical-content boost (capped at +3 — once is enough).
  if (ANALYSIS_KEYWORDS.some((kw) => combined.includes(kw))) score += 3;
  // Penalize release-flavored phrasing that slips past pattern filter.
  const releaseFlavor = ['release notes', 'changelog', 'now generally available', 'is now available'];
  if (releaseFlavor.some((kw) => combined.includes(kw))) score -= 4;
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
const MAX_ARTICLE_AGE_DAYS = 14;

function extractArticlesFromMarkdown(
  markdown: string, sourceName: string, sourceUrl: string, sourceWeight: number
): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  const today = new Date().toISOString().split('T')[0];
  const sections = markdown.split(/\n#{1,3}\s+/).filter(Boolean);
  const display = displaySource(sourceName);

  // Take more candidate sections — we'll filter aggressively by date + signal.
  for (const section of sections.slice(0, 20)) {
    const lines = section.trim().split('\n').filter(Boolean);
    if (lines.length === 0) continue;

    const title = cleanSummaryText(lines[0]).trim();
    if (title.length < 10 || title.length > 200) continue;

    // Pick the first markdown link in the section that looks like a real
    // blog post URL — skip category/tag/author/feed/asset links and don't
    // fall back to the source landing page (which sends the wrong signal).
    const base = new URL(sourceUrl);
    let link: string | undefined;
    for (const m of section.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
      let candidate = m[2].trim();
      if (candidate.startsWith('/')) candidate = `${base.origin}${candidate}`;
      if (isBlogPostLink(candidate, sourceUrl)) { link = candidate; break; }
    }
    if (!link) continue;

    const summaryRaw = lines.slice(1, 4).join(' ');
    const summary = cleanSummaryText(summaryRaw).slice(0, 200) || title;

    if (isNoise(title, summary)) continue;
    // AWS feed is noisy — only keep big-data-relevant items.
    if (sourceName === 'aws' && !isRelevantForAws(title, summary)) continue;
    if (EXCLUDE_PATTERNS.some((p) => p.test(`${title} ${summary}`))) continue;
    // Drop release notes / changelogs / version dumps — keep analysis only.
    if (isReleaseNote(title, summary, link)) continue;

    const hasAnalysis = hasAnalysisSignal(title, summary);
    // Require minimal depth: extreme stubs are usually navigation crumbs.
    if (summary.length < 40 && !hasAnalysis) continue;

    // Date extraction + freshness filter
    const publishedAt = extractPublishedDate(section);
    const age = publishedAt ? ageInDays(publishedAt) : undefined;
    if (age !== undefined && age > MAX_ARTICLE_AGE_DAYS) continue;

    const tags = extractTags(`${title} ${summary}`);
    let signalScore = computeSignalScore(title, summary, sourceWeight);
    // Recency boost: very fresh posts (<= 3 days) get a small bump.
    if (age !== undefined && age <= 3) signalScore += 2;
    // No score gate at extraction — Tier B (News) accepts anything that
    // passed noise/release/exclude/age filters. Tier A (Home) gates on >= 6 later.

    articles.push({
      title,
      source: display,
      rawSource: sourceName,
      summary,
      link,
      tags,
      date: today,
      publishedAt,
      ageDays: age,
      weight: sourceWeight,
      signalScore,
    });
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

Rules: focus on analytical posts with strategic takeaways (architecture decisions, performance analyses, case studies, comparisons). Skip pure release notes, version announcements, and changelogs. Cluster similar updates. Be concise.`;

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

// Load article links seen in the last N days, mapped to days-ago.
// Used to boost unseen articles and penalise recently-shown ones.
async function loadRecentArticleLinks(days: number): Promise<Map<string, number>> {
  const seen = new Map<string, number>();
  const sb = getSupabaseClient();
  if (!sb) return seen;
  try {
    const resp = await fetch(
      `${sb.url}/rest/v1/spark_daily_snapshots?order=date.desc&limit=${days}&select=date,summary`,
      { headers: { 'apikey': sb.key, 'Authorization': `Bearer ${sb.key}` } }
    );
    if (!resp.ok) return seen;
    const rows = await resp.json() as Array<{ date: string; summary: { article_links?: string[] } | null }>;
    const today = new Date();
    for (const row of rows) {
      const links = row.summary?.article_links;
      if (!Array.isArray(links)) continue;
      const rowDate = new Date(`${row.date}T00:00:00Z`);
      const daysAgo = Math.max(0, Math.floor((today.getTime() - rowDate.getTime()) / 86400000));
      for (const link of links) {
        const prev = seen.get(link);
        if (prev === undefined || daysAgo < prev) seen.set(link, daysAgo);
      }
    }
  } catch (err) {
    console.error('Failed to load recent article links:', err);
  }
  return seen;
}

// Load `all_articles` from the last N days of snapshots for News-feed backfill.
// Returns articles with their original dates preserved; tolerates old-shape rows.
async function loadHistoricalNewsArticles(days: number): Promise<Array<Record<string, unknown> & { link?: string; date?: string }>> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  try {
    const resp = await fetch(
      `${sb.url}/rest/v1/spark_daily_snapshots?order=date.desc&limit=${days}&select=date,summary`,
      { headers: { 'apikey': sb.key, 'Authorization': `Bearer ${sb.key}` } }
    );
    if (!resp.ok) return [];
    const rows = await resp.json() as Array<{ date: string; summary: { all_articles?: unknown[] } | null }>;
    const out: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      const items = row.summary?.all_articles;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          // Filter out legacy stored items pointing to category/landing/feed URLs.
          const link = typeof obj.link === 'string' ? obj.link : undefined;
          if (!isBlogPostLink(link, '')) continue;
          // Preserve original date if present, else stamp with the snapshot date.
          if (!obj.date) obj.date = row.date;
          out.push(obj);
        }
      }
    }
    return out;
  } catch (err) {
    console.error('Failed to load historical news articles:', err);
    return [];
  }
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

    // Step 1: Ingest — fetch from all sources in parallel.
    // Lower cache TTL since cron now runs every 6 hours.
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
            maxAge: 900000, // 15 min — fresher pulls between cron runs
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

    // Run scrape + history lookups in parallel — they don't depend on each other.
    const [results, previousSnapshot, recentLinks] = await Promise.all([
      Promise.all(scrapePromises),
      loadPreviousSnapshot(),
      loadRecentArticleLinks(7),
    ]);
    let allArticles = results.flat();
    metrics.articles_fetched = allArticles.length;

    console.log(`Scraped ${allArticles.length} raw articles (recent-link memory: ${recentLinks.size})`);

    // Step 2-5: Filter, Deduplicate, Tag, Sort
    if (allArticles.length === 0) {
      // ── Fallback: use previous day's data ──
      console.log('No articles fetched, falling back to previous snapshot');
      metrics.used_fallback = true;

      if (previousSnapshot?.summary) {
        const today = new Date().toISOString().split('T')[0];
        const prevSummary = previousSnapshot.summary as { topInsight?: string; highlights?: string[]; trends?: string[]; impact?: string[]; all_articles?: unknown[] };
        metrics.processing_time_ms = Date.now() - startTime;

        return new Response(JSON.stringify({
          success: true,
          data: {
            date: previousSnapshot.date || today,
            summary: prevSummary,
            articles: [],
            all_articles: Array.isArray(prevSummary.all_articles)
              ? prevSummary.all_articles.filter((it) => {
                  const link = (it as { link?: unknown })?.link;
                  return isBlogPostLink(typeof link === 'string' ? link : undefined, '');
                })
              : [],
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
          all_articles: [],
          trends: [],
        },
        metrics,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Deduplicate
    const { result: dedupedArticles, removed } = deduplicateArticles(allArticles);
    metrics.duplicates_removed = removed;

    // ── Freshness scoring: strict-tier ranking only ──
    // Boost links we've never shown (+4); penalise links shown in last 3 days (-3).
    // We compute an adjusted score for the Home/AI tier so it rotates each run.
    // The News tier intentionally ignores this so older-but-still-valid links
    // remain visible and the feed never collapses to zero.
    const adjustedScore = new Map<ScrapedArticle, number>();
    for (const a of dedupedArticles) {
      const seenDaysAgo = recentLinks.get(a.link);
      let s = a.signalScore;
      if (seenDaysAgo === undefined) s += 4;
      else if (seenDaysAgo <= 3) s -= 3;
      adjustedScore.set(a, s);
    }

    // Sort by adjusted score for strict tier
    const sortedStrict = [...dedupedArticles].sort(
      (a, b) => (adjustedScore.get(b) ?? 0) - (adjustedScore.get(a) ?? 0)
    );

    // ── Tier A: Strict highlights (Home page + AI summary) ──
    // adjusted signalScore >= 6, max 3 per vendor, top 10.
    const STRICT_CAP = 3;
    const strictPerSource = new Map<string, number>();
    const finalArticles: ScrapedArticle[] = [];
    for (const a of sortedStrict) {
      if ((adjustedScore.get(a) ?? 0) < 6) continue;
      const used = strictPerSource.get(a.source) ?? 0;
      if (used >= STRICT_CAP) continue;
      finalArticles.push(a);
      strictPerSource.set(a.source, used + 1);
      if (finalArticles.length >= 10) break;
    }
    metrics.articles_after_filter = finalArticles.length;

    // ── Tier B: Relaxed feed (News page) ──
    // Sort by raw signalScore (no recency penalty), max 5 per vendor, up to 30.
    const sortedRelaxed = [...dedupedArticles].sort((a, b) => b.signalScore - a.signalScore);
    const RELAXED_CAP = 5;
    const relaxedPerSource = new Map<string, number>();
    const newsArticles: ScrapedArticle[] = [];
    for (const a of sortedRelaxed) {
      const used = relaxedPerSource.get(a.source) ?? 0;
      if (used >= RELAXED_CAP) continue;
      newsArticles.push(a);
      relaxedPerSource.set(a.source, used + 1);
      if (newsArticles.length >= 30) break;
    }

    // Step 6: Trend detection
    const trends = deriveTrends(finalArticles, previousSnapshot?.tag_counts as Record<string, number> | undefined);

    // Step 7: AI Summarization (uses strict tier only)
    const aiSummary = await aiSummarize(finalArticles);
    const baseSummary = aiSummary || fallbackSummary(finalArticles);
    metrics.summary_generated = !!aiSummary;

    // Step 8: Save snapshot — include article_links so future runs have freshness memory.
    const today = new Date().toISOString().split('T')[0];
    const tagCounts: Record<string, number> = {};
    for (const a of finalArticles) {
      for (const t of a.tags) { tagCounts[t] = (tagCounts[t] || 0) + 1; }
    }
    const cleanArticles = finalArticles.map(({ weight: _w, signalScore: _s, rawSource: _r, ...rest }) => rest);
    let cleanNewsArticles: Array<Record<string, unknown> & { link?: string; date?: string }> =
      newsArticles.map(({ weight: _w, signalScore: _s, rawSource: _r, ...rest }) => rest);

    // ── Backfill: if today's News tier is thin, pull from last 10 days ──
    const todaysNewsCount = cleanNewsArticles.length;
    if (cleanNewsArticles.length < 12) {
      const historical = await loadHistoricalNewsArticles(10);
      const seenLinks = new Set(cleanNewsArticles.map((a) => a.link).filter(Boolean) as string[]);
      for (const item of historical) {
        if (cleanNewsArticles.length >= 40) break;
        const link = typeof item.link === 'string' ? item.link : undefined;
        if (!link || seenLinks.has(link)) continue;
        seenLinks.add(link);
        cleanNewsArticles.push(item);
      }
      console.log(`News backfill: today=${todaysNewsCount}, after backfill=${cleanNewsArticles.length}`);
    }

    const summary = {
      ...baseSummary,
      article_links: newsArticles.map((a) => a.link),
      all_articles: cleanNewsArticles,
    };
    await saveSnapshot(today, tagCounts, finalArticles.length, summary);

    metrics.processing_time_ms = Date.now() - startTime;

    console.log(`Returning ${cleanArticles.length} strict / ${cleanNewsArticles.length} news articles, ${trends.length} trends | metrics: fetched=${metrics.articles_fetched} filtered=${metrics.articles_after_filter} deduped=${metrics.duplicates_removed} ai=${metrics.summary_generated}`);

    return new Response(JSON.stringify({
      success: true,
      data: { date: today, summary, articles: cleanArticles, all_articles: cleanNewsArticles, trends },
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

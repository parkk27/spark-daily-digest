import { corsHeaders } from '@supabase/supabase-js/cors'

const SOURCES = [
  {
    name: 'databricks',
    url: 'https://www.databricks.com/blog',
    search: 'Apache Spark',
  },
  {
    name: 'apache',
    url: 'https://spark.apache.org/news/',
    search: 'Spark',
  },
  {
    name: 'google',
    url: 'https://cloud.google.com/blog/products/data-analytics',
    search: 'Spark',
  },
  {
    name: 'microsoft',
    url: 'https://azure.microsoft.com/en-us/blog/',
    search: 'Apache Spark',
  },
];

interface ScrapedArticle {
  title: string;
  source: string;
  summary: string;
  link: string;
  tags: string[];
  date: string;
}

function extractTags(text: string): string[] {
  const tagMap: Record<string, string> = {
    'iceberg': 'iceberg',
    'spark 4': 'spark4',
    'spark4': 'spark4',
    'delta lake': 'delta-lake',
    'databricks': 'databricks',
    'machine learning': 'ml',
    'ai': 'ai',
    'performance': 'performance',
    'open table': 'open-table-format',
    'kubernetes': 'kubernetes',
    'photon': 'photon',
    'unity catalog': 'unity-catalog',
    'structured streaming': 'streaming',
  };

  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lower.includes(keyword) && !found.includes(tag)) {
      found.push(tag);
    }
  }
  return found.length > 0 ? found : ['spark'];
}

function extractArticlesFromMarkdown(
  markdown: string,
  sourceName: string,
  sourceUrl: string
): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Split by markdown headings to find article-like sections
  const sections = markdown.split(/\n#{1,3}\s+/).filter(Boolean);

  for (const section of sections.slice(0, 5)) {
    const lines = section.trim().split('\n').filter(Boolean);
    if (lines.length === 0) continue;

    const title = lines[0].replace(/\[([^\]]+)\]\([^)]+\)/, '$1').replace(/[#*`]/g, '').trim();
    if (title.length < 10 || title.length > 200) continue;

    // Extract first link if present
    const linkMatch = section.match(/\[([^\]]*)\]\(([^)]+)\)/);
    let link = linkMatch ? linkMatch[2] : sourceUrl;
    if (link.startsWith('/')) {
      const base = new URL(sourceUrl);
      link = `${base.origin}${link}`;
    }

    // Build summary from remaining lines
    const summaryLines = lines.slice(1, 4).join(' ').replace(/\[([^\]]*)\]\([^)]+\)/g, '$1').replace(/[#*`]/g, '').trim();
    const summary = summaryLines.length > 0 ? summaryLines.slice(0, 200) : title;

    const tags = extractTags(`${title} ${summary}`);

    articles.push({ title, source: sourceName, summary, link, tags, date: today });
  }

  return articles;
}

function deriveTrends(articles: ScrapedArticle[]): { topic: string; status: string }[] {
  const tagCount: Record<string, number> = {};
  for (const a of articles) {
    for (const t of a.tags) {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }

  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic, count]) => ({
      topic,
      status: count >= 3 ? 'growing' : count >= 2 ? 'stable' : 'new',
    }));
}

function deriveSummary(articles: ScrapedArticle[]) {
  const highlights = articles.slice(0, 5).map((a) => a.title);
  const trends = deriveTrends(articles)
    .slice(0, 3)
    .map((t) => `${t.topic} is ${t.status}`);
  const impact = [
    articles.length > 5
      ? 'High activity across the Spark ecosystem'
      : 'Moderate activity in the Spark ecosystem',
    'Continued focus on performance and open formats',
    'Growing integration between AI and data engineering',
  ];

  return { highlights, trends, impact };
}

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

    const allArticles: ScrapedArticle[] = [];

    // Scrape each source
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
        return extractArticlesFromMarkdown(markdown, source.name, source.url);
      } catch (err) {
        console.error(`Error scraping ${source.name}:`, err);
        return [];
      }
    });

    const results = await Promise.all(scrapePromises);
    for (const r of results) {
      allArticles.push(...r);
    }

    console.log(`Scraped ${allArticles.length} articles total`);

    const today = new Date().toISOString().split('T')[0];

    const responseData = {
      success: true,
      data: {
        date: today,
        summary: deriveSummary(allArticles),
        articles: allArticles,
        trends: deriveTrends(allArticles),
      },
    };

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

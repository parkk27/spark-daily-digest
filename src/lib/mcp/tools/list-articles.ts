import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { articlesOf, errorText, latestSnapshots, text } from "../supabase";

export default defineTool({
  name: "list_articles",
  title: "List articles",
  description:
    "List the most recently ingested big data ecosystem articles (Databricks, Spark, Iceberg, Delta, Fabric, EMR, BigQuery, Google Cloud) with title, source, summary, tags and link.",
  inputSchema: {
    limit: z.number().int().describe("Max articles to return (1-40). Default 15.").optional(),
    source: z.string().describe("Optional source filter, e.g. 'databricks' or 'google'.").optional(),
    days: z.number().int().describe("How many recent days of snapshots to scan. Default 3.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, source, days }) => {
    try {
      const max = Math.min(Math.max(limit ?? 15, 1), 40);
      const snapshots = await latestSnapshots(Math.min(Math.max(days ?? 3, 1), 10));
      const seen = new Set<string>();
      const out: any[] = [];
      for (const snap of snapshots) {
        for (const a of articlesOf(snap)) {
          const key = a?.link ?? a?.title;
          if (!key || seen.has(key)) continue;
          if (source && !String(a.source ?? "").toLowerCase().includes(source.toLowerCase())) continue;
          seen.add(key);
          out.push({
            title: a.title,
            source: a.source,
            summary: a.summary,
            tags: a.tags,
            link: a.link,
            date: snap.date,
          });
          if (out.length >= max) break;
        }
        if (out.length >= max) break;
      }
      return text({ count: out.length, articles: out });
    } catch (e) {
      return errorText(String(e));
    }
  },
});

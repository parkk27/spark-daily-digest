import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { articlesOf, errorText, latestSnapshots, text } from "../supabase";

export default defineTool({
  name: "search_articles",
  title: "Search articles",
  description:
    "Keyword-search recently ingested big data ecosystem articles by title, summary or tag (e.g. 'iceberg', 'lakehouse', 'agentic').",
  inputSchema: {
    query: z.string().describe("Keyword or phrase to search for."),
    limit: z.number().int().describe("Max results (1-25). Default 10.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    try {
      const q = query.trim().toLowerCase();
      if (!q) return errorText("query must not be empty.");
      const max = Math.min(Math.max(limit ?? 10, 1), 25);
      const snapshots = await latestSnapshots(10);
      const seen = new Set<string>();
      const out: any[] = [];
      for (const snap of snapshots) {
        for (const a of articlesOf(snap)) {
          const key = a?.link ?? a?.title;
          if (!key || seen.has(key)) continue;
          const hay = `${a.title ?? ""} ${a.summary ?? ""} ${(a.tags ?? []).join(" ")}`.toLowerCase();
          if (!hay.includes(q)) continue;
          seen.add(key);
          out.push({ title: a.title, source: a.source, summary: a.summary, tags: a.tags, link: a.link, date: snap.date });
          if (out.length >= max) break;
        }
        if (out.length >= max) break;
      }
      return text({ query, count: out.length, articles: out });
    } catch (e) {
      return errorText(String(e));
    }
  },
});

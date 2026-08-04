import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, latestSnapshots, text } from "../supabase";

export default defineTool({
  name: "get_daily_brief",
  title: "Get daily brief",
  description:
    "Get the latest AI-curated big data ecosystem brief: top insight, key highlights, emerging trends, and why-it-matters impact lines.",
  inputSchema: {
    date: z
      .string()
      .describe("Optional ISO date (YYYY-MM-DD). Omit for the most recent brief.")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date }) => {
    try {
      const snapshots = await latestSnapshots(date ? 30 : 1);
      const snap = date ? snapshots.find((s) => s.date === date) : snapshots[0];
      if (!snap) return errorText(date ? `No brief found for ${date}.` : "No brief available yet.");
      const s: any = snap.summary ?? {};
      return text({
        date: snap.date,
        topInsight: s.topInsight ?? null,
        highlights: s.highlights ?? [],
        trends: s.trends ?? [],
        impact: s.impact ?? [],
      });
    } catch (e) {
      return errorText(String(e));
    }
  },
});

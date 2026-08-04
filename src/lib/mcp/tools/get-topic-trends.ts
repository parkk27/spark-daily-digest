import { defineTool } from "@lovable.dev/mcp-js";
import { errorText, latestSnapshots, text } from "../supabase";

export default defineTool({
  name: "get_topic_trends",
  title: "Get topic trends",
  description:
    "Get today's tracked big data topics with momentum status (growing, declining, new, stable), mention counts and day-over-day change.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    try {
      const [snap] = await latestSnapshots(1);
      if (!snap) return errorText("No trend data available yet.");
      const s: any = snap.summary ?? {};
      const trends = Array.isArray(s.topic_trends) ? s.topic_trends : (s.trendItems ?? s.trends ?? []);
      return text({ date: snap.date, trends });
    } catch (e) {
      return errorText(String(e));
    }
  },
});

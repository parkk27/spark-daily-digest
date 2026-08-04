import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getDailyBrief from "./tools/get-daily-brief";
import listArticles from "./tools/list-articles";
import getTopicTrends from "./tools/get-topic-trends";
import searchArticles from "./tools/search-articles";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bigdata-hub-mcp",
  title: "Big Data Intelligence Hub",
  version: "0.1.0",
  instructions:
    "Read-only intelligence tools for the Big Data Intelligence Hub. Use `get_daily_brief` for today's executive summary, `get_topic_trends` for topic momentum, `list_articles` for the latest ingested vendor blog posts, and `search_articles` to find posts by keyword. Data covers Databricks, Apache Spark, Iceberg, Delta Lake, Microsoft Fabric, AWS EMR, BigQuery and Google Cloud.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getDailyBrief, getTopicTrends, listArticles, searchArticles],
});

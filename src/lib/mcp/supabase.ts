import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous (RLS-scoped) client. The MCP server is public, so it must never
 * use a service-role key — snapshots are intentionally public-readable.
 */
export function publicSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type Snapshot = {
  date: string;
  summary: Record<string, any> | null;
};

export async function latestSnapshots(limit = 1): Promise<Snapshot[]> {
  const { data, error } = await publicSupabase()
    .from("spark_daily_snapshots")
    .select("date, summary")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Snapshot[];
}

export function articlesOf(snapshot: Snapshot | undefined) {
  const s: any = snapshot?.summary ?? {};
  const list = (Array.isArray(s.all_articles) && s.all_articles.length > 0
    ? s.all_articles
    : s.articles) ?? [];
  return list as any[];
}

export function text(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

export function errorText(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

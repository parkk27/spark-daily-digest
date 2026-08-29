/**
 * Radar export — CSV rows and a printable HTML view of lifecycle counts and signals.
 * Everything is derived from data already rendered on the page; no new fetching.
 */

import type { DecisionRecord, Recommendation } from "@/hooks/useRecommendations";
import { DECISION_LABELS } from "@/hooks/useRecommendations";
import { LANE_LABELS, laneOf, type Lane } from "@/lib/radarLifecycle";
import { signalIdOf } from "@/lib/signalIdentity";

export interface ExportRow {
  lane: string;
  title: string;
  section: string;
  signal_type: string;
  polarity: string;
  owner: string;
  priority: string;
  confidence: string;
  evidence_count: string;
  vendor: string;
  decision: string;
  reason: string;
  action: string;
  action_owner: string;
  action_due_date: string;
  review_date: string;
  outcome: string;
  signal_key: string;
  date: string;
}

export const EXPORT_HEADERS: { key: keyof ExportRow; label: string }[] = [
  { key: "lane", label: "Lifecycle" },
  { key: "title", label: "Signal" },
  { key: "section", label: "Section" },
  { key: "signal_type", label: "Signal type" },
  { key: "polarity", label: "Polarity" },
  { key: "owner", label: "Owner" },
  { key: "priority", label: "Priority" },
  { key: "confidence", label: "Confidence" },
  { key: "evidence_count", label: "Evidence" },
  { key: "vendor", label: "Vendor" },
  { key: "decision", label: "Decision" },
  { key: "reason", label: "Reason" },
  { key: "action", label: "Action" },
  { key: "action_owner", label: "Action owner" },
  { key: "action_due_date", label: "Action due" },
  { key: "review_date", label: "Review date" },
  { key: "outcome", label: "Outcome" },
  { key: "signal_key", label: "Signal key" },
  { key: "date", label: "Signal date" },
];

export const toExportRow = (
  r: Recommendation,
  decisions: Record<string, DecisionRecord>
): ExportRow => {
  const key = signalIdOf(r);
  const d = decisions[key] ?? decisions[r.id];
  return {
    lane: LANE_LABELS[laneOf(r, d)],
    title: r.title,
    section: r.section,
    signal_type: r.signal_type ?? "",
    polarity: r.polarity ?? "",
    owner: r.owner ?? "",
    priority: r.priority ?? "",
    confidence: String(r.confidence ?? ""),
    evidence_count: String(r.evidence_count ?? 0),
    vendor: r.related_vendor ?? "",
    decision: d ? DECISION_LABELS[d.decision] : "",
    reason: d?.reason ?? "",
    action: d?.action ?? d?.next_step ?? "",
    action_owner: d?.action_owner ?? "",
    action_due_date: d?.action_due_date ?? "",
    review_date: d?.review_date ?? "",
    outcome: d?.outcome ?? "",
    signal_key: key,
    date: r.date,
  };
};

const csvCell = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const buildCsv = (rows: ExportRow[], counts: Record<Lane, number>): string => {
  const summary = [
    "Lifecycle summary",
    ...Object.entries(counts).map(
      ([lane, count]) => `${LANE_LABELS[lane as Lane]},${count}`
    ),
    "",
  ];
  const header = EXPORT_HEADERS.map((h) => csvCell(h.label)).join(",");
  const body = rows.map((row) => EXPORT_HEADERS.map((h) => csvCell(row[h.key])).join(","));
  return [...summary, header, ...body].join("\n");
};

export const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const escapeHtml = (v: string) =>
  v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Printable HTML — the browser's print dialog produces the PDF, no extra dependency. */
export const buildPrintHtml = (
  rows: ExportRow[],
  counts: Record<Lane, number>,
  generatedAt = new Date()
): string => `<!doctype html><html><head><meta charset="utf-8" />
<title>Action Radar — lifecycle report</title>
<style>
 body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#111;margin:32px;}
 h1{font-size:20px;margin:0 0 4px;} p.meta{color:#666;font-size:12px;margin:0 0 20px;}
 .counts{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;}
 .count{border:1px solid #ddd;border-radius:8px;padding:8px 12px;min-width:120px;}
 .count b{display:block;font-size:20px;}
 .count span{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.04em;}
 table{width:100%;border-collapse:collapse;font-size:11px;}
 th,td{border-bottom:1px solid #e5e5e5;padding:6px 8px;text-align:left;vertical-align:top;}
 th{background:#f6f6f6;}
 @media print{@page{size:landscape;margin:12mm;}}
</style></head><body>
<h1>Action Radar — lifecycle report</h1>
<p class="meta">Microsoft Fabric Spark perspective · Generated ${escapeHtml(
  generatedAt.toLocaleString()
)} · ${rows.length} signal${rows.length === 1 ? "" : "s"}</p>
<div class="counts">${Object.entries(counts)
  .map(
    ([lane, count]) =>
      `<div class="count"><b>${count}</b><span>${escapeHtml(LANE_LABELS[lane as Lane])}</span></div>`
  )
  .join("")}</div>
<table><thead><tr>${EXPORT_HEADERS.map((h) => `<th>${escapeHtml(h.label)}</th>`).join(
  ""
)}</tr></thead><tbody>
${rows
  .map(
    (row) =>
      `<tr>${EXPORT_HEADERS.map((h) => `<td>${escapeHtml(row[h.key] ?? "")}</td>`).join("")}</tr>`
  )
  .join("")}
</tbody></table></body></html>`;

export const openPrintView = (html: string) => {
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
};

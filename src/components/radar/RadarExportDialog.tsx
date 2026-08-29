import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DecisionRecord, Recommendation } from "@/hooks/useRecommendations";
import type { Lane } from "@/lib/radarLifecycle";
import { buildCsv, buildPrintHtml, downloadCsv, openPrintView, toExportRow } from "@/lib/radarExport";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visible: Recommendation[];
  selected: Recommendation[];
  decisions: Record<string, DecisionRecord>;
  counts: Record<Lane, number>;
  onExported: (format: "csv" | "print", scope: string, count: number) => void;
}

/** Share Radar state with stakeholders: CSV download or a printable (PDF) report. */
const RadarExportDialog = ({
  open,
  onOpenChange,
  visible,
  selected,
  decisions,
  counts,
  onExported,
}: Props) => {
  const [scope, setScope] = useState<"visible" | "selected">("visible");
  const effectiveScope = selected.length === 0 ? "visible" : scope;
  const source = effectiveScope === "selected" ? selected : visible;
  const rows = source.map((r) => toExportRow(r, decisions));

  const exportCsv = () => {
    downloadCsv(
      buildCsv(rows, counts),
      `action-radar-${new Date().toISOString().slice(0, 10)}.csv`
    );
    onExported("csv", effectiveScope, rows.length);
    onOpenChange(false);
  };

  const exportPdf = () => {
    const ok = openPrintView(buildPrintHtml(rows, counts));
    if (!ok) {
      toast.error("Allow pop-ups to generate the printable report");
      return;
    }
    onExported("print", effectiveScope, rows.length);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Export Radar</DialogTitle>
          <DialogDescription className="text-xs">
            Lifecycle counts plus the signals, decisions, actions and outcomes below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {(
            [
              ["visible", `Signals currently shown (${visible.length})`],
              ["selected", `Selected signals (${selected.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={value === "selected" && selected.length === 0}
              onClick={() => setScope(value)}
              aria-pressed={effectiveScope === value}
              className={cn(
                "rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-50",
                effectiveScope === value
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-surface-3"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={rows.length === 0}>
            <Printer className="mr-1.5 h-4 w-4" /> Printable PDF
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RadarExportDialog;

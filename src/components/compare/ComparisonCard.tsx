import { useState } from "react";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  MessageSquare,
  MoveRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ACTION_LABELS,
  VENDOR_LABELS,
  timelineLabel,
  type Comparison,
} from "@/data/features";
import { ThreatBadge, GapBadge } from "./ComparisonBadges";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ComparisonCard = ({ row }: { row: Comparison }) => {
  const [open, setOpen] = useState(false);
  const { competitor, ours } = row;
  const timeline = timelineLabel(row.timeline_delta_days);
  const weLead = (row.timeline_delta_days ?? 0) > 30;

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(
        `${VENDOR_LABELS[competitor.vendor]} — ${competitor.feature_name}\n\n${row.suggested_response}\n\nSource: ${competitor.source_article_link}`
      );
      toast({ title: "Copied", description: "RFP response copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access was blocked.", variant: "destructive" });
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {VENDOR_LABELS[competitor.vendor]}
        </span>
        <ThreatBadge level={row.threat} />
        <GapBadge status={row.gap_status} />
        <a
          href={competitor.source_article_link}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Source <ExternalLink className="h-3 w-3" />
        </a>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border/60 bg-secondary/30 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Their capability</p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{competitor.feature_name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Announced {fmt(competitor.announced_date)} · {competitor.mentioned_count} mentions
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {competitor.extracted_summary}
          </p>
        </div>

        <div className="rounded-md border border-border/60 bg-secondary/10 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Our baseline</p>
          {ours ? (
            <>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{ours.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {ours.status === "shipped" ? `Shipped ${fmt(ours.shipped_date)}` : `Target ${ours.roadmap_quarter}`}
                {" · "}
                <span className="capitalize">{ours.status.replace("_", " ")}</span>
                {" · "}
                <span className="capitalize">{ours.maturity}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ours.description}</p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No matching capability on our baseline. Capability gap.
            </p>
          )}
        </div>
      </div>

      {timeline && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
            weLead
              ? "border-status-growing/30 bg-status-growing/10 text-status-growing"
              : row.gap_status === "we_lag"
                ? "border-status-stable/30 bg-status-stable/10 text-status-stable"
                : "border-border bg-secondary/30 text-muted-foreground"
          )}
        >
          {weLead ? <TrendingUp className="h-4 w-4" /> : row.gap_status === "we_lag" ? <TrendingDown className="h-4 w-4" /> : <MoveRight className="h-4 w-4" />}
          {timeline}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 gap-1.5 px-2 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        {open ? "Hide analysis" : "Show analysis"}
      </Button>

      {open && (
        <div className="mt-2 space-y-4 border-t border-border pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Suggested response</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{row.suggested_response}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {ACTION_LABELS[row.recommended_action]}
            </span>
            <ThreatBadge level={row.gtm_priority} label="GTM priority" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={copyResponse}>
              <Copy className="h-4 w-4" /> Copy RFP response
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled>
                    <MessageSquare className="h-4 w-4" /> Share to Slack
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </article>
  );
};

export default ComparisonCard;

import { useState } from "react";
import { ChevronDown, Copy, ExternalLink, MessageSquare, Minus, Plus, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { cn } from "@/lib/utils";

import {
  CATEGORY_LABELS,
  RECOMMENDATION_LABELS,
  VENDOR_LABELS,
  confidenceSummary,
  type CapabilityBenchmark,
} from "@/data/features";
import { ConfidenceBadge, ImpactBadge, PositionBadge } from "./ComparisonBadges";
import ExecutiveActions from "./ExecutiveActions";
import ShareCardDialog from "@/components/share/ShareCardDialog";

const DiffList = ({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "fabric" | "competitor";
}) => (
  <div className="rounded-md border border-border/60 bg-secondary/20 p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
          {tone === "fabric" ? (
            <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-growing" />
          ) : (
            <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-stable" />
          )}
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const ComparisonCard = ({ row }: { row: CapabilityBenchmark }) => {
  const [open, setOpen] = useState(false);

  const copyBriefing = async () => {
    const text = [
      `${VENDOR_LABELS[row.vendor]} — ${row.capability}`,
      `Position: ${row.position} · ${row.impact} customer impact · ${row.confidence} confidence`,
      "",
      `Competitor: ${row.competitor_capability}`,
      `Microsoft Fabric Spark: ${row.fabric_capability}`,
      `Capability gap: ${row.capability_gap}`,
      "",
      `Fabric differentiators: ${row.fabric_differentiators.join("; ")}`,
      `Competitor differentiators: ${row.competitor_differentiators.join("; ")}`,
      "",
      `Customer impact: ${row.customer_impact}`,
      `Product: ${row.recommendation.product}`,
      `Sales: ${row.recommendation.sales}`,
      `GTM: ${row.recommendation.gtm}`,
      `Customer Success: ${row.recommendation.customer_success}`,
      `Product recommendation: ${RECOMMENDATION_LABELS[row.product_recommendation]}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Competitive briefing copied to clipboard." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked.",
        variant: "destructive",
      });
    }
  };

  return (
    <article className="rounded-lg border border-border bg-surface-2 p-5 shadow-card transition-colors hover:border-primary/30 hover:bg-surface-3/40">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{VENDOR_LABELS[row.vendor]}</span>
        <PositionBadge position={row.position} />
        <ImpactBadge impact={row.impact} />
        <span className="ml-auto text-xs text-muted-foreground">
          {CATEGORY_LABELS[row.category]}
        </span>
      </header>

      <h3 className="mt-3 text-base font-semibold text-foreground">{row.capability}</h3>

      <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border-subtle md:grid-cols-2">
        <div className="bg-surface-3/60 p-4">
          <p className="eyebrow text-muted-foreground">
            Competitor capability — {VENDOR_LABELS[row.vendor]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
            {row.competitor_capability}
          </p>
        </div>
        <div className="bg-primary/[0.06] p-4">
          <p className="eyebrow text-primary">Microsoft Fabric Spark capability</p>
          <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
            {row.fabric_capability}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-surface-3/50 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Capability gap: </span>
        {row.capability_gap}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="eyebrow text-muted-foreground">Why this matters</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{row.customer_impact}</p>
        </div>
        <div>
          <p className="eyebrow text-muted-foreground">Recommended next action</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {row.recommendation.product}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <DiffList title="Fabric differentiators" items={row.fabric_differentiators} tone="fabric" />
        <DiffList
          title="Competitor differentiators"
          items={row.competitor_differentiators}
          tone="competitor"
        />
      </div>

      <div className="mt-4">
        <ConfidenceBadge confidence={row.confidence} detail={confidenceSummary(row)} />
      </div>


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
        <div className="mt-2 space-y-4 border-t border-border-subtle pt-4">
          <div>

            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Strategic recommendation
            </p>
            <dl className="mt-2 grid gap-2 md:grid-cols-2">
              {(
                [
                  ["Product", row.recommendation.product],
                  ["Sales", row.recommendation.sales],
                  ["GTM", row.recommendation.gtm],
                  ["Customer Success", row.recommendation.customer_success],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-md border border-border/60 p-3">
                  <dt className="text-xs font-medium text-foreground">{label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Product recommendation: {RECOMMENDATION_LABELS[row.product_recommendation]}
            </span>
          </div>

          <ExecutiveActions actions={row.executive_actions} />

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Related articles
            </p>
            <ul className="mt-2 space-y-1.5">
              {row.related_articles.map((a) => (
                <li key={a.link}>
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {a.title}
                    <span className="text-xs opacity-70">· {a.source}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={copyBriefing}>
              <Copy className="h-4 w-4" /> Copy briefing
            </Button>
            <ShareCardDialog
              data={{
                title: row.capability,
                why: row.capability_gap,
                status: `${VENDOR_LABELS[row.vendor]} · ${row.position}`,
                sources: row.confidence_signals.source_count,
                eyebrow: "Competitive intelligence",
              }}
              label="Share card"
            />
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

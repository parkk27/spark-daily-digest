import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CONFIDENCE_FACTORS,
  DIRECTION_LABEL,
  MOMENTUM_BANDS,
  MOMENTUM_CONFIG,
  isRadarEligible,
  type PerspectiveTrend,
} from "@/lib/momentum";
import { confidenceLabel, impactLabel, perspectiveRelevance } from "@/lib/perspectiveScoring";
import { getPerspective } from "@/lib/perspectives";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 py-1 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-border pt-3">
    <h3 className="eyebrow mb-1.5 text-muted-foreground">{title}</h3>
    {children}
  </section>
);

const Bar = ({ value, max }: { value: number; max: number }) => (
  <span className="ml-2 inline-block h-1.5 w-16 shrink-0 rounded-full bg-surface-3 align-middle">
    <span
      className="block h-1.5 rounded-full bg-primary"
      style={{ width: `${Math.min(100, max === 0 ? 0 : (value / max) * 100)}%` }}
    />
  </span>
);

interface Props {
  trend: PerspectiveTrend;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full explanation of a momentum chip: every score, the components behind it and
 * the exact thresholds used. Values are read from the deterministic model only.
 */
const MomentumExplainDrawer = ({ trend, open, onOpenChange }: Props) => {
  const [sending, setSending] = useState(false);
  const perspective = getPerspective(trend.perspective_id);
  const relevance = perspectiveRelevance(
    { title: trend.entity_name, summary: trend.rationale, tags: trend.top_drivers.map((d) => d.label) },
    perspective
  );
  const eligibility = MOMENTUM_CONFIG.radar_eligibility;
  const eligible = isRadarEligible(trend);

  const sendToRadar = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("add-radar-signal", {
      body: {
        kind: "trend",
        perspective_id: trend.perspective_id,
        entity_name: trend.entity_name,
        momentum_percent: trend.momentum_percent,
        trend_confidence: trend.trend_confidence,
        impact_score: trend.impact_score,
        strategic_relevance: trend.strategic_relevance,
        competitive_intensity: trend.competitive_intensity,
        rationale: trend.rationale,
      },
    });
    setSending(false);
    toast(
      error || !data?.success
        ? { title: "Could not add to Radar", variant: "destructive" }
        : { title: `${trend.entity_name} added to Action Radar` }
    );
  };

  const checks = [
    { label: "Strategic impact", value: trend.impact_score, min: eligibility.impact },
    { label: "Perspective relevance", value: trend.strategic_relevance, min: eligibility.relevance },
    { label: "Evidence confidence", value: trend.trend_confidence, min: eligibility.confidence },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="capitalize">{trend.entity_name}</SheetTitle>
          <SheetDescription>
            {DIRECTION_LABEL[trend.momentum_direction]} · rolling {MOMENTUM_CONFIG.window_days}-day
            window {trend.window_start} → {trend.window_end} · {perspective.display_name} perspective
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Section title="Momentum">
            <Row label={`Previous ${MOMENTUM_CONFIG.window_days} days`} value={trend.baseline_activity} />
            <Row label={`Current ${MOMENTUM_CONFIG.window_days} days`} value={trend.current_activity} />
            <Row
              label="Change"
              value={`${trend.momentum_percent > 0 ? "+" : ""}${trend.momentum_percent}%`}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{trend.rationale}</p>
            <div className="mt-2 space-y-0.5">
              {MOMENTUM_BANDS.map((b) => (
                <div
                  key={b.direction}
                  className={cn(
                    "flex justify-between rounded px-1.5 py-0.5 text-[11px]",
                    b.direction === trend.momentum_direction
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <span>{DIRECTION_LABEL[b.direction]}</span>
                  <span>{b.rule}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Perspective relevance">
            <Row
              label="Score used for eligibility"
              value={`${trend.strategic_relevance} / 100`}
            />
            {relevance.components.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No relevance components are observable for this entity — nothing is assumed.
              </p>
            ) : (
              relevance.components.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="flex items-center text-foreground">
                    {c.value} / {c.max}
                    <Bar value={c.value} max={c.max} />
                  </span>
                </div>
              ))
            )}
            {relevance.matched_terms.length > 0 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Matched terms: {relevance.matched_terms.join(", ")}
              </p>
            )}
          </Section>

          <Section title="Strategic impact">
            <Row label={impactLabel(trend.impact_score)} value={`${trend.impact_score} / 100`} />
            <Row label="Competitive intensity" value={`${trend.competitive_intensity} / 100`} />
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Impact is the weighted mean of the observed recommendation factors for this entity:
              strategic relevance 25%, customer impact 20%, competitive intensity 20%, momentum 15%,
              evidence confidence 10%, urgency 10%. Factors without evidence are dropped and the
              remaining weights renormalised.
            </p>
          </Section>

          <Section title="Evidence confidence">
            <Row
              label={confidenceLabel(trend.trend_confidence)}
              value={`${trend.trend_confidence} / 100`}
            />
            {CONFIDENCE_FACTORS.map((f) => (
              <Row key={f.label} label={`${f.label} (max ${f.max})`} value={f.note} />
            ))}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Below {MOMENTUM_CONFIG.low_data_threshold} combined weighted signals the trend is
              reported as low data instead of a direction.
            </p>
          </Section>

          <Section title="Top trend drivers">
            {trend.top_drivers.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No individual driver moved enough to explain the change.
              </p>
            ) : (
              trend.top_drivers.map((d) => (
                <Row
                  key={d.label}
                  label={d.label}
                  value={`${d.baseline} → ${d.current} (${d.contribution > 0 ? "+" : ""}${d.contribution})`}
                />
              ))
            )}
          </Section>

          <Section title="Action Radar eligibility">
            {checks.map((c) => (
              <Row
                key={c.label}
                label={`${c.label} (needs ≥ ${c.min})`}
                value={
                  <span className={c.value >= c.min ? "text-status-growing" : "text-muted-foreground"}>
                    {c.value} {c.value >= c.min ? "✓" : "✕"}
                  </span>
                }
              />
            ))}
            {trend.momentum_direction === "LOW_DATA" && (
              <p className="text-[11px] text-muted-foreground">
                Low-data trends are never promoted to the Radar.
              </p>
            )}
            {eligible && (
              <Button size="sm" className="mt-2" disabled={sending} onClick={sendToRadar}>
                {sending ? "Adding…" : "Add to Action Radar"}
              </Button>
            )}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MomentumExplainDrawer;

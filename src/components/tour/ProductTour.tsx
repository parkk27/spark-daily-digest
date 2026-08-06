import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProductTour } from "@/hooks/useProductTour";
import { TOUR_STEPS } from "@/components/tour/tourSteps";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

/** Dimmed overlay with a spotlight cut-out around the current step's target. */
const ProductTour = () => {
  const { active, stepIndex, next, prev, skip } = useProductTour();
  const location = useLocation();
  const [rect, setRect] = useState<Rect | null>(null);
  const step = TOUR_STEPS[stepIndex];

  // Poll for the target element — protected pages are lazy-loaded.
  useEffect(() => {
    if (!active || !step) return;
    let frame = 0;
    let attempts = 0;
    setRect(null);

    const tick = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        if (r.top < 0 || r.bottom > window.innerHeight) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      } else if (attempts++ > 120) {
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, step, location.pathname]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, prev, skip]);

  if (!active || !step) return null;

  const spotlight = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const tooltipTop = spotlight
    ? Math.min(spotlight.top + spotlight.height + 12, window.innerHeight - 220)
    : window.innerHeight / 2 - 100;
  const tooltipLeft = spotlight
    ? Math.max(16, Math.min(spotlight.left, window.innerWidth - 360))
    : Math.max(16, window.innerWidth / 2 - 170);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Product tour">
      {/* Dim + spotlight cut-out via a huge outline shadow */}
      {spotlight ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: "0 0 0 9999px hsl(var(--background) / 0.85)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-background/85" />
      )}

      <div
        className="absolute w-[340px] rounded-lg border border-border bg-card p-4 shadow-lg"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-foreground">{step.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={prev} disabled={stepIndex === 0}>
              Back
            </Button>
            <Button size="sm" onClick={next}>
              {stepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTour;

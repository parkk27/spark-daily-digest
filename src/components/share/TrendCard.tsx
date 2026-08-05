import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShareCardData } from "@/lib/shareCard";

/**
 * 1200x630-proportioned shareable intelligence card.
 * Scales to its container width; used in the share dialog and on /card/:cardId.
 */
const TrendCard = ({ data, className }: { data: ShareCardData; className?: string }) => (
  <div
    className={cn(
      "relative flex aspect-[1200/630] w-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-[5%] [container-type:inline-size]",
      className
    )}
  >
    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

    <div className="relative">
      <div className="flex items-center gap-2 text-primary">
        <Zap className="h-[3.2%] min-h-4 w-auto" aria-hidden="true" />
        <span className="text-[1.9cqw] font-medium uppercase tracking-[0.18em]">
          {data.eyebrow ?? "Big Data Intelligence Hub"}
        </span>
      </div>
      <h2 className="mt-[3%] text-[5.2cqw] font-semibold capitalize leading-tight tracking-tight text-foreground">
        {data.title}
      </h2>
      <p className="mt-[2.5%] max-w-[85%] text-[2.6cqw] leading-relaxed text-muted-foreground">
        {data.why}
      </p>
    </div>

    <div className="relative flex flex-wrap items-center gap-[2%]">
      <span className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-[2.1cqw] font-medium text-primary">
        {data.status}
      </span>
      <span className="text-[2.1cqw] text-muted-foreground">
        {data.sources} source{data.sources === 1 ? "" : "s"}
      </span>
      <span className="ml-auto text-[2.1cqw] text-muted-foreground">bigdata-hub.lovable.app</span>
    </div>
  </div>
);

export default TrendCard;

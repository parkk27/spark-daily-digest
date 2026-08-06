import { cn } from "@/lib/utils";

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Raised cards are used for primary anchors like Executive Intelligence. */
  raised?: boolean;
  /** Adds a subtle accent edge for high-priority surfaces. */
  accent?: boolean;
  interactive?: boolean;
  as?: "div" | "section" | "article";
}

const SurfaceCard = ({
  raised = false,
  accent = false,
  interactive = false,
  as: Tag = "div",
  className,
  ...props
}: SurfaceCardProps) => (
  <Tag
    className={cn(
      "relative rounded-lg border border-border bg-surface-2 shadow-card",
      raised && "bg-surface-2 shadow-raised",
      accent && "border-l-2 border-l-primary",
      interactive && "transition-colors hover:border-primary/30 hover:bg-surface-3",
      className
    )}
    {...props}
  />
);

export default SurfaceCard;

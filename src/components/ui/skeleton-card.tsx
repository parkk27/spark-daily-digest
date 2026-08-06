import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

const SkeletonCard = ({ lines = 3, className }: SkeletonCardProps) => (
  <div
    className={cn("rounded-lg border border-border bg-surface-2 p-6 shadow-card", className)}
    aria-hidden
  >
    <div className="h-3 w-28 animate-pulse rounded bg-surface-3" />
    <div className="mt-4 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-surface-3"
          style={{ width: `${100 - i * 12}%`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  </div>
);

export default SkeletonCard;

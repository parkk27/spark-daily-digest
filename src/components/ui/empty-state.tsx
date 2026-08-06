import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center rounded-lg border border-dashed border-border bg-surface-2/40 px-6 py-12 text-center",
      className
    )}
  >
    {Icon && (
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-3">
        <Icon className="h-4.5 w-4.5 text-muted-foreground" />
      </span>
    )}
    <p className="text-sm font-medium text-foreground">{title}</p>
    {description && (
      <p className="measure mt-1.5 text-sm text-muted-foreground">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon?: React.ElementType;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** `page` renders an h1-scale header, `section` an h2-scale card header. */
  level?: "page" | "section";
  className?: string;
}

const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  level = "section",
  className,
}: SectionHeaderProps) => {
  const Title = level === "page" ? "h1" : "h2";
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {(Icon || eyebrow) && (
          <div className="flex items-center gap-2 text-primary">
            {Icon && <Icon className={level === "page" ? "h-5 w-5" : "h-4 w-4"} />}
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          </div>
        )}
        <Title
          className={cn(
            "text-foreground",
            level === "page"
              ? "mt-2 text-[1.75rem] font-semibold leading-tight"
              : "mt-1.5 text-base font-semibold"
          )}
        >
          {title}
        </Title>
        {description && (
          <p className="measure mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
};

export default SectionHeader;

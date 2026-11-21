import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}

/** Encabezado de página con jerarquía H1 + descripción + acciones. */
export function PageHeader({ eyebrow, title, description, actions, breadcrumb, className }: Props) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {breadcrumb && <div className="mb-2 text-sm text-muted-foreground">{breadcrumb}</div>}
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="break-words">{title}</h1>
        {description && (
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  title,
  description,
  count,
  className,
}: {
  title: string;
  description?: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <div>
        <h2 className="flex items-center gap-2 text-lg md:text-xl">
          {title}
          {typeof count === "number" && (
            <span className="numeric rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

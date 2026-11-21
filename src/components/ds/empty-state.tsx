import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  icon?: typeof Inbox;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title = "Nada por aquí", description, icon: Icon = Inbox, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-rose-soft bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-brand-rose-pale text-brand-wine">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <div className="font-heading text-base font-semibold text-foreground">{title}</div>
        {description && <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

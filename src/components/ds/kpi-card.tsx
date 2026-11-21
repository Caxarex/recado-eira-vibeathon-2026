import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
  icon?: ReactNode;
  className?: string;
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  brand: "text-brand-wine",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  danger: "text-danger-foreground",
};

/** Tarjeta de indicador con número grande, tabular y legible. */
export function KpiCard({ label, value, hint, tone = "default", icon, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {icon && <span className="text-brand-rose">{icon}</span>}
      </div>
      <div className={cn("numeric font-heading text-4xl font-extrabold leading-none md:text-[2.75rem]", TONE[tone])}>
        {value}
      </div>
      {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
    </div>
  );
}

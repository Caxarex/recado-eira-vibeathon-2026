import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Lock, OctagonX, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "danger" | "locked" | "simulation";

const ESTILO: Record<Variant, { box: string; icon: typeof Info; etiqueta: string }> = {
  info: { box: "border-info/30 bg-info-soft text-info-foreground", icon: Info, etiqueta: "Información" },
  success: { box: "border-success/30 bg-success-soft text-success-foreground", icon: CheckCircle2, etiqueta: "Correcto" },
  warning: { box: "border-warning/40 bg-warning-soft text-warning-foreground", icon: AlertTriangle, etiqueta: "Atención" },
  danger: { box: "border-danger/30 bg-danger-soft text-danger-foreground", icon: OctagonX, etiqueta: "Error" },
  locked: { box: "border-border bg-surface-2 text-foreground", icon: Lock, etiqueta: "Paso bloqueado" },
  simulation: { box: "border-dashed border-brand-rose-soft bg-brand-rose-pale text-brand-wine", icon: FlaskConical, etiqueta: "Simulación" },
};

interface Props {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

/**
 * Panel de aviso accesible: icono + etiqueta textual + contenido.
 * El estado nunca depende solo del color.
 */
export function AlertPanel({ variant = "info", title, children, className, actions }: Props) {
  const { box, icon: Icon, etiqueta } = ESTILO[variant];
  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", box, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-semibold">
          <span className="sr-only">{etiqueta}: </span>
          {title ?? etiqueta}
        </div>
        <div className="text-[0.95rem] opacity-90">{children}</div>
        {actions && <div className="pt-2">{actions}</div>}
      </div>
    </div>
  );
}

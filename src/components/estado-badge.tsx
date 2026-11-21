import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ClipboardList,
  FileUp,
  HeartHandshake,
  PackageCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ClasificacionBethesda, EstadoResultado } from "@/contracts/types";
import { cn } from "@/lib/utils";

export const ETIQUETA_ESTADO: Record<EstadoResultado, string> = {
  cargado: "Cargado",
  en_revision: "En revisión",
  autorizado: "Autorizado",
  rechazado: "Rechazado",
  notificado: "Notificado",
  entregado: "Entregado",
  en_seguimiento: "En seguimiento",
};

/**
 * Cada estado se expresa con color + icono + texto. Los tonos usan tokens
 * semánticos del design system (ver globals.css).
 */
const ESTILO_ESTADO: Record<EstadoResultado, { clase: string; icon: LucideIcon }> = {
  cargado: { clase: "bg-muted text-foreground border-border", icon: FileUp },
  en_revision: { clase: "bg-warning-soft text-warning-foreground border-warning/40", icon: ClipboardList },
  autorizado: { clase: "bg-success-soft text-success-foreground border-success/35", icon: CheckCircle2 },
  rechazado: { clase: "bg-danger-soft text-danger-foreground border-danger/35", icon: XCircle },
  notificado: { clase: "bg-info-soft text-info-foreground border-info/35", icon: Bell },
  entregado: { clase: "bg-brand-rose-pale text-brand-wine border-brand-rose-soft", icon: PackageCheck },
  en_seguimiento: { clase: "bg-brand-wine text-primary-foreground border-brand-wine", icon: HeartHandshake },
};

const base =
  "inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[0.8rem] font-semibold leading-none";

export function EstadoBadge({ estado, className }: { estado: EstadoResultado; className?: string }) {
  const { clase, icon: Icon } = ESTILO_ESTADO[estado];
  return (
    <span className={cn(base, clase, className)}>
      <Icon className="size-3.5" aria-hidden />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function ClasificacionBadge({ valor, className }: { valor: ClasificacionBethesda; className?: string }) {
  const anormal = ["ASC-US", "LSIL", "HSIL"].includes(valor);
  const insuficiente = valor === "Insuficiente";
  return (
    <span
      className={cn(
        base,
        "font-mono tracking-tight",
        anormal && "bg-danger-soft text-danger-foreground border-danger/35",
        insuficiente && "bg-warning-soft text-warning-foreground border-warning/40",
        !anormal && !insuficiente && "bg-success-soft text-success-foreground border-success/35",
        className,
      )}
      title={anormal ? "Hallazgo anormal" : insuficiente ? "Muestra insuficiente" : "Sin hallazgo"}
    >
      {anormal && <AlertCircle className="size-3.5" aria-hidden />}
      {valor}
    </span>
  );
}

export function SimuladoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-dashed border-brand-rose-soft bg-brand-rose-pale px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-brand-wine",
        className,
      )}
    >
      Simulado
    </span>
  );
}

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

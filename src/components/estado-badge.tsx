import { Badge } from "@/components/ui/badge";
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

const COLOR_ESTADO: Record<EstadoResultado, string> = {
  cargado: "bg-slate-100 text-slate-800 border-slate-200",
  en_revision: "bg-amber-100 text-amber-900 border-amber-200",
  autorizado: "bg-emerald-100 text-emerald-900 border-emerald-200",
  rechazado: "bg-red-100 text-red-900 border-red-200",
  notificado: "bg-sky-100 text-sky-900 border-sky-200",
  entregado: "bg-violet-100 text-violet-900 border-violet-200",
  en_seguimiento: "bg-pink-100 text-pink-900 border-pink-200",
};

export function EstadoBadge({ estado }: { estado: EstadoResultado }) {
  return (
    <Badge variant="outline" className={cn("font-medium", COLOR_ESTADO[estado])}>
      {ETIQUETA_ESTADO[estado]}
    </Badge>
  );
}

export function ClasificacionBadge({ valor }: { valor: ClasificacionBethesda }) {
  const anormal = ["ASC-US", "LSIL", "HSIL"].includes(valor);
  return (
    <Badge
      variant="outline"
      className={cn(
        anormal
          ? "bg-rose-50 text-rose-900 border-rose-200"
          : valor === "Insuficiente"
            ? "bg-orange-50 text-orange-900 border-orange-200"
            : "bg-green-50 text-green-900 border-green-200",
      )}
    >
      {valor}
    </Badge>
  );
}

export function SimuladoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-dashed border-pink-400 bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pink-700",
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

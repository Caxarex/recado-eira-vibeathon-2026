import { ETIQUETA_ESTADO, fechaCorta } from "@/components/estado-badge";
import type { EventoHistorial } from "@/contracts/types";
import { cn } from "@/lib/utils";

export function HistorialResultado({ historial }: { historial: EventoHistorial[] }) {
  if (historial.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>;
  }
  return (
    <ol className="relative ml-1.5 space-y-4 border-l-2 border-brand-rose-soft pl-5">
      {historial.map((h, i) => {
        const ultimo = i === historial.length - 1;
        return (
          <li key={i} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[1.65rem] top-1 size-3.5 rounded-full border-2 border-surface",
                ultimo ? "bg-brand-wine ring-4 ring-brand-rose-pale" : "bg-brand-rose",
              )}
            />
            <div className="text-[0.95rem] font-semibold text-foreground">{ETIQUETA_ESTADO[h.estadoNuevo]}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              <time dateTime={h.fecha}>{fechaCorta(h.fecha)}</time> · {h.actor}{" "}
              <span className="text-xs">({h.rol})</span>
            </div>
            {h.nota && (
              <p className="mt-1.5 rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed text-foreground/85">
                {h.nota}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

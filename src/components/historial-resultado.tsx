import { ETIQUETA_ESTADO, fechaCorta } from "@/components/estado-badge";
import type { EventoHistorial } from "@/contracts/types";

export function HistorialResultado({ historial }: { historial: EventoHistorial[] }) {
  return (
    <ol className="relative ml-2 border-l pl-4">
      {historial.map((h, i) => (
        <li key={i} className="mb-3 last:mb-0">
          <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-pink-500" />
          <div className="text-sm font-medium">{ETIQUETA_ESTADO[h.estadoNuevo]}</div>
          <div className="text-xs text-muted-foreground">
            {fechaCorta(h.fecha)} · {h.actor} ({h.rol})
          </div>
          {h.nota && <div className="mt-0.5 text-xs italic text-slate-700">“{h.nota}”</div>}
        </li>
      ))}
    </ol>
  );
}

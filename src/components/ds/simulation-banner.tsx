import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";

/** Aviso global de simulación. Siempre visible; nunca se oculta por diseño. */
export function SimulationBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-brand-rose-soft bg-brand-rose-pale px-4 py-2 text-center text-[0.8rem] font-medium leading-snug text-brand-wine"
    >
      <FlaskConical className="hidden size-4 shrink-0 sm:block" aria-hidden />
      <span>
        <strong className="font-bold uppercase tracking-wide">Simulación.</strong> {children}
      </span>
    </div>
  );
}

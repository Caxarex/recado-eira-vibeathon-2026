import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Marca tipográfica de RECADO. No es un logo oficial de EIRA:
 * es una composición de texto con el nombre del producto.
 */
export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 rounded-md", className)}
      aria-label="RECADO – ir al inicio"
    >
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-xl bg-brand-wine text-primary-foreground shadow-card transition-transform group-hover:-rotate-3"
      >
        <span className="font-heading text-base font-extrabold leading-none">R</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[1.05rem] font-extrabold tracking-tight text-brand-wine">
            RECADO
          </span>
          <span className="mt-0.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground">
            EIRA Movimiento Rosa
          </span>
        </span>
      )}
    </Link>
  );
}

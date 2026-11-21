"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { AVISO_ALMACENAMIENTO_LOCAL } from "@/contracts/pdf";
import type { Documento } from "@/contracts/types";
import { leerPdfLocal } from "@/data/pdf-local";
import { cn } from "@/lib/utils";

/** Vista del PDF de prueba o del marcador de posición cuando solo hay metadatos. */
export function VistaPreviaDocumento({
  documento,
  compacto = false,
}: {
  documento: Documento;
  compacto?: boolean;
}) {
  const alto = compacto ? "h-48" : "h-96";
  const local = documento.almacenamiento === "local-navegador";
  const [url, setUrl] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    if (!local) return;
    let cancelado = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setFallo(null);
    leerPdfLocal(documento.id)
      .then((blob) => {
        if (cancelado) return;
        if (!blob) {
          setFallo(
            "No está el PDF en este navegador. Si reiniciaste la demo o cambiaste de equipo, hay que volver a seleccionarlo.",
          );
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelado) setFallo("No se pudo leer el almacenamiento local del navegador.");
      });
    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documento.id, local]);

  if (!local) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-slate-50 px-4 text-center text-muted-foreground",
          compacto ? "py-4" : "aspect-[3/4] max-h-80",
        )}
      >
        <FileText className={compacto ? "size-6 text-slate-300" : "size-12 text-slate-300"} />
        <div className="text-sm font-medium">Sin archivo en este navegador</div>
        {!compacto && (
          <div className="text-xs">
            Este registro de la semilla solo guarda metadatos ficticios. No hay un PDF que mostrar.
          </div>
        )}
        <div className="font-mono text-[10px]">Referencia ficticia {documento.hashSimulado}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm leading-relaxed text-warning-foreground">
        {AVISO_ALMACENAMIENTO_LOCAL}
      </div>
      {fallo && <p role="alert" className="text-sm font-medium text-danger-foreground">{fallo}</p>}
      {!url && !fallo && <p className="text-sm text-muted-foreground">Cargando vista previa local…</p>}
      {url && (
        <>
          <iframe
            title={`Vista previa de ${documento.nombreArchivo}`}
            src={url}
            className={cn("w-full rounded-md border bg-white", alto)}
          />
          <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-wine underline underline-offset-4">
            Abrir el PDF en una pestaña
          </a>
        </>
      )}
      <div className="break-all font-mono text-[10px] text-muted-foreground">
        Huella SHA-256 local {documento.hashSimulado}
      </div>
    </div>
  );
}

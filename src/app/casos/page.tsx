"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  estadoVisible,
  entregaCompletada,
  VOZ_NO_DISPONIBLE,
  type EstadoPublico,
} from "@/contracts/casos-ana";

type RespuestaLista = EstadoPublico & {
  ok?: boolean;
  mensaje?: string;
  agregados?: string[];
  casosConservados?: string[];
  eventosArchivados?: number;
};

export default function CasosDemo() {
  const [estado, setEstado] = useState<EstadoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recargar = useCallback(async () => {
    const res = await fetch("/api/casos", { cache: "no-store" });
    const data = (await res.json()) as EstadoPublico & { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudieron leer los casos del servidor.");
      return;
    }
    setError(null);
    setEstado(data);
  }, []);

  useEffect(() => {
    let vivo = true;
    recargar().catch(() => {
      if (vivo) setError("No hay respuesta del servidor de casos.");
    });
    return () => {
      vivo = false;
    };
  }, [recargar]);

  async function accion(nombre: "preparar" | "restaurar-escenario") {
    if (nombre === "restaurar-escenario") {
      const sigue = window.confirm(
        "Los seis casos DEMO vuelven a los campos del JSON. Sus eventos se archivan y no se borran. Los demás casos y las notas se conservan.",
      );
      if (!sigue) return;
    }
    setOcupado(true);
    try {
      const res = await fetch("/api/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: nombre }),
      });
      const data = (await res.json()) as RespuestaLista & { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo completar la acción.");
        return;
      }
      setEstado(data);
      toast.success(data.mensaje ?? "Listo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Casos demo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seis personas sintéticas. Los casos y los eventos viven en el servidor de esta demo: al recargar, y en otro navegador que use la misma URL, se ve el mismo estado.
        </p>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        Las 23 pruebas PR-* siguen en <strong>Pendiente</strong>. Esta pantalla no las marca como aprobadas. Ana las ejecuta desde su equipo: ella usa DEMO-002 y Felipe usa DEMO-001.
        <div className="mt-2">{VOZ_NO_DISPONIBLE}</div>
        <div className="mt-2">
          Clave de teclado, solo para el personal: <strong className="font-mono">{estado?.claveDemo ?? "…"}</strong>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {estado && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Tarjeta titulo="Recepciones del aviso" valor={estado.metricas.recepciones} />
          <Tarjeta titulo="Accesos al PDF" valor={estado.metricas.accesosPdf} />
          <Tarjeta titulo="Acompañamientos" valor={estado.metricas.acompanamientos} />
          <Tarjeta titulo="Entregas del resultado" valor={estado.metricas.entregasCompletadas} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Confirmar el aviso, abrir el PDF o pedir transporte no cuenta como entrega del resultado. Esta demo no registra esa entrega.
      </p>

      <div className="grid gap-3">
        {(estado?.casos ?? []).map((caso) => {
          const entregado = estado ? entregaCompletada(estado.eventos, caso.caseId) : false;
          return (
            <Card key={caso.caseId}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{caso.caseId}</span>
                  <span>{caso.alias}</span>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-900">
                    Dato sintético
                  </span>
                </CardTitle>
                <CardDescription>Escenario demo: {caso.demo.scenario}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div>{estado ? estadoVisible(caso, estado.eventos) : "…"}</div>
                  <div className="text-muted-foreground">
                    Entrega del resultado: {entregado ? "sí" : "no"}
                  </div>
                </div>
                <Button size="sm" variant="outline" render={<Link href={`/casos/${caso.caseId}`} />}>
                  Abrir caso
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={ocupado} onClick={() => void accion("preparar")}>
          Preparar casos que falten
        </Button>
        <Button type="button" variant="outline" disabled={ocupado} onClick={() => void accion("restaurar-escenario")}>
          Restaurar escenario demo
        </Button>
        <Button type="button" variant="ghost" disabled={ocupado} onClick={() => void recargar().catch(() => setError("No hay respuesta del servidor de casos."))}>
          Actualizar desde el servidor
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Preparar solo agrega un DEMO que no esté. Restaurar devuelve los campos de los seis casos al JSON, archiva sus eventos y deja intactos los demás casos y las notas operativas.
        {estado && estado.archivados.length > 0
          ? ` Hay ${estado.archivados.length} eventos archivados: no cuentan en el escenario actual.`
          : ""}
      </p>
    </div>
  );
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card className="py-3">
      <CardContent className="px-3">
        <div className="text-2xl font-bold">{valor}</div>
        <div className="text-xs text-muted-foreground">{titulo}</div>
      </CardContent>
    </Card>
  );
}

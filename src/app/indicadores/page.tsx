"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ETIQUETA_ESTADO } from "@/components/estado-badge";
import { calcularIndicadores } from "@/contracts/indicadores";
import { ESTADOS_RESULTADO } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

export default function Indicadores() {
  const { resultados, hidratado } = useRepositorio();
  if (!hidratado) return null;
  const ind = calcularIndicadores(resultados);
  const max = Math.max(1, ...Object.values(ind.porEstado));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Indicadores</h1>
        <p className="text-sm text-muted-foreground">
          Cálculo de referencia sobre datos ficticios. La versión definitiva corresponde al módulo de datos.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-pink-300 bg-pink-50 p-4 text-sm text-pink-900">
        <strong>Módulo a cargo del equipo de datos – Ana.</strong> Contrato definido en{" "}
        <code className="rounded bg-white px-1">src/contracts/indicadores.ts</code> (<code>IndicadorResumen</code>,{" "}
        <code>calcularIndicadores</code>). Importador Excel/CSV validado con{" "}
        <code className="rounded bg-white px-1">src/contracts/schemas.ts</code>.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Total de resultados" valor={ind.totalResultados} />
        <Kpi titulo="% con hallazgo anormal" valor={`${ind.porcentajeAnormales}%`} desc="ASC-US, LSIL, HSIL" />
        <Kpi titulo="Horas promedio a autorización" valor={ind.horasPromedioAutorizacion ?? "—"} desc="cargado → autorizado" />
        <Kpi titulo="Pendientes de autorizar" valor={ind.pendientesAutorizacion} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados por estado</CardTitle>
          <CardDescription>Distribución actual de la demo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ESTADOS_RESULTADO.map((e) => (
            <div key={e} className="flex items-center gap-3 text-sm">
              <div className="w-32 text-muted-foreground">{ETIQUETA_ESTADO[e]}</div>
              <div className="h-5 flex-1 rounded bg-slate-100">
                <div
                  className="h-5 rounded bg-pink-500"
                  style={{ width: `${(ind.porEstado[e] / max) * 100}%` }}
                />
              </div>
              <div className="w-6 text-right font-medium">{ind.porEstado[e]}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ titulo, valor, desc }: { titulo: string; valor: string | number; desc?: string }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="text-xs text-muted-foreground">{titulo}</div>
        <div className="text-2xl font-bold">{valor}</div>
        {desc && <div className="text-[11px] text-muted-foreground">{desc}</div>}
      </CardContent>
    </Card>
  );
}

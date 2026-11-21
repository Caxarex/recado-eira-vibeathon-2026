"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ETIQUETA_ESTADO } from "@/components/estado-badge";
import { AlertPanel, KpiCard, PageHeader } from "@/components/ds";
import { calcularIndicadores } from "@/contracts/indicadores";
import { ESTADOS_RESULTADO } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

export default function Indicadores() {
  const { resultados, hidratado } = useRepositorio();
  if (!hidratado) return null;
  const ind = calcularIndicadores(resultados);
  const max = Math.max(1, ...Object.values(ind.porEstado));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Seguimiento operativo"
        title="Indicadores"
        description="Cálculo de referencia sobre datos ficticios. La versión definitiva corresponde al módulo de datos."
      />

      <AlertPanel variant="simulation" title="Módulo a cargo del equipo de datos – Ana">
        Contrato definido en <code className="rounded bg-surface px-1.5 py-0.5">src/contracts/indicadores.ts</code> (
        <code>IndicadorResumen</code>, <code>calcularIndicadores</code>). Importador Excel/CSV validado con{" "}
        <code className="rounded bg-surface px-1.5 py-0.5">src/contracts/schemas.ts</code>.
      </AlertPanel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total de resultados" value={ind.totalResultados} tone="brand" />
        <KpiCard label="Con hallazgo anormal" value={`${ind.porcentajeAnormales}%`} hint="ASC-US, LSIL, HSIL" tone="danger" />
        <KpiCard
          label="Horas promedio a autorización"
          value={ind.horasPromedioAutorizacion ?? "—"}
          hint="cargado → autorizado"
        />
        <KpiCard label="Pendientes de autorizar" value={ind.pendientesAutorizacion} tone="warning" />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Resultados por estado</CardTitle>
          <CardDescription>Distribución actual de la demo</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {ESTADOS_RESULTADO.map((e) => {
              const n = ind.porEstado[e];
              return (
                <li key={e} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-[0.95rem] sm:grid-cols-[10rem_1fr_3rem]">
                  <span className="truncate text-muted-foreground">{ETIQUETA_ESTADO[e]}</span>
                  <div
                    className="h-6 overflow-hidden rounded-full bg-surface-2"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={max}
                    aria-valuenow={n}
                    aria-label={`${ETIQUETA_ESTADO[e]}: ${n}`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-wine to-brand-rose transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${(n / max) * 100}%` }}
                    />
                  </div>
                  <span className="numeric text-right font-heading font-bold">{n}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

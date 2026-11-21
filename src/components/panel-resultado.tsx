"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClasificacionBadge, EstadoBadge, SimuladoTag } from "@/components/estado-badge";
import { HistorialResultado } from "@/components/historial-resultado";
import { VistaPreviaDocumento } from "@/components/vista-previa-pdf";
import type { ResultadoPapanicolaou } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";
import { AlertPanel, PageHeader } from "@/components/ds";

/** Visor de documento simulado + datos del expediente + historial. */
export function PanelResultado({ resultado }: { resultado: ResultadoPapanicolaou }) {
  const { obtenerExpediente, obtenerPaciente } = useRepositorio();
  const exp = obtenerExpediente(resultado.expedienteId);
  const pac = exp ? obtenerPaciente(exp.pacienteId) : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Documento <SimuladoTag />
          </CardTitle>
          <CardDescription>
            {resultado.documento.nombreArchivo} · {resultado.documento.tipo} · {resultado.documento.tamanoKb} KB
            {" · "}
            {resultado.documento.almacenamiento === "local-navegador"
              ? "copia local del navegador"
              : "solo metadatos ficticios"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VistaPreviaDocumento documento={resultado.documento} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Link href={`/expedientes/${resultado.expedienteId}`} className="rounded font-mono text-sm text-brand-wine underline-offset-4 hover:underline">
                {exp?.folio}
              </Link>
              <ClasificacionBadge valor={resultado.clasificacion} />
              <EstadoBadge estado={resultado.estado} />
            </CardTitle>
            <CardDescription>{pac?.nombre} · CURP ficticia {pac?.curp}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-6 gap-y-2 text-[0.95rem] sm:grid-cols-2">
            <Dato k="Fecha de toma" v={resultado.fechaToma} />
            <Dato k="Fecha de resultado" v={resultado.fechaResultado} />
            <Dato k="Laboratorio" v={resultado.laboratorio} />
            <Dato k="Unidad médica" v={exp?.unidadMedica ?? "—"} />
            <Dato k="Teléfono" v={pac?.telefono ?? "—"} />
            <Dato k="Municipio" v={pac?.municipio ?? "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <HistorialResultado historial={resultado.historial} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col border-b border-border/60 pb-2 last:border-0 sm:border-0 sm:pb-0">
      <span className="eyebrow">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export function Encabezado({ titulo, desc }: { titulo: string; desc: string }) {
  return <PageHeader title={titulo} description={desc} />;
}

export function AvisoRol({ requerido, actual }: { requerido: string; actual: string }) {
  if (requerido === actual) return null;
  return (
    <AlertPanel variant="locked" title={`Este paso lo realiza el rol ${requerido}`}>
      Tu rol simulado actual es <strong>{actual}</strong>. Cámbialo en la parte superior derecha para habilitar las
      acciones. Las acciones permanecen deshabilitadas hasta entonces.
    </AlertPanel>
  );
}

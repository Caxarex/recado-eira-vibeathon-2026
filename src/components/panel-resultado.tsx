"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClasificacionBadge, EstadoBadge, SimuladoTag } from "@/components/estado-badge";
import { HistorialResultado } from "@/components/historial-resultado";
import { VistaPreviaDocumento } from "@/components/vista-previa-pdf";
import type { ResultadoPapanicolaou } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

/** Visor de documento simulado + datos del expediente + historial. */
export function PanelResultado({ resultado }: { resultado: ResultadoPapanicolaou }) {
  const { obtenerExpediente, obtenerPaciente } = useRepositorio();
  const exp = obtenerExpediente(resultado.expedienteId);
  const pac = exp ? obtenerPaciente(exp.pacienteId) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
              <Link href={`/expedientes/${resultado.expedienteId}`} className="font-mono text-xs hover:underline">
                {exp?.folio}
              </Link>
              <ClasificacionBadge valor={resultado.clasificacion} />
              <EstadoBadge estado={resultado.estado} />
            </CardTitle>
            <CardDescription>{pac?.nombre} · CURP ficticia {pac?.curp}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
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
    <>
      <div className="text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </>
  );
}

export function Encabezado({ titulo, desc }: { titulo: string; desc: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export function AvisoRol({ requerido, actual }: { requerido: string; actual: string }) {
  if (requerido === actual) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      Este paso lo realiza el rol <strong>{requerido}</strong>. Tu rol simulado actual es <strong>{actual}</strong>;
      cámbialo en la esquina superior derecha para habilitar las acciones.
    </div>
  );
}

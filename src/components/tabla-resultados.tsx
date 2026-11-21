"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClasificacionBadge, EstadoBadge } from "@/components/estado-badge";
import type { ResultadoPapanicolaou } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

interface Props {
  resultados: ResultadoPapanicolaou[];
  accion?: { etiqueta: string; href: (r: ResultadoPapanicolaou) => string };
  vacio?: string;
}

export function TablaResultados({ resultados, accion, vacio }: Props) {
  const { obtenerExpediente, obtenerPaciente } = useRepositorio();
  if (resultados.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
        {vacio ?? "No hay resultados en este estado."}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Paciente (ficticia)</TableHead>
            <TableHead>Clasificación</TableHead>
            <TableHead>Fecha resultado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultados.map((r) => {
            const exp = obtenerExpediente(r.expedienteId);
            const pac = exp ? obtenerPaciente(exp.pacienteId) : undefined;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/expedientes/${r.expedienteId}`} className="underline-offset-2 hover:underline">
                    {exp?.folio ?? r.expedienteId}
                  </Link>
                </TableCell>
                <TableCell>{pac?.nombre ?? "—"}</TableCell>
                <TableCell><ClasificacionBadge valor={r.clasificacion} /></TableCell>
                <TableCell>{r.fechaResultado}</TableCell>
                <TableCell><EstadoBadge estado={r.estado} /></TableCell>
                <TableCell className="text-right">
                  {accion && (
                    <Button size="sm" variant="outline" render={<Link href={accion.href(r)} />}>
                      {accion.etiqueta}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

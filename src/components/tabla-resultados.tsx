"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { EmptyState } from "@/components/ds";
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
    return <EmptyState title="Sin resultados en este paso" description={vacio ?? "No hay resultados en este estado."} />;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="bg-surface-2 hover:bg-surface-2">
            <TableHead className="eyebrow h-11 px-4">Folio</TableHead>
            <TableHead className="eyebrow h-11">Paciente (ficticia)</TableHead>
            <TableHead className="eyebrow h-11">Clasificación</TableHead>
            <TableHead className="eyebrow h-11">Fecha resultado</TableHead>
            <TableHead className="eyebrow h-11">Estado</TableHead>
            <TableHead className="eyebrow h-11 pr-4 text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultados.map((r) => {
            const exp = obtenerExpediente(r.expedienteId);
            const pac = exp ? obtenerPaciente(exp.pacienteId) : undefined;
            return (
              <TableRow key={r.id} className="h-14 text-[0.95rem]">
                <TableCell className="px-4 font-mono text-sm">
                  <Link
                    href={`/expedientes/${r.expedienteId}`}
                    className="rounded text-brand-wine underline-offset-4 hover:underline"
                  >
                    {exp?.folio ?? r.expedienteId}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{pac?.nombre ?? "—"}</TableCell>
                <TableCell><ClasificacionBadge valor={r.clasificacion} /></TableCell>
                <TableCell className="numeric text-muted-foreground">{r.fechaResultado}</TableCell>
                <TableCell><EstadoBadge estado={r.estado} /></TableCell>
                <TableCell className="pr-4 text-right">
                  {accion && (
                    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={accion.href(r)} />}>
                      {accion.etiqueta} <ArrowRight className="size-3.5" />
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

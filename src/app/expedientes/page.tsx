"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoBadge } from "@/components/estado-badge";
import { PageHeader } from "@/components/ds";
import { useRepositorio } from "@/data/repository";

export default function Expedientes() {
  const { expedientes, obtenerPaciente, resultadosDeExpediente } = useRepositorio();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Registro"
        title="Expedientes"
        description="Expedientes ficticios. Abre uno para asociar un nuevo resultado o consultar su historial."
      />
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-surface-2 hover:bg-surface-2">
              <TableHead className="eyebrow h-11 px-4">Folio</TableHead>
              <TableHead className="eyebrow h-11">Paciente (ficticia)</TableHead>
              <TableHead className="eyebrow h-11">Unidad médica</TableHead>
              <TableHead className="eyebrow h-11">Último resultado</TableHead>
              <TableHead className="h-11 pr-4 text-right"><span className="sr-only">Acción</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expedientes.map((e) => {
              const pac = obtenerPaciente(e.pacienteId);
              const res = resultadosDeExpediente(e.id);
              return (
                <TableRow key={e.id} className="h-14 text-[0.95rem]">
                  <TableCell className="px-4 font-mono text-sm text-brand-wine">{e.folio}</TableCell>
                  <TableCell className="font-medium">{pac?.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{e.unidadMedica}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      {res[0] ? (
                        <EstadoBadge estado={res[0].estado} />
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin resultados</span>
                      )}
                      {res.length > 1 && (
                        <span className="numeric text-xs font-semibold text-muted-foreground">+{res.length - 1}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/expedientes/${e.id}`} />}>
                      Abrir <ArrowRight className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

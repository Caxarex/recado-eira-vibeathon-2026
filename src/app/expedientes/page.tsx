"use client";

import Link from "next/link";
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
import { useRepositorio } from "@/data/repository";

export default function Expedientes() {
  const { expedientes, obtenerPaciente, resultadosDeExpediente } = useRepositorio();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Expedientes</h1>
        <p className="text-sm text-muted-foreground">
          Expedientes ficticios. Abre uno para asociar un nuevo resultado o ver su historial.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Paciente (ficticia)</TableHead>
              <TableHead>Unidad médica</TableHead>
              <TableHead>Último resultado</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expedientes.map((e) => {
              const pac = obtenerPaciente(e.pacienteId);
              const res = resultadosDeExpediente(e.id);
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.folio}</TableCell>
                  <TableCell>{pac?.nombre}</TableCell>
                  <TableCell>{e.unidadMedica}</TableCell>
                  <TableCell>
                    {res[0] ? <EstadoBadge estado={res[0].estado} /> : <span className="text-xs text-muted-foreground">Sin resultados</span>}
                    {res.length > 1 && <span className="ml-2 text-xs text-muted-foreground">+{res.length - 1}</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" render={<Link href={`/expedientes/${e.id}`} />}>
                      Abrir
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

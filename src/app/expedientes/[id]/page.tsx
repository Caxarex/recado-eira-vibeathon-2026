"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ClasificacionBadge, EstadoBadge, SimuladoTag } from "@/components/estado-badge";
import { HistorialResultado } from "@/components/historial-resultado";
import {
  CLASIFICACIONES_BETHESDA,
  type ClasificacionBethesda,
  type ResultadoPapanicolaou,
} from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

const SIGUIENTE_RUTA: Partial<Record<ResultadoPapanicolaou["estado"], (id: string) => string>> = {
  cargado: (id) => `/revision/${id}`,
  en_revision: (id) => `/autorizaciones/${id}`,
  autorizado: (id) => `/notificaciones/${id}`,
  notificado: (id) => `/entregas/${id}`,
  entregado: (id) => `/entregas/${id}`,
};

export default function DetalleExpediente() {
  const { id } = useParams<{ id: string }>();
  const { obtenerExpediente, obtenerPaciente, resultadosDeExpediente, agregarResultado, rol, hidratado } =
    useRepositorio();
  const [abierto, setAbierto] = useState(false);
  const [fechaToma, setFechaToma] = useState("2026-11-01");
  const [fechaResultado, setFechaResultado] = useState("2026-11-15");
  const [laboratorio, setLaboratorio] = useState("Laboratorio Ficticio A");
  const [clasificacion, setClasificacion] = useState<ClasificacionBethesda>("Negativo");

  const exp = obtenerExpediente(id);
  if (!hidratado) return null;
  if (!exp) return <p className="text-sm text-muted-foreground">Expediente no encontrado.</p>;
  const pac = obtenerPaciente(exp.pacienteId);
  const resultados = resultadosDeExpediente(exp.id);

  const asociar = () => {
    if (fechaResultado < fechaToma) {
      toast.error("La fecha de resultado no puede ser anterior a la fecha de toma");
      return;
    }
    const n = String(Date.now()).slice(-4);
    agregarResultado({
      id: `res-nuevo-${Date.now()}`,
      expedienteId: exp.id,
      fechaToma,
      fechaResultado,
      laboratorio,
      clasificacion,
      estado: "cargado",
      documento: {
        id: `doc-nuevo-${n}`,
        nombreArchivo: `PAP-${n}.pdf`,
        tipo: "PDF",
        tamanoKb: 210,
        hashSimulado: `sha256:demo${n}…`,
      },
      historial: [
        {
          fecha: new Date().toISOString(),
          estadoAnterior: null,
          estadoNuevo: "cargado",
          actor: `${rol} Demo`,
          rol,
          nota: "Archivo simulado asociado al expediente.",
        },
      ],
    });
    setAbierto(false);
    toast.success("Resultado asociado (simulado). Ahora aparece en la Bandeja de revisión.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            <Link href="/expedientes" className="hover:underline">Expedientes</Link> / {exp.folio}
          </div>
          <h1 className="text-2xl font-bold">{pac?.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            CURP ficticia {pac?.curp} · Tel. {pac?.telefono} · {pac?.municipio} · {exp.unidadMedica}
          </p>
        </div>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger render={<Button />}>Asociar resultado</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Asociar resultado al expediente <SimuladoTag />
              </DialogTitle>
              <DialogDescription>
                El archivo no se sube realmente; sólo se registran sus metadatos ficticios.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="toma">Fecha de toma</Label>
                  <Input id="toma" type="date" value={fechaToma} onChange={(e) => setFechaToma(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="res">Fecha de resultado</Label>
                  <Input id="res" type="date" value={fechaResultado} onChange={(e) => setFechaResultado(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lab">Laboratorio</Label>
                <Input id="lab" value={laboratorio} onChange={(e) => setLaboratorio(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Clasificación (Bethesda)</Label>
                <Select value={clasificacion} onValueChange={(v) => v && setClasificacion(v as ClasificacionBethesda)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASIFICACIONES_BETHESDA.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border border-dashed bg-slate-50 p-3 text-xs text-muted-foreground">
                Archivo simulado: <span className="font-mono">PAP-XXXX.pdf</span> (210 KB) – no se carga ningún archivo real.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button onClick={asociar}>Asociar (simulado)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <h2 className="text-lg font-semibold">Resultados ({resultados.length})</h2>
      {resultados.length === 0 && (
        <p className="text-sm text-muted-foreground">Este expediente aún no tiene resultados asociados.</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {resultados.map((r) => {
          const siguiente = SIGUIENTE_RUTA[r.estado];
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <span className="font-mono text-xs">{r.documento.nombreArchivo}</span>
                  <ClasificacionBadge valor={r.clasificacion} />
                  <EstadoBadge estado={r.estado} />
                </CardTitle>
                <CardDescription>
                  Toma {r.fechaToma} · Resultado {r.fechaResultado} · {r.laboratorio}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <HistorialResultado historial={r.historial} />
                {siguiente && (
                  <Button size="sm" variant="outline" render={<Link href={siguiente(r.id)} />}>
                    Ir al siguiente paso
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

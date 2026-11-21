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
import { AvisoRol } from "@/components/panel-resultado";
import { VistaPreviaDocumento } from "@/components/vista-previa-pdf";
import { bytesAKb, validarPdf } from "@/contracts/pdf";
import {
  CLASIFICACIONES_BETHESDA,
  rutaOperativa,
  type ClasificacionBethesda,
} from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

export default function DetalleExpediente() {
  const { id } = useParams<{ id: string }>();
  const { obtenerExpediente, obtenerPaciente, resultadosDeExpediente, asociarPdfAExpediente, rol, hidratado } =
    useRepositorio();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fechaToma, setFechaToma] = useState("2026-11-01");
  const [fechaResultado, setFechaResultado] = useState("2026-11-15");
  const [laboratorio, setLaboratorio] = useState("Laboratorio Ficticio A");
  const [clasificacion, setClasificacion] = useState<ClasificacionBethesda>("Negativo");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const exp = obtenerExpediente(id);
  if (!hidratado) return null;
  if (!exp) return <p className="text-sm text-muted-foreground">Expediente no encontrado.</p>;
  const pac = obtenerPaciente(exp.pacienteId);
  const resultados = resultadosDeExpediente(exp.id);

  const elegirArchivo = async (file: File | undefined, input?: HTMLInputElement) => {
    if (!file) {
      setArchivo(null);
      setErrorArchivo(null);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validacion = validarPdf({ nombreArchivo: file.name, tipoMime: file.type, bytes });
    if (!validacion.ok) {
      setArchivo(null);
      setErrorArchivo(validacion.error);
      if (input) input.value = "";
      return;
    }
    setArchivo(file);
    setErrorArchivo(null);
  };

  const asociar = async () => {
    if (rol !== "Capturista") {
      toast.error("Solo el rol simulado Capturista puede asociar un PDF.");
      return;
    }
    if (!archivo) {
      toast.error("Selecciona un PDF de prueba.");
      return;
    }
    setGuardando(true);
    try {
      const bytes = new Uint8Array(await archivo.arrayBuffer());
      const res = await asociarPdfAExpediente({
        expedienteId: exp.id,
        fechaToma,
        fechaResultado,
        laboratorio,
        clasificacion,
        nombreArchivo: archivo.name,
        tipoMime: archivo.type,
        bytes,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setArchivo(null);
      setErrorArchivo(null);
      setAbierto(false);
      toast.success("PDF de prueba asociado. Queda en este navegador y pasa a revisión.");
    } finally {
      setGuardando(false);
    }
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
          <DialogTrigger render={<Button disabled={rol !== "Capturista"} />}>Asociar PDF de prueba</DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Asociar PDF al expediente <SimuladoTag />
              </DialogTitle>
              <DialogDescription>
                El archivo se guarda en este navegador. No se envía a un servidor y no queda en un repositorio clínico seguro.
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
              <div className="grid gap-1.5">
                <Label htmlFor="pdf">PDF de prueba (máximo 2 MB)</Label>
                <Input
                  id="pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-invalid={Boolean(errorArchivo)}
                  onChange={(e) => void elegirArchivo(e.target.files?.[0], e.target)}
                />
                {errorArchivo && <p className="text-xs text-red-700">{errorArchivo}</p>}
                {archivo && !errorArchivo && (
                  <p className="text-xs text-muted-foreground">
                    Seleccionado: <span className="font-mono">{archivo.name}</span> ({bytesAKb(archivo.size)} KB)
                  </p>
                )}
              </div>
              <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">
                Puedes usar el documento ficticio de la demo:{" "}
                <a className="font-medium underline" href="/muestras/pap-ficticio.pdf" download>
                  descargar pap-ficticio.pdf
                </a>
                . Después selecciónalo aquí. No contiene datos de una paciente real.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button disabled={guardando || rol !== "Capturista" || !archivo || Boolean(errorArchivo)} onClick={() => void asociar()}>
                {guardando ? "Guardando…" : "Asociar PDF"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AvisoRol requerido="Capturista" actual={rol} />

      <Separator />

      <h2 className="text-lg font-semibold">Resultados ({resultados.length})</h2>
      {resultados.length === 0 && (
        <p className="text-sm text-muted-foreground">Este expediente aún no tiene resultados asociados.</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {resultados.map((r) => {
          const siguiente = rutaOperativa(r.estado, r.id);
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
                <VistaPreviaDocumento documento={r.documento} compacto />
                <HistorialResultado historial={r.historial} />
                {siguiente && (
                  <Button size="sm" variant="outline" render={<Link href={siguiente} />}>
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

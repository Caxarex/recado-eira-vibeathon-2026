"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ETIQUETA_ESTADO, SimuladoTag, fechaCorta } from "@/components/estado-badge";
import { AvisoRol, Encabezado, PanelResultado } from "@/components/panel-resultado";
import { entregaHabilitada, rutaOperativa } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

const ACTOR = "Trabajo Social Demo";

export default function DetalleEntrega() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { obtenerResultado, transicionarEstado, rol, hidratado } = useRepositorio();
  const [identificacion, setIdentificacion] = useState(false);
  const [fechaSeg, setFechaSeg] = useState("2026-12-15");
  const [responsable, setResponsable] = useState(ACTOR);
  const [motivo, setMotivo] = useState("");

  if (!hidratado) return null;
  const r = obtenerResultado(id);
  if (!r) return <p className="text-sm text-muted-foreground">Resultado no encontrado.</p>;

  const esTS = rol === "Trabajo social";
  const puedeEntregar = entregaHabilitada(r.estado);
  const siguiente = rutaOperativa(r.estado, r.id);
  const anormal = ["ASC-US", "LSIL", "HSIL"].includes(r.clasificacion);
  const motivoSugerido = anormal
    ? "Referencia a colposcopía y cita de control"
    : r.clasificacion === "Insuficiente"
      ? "Nueva toma de muestra"
      : "Recordatorio de tamizaje anual";

  const entregar = () => {
    const codigo = `ENT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const res = transicionarEstado(r.id, {
      nuevoEstado: "entregado",
      actor: ACTOR,
      nota: `Entrega verificada con identificación. Código ${codigo}.`,
      extra: { entrega: { fecha: new Date().toISOString(), codigoEntrega: codigo, entregadoPor: ACTOR } },
    });
    if (!res.ok) return toast.error(res.error);
    toast.success(`Entrega registrada. Código ${codigo} (simulado).`);
  };

  const agendar = () => {
    const res = transicionarEstado(r.id, {
      nuevoEstado: "en_seguimiento",
      actor: ACTOR,
      nota: `Seguimiento agendado para ${fechaSeg}: ${motivo || motivoSugerido}.`,
      extra: {
        seguimiento: { fechaProgramada: fechaSeg, responsable, motivo: motivo || motivoSugerido },
      },
    });
    if (!res.ok) return toast.error(res.error);
    toast.success("Seguimiento agendado. Flujo completo.");
    router.push("/entregas");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Encabezado titulo="Entrega segura y seguimiento" desc="Última etapa del recorrido." />
      <AvisoRol requerido="Trabajo social" actual={rol} />
      <PanelResultado resultado={r} />

      {!puedeEntregar && r.estado !== "entregado" && r.estado !== "en_seguimiento" && (
        <Card>
          <CardHeader>
            <CardTitle>Entrega no disponible</CardTitle>
            <CardDescription>
              Este resultado está en «{ETIQUETA_ESTADO[r.estado]}». La interfaz no ofrece la entrega
              antes de la autorización clínica humana y de la notificación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {siguiente ? (
              <Button variant="outline" nativeButton={false} render={<Link href={siguiente} />}>
                Ir al paso que corresponde
              </Button>
            ) : (
              <Button variant="outline" nativeButton={false} render={<Link href={`/expedientes/${r.expedienteId}`} />}>
                Volver al expediente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {puedeEntregar && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Entrega del resultado <SimuladoTag /></CardTitle>
            <CardDescription>Se genera un código de entrega ficticio y queda registrado quién entregó.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-brand-wine"
                checked={identificacion}
                disabled={!esTS}
                onChange={(e) => setIdentificacion(e.target.checked)}
              />
              La paciente se identificó y recibe el sobre cerrado en persona.
            </label>
            <div className="flex justify-end">
              <Button disabled={!esTS || !identificacion} onClick={entregar}>Registrar entrega</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {r.entrega && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrega registrada</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Código <span className="font-mono font-semibold">{r.entrega.codigoEntrega}</span> · {fechaCorta(r.entrega.fecha)} · {r.entrega.entregadoPor}
          </CardContent>
        </Card>
      )}

      {r.estado === "entregado" && (
        <Card>
          <CardHeader>
            <CardTitle>Agendar seguimiento</CardTitle>
            <CardDescription>Sugerido según clasificación: {motivoSugerido}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="fs">Fecha programada</Label>
                <Input id="fs" type="date" value={fechaSeg} disabled={!esTS} onChange={(e) => setFechaSeg(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="resp">Responsable</Label>
                <Input id="resp" value={responsable} disabled={!esTS} onChange={(e) => setResponsable(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mot">Motivo</Label>
              <Input id="mot" placeholder={motivoSugerido} value={motivo} disabled={!esTS} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button disabled={!esTS || !fechaSeg} onClick={agendar}>Agendar seguimiento</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {r.seguimiento && (
        <Card className="border-brand-rose-soft bg-brand-rose-pale/40">
          <CardHeader>
            <CardTitle className="text-base">Seguimiento programado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {r.seguimiento.fechaProgramada} · {r.seguimiento.responsable} · {r.seguimiento.motivo}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

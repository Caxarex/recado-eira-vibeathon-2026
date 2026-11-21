"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvisoRol, Encabezado, PanelResultado } from "@/components/panel-resultado";
import { useRepositorio } from "@/data/repository";

const MEDICO = "Dra. Demo Autorizadora";

export default function DetalleAutorizacion() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { obtenerResultado, transicionarEstado, rol, hidratado } = useRepositorio();
  const [nota, setNota] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  if (!hidratado) return null;
  const r = obtenerResultado(id);
  if (!r) return <p className="text-sm text-muted-foreground">Resultado no encontrado.</p>;

  const habilitado = rol === "Médico autorizador" && r.estado === "en_revision";
  const listo = habilitado && confirmado && nota.trim().length >= 10;

  const decidir = (decision: "autorizado" | "rechazado") => {
    const res = transicionarEstado(r.id, {
      nuevoEstado: decision,
      actor: MEDICO,
      nota: nota.trim(),
      extra: {
        autorizacion: {
          fecha: new Date().toISOString(),
          medico: MEDICO,
          decision,
          nota: nota.trim(),
          confirmacionHumana: true,
        },
      },
    });
    if (!res.ok) return toast.error(res.error);
    if (decision === "autorizado") {
      toast.success("Resultado autorizado. Pasa a Notificaciones.");
      router.push("/notificaciones");
    } else {
      toast.warning("Resultado rechazado. Regresa al expediente para corrección.");
      router.push(`/expedientes/${r.expedienteId}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Encabezado
        titulo="Autorización clínica"
        desc="Decisión exclusiva de personal médico humano. Queda registrada con nombre, fecha y nota."
      />
      <AvisoRol requerido="Médico autorizador" actual={rol} />
      <PanelResultado resultado={r} />
      <Card>
        <CardHeader>
          <CardTitle>Decisión del médico</CardTitle>
          <CardDescription>
            La nota es obligatoria (mínimo 10 caracteres) y debe confirmarse la revisión humana.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nota">Nota clínica</Label>
            <Textarea
              id="nota"
              placeholder="Ej. Documento legible, clasificación consistente. Se autoriza entrega."
              value={nota}
              disabled={!habilitado}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-brand-rose-soft bg-brand-rose-pale p-4">
            <Checkbox
              id="confirma"
              checked={confirmado}
              disabled={!habilitado}
              onCheckedChange={(v) => setConfirmado(Boolean(v))}
            />
            <Label htmlFor="confirma" className="font-normal leading-snug">
              Confirmo que un profesional de la salud humano revisó este documento y asume la decisión clínica.
              Esta autorización no es automática ni generada por un sistema.
            </Label>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="destructive" disabled={!listo} onClick={() => decidir("rechazado")}>
              Rechazar
            </Button>
            <Button disabled={!listo} onClick={() => decidir("autorizado")}>
              Autorizar
            </Button>
          </div>
          {r.estado !== "en_revision" && (
            <p className="text-sm text-muted-foreground">Este resultado ya no está en estado “En revisión”.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

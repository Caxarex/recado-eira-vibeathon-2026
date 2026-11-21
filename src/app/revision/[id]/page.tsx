"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AvisoRol, Encabezado, PanelResultado } from "@/components/panel-resultado";
import { useRepositorio } from "@/data/repository";

const CHECKS = [
  "El documento es legible y está completo",
  "El nombre y la CURP coinciden con el expediente",
  "La fecha de toma es anterior o igual a la fecha de resultado",
  "La clasificación capturada coincide con el documento",
];

export default function DetalleRevision() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { obtenerResultado, transicionarEstado, rol, hidratado } = useRepositorio();
  const [marcados, setMarcados] = useState<boolean[]>(CHECKS.map(() => false));

  if (!hidratado) return null;
  const r = obtenerResultado(id);
  if (!r) return <p className="text-sm text-muted-foreground">Resultado no encontrado.</p>;

  const habilitado = rol === "Revisor" && r.estado === "cargado";
  const completo = marcados.every(Boolean);

  const enviar = () => {
    const res = transicionarEstado(r.id, {
      nuevoEstado: "en_revision",
      actor: "Revisor Demo",
      nota: "Checklist de revisión documental completado.",
    });
    if (!res.ok) return toast.error(res.error);
    toast.success("Enviado a autorización clínica");
    router.push("/autorizaciones");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Encabezado titulo="Revisión documental" desc="Verifica el documento antes de enviarlo a autorización." />
      <AvisoRol requerido="Revisor" actual={rol} />
      <PanelResultado resultado={r} />
      <Card>
        <CardHeader>
          <CardTitle>Checklist de verificación</CardTitle>
          <CardDescription>Todos los puntos deben estar marcados para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CHECKS.map((c, i) => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox
                id={`chk-${i}`}
                checked={marcados[i]}
                disabled={!habilitado}
                onCheckedChange={(v) =>
                  setMarcados((m) => m.map((x, j) => (j === i ? Boolean(v) : x)))
                }
              />
              <Label htmlFor={`chk-${i}`} className="font-normal">{c}</Label>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button disabled={!habilitado || !completo} onClick={enviar}>
              Enviar a autorización
            </Button>
          </div>
          {r.estado !== "cargado" && (
            <p className="text-xs text-muted-foreground">Este resultado ya no está en estado “Cargado”.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

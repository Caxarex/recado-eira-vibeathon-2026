"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageSquare, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimuladoTag } from "@/components/estado-badge";
import { AvisoRol, Encabezado, PanelResultado } from "@/components/panel-resultado";
import type { CanalNotificacion } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

const GUION_LLAMADA = [
  "Buen día, ¿hablo con la señora [nombre]? Le llamo de EIRA Movimiento Rosa.",
  "Le informo que su resultado de Papanicolaou ya está disponible.",
  "Por su privacidad, no puedo darle el resultado por teléfono.",
  "Puede recogerlo en [unidad médica] presentando su identificación y el código que le daremos.",
  "¿Tiene alguna duda sobre cómo recogerlo? Gracias, que tenga buen día.",
];

export default function DetalleNotificacion() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { obtenerResultado, obtenerExpediente, obtenerPaciente, transicionarEstado, rol, hidratado } =
    useRepositorio();
  const [canal, setCanal] = useState<CanalNotificacion>("Llamada");
  const [llamando, setLlamando] = useState(false);
  const [pasoLlamada, setPasoLlamada] = useState(0);

  if (!hidratado) return null;
  const r = obtenerResultado(id);
  if (!r) return <p className="text-sm text-muted-foreground">Resultado no encontrado.</p>;
  const exp = obtenerExpediente(r.expedienteId);
  const pac = exp ? obtenerPaciente(exp.pacienteId) : undefined;

  const habilitado = rol === "Trabajo social" && r.estado === "autorizado";
  const mensajeTexto = `EIRA Movimiento Rosa: Hola ${pac?.nombre?.split(" ")[0] ?? ""}, su resultado ya está disponible. Recójalo en ${exp?.unidadMedica} con identificación. No compartimos resultados por este medio. (SIMULADO)`;

  const registrar = (mensaje: string) => {
    const res = transicionarEstado(r.id, {
      nuevoEstado: "notificado",
      actor: "Trabajo Social Demo",
      nota: `Notificación simulada por ${canal}.`,
      extra: {
        notificacion: { fecha: new Date().toISOString(), canal, mensaje, simulado: true },
      },
    });
    if (!res.ok) return toast.error(res.error);
    toast.success(`Notificación por ${canal} registrada (simulada). Pasa a Entregas.`);
    router.push("/entregas");
  };

  const iniciarLlamada = () => {
    setLlamando(true);
    setPasoLlamada(0);
  };
  const siguientePaso = () => {
    if (pasoLlamada < GUION_LLAMADA.length - 1) setPasoLlamada((p) => p + 1);
    else {
      setLlamando(false);
      registrar(`Llamada demo completada siguiendo guion de ${GUION_LLAMADA.length} pasos.`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Encabezado
        titulo="Notificar disponibilidad"
        desc="Se avisa a la paciente que puede recoger su resultado. Nunca se comunica el resultado por el canal."
      />
      <AvisoRol requerido="Trabajo social" actual={rol} />
      <PanelResultado resultado={r} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Canal de notificación <SimuladoTag />
          </CardTitle>
          <CardDescription>Ningún mensaje ni llamada se realiza realmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={canal} onValueChange={(v) => setCanal(v as CanalNotificacion)}>
            <TabsList>
              <TabsTrigger value="Llamada"><Phone className="size-3.5" /> Llamada demo</TabsTrigger>
              <TabsTrigger value="SMS"><MessageSquare className="size-3.5" /> SMS</TabsTrigger>
              <TabsTrigger value="WhatsApp"><Send className="size-3.5" /> WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="Llamada" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                Teléfono ficticio: <span className="font-mono">{pac?.telefono}</span>
              </p>
              {!llamando ? (
                <Button disabled={!habilitado} onClick={iniciarLlamada}>
                  <Phone className="size-4" /> Iniciar llamada demo
                </Button>
              ) : (
                <div className="space-y-3 rounded-md border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 animate-pulse rounded-full bg-green-500" />
                    Llamada simulada en curso · paso {pasoLlamada + 1} de {GUION_LLAMADA.length}
                  </div>
                  <p className="text-sm">
                    {GUION_LLAMADA[pasoLlamada]
                      .replace("[nombre]", pac?.nombre ?? "")
                      .replace("[unidad médica]", exp?.unidadMedica ?? "")}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={siguientePaso}>
                      {pasoLlamada < GUION_LLAMADA.length - 1 ? "Siguiente" : "Finalizar y registrar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLlamando(false)}>
                      Colgar sin registrar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {(["SMS", "WhatsApp"] as const).map((c) => (
              <TabsContent key={c} value={c} className="space-y-3 pt-3">
                <div className="rounded-md border bg-slate-50 p-3 text-sm">
                  <div className="mb-1 text-xs text-muted-foreground">Mensaje que se habría enviado a {pac?.telefono}:</div>
                  {mensajeTexto}
                </div>
                <Button disabled={!habilitado} onClick={() => registrar(mensajeTexto)}>
                  <Send className="size-4" /> Simular envío por {c}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
          {r.estado !== "autorizado" && (
            <p className="mt-3 text-xs text-muted-foreground">Este resultado ya no está en estado “Autorizado”.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

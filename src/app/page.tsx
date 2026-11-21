"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ETIQUETA_ESTADO } from "@/components/estado-badge";
import { ESTADOS_RESULTADO } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

const PASOS = [
  { n: 1, titulo: "Asociar resultado", desc: "El capturista vincula el PDF del laboratorio a un expediente.", href: "/expedientes", rol: "Capturista" },
  { n: 2, titulo: "Revisar documento", desc: "El revisor verifica legibilidad y coincidencia de datos.", href: "/revision", rol: "Revisor" },
  { n: 3, titulo: "Autorizar clínicamente", desc: "Un médico humano autoriza o rechaza con nota obligatoria.", href: "/autorizaciones", rol: "Médico autorizador" },
  { n: 4, titulo: "Notificar disponibilidad", desc: "Se simula SMS / WhatsApp / llamada a la paciente.", href: "/notificaciones", rol: "Trabajo social" },
  { n: 5, titulo: "Entregar y dar seguimiento", desc: "Entrega segura con código y agenda de seguimiento.", href: "/entregas", rol: "Trabajo social" },
];

export default function Inicio() {
  const { resultados, hidratado } = useRepositorio();
  const conteo = Object.fromEntries(
    ESTADOS_RESULTADO.map((e) => [e, resultados.filter((r) => r.estado === e).length]),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RECADO – Demo interactiva</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recorrido simulado: resultado de Papanicolaou → revisión → autorización clínica humana → notificación → entrega y seguimiento.
          Cambia el <strong>rol simulado</strong> en la esquina superior derecha para habilitar cada paso.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {ESTADOS_RESULTADO.map((e) => (
          <Card key={e} className="py-3">
            <CardContent className="px-3">
              <div className="text-2xl font-bold">{hidratado ? conteo[e] : "–"}</div>
              <div className="text-xs text-muted-foreground">{ETIQUETA_ESTADO[e]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {PASOS.map((p) => (
          <Card key={p.n}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-pink-600 text-xs text-white">{p.n}</span>
                {p.titulo}
              </CardTitle>
              <CardDescription>{p.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rol: {p.rol}</span>
              <Button size="sm" variant="outline" render={<Link href={p.href} />}>
                Ir <ArrowRight className="size-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

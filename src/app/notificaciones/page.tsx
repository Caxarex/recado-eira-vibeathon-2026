"use client";

import { TablaResultados } from "@/components/tabla-resultados";
import { AvisoRol, Encabezado } from "@/components/panel-resultado";
import { useRepositorio } from "@/data/repository";

export default function Notificaciones() {
  const { resultados, rol, hidratado } = useRepositorio();
  if (!hidratado) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Encabezado
        titulo="Notificaciones"
        desc="Resultados autorizados listos para avisar a la paciente que puede recoger su resultado. Todo envío es simulado."
      />
      <AvisoRol requerido="Trabajo social" actual={rol} />
      <TablaResultados
        resultados={resultados.filter((r) => r.estado === "autorizado")}
        accion={{ etiqueta: "Notificar", href: (r) => `/notificaciones/${r.id}` }}
        vacio="No hay resultados pendientes de notificación."
      />
    </div>
  );
}

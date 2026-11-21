"use client";

import { TablaResultados } from "@/components/tabla-resultados";
import { Encabezado } from "@/components/panel-resultado";
import { useRepositorio } from "@/data/repository";

export default function Revision() {
  const { resultados, hidratado } = useRepositorio();
  if (!hidratado) return null;
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Encabezado
        titulo="Bandeja de revisión"
        desc="Resultados cargados que esperan verificación documental por el Revisor."
      />
      <TablaResultados
        resultados={resultados.filter((r) => r.estado === "cargado")}
        accion={{ etiqueta: "Revisar", href: (r) => `/revision/${r.id}` }}
        vacio="No hay resultados pendientes de revisión. Asocia uno desde un expediente."
      />
    </div>
  );
}

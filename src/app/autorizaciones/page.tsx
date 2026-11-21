"use client";

import { TablaResultados } from "@/components/tabla-resultados";
import { AvisoRol, Encabezado } from "@/components/panel-resultado";
import { useRepositorio } from "@/data/repository";

export default function Autorizaciones() {
  const { resultados, rol, hidratado } = useRepositorio();
  if (!hidratado) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Encabezado
        titulo="Autorizaciones clínicas"
        desc="Resultados revisados que requieren autorización por un médico humano."
      />
      <AvisoRol requerido="Médico autorizador" actual={rol} />
      <TablaResultados
        resultados={resultados.filter((r) => r.estado === "en_revision")}
        accion={{ etiqueta: "Autorizar / Rechazar", href: (r) => `/autorizaciones/${r.id}` }}
        vacio="No hay resultados pendientes de autorización."
      />
    </div>
  );
}

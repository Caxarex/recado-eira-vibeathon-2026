"use client";

import { TablaResultados } from "@/components/tabla-resultados";
import { AvisoRol, Encabezado } from "@/components/panel-resultado";
import { useRepositorio } from "@/data/repository";

export default function Entregas() {
  const { resultados, rol, hidratado } = useRepositorio();
  if (!hidratado) return null;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Encabezado
        titulo="Entregas y seguimiento"
        desc="Entrega segura del resultado con código de verificación y agenda de seguimiento."
      />
      <AvisoRol requerido="Trabajo social" actual={rol} />
      <section className="space-y-2">
        <h2 className="font-semibold">Pendientes de entrega</h2>
        <TablaResultados
          resultados={resultados.filter((r) => r.estado === "notificado")}
          accion={{ etiqueta: "Entregar", href: (r) => `/entregas/${r.id}` }}
          vacio="No hay resultados notificados pendientes de entrega."
        />
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Entregados, pendientes de agendar seguimiento</h2>
        <TablaResultados
          resultados={resultados.filter((r) => r.estado === "entregado")}
          accion={{ etiqueta: "Agendar seguimiento", href: (r) => `/entregas/${r.id}` }}
          vacio="No hay entregas pendientes de seguimiento."
        />
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">En seguimiento</h2>
        <TablaResultados
          resultados={resultados.filter((r) => r.estado === "en_seguimiento")}
          accion={{ etiqueta: "Ver", href: (r) => `/entregas/${r.id}` }}
          vacio="Aún no hay casos en seguimiento."
        />
      </section>
    </div>
  );
}

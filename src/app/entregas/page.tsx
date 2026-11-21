"use client";

import { TablaResultados } from "@/components/tabla-resultados";
import { AvisoRol, Encabezado } from "@/components/panel-resultado";
import { SectionTitle } from "@/components/ds";
import { entregaHabilitada } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

export default function Entregas() {
  const { resultados, rol, hidratado } = useRepositorio();
  if (!hidratado) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Encabezado
        titulo="Entregas y seguimiento"
        desc="La entrega solo aparece después de la autorización clínica humana y de la notificación. El código de verificación es ficticio."
      />
      <AvisoRol requerido="Trabajo social" actual={rol} />
      <section className="space-y-3">
        <SectionTitle title="Pendientes de entrega" />
        <TablaResultados
          resultados={resultados.filter((r) => entregaHabilitada(r.estado))}
          accion={{ etiqueta: "Entregar", href: (r) => `/entregas/${r.id}` }}
          vacio="No hay resultados notificados pendientes de entrega."
        />
      </section>
      <section className="space-y-3">
        <SectionTitle title="Entregados, pendientes de agendar seguimiento" />
        <TablaResultados
          resultados={resultados.filter((r) => r.estado === "entregado")}
          accion={{ etiqueta: "Agendar seguimiento", href: (r) => `/entregas/${r.id}` }}
          vacio="No hay entregas pendientes de seguimiento."
        />
      </section>
      <section className="space-y-3">
        <SectionTitle title="En seguimiento" />
        <TablaResultados
          resultados={resultados.filter((r) => r.estado === "en_seguimiento")}
          accion={{ etiqueta: "Ver", href: (r) => `/entregas/${r.id}` }}
          vacio="Aún no hay casos en seguimiento."
        />
      </section>
    </div>
  );
}

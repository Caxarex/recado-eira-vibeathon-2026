"use client";

import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ETIQUETA_ESTADO, EstadoBadge } from "@/components/estado-badge";
import { AlertPanel, KpiCard, PageHeader, SectionTitle } from "@/components/ds";
import { ESTADOS_RESULTADO, type EstadoResultado } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";

const PASOS = [
  { n: 1, titulo: "Asociar PDF de prueba", desc: "El capturista elige un PDF ficticio. Se guarda solo en este navegador, no en un repositorio clínico.", href: "/expedientes", rol: "Capturista" },
  { n: 2, titulo: "Revisar documento", desc: "El revisor verifica legibilidad y coincidencia de datos.", href: "/revision", rol: "Revisor" },
  { n: 3, titulo: "Autorizar clínicamente", desc: "Un médico humano autoriza o rechaza con nota obligatoria.", href: "/autorizaciones", rol: "Médico autorizador" },
  { n: 4, titulo: "Notificar disponibilidad", desc: "Se simula SMS / WhatsApp / llamada a la paciente.", href: "/notificaciones", rol: "Trabajo social" },
  { n: 5, titulo: "Entregar y dar seguimiento", desc: "Entrega segura con código y agenda de seguimiento.", href: "/entregas", rol: "Trabajo social" },
];

const DESTACADOS: EstadoResultado[] = ["cargado", "en_revision", "autorizado", "notificado"];

export default function Inicio() {
  const { resultados, hidratado } = useRepositorio();
  const conteo = Object.fromEntries(
    ESTADOS_RESULTADO.map((e) => [e, resultados.filter((r) => r.estado === e).length]),
  ) as Record<EstadoResultado, number>;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="bg-editorial -mx-4 -mt-6 border-b px-4 pb-8 pt-8 md:-mx-8 md:-mt-8 md:px-8 md:pb-10 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            eyebrow="Reto 4 · EIRA Movimiento Rosa"
            title="Cada resultado llega a quien lo espera, con cuidado y a tiempo."
            description={
              <>
                RECADO acompaña el recorrido de un resultado de Papanicolaou: revisión documental, autorización clínica
                por personal humano, aviso a la paciente, entrega segura y seguimiento. Cambia el{" "}
                <strong className="text-foreground">rol simulado</strong> arriba a la derecha para habilitar cada paso.
              </>
            }
            actions={
              <>
                <Button nativeButton={false} render={<Link href="/casos" />}>
                  <Phone className="size-4" /> Abrir casos demo
                </Button>
                <Button variant="outline" nativeButton={false} render={<Link href="/expedientes" />}>
                  Ver expedientes <ArrowRight className="size-4" />
                </Button>
              </>
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Pulso del recorrido" description="Resultados ficticios en cada etapa, en este navegador." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DESTACADOS.map((e, i) => (
            <KpiCard
              key={e}
              label={ETIQUETA_ESTADO[e]}
              value={hidratado ? conteo[e] : "–"}
              tone={i === 0 ? "default" : i === 1 ? "warning" : i === 2 ? "success" : "brand"}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>También:</span>
          {(["rechazado", "entregado", "en_seguimiento"] as EstadoResultado[]).map((e) => (
            <span key={e} className="inline-flex items-center gap-1.5">
              <EstadoBadge estado={e} />
              <span className="numeric font-semibold text-foreground">{hidratado ? conteo[e] : "–"}</span>
            </span>
          ))}
        </div>
      </section>

      <AlertPanel
        variant="simulation"
        title="Casos de la llamada demo"
        actions={
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/casos" />}>
            Abrir casos <ArrowRight className="size-3.5" />
          </Button>
        }
      >
        DEMO-001 a DEMO-006, con eventos compartidos en el servidor. Ana usa DEMO-002 y Felipe usa DEMO-001.
      </AlertPanel>

      <section className="space-y-4">
        <SectionTitle title="Recorrido en cinco pasos" description="Cada paso exige un rol concreto; así se refleja la separación de responsabilidades." />
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PASOS.map((p) => (
            <li
              key={p.n}
              className="group flex flex-col justify-between gap-5 rounded-2xl border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="numeric grid size-9 shrink-0 place-items-center rounded-full bg-brand-wine font-heading text-sm font-bold text-primary-foreground">
                    {p.n}
                  </span>
                  <h3 className="leading-tight">{p.titulo}</h3>
                </div>
                <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">Rol · {p.rol}</span>
                <Button size="sm" variant="secondary" nativeButton={false} render={<Link href={p.href} />}>
                  Ir <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

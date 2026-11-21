"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SlotSegundoChat } from "@/components/llamada/slot-segundo-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AVISO_NEUTRO,
  BLOQUEO_AUTORIZACION,
  BLOQUEO_CONSENTIMIENTO,
  CLAVE_ESCALADO,
  estadoVisible,
  entregaCompletada,
  metricasDe,
  OPCIONES_LLAMADA,
  PEDIR_CLAVE,
  SIN_RESPUESTA_TEXTO,
  VOZ_NO_DISPONIBLE,
  type CasoOperativo,
  type EstadoPublico,
  type EventoCaso,
  type TipoEvento,
} from "@/contracts/casos-ana";
import { useRepositorio } from "@/data/repository";

const ETIQUETA: Record<TipoEvento, string> = {
  recepcion_aviso: "Recepción del aviso",
  acceso_pdf: "Acceso al PDF",
  acompanamiento: "Acompañamiento",
  revision_personal: "Revisión del personal",
  autorizacion_medica: "Autorización médica",
  intento_contacto: "Intento de contacto",
  sin_respuesta: "Sin respuesta",
  verificacion_fallo: "Clave incorrecta",
  verificacion_ok: "Clave correcta",
  escalado_humano: "Escalado humano",
};

type CuerpoCaso = EstadoPublico & {
  caso?: CasoOperativo;
  ok?: boolean;
  error?: string;
  mensaje?: string;
  resultado?: string;
  duplicado?: boolean;
};

export default function DetalleCaso() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { rol, hidratado } = useRepositorio();
  const [caso, setCaso] = useState<CasoOperativo | null>(null);
  const [eventos, setEventos] = useState<EventoCaso[]>([]);
  const [archivados, setArchivados] = useState<EventoCaso[]>([]);
  const [claveDemo, setClaveDemo] = useState("");
  const [nota, setNota] = useState("");
  const [digitos, setDigitos] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorPaciente, setErrorPaciente] = useState<string | null>(null);
  const [errorPersonal, setErrorPersonal] = useState<string | null>(null);
  const [pdfPaciente, setPdfPaciente] = useState<string | null>(null);
  const [pdfPersonal, setPdfPersonal] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [pedirBarrera, setPedirBarrera] = useState(false);
  const editandoNota = useRef(false);
  const ocupadoRef = useRef(false);

  const aplicar = useCallback((data: CuerpoCaso) => {
    if (data.caso) setCaso(data.caso);
    setEventos(data.eventos.filter((e) => e.caseId === id));
    setArchivados(data.archivados.filter((e) => e.caseId === id));
    setClaveDemo(data.claveDemo);
  }, [id]);

  const recargar = useCallback(async () => {
    const res = await fetch(`/api/casos/${id}`, { cache: "no-store" });
    const data = (await res.json()) as CuerpoCaso;
    if (!res.ok) {
      setError(data.error ?? "Caso no encontrado.");
      setCaso(null);
      return;
    }
    setError(null);
    aplicar(data);
    if (!editandoNota.current && data.caso) setNota(data.caso.notaOperativa);
  }, [aplicar, id]);

  useEffect(() => {
    let vivo = true;
    recargar().catch(() => {
      if (vivo) setError("No hay respuesta del servidor de casos.");
    });
    const reloj = window.setInterval(() => {
      if (!vivo || document.hidden || ocupadoRef.current) return;
      recargar().catch(() => undefined);
    }, 4000);
    return () => {
      vivo = false;
      window.clearInterval(reloj);
    };
  }, [recargar]);

  useEffect(() => {
    return () => {
      if (pdfPaciente) URL.revokeObjectURL(pdfPaciente);
      if (pdfPersonal) URL.revokeObjectURL(pdfPersonal);
    };
  }, [pdfPaciente, pdfPersonal]);

  async function enviar(accion: string, extra: Record<string, unknown> = {}) {
    ocupadoRef.current = true;
    setOcupado(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/casos/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ accion, rol, ...extra }),
      });
      const data = (await res.json()) as CuerpoCaso;
      if (!res.ok || data.ok === false) {
        setMensaje(data.error ?? "El servidor rechazó la acción.");
        if (data.caso) aplicar(data);
        return data;
      }
      aplicar(data);
      setMensaje(data.mensaje ?? null);
      if (data.resultado === "reintento" || data.resultado === "escalado") setDigitos("");
      return data;
    } finally {
      ocupadoRef.current = false;
      setOcupado(false);
    }
  }

  const comprobar = useCallback(async () => {
    ocupadoRef.current = true;
    setOcupado(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/casos/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ accion: "verificar", rol, digitos }),
      });
      const data = (await res.json()) as CuerpoCaso;
      if (!res.ok || data.ok === false) {
        setMensaje(data.error ?? "No se pudo comprobar la clave.");
        return;
      }
      aplicar(data);
      setMensaje(data.mensaje ?? null);
      if (data.resultado === "reintento" || data.resultado === "escalado" || data.resultado === "correcta") {
        setDigitos("");
      }
    } finally {
      ocupadoRef.current = false;
      setOcupado(false);
    }
  }, [aplicar, digitos, id, rol]);

  useEffect(() => {
    if (!caso?.llamadaAbierta || caso.identidadVerificada || caso.escaladoHumano) return;
    const onKey = (evento: KeyboardEvent) => {
      const destino = evento.target as HTMLElement | null;
      const etiqueta = destino?.tagName;
      if (etiqueta === "TEXTAREA") return;
      if (etiqueta === "INPUT") return;
      if (evento.key >= "0" && evento.key <= "9") {
        evento.preventDefault();
        setDigitos((valor) => (valor + evento.key).slice(0, 8));
      } else if (evento.key === "Backspace") {
        setDigitos((valor) => valor.slice(0, -1));
      } else if (evento.key === "Enter") {
        evento.preventDefault();
        void comprobar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caso, comprobar]);

  async function abrirDocumento(audiencia: "personal" | "paciente") {
    ocupadoRef.current = true;
    setOcupado(true);
    if (audiencia === "paciente") setErrorPaciente(null);
    else setErrorPersonal(null);
    try {
      const res = await fetch(`/api/casos/${id}/documento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ audiencia, rol }),
      });
      const tipo = res.headers.get("content-type") ?? "";
      if (!tipo.includes("pdf")) {
        const data = (await res.json()) as { error?: string };
        const texto = data.error ?? "Acceso bloqueado.";
        if (audiencia === "paciente") {
          setErrorPaciente(texto);
          setPdfPaciente((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        } else {
          setErrorPersonal(texto);
        }
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      if (audiencia === "paciente") {
        setPdfPaciente((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        setPdfPersonal((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    } finally {
      ocupadoRef.current = false;
      setOcupado(false);
      recargar().catch(() => undefined);
    }
  }

  if (!hidratado) return null;
  if (error && !caso) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <p className="text-sm text-red-700">{error}</p>
        <Link href="/casos" className="text-sm text-pink-800 underline">Volver a los casos</Link>
      </div>
    );
  }
  if (!caso) return <p className="text-sm text-muted-foreground">Cargando el caso desde el servidor…</p>;

  const entregado = entregaCompletada(eventos, caso.caseId);
  const metricas = metricasDe(eventos);
  const fase = faseDe(caso, eventos);
  const bloqueo =
    !caso.contactConsent ? BLOQUEO_CONSENTIMIENTO : !caso.medicalAuthorized ? BLOQUEO_AUTORIZACION : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <Link href="/casos" className="text-xs text-pink-800 underline">Casos demo</Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold">
          <span className="font-mono">{caso.caseId}</span>
          <span>{caso.alias}</span>
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-900">Dato sintético</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Escenario demo: {caso.demo.scenario}. Estado: {estadoVisible(caso, eventos)}. Entrega completada: {entregado ? "sí" : "no"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ficha del personal</CardTitle>
          <CardDescription>
            Rol simulado actual: {rol}. Para revisar el documento antes de autorizarlo, elige Revisor o Médico autorizador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="grid gap-1 sm:grid-cols-3">
            <li>Consentimiento de contacto: {caso.contactConsent ? "sí" : "no"}</li>
            <li>Revisión administrativa: {caso.administrativeReviewed ? "sí" : "no"}</li>
            <li>Autorización médica: {caso.medicalAuthorized ? "sí" : "no"}</li>
          </ul>
          {caso.approvedScript ? (
            <p className="rounded-md border bg-white p-3">
              <span className="font-medium">Mensaje aprobado, solo en esta ficha. </span>
              La llamada no lo dice hasta comprobar la clave. {caso.approvedScript}
            </p>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-muted-foreground">
              No hay mensaje aprobado para la paciente.
            </p>
          )}
          <p>
            Clave de demostración, solo para el personal: <strong className="font-mono">{claveDemo}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={ocupado} onClick={() => void abrirDocumento("personal")}>
              Revisar documento como personal
            </Button>
            {!caso.medicalAuthorized && (
              <Button type="button" disabled={ocupado || rol !== "Médico autorizador"} onClick={() => void enviar("autorizar")}>
                Registrar autorización médica
              </Button>
            )}
          </div>
          {rol !== "Médico autorizador" && !caso.medicalAuthorized && (
            <p className="text-xs text-muted-foreground">
              La autorización médica se registra con el rol simulado Médico autorizador.
            </p>
          )}
          {errorPersonal && <p className="text-sm text-red-700">{errorPersonal}</p>}
          {pdfPersonal && (
            <iframe title={`Revisión del personal ${caso.caseId}`} src={pdfPersonal} className="h-80 w-full rounded-md border bg-white" />
          )}
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Nota operativa visible para el otro equipo</span>
            <Textarea
              value={nota}
              maxLength={500}
              onChange={(e) => {
                editandoNota.current = true;
                setNota(e.target.value);
              }}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={ocupado}
            onClick={() =>
              void enviar("nota", { nota }).then((data) => {
                if (data && data.ok !== false) {
                  editandoNota.current = false;
                  toast.success("Nota guardada en el servidor.");
                }
              })
            }
          >
            Guardar nota operativa
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulador de llamada · sin conexión telefónica</CardTitle>
          <CardDescription>{VOZ_NO_DISPONIBLE}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SlotSegundoChat
            caseId={caso.caseId}
            alias={caso.alias}
            llamadaAbierta={caso.llamadaAbierta}
            contactoBloqueado={Boolean(bloqueo) || caso.escaladoHumano}
            motivoBloqueo={bloqueo ?? (caso.escaladoHumano ? CLAVE_ESCALADO : null)}
          />
          {fase === "bloqueado" && bloqueo && (
            <div className="space-y-2">
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-900">{bloqueo}</p>
              <Button type="button" disabled>
                Iniciar contacto simulado
              </Button>
            </div>
          )}
          {fase === "lista" && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={ocupado} onClick={() => void enviar("iniciar")}>
                Iniciar contacto simulado
              </Button>
              <Button type="button" variant="outline" disabled={ocupado} onClick={() => void enviar("sin-respuesta")}>
                Nadie contesta
              </Button>
            </div>
          )}
          {fase === "clave" && (
            <div className="space-y-3">
              <p className="rounded-md bg-white p-3">{AVISO_NEUTRO}</p>
              <p>{PEDIR_CLAVE}</p>
              <p className="text-xs text-muted-foreground">
                Intentos fallidos: {caso.intentosClaveFallidos} de 3. El documento no se muestra en este paso.
              </p>
              <Input
                autoFocus
                inputMode="numeric"
                autoComplete="off"
                aria-label="Clave de dibujos"
                value={digitos}
                onChange={(e) => setDigitos(e.target.value.replace(/\D/g, "").slice(0, 8))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void comprobar();
                  }
                }}
              />
              <div className="grid max-w-xs grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((tecla) => (
                  <Button key={tecla} type="button" variant="outline" onClick={() => setDigitos((valor) => (valor + tecla).slice(0, 8))}>
                    {tecla}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={ocupado} onClick={() => void comprobar()}>
                  Comprobar clave
                </Button>
                <Button type="button" variant="outline" disabled={ocupado} onClick={() => void enviar("sin-respuesta")}>
                  Nadie contesta
                </Button>
              </div>
            </div>
          )}
          {fase === "escalado" && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-900">{CLAVE_ESCALADO}</p>
          )}
          {fase === "sin_respuesta" && (
            <div className="space-y-2">
              <p className="rounded-md bg-white p-3">{SIN_RESPUESTA_TEXTO}</p>
              <Button type="button" disabled={ocupado} onClick={() => void enviar("iniciar")}>
                Iniciar contacto simulado
              </Button>
            </div>
          )}
          {fase === "verificada" && (
            <div className="space-y-3">
              <p className="rounded-md bg-white p-3">{caso.approvedScript || "Tu documento está disponible."}</p>
              <p>{OPCIONES_LLAMADA}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={ocupado} onClick={() => void enviar("confirmar-recepcion")}>
                  {entregado ? "Repetir confirmación de recepción" : "Confirmar recepción del aviso"}
                </Button>
                <Button type="button" variant="outline" disabled={ocupado} onClick={() => setPedirBarrera((v) => !v)}>
                  Solicitar acompañamiento
                </Button>
                <Button type="button" variant="outline" disabled={ocupado} onClick={() => void abrirDocumento("paciente")}>
                  Acceder al documento como paciente
                </Button>
              </div>
              {pedirBarrera && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={ocupado} onClick={() => void enviar("acompanamiento", { barrier: "TRANSPORT" })}>
                    Transporte
                  </Button>
                  <Button type="button" variant="outline" disabled={ocupado} onClick={() => void enviar("acompanamiento", { barrier: "HORARIO" })}>
                    Un horario diferente
                  </Button>
                  <Button type="button" variant="outline" disabled={ocupado} onClick={() => void enviar("acompanamiento", { barrier: "CONTACTO" })}>
                    Ayuda para contactar al equipo
                  </Button>
                </div>
              )}
              {errorPaciente && <p className="text-sm text-red-700">{errorPaciente}</p>}
              {pdfPaciente && (
                <iframe title={`Documento de la paciente ${caso.caseId}`} src={pdfPaciente} className="h-80 w-full rounded-md border bg-white" />
              )}
            </div>
          )}
          {fase !== "verificada" && (
            <div className="space-y-2 border-t pt-3">
              <Button type="button" variant="outline" disabled={ocupado} onClick={() => void abrirDocumento("paciente")}>
                Acceder al documento como paciente
              </Button>
              {errorPaciente && <p className="text-sm text-red-700">{errorPaciente}</p>}
              {pdfPaciente && (
                <iframe title={`Documento de la paciente ${caso.caseId}`} src={pdfPaciente} className="h-80 w-full rounded-md border bg-white" />
              )}
            </div>
          )}
          {mensaje && <p className="rounded-md border bg-slate-50 p-3">{mensaje}</p>}
          <p className="text-xs text-muted-foreground">
            Recepción del aviso: {metricas.recepciones}. Acceso al PDF de la paciente: {metricas.accesosPdf}. Acompañamiento: {metricas.acompanamientos}. Son eventos distintos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos del caso</CardTitle>
          <CardDescription>Lo que está en el servidor ahora. Recargar muestra lo mismo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {eventos.length === 0 && <p className="text-muted-foreground">Todavía no hay eventos.</p>}
          {eventos.map((evento) => (
            <div key={evento.id} className="rounded-md border bg-white px-3 py-2">
              <div className="font-medium">{ETIQUETA[evento.tipo]}</div>
              <div className="font-mono text-xs text-muted-foreground">{evento.id}</div>
              {evento.barrier && <div>Barrera: {evento.barrier}</div>}
            </div>
          ))}
          {archivados.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary>{archivados.length} eventos archivados. No cuentan en el escenario actual.</summary>
              <ul className="mt-2 space-y-1">
                {archivados.map((evento) => (
                  <li key={evento.id} className="font-mono">{evento.tipo} · {evento.id}</li>
                ))}
              </ul>
            </details>
          )}
        </CardContent>
      </Card>

      <details className="text-xs text-muted-foreground">
        <summary>Notas internas de la prueba. No son datos de la persona.</summary>
        <p className="mt-2">Identidad del escenario: {caso.demo.identityScenario}</p>
        <p>Esperado por la prueba: {caso.demo.expected}</p>
        <p>Barrera del JSON: {caso.demo.barrier ?? "ninguna"}</p>
      </details>
    </div>
  );
}

function faseDe(caso: CasoOperativo, eventos: EventoCaso[]) {
  if (!caso.contactConsent || !caso.medicalAuthorized) return "bloqueado" as const;
  if (caso.escaladoHumano) return "escalado" as const;
  if (caso.identidadVerificada) return "verificada" as const;
  if (!caso.llamadaAbierta && eventos.some((e) => e.tipo === "sin_respuesta")) return "sin_respuesta" as const;
  if (caso.llamadaAbierta) return "clave" as const;
  return "lista" as const;
}

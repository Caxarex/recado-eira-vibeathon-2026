/**
 * Casos DEMO de Ana y eventos de la entrega simulada.
 * Los IDs y alias salen de `src/data/casos-demo.json` y no se renombran aquí.
 * La recepción del aviso, el acceso al PDF y el acompañamiento son eventos distintos.
 * La comprobación de la clave es por teclado. No hay respuesta por voz.
 */
import { z } from "zod";
import { ROLES, type Rol } from "./types.ts";

export const CLAVE_DEMO = "2580";
export const MAX_FALLOS_CLAVE = 3;
export const MENSAJE_APROBADO_DEMO =
  "Mensaje de demostración: tu documento está disponible. Puedes solicitar acompañamiento para el siguiente paso.";

export const AVISO_NEUTRO =
  "Hola. Tenemos un recado para ti. Antes de continuar, vamos a comprobar tu clave de dibujos.";
export const PEDIR_CLAVE = "Por favor, marca tu clave de dibujos en el teclado.";
export const CLAVE_CORRECTA = "Gracias. Clave correcta, continuamos.";
export const CLAVE_REINTENTO = "La clave no coincide. Inténtalo de nuevo.";
export const CLAVE_ESCALADO =
  "No pudimos comprobar la clave. El equipo deberá ayudarte por otro canal.";
export const DOCUMENTO_DISPONIBLE =
  "Tu documento está disponible. Puedes confirmar que recibiste este aviso o solicitar acompañamiento para el siguiente paso.";
export const OPCIONES_LLAMADA =
  "Pulsa 1 para confirmar que recibiste este aviso. Pulsa 2 si necesitas ayuda para el siguiente paso.";
export const CIERRE_RECEPCION = "Gracias por confirmar. Que tengas buen día.";
export const ANOTADO_TRANSPORTE =
  "Anotado. El equipo recibirá tu solicitud de apoyo con el transporte y te contactará para acordar el siguiente paso.";
export const SIN_RESPUESTA_TEXTO =
  "Te dejamos este aviso. Tienes un recado pendiente. El equipo volverá a intentar contactarte.";
export const BLOQUEO_AUTORIZACION =
  "La entrega está bloqueada hasta registrar la autorización médica.";
export const BLOQUEO_CONSENTIMIENTO =
  "No hay consentimiento de contacto registrado. Este caso no se puede llamar.";
export const LLAMADA_NO_CONTINUA =
  "La llamada no continúa. El caso está escalado a seguimiento humano.";
export const VOZ_NO_DISPONIBLE =
  "La respuesta por voz no está implementada ni probada. La comprobación es solo por teclado.";

export const BARRERAS = ["TRANSPORT", "HORARIO", "CONTACTO"] as const;
export type Barrera = (typeof BARRERAS)[number];

export const TIPOS_EVENTO = [
  "recepcion_aviso",
  "acceso_pdf",
  "acompanamiento",
  "revision_personal",
  "autorizacion_medica",
  "intento_contacto",
  "sin_respuesta",
  "verificacion_fallo",
  "verificacion_ok",
  "escalado_humano",
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const casoContratoSchema = z.object({
  caseId: z.string().min(1),
  alias: z.string().min(1),
  synthetic: z.literal(true),
  contactConsent: z.boolean(),
  administrativeReviewed: z.boolean(),
  medicalAuthorized: z.boolean(),
  approvedScript: z.string(),
  demo: z.object({
    identityScenario: z.string(),
    scenario: z.string(),
    expected: z.string(),
    barrier: z.string().nullable(),
  }),
});

export type CasoContrato = z.infer<typeof casoContratoSchema>;

export interface CasoOperativo extends CasoContrato {
  notaOperativa: string;
  intentosClaveFallidos: number;
  identidadVerificada: boolean;
  llamadaAbierta: boolean;
  escaladoHumano: boolean;
  pendienteSeguimiento: boolean;
}

export const eventoSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  tipo: z.enum(TIPOS_EVENTO),
  fecha: z.string().min(1),
  barrier: z.string().optional(),
  audiencia: z.enum(["personal", "paciente"]).optional(),
  rol: z.string().optional(),
});

export type EventoCaso = z.infer<typeof eventoSchema>;

export interface MetricasCasos {
  recepciones: number;
  accesosPdf: number;
  acompanamientos: number;
  entregasCompletadas: number;
}

export interface EstadoPublico {
  casos: CasoOperativo[];
  eventos: EventoCaso[];
  archivados: EventoCaso[];
  claveDemo: string;
  vozDisponible: false;
  metricas: MetricasCasos;
}

export type Efecto =
  | {
      ok: true;
      caso: CasoOperativo;
      nuevosEventos: EventoCaso[];
      mensaje: string;
      duplicado?: boolean;
      resultado?: "correcta" | "reintento" | "escalado" | "duplicado";
    }
  | { ok: false; status: number; error: string };

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}

export function copiarCaso(caso: CasoOperativo): CasoOperativo {
  return { ...caso, demo: { ...caso.demo } };
}

export function aOperativo(
  contrato: CasoContrato & Partial<CasoOperativo>,
): CasoOperativo {
  return {
    ...contrato,
    demo: { ...contrato.demo },
    notaOperativa: contrato.notaOperativa ?? "",
    intentosClaveFallidos: contrato.intentosClaveFallidos ?? 0,
    identidadVerificada: contrato.identidadVerificada ?? false,
    llamadaAbierta: contrato.llamadaAbierta ?? false,
    escaladoHumano: contrato.escaladoHumano ?? false,
    pendienteSeguimiento: contrato.pendienteSeguimiento ?? false,
  };
}

export function motivoBloqueoContacto(
  caso: Pick<CasoOperativo, "contactConsent" | "medicalAuthorized" | "escaladoHumano">,
): string | null {
  if (!caso.contactConsent) return BLOQUEO_CONSENTIMIENTO;
  if (!caso.medicalAuthorized) return BLOQUEO_AUTORIZACION;
  if (caso.escaladoHumano) return LLAMADA_NO_CONTINUA;
  return null;
}

/** El personal de revisión puede ver el documento antes de la autorización médica. */
export function puedeRevisarDocumentoPersonal(rol: Rol, caso: CasoContrato): boolean {
  if (rol === "Revisor" || rol === "Médico autorizador") return true;
  return rol === "Trabajo social" && caso.medicalAuthorized;
}

export function decidirDocumento(
  caso: CasoOperativo,
  audiencia: "personal" | "paciente",
  rol: Rol,
):
  | { ok: true; tipoEvento: "revision_personal" | "acceso_pdf" }
  | { ok: false; status: number; error: string } {
  if (audiencia === "personal") {
    if (!puedeRevisarDocumentoPersonal(rol, caso)) {
      return {
        ok: false,
        status: 403,
        error:
          "La revisión del documento corresponde al Revisor o al Médico autorizador. Trabajo social puede abrirlo después de la autorización médica. El selector de rol no es una sesión autenticada.",
      };
    }
    return { ok: true, tipoEvento: "revision_personal" };
  }
  if (!caso.medicalAuthorized) return { ok: false, status: 403, error: BLOQUEO_AUTORIZACION };
  if (!caso.contactConsent) return { ok: false, status: 403, error: BLOQUEO_CONSENTIMIENTO };
  if (caso.escaladoHumano) return { ok: false, status: 403, error: LLAMADA_NO_CONTINUA };
  if (!caso.identidadVerificada) {
    return {
      ok: false,
      status: 403,
      error: "La paciente no puede abrir el documento antes de comprobar la clave.",
    };
  }
  return { ok: true, tipoEvento: "acceso_pdf" };
}

export function entregaCompletada(eventos: EventoCaso[], caseId: string): boolean {
  return eventos.some((e) => e.caseId === caseId && e.tipo === "recepcion_aviso");
}

export function estadoVisible(caso: CasoOperativo, eventos: EventoCaso[]): string {
  if (entregaCompletada(eventos, caso.caseId)) return "Entregado";
  if (caso.escaladoHumano) return "Escalado a seguimiento humano";
  if (eventos.some((e) => e.caseId === caso.caseId && e.tipo === "acompanamiento")) {
    return "Acompañamiento solicitado";
  }
  if (
    caso.pendienteSeguimiento ||
    eventos.some((e) => e.caseId === caso.caseId && e.tipo === "sin_respuesta")
  ) {
    return "Pendiente de seguimiento";
  }
  if (!caso.contactConsent) return "Sin consentimiento de contacto";
  if (!caso.medicalAuthorized) return "Sin autorización médica";
  return "Listo para contacto";
}

export function metricasDe(eventos: EventoCaso[]): MetricasCasos {
  const recepciones = eventos.filter((e) => e.tipo === "recepcion_aviso");
  return {
    recepciones: recepciones.length,
    accesosPdf: eventos.filter((e) => e.tipo === "acceso_pdf").length,
    acompanamientos: eventos.filter((e) => e.tipo === "acompanamiento").length,
    entregasCompletadas: new Set(recepciones.map((e) => e.caseId)).size,
  };
}

function fallo(status: number, error: string): Efecto {
  return { ok: false, status, error };
}

function evento(
  id: string,
  caso: CasoOperativo,
  tipo: TipoEvento,
  fecha: string,
  extra?: Partial<Pick<EventoCaso, "barrier" | "audiencia" | "rol">>,
): EventoCaso {
  return { id, caseId: caso.caseId, tipo, fecha, ...extra };
}

function exigeLlamadaVerificada(caso: CasoOperativo): Efecto | null {
  const bloqueo = motivoBloqueoContacto(caso);
  if (bloqueo) return fallo(409, bloqueo);
  if (!caso.identidadVerificada) return fallo(409, "Antes hay que comprobar la clave.");
  return null;
}

export function efectoNota(caso: CasoOperativo, nota: string): Efecto {
  const limpia = nota.trim();
  if (limpia.length > 500) return fallo(400, "La nota admite hasta 500 caracteres.");
  return {
    ok: true,
    caso: { ...copiarCaso(caso), notaOperativa: limpia },
    nuevosEventos: [],
    mensaje: "Nota operativa guardada en el servidor.",
  };
}

export function efectoIniciar(caso: CasoOperativo, eventos: EventoCaso[], ahora: string): Efecto {
  const bloqueo = motivoBloqueoContacto(caso);
  if (bloqueo) return fallo(409, bloqueo);
  if (caso.llamadaAbierta) {
    return {
      ok: true,
      caso: copiarCaso(caso),
      nuevosEventos: [],
      mensaje: AVISO_NEUTRO,
      duplicado: true,
    };
  }
  const siguiente = { ...copiarCaso(caso), llamadaAbierta: true };
  return {
    ok: true,
    caso: siguiente,
    nuevosEventos: [
      evento(`evt-${caso.caseId}-intento-${ahora}`, siguiente, "intento_contacto", ahora),
    ],
    mensaje: AVISO_NEUTRO,
  };
}

export function efectoVerificar(
  caso: CasoOperativo,
  digitos: string,
  ahora: string,
): Efecto {
  const bloqueo = motivoBloqueoContacto({ ...caso, escaladoHumano: false });
  if (!caso.contactConsent || !caso.medicalAuthorized) {
    return fallo(409, bloqueo ?? BLOQUEO_AUTORIZACION);
  }
  if (caso.escaladoHumano) return fallo(409, LLAMADA_NO_CONTINUA);
  if (!caso.llamadaAbierta) return fallo(409, "Primero inicia el contacto simulado.");
  if (caso.identidadVerificada) {
    return {
      ok: true,
      caso: copiarCaso(caso),
      nuevosEventos: [],
      mensaje: mensajeClaveCorrecta(caso),
      duplicado: true,
      resultado: "correcta",
    };
  }
  const clave = digitos.trim();
  if (!clave) return fallo(400, "Escribe la clave en el teclado.");
  if (clave === CLAVE_DEMO) {
    const siguiente = { ...copiarCaso(caso), identidadVerificada: true, llamadaAbierta: true };
    return {
      ok: true,
      caso: siguiente,
      nuevosEventos: [
        evento(`evt-${caso.caseId}-verificacion-ok-${ahora}`, siguiente, "verificacion_ok", ahora),
      ],
      mensaje: mensajeClaveCorrecta(siguiente),
      resultado: "correcta",
    };
  }
  const intentos = caso.intentosClaveFallidos + 1;
  const escalado = intentos >= MAX_FALLOS_CLAVE;
  const siguiente = {
    ...copiarCaso(caso),
    intentosClaveFallidos: intentos,
    identidadVerificada: false,
    llamadaAbierta: !escalado,
    escaladoHumano: escalado,
    pendienteSeguimiento: escalado || caso.pendienteSeguimiento,
  };
  const nuevos: EventoCaso[] = [
    evento(`evt-${caso.caseId}-verificacion-fallo-${intentos}`, siguiente, "verificacion_fallo", ahora),
  ];
  if (escalado) {
    nuevos.push(evento(`evt-${caso.caseId}-escalado_humano`, siguiente, "escalado_humano", ahora));
  }
  return {
    ok: true,
    caso: siguiente,
    nuevosEventos: nuevos,
    mensaje: escalado ? CLAVE_ESCALADO : CLAVE_REINTENTO,
    resultado: escalado ? "escalado" : "reintento",
  };
}

function mensajeClaveCorrecta(caso: CasoOperativo): string {
  const cuerpo = caso.approvedScript.trim() || DOCUMENTO_DISPONIBLE;
  return `${CLAVE_CORRECTA} ${cuerpo} ${OPCIONES_LLAMADA}`;
}

export function efectoConfirmar(caso: CasoOperativo, eventos: EventoCaso[], ahora: string): Efecto {
  const bloqueo = exigeLlamadaVerificada(caso);
  if (bloqueo) return bloqueo;
  const previo = eventos.find((e) => e.caseId === caso.caseId && e.tipo === "recepcion_aviso");
  if (previo) {
    return {
      ok: true,
      caso: copiarCaso(caso),
      nuevosEventos: [],
      mensaje: "La recepción ya estaba registrada. No se creó otro registro.",
      duplicado: true,
      resultado: "duplicado",
    };
  }
  return {
    ok: true,
    caso: copiarCaso(caso),
    nuevosEventos: [
      evento(`evt-${caso.caseId}-recepcion_aviso`, caso, "recepcion_aviso", ahora),
    ],
    mensaje: CIERRE_RECEPCION,
  };
}

export function mensajeAcompanamiento(barrier: Barrera): string {
  if (barrier === "TRANSPORT") return ANOTADO_TRANSPORTE;
  if (barrier === "HORARIO") {
    return "Anotado. El equipo registró que necesitas un horario diferente y te contactará para acordar el siguiente paso.";
  }
  return "Anotado. El equipo registró que necesitas ayuda para contactarles y te contactará para acordar el siguiente paso.";
}

export function efectoAcompanamiento(
  caso: CasoOperativo,
  eventos: EventoCaso[],
  barrier: Barrera,
  ahora: string,
): Efecto {
  const bloqueo = exigeLlamadaVerificada(caso);
  if (bloqueo) return bloqueo;
  const id = `evt-${caso.caseId}-acompanamiento-${barrier}`;
  const previo = eventos.find((e) => e.id === id);
  if (previo) {
    return {
      ok: true,
      caso: copiarCaso(caso),
      nuevosEventos: [],
      mensaje: `El seguimiento ${barrier} ya estaba registrado. No se creó otro.`,
      duplicado: true,
      resultado: "duplicado",
    };
  }
  const siguiente = { ...copiarCaso(caso), pendienteSeguimiento: true };
  return {
    ok: true,
    caso: siguiente,
    nuevosEventos: [evento(id, siguiente, "acompanamiento", ahora, { barrier })],
    mensaje: mensajeAcompanamiento(barrier),
  };
}

export function efectoSinRespuesta(caso: CasoOperativo, eventos: EventoCaso[], ahora: string): Efecto {
  if (!caso.contactConsent) return fallo(409, BLOQUEO_CONSENTIMIENTO);
  if (!caso.medicalAuthorized) return fallo(409, BLOQUEO_AUTORIZACION);
  if (caso.escaladoHumano) return fallo(409, LLAMADA_NO_CONTINUA);
  const previo = eventos.find((e) => e.caseId === caso.caseId && e.tipo === "sin_respuesta");
  if (previo) {
    return {
      ok: true,
      caso: copiarCaso(caso),
      nuevosEventos: [],
      mensaje: SIN_RESPUESTA_TEXTO,
      duplicado: true,
    };
  }
  const siguiente = {
    ...copiarCaso(caso),
    pendienteSeguimiento: true,
    llamadaAbierta: false,
    identidadVerificada: caso.identidadVerificada,
  };
  return {
    ok: true,
    caso: siguiente,
    nuevosEventos: [evento(`evt-${caso.caseId}-sin_respuesta`, siguiente, "sin_respuesta", ahora)],
    mensaje: SIN_RESPUESTA_TEXTO,
  };
}

export function efectoAutorizar(caso: CasoOperativo, rol: Rol, ahora: string): Efecto {
  if (rol !== "Médico autorizador") {
    return fallo(
      403,
      "Registrar la autorización médica corresponde al rol simulado Médico autorizador.",
    );
  }
  if (caso.medicalAuthorized) {
    return {
      ok: true,
      caso: copiarCaso(caso),
      nuevosEventos: [],
      mensaje: "La autorización médica ya estaba registrada.",
      duplicado: true,
    };
  }
  const siguiente = {
    ...copiarCaso(caso),
    medicalAuthorized: true,
    approvedScript: caso.approvedScript.trim() || MENSAJE_APROBADO_DEMO,
  };
  return {
    ok: true,
    caso: siguiente,
    nuevosEventos: [
      evento(`evt-${caso.caseId}-autorizacion_medica`, siguiente, "autorizacion_medica", ahora, {
        rol,
      }),
    ],
    mensaje: "Autorización médica registrada. El contacto queda habilitado.",
  };
}

export function esBarrera(valor: unknown): valor is Barrera {
  return typeof valor === "string" && (BARRERAS as readonly string[]).includes(valor);
}

/**
 * Contratos compartidos de RECADO (EIRA Movimiento Rosa).
 * Estos tipos son la fuente de verdad para la app web y para el módulo
 * de datos / Excel / indicadores (equipo de Ana). Cualquier cambio aquí
 * debe reflejarse también en `schemas.ts`.
 *
 * TODOS LOS DATOS QUE CIRCULAN POR ESTOS CONTRATOS EN LA DEMO SON FICTICIOS.
 */

export const ESTADOS_RESULTADO = [
  "cargado",
  "en_revision",
  "autorizado",
  "rechazado",
  "notificado",
  "entregado",
  "en_seguimiento",
] as const;
export type EstadoResultado = (typeof ESTADOS_RESULTADO)[number];

export const CLASIFICACIONES_BETHESDA = [
  "Negativo",
  "ASC-US",
  "LSIL",
  "HSIL",
  "Insuficiente",
] as const;
export type ClasificacionBethesda = (typeof CLASIFICACIONES_BETHESDA)[number];

export const ROLES = [
  "Capturista",
  "Revisor",
  "Médico autorizador",
  "Trabajo social",
] as const;
export type Rol = (typeof ROLES)[number];

export const CANALES_NOTIFICACION = ["SMS", "WhatsApp", "Llamada"] as const;
export type CanalNotificacion = (typeof CANALES_NOTIFICACION)[number];

/**
 * `solo-metadatos`: la semilla no trae binario.
 * `local-navegador`: PDF de prueba guardado en IndexedDB de este equipo.
 * Ningún valor es un repositorio clínico seguro.
 */
export const ALMACENAMIENTOS_DOCUMENTO = ["solo-metadatos", "local-navegador"] as const;
export type AlmacenamientoDocumento = (typeof ALMACENAMIENTOS_DOCUMENTO)[number];

/** Transiciones permitidas de la máquina de estados. */
export const TRANSICIONES: Record<EstadoResultado, EstadoResultado[]> = {
  cargado: ["en_revision"],
  en_revision: ["autorizado", "rechazado"],
  autorizado: ["notificado"],
  rechazado: ["cargado"],
  notificado: ["entregado"],
  entregado: ["en_seguimiento"],
  en_seguimiento: [],
};

export function puedeTransicionar(
  desde: EstadoResultado,
  hacia: EstadoResultado,
): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/**
 * La entrega solo se ofrece cuando el resultado ya fue notificado.
 * Autorizar no alcanza: antes hay revisión humana y después notificación.
 */
export function entregaHabilitada(estado: EstadoResultado): boolean {
  return estado === "notificado";
}

/** Siguiente paso del flujo. Nunca apunta a entrega antes de `notificado`. */
export function rutaOperativa(
  estado: EstadoResultado,
  resultadoId: string,
): string | null {
  switch (estado) {
    case "cargado":
      return `/revision/${resultadoId}`;
    case "en_revision":
      return `/autorizaciones/${resultadoId}`;
    case "autorizado":
      return `/notificaciones/${resultadoId}`;
    case "notificado":
    case "entregado":
      return `/entregas/${resultadoId}`;
    case "en_seguimiento":
    case "rechazado":
      return null;
  }
}

/** Rol simulado que ejecuta cada paso. No representa una sesión autenticada. */
export function rolDelPaso(hacia: EstadoResultado): Rol {
  switch (hacia) {
    case "cargado":
      return "Capturista";
    case "en_revision":
      return "Revisor";
    case "autorizado":
    case "rechazado":
      return "Médico autorizador";
    case "notificado":
    case "entregado":
    case "en_seguimiento":
      return "Trabajo social";
  }
}

export function evaluarTransicion(input: {
  estadoActual: EstadoResultado;
  nuevoEstado: EstadoResultado;
  rol: Rol;
}): { ok: true } | { ok: false; error: string } {
  if (!puedeTransicionar(input.estadoActual, input.nuevoEstado)) {
    return {
      ok: false,
      error: `Transición no permitida: ${input.estadoActual} → ${input.nuevoEstado}`,
    };
  }
  const esperado = rolDelPaso(input.nuevoEstado);
  if (input.rol !== esperado) {
    return {
      ok: false,
      error: `El rol simulado “${input.rol}” no realiza este paso. Corresponde a “${esperado}”. El selector del encabezado no es una sesión autenticada.`,
    };
  }
  return { ok: true };
}

export interface Paciente {
  id: string;
  nombre: string;
  /** CURP ficticia (no corresponde a personas reales). */
  curp: string;
  fechaNacimiento: string; // ISO yyyy-mm-dd
  telefono: string;
  municipio: string;
}

export interface Expediente {
  id: string;
  folio: string;
  pacienteId: string;
  unidadMedica: string;
  fechaApertura: string; // ISO
}

export interface Documento {
  id: string;
  nombreArchivo: string;
  tipo: "PDF" | "Imagen";
  tamanoKb: number;
  /**
   * Huella SHA-256 calculada en el navegador para la demo.
   * No sustituye una custodia clínica ni un sellado de tiempo.
   */
  hashSimulado: string;
  almacenamiento?: AlmacenamientoDocumento;
}

export interface EventoHistorial {
  fecha: string; // ISO datetime
  estadoAnterior: EstadoResultado | null;
  estadoNuevo: EstadoResultado;
  actor: string;
  rol: Rol;
  nota?: string;
}

export interface Autorizacion {
  fecha: string;
  medico: string;
  decision: "autorizado" | "rechazado";
  nota: string;
  confirmacionHumana: true;
}

export interface Notificacion {
  fecha: string;
  canal: CanalNotificacion;
  mensaje: string;
  simulado: true;
}

export interface Entrega {
  fecha: string;
  codigoEntrega: string;
  entregadoPor: string;
}

export interface Seguimiento {
  fechaProgramada: string;
  responsable: string;
  motivo: string;
}

export interface ResultadoPapanicolaou {
  id: string;
  expedienteId: string;
  fechaToma: string; // ISO
  fechaResultado: string; // ISO
  laboratorio: string;
  clasificacion: ClasificacionBethesda;
  estado: EstadoResultado;
  documento: Documento;
  historial: EventoHistorial[];
  autorizacion?: Autorizacion;
  notificacion?: Notificacion;
  entrega?: Entrega;
  seguimiento?: Seguimiento;
}

/** Fila plana esperada desde Excel/CSV (módulo de datos – Ana). */
export interface FilaExcelResultado {
  folio_expediente: string;
  curp: string;
  nombre_paciente: string;
  fecha_nacimiento: string;
  telefono: string;
  municipio: string;
  unidad_medica: string;
  fecha_toma: string;
  fecha_resultado: string;
  laboratorio: string;
  clasificacion: ClasificacionBethesda;
  nombre_archivo: string;
}

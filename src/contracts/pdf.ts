/**
 * Validación de un PDF de prueba antes de asociarlo a un expediente ficticio.
 * El binario no entra al contrato persistido en localStorage: solo metadatos
 * y una huella. El archivo vive en IndexedDB de este navegador.
 */
import type {
  ClasificacionBethesda,
  ResultadoPapanicolaou,
  Rol,
} from "./types.ts";

/** Tope de la demo local. Evita llenar el almacenamiento del navegador. */
export const PDF_MAX_BYTES = 2 * 1024 * 1024;

export const AVISO_ALMACENAMIENTO_LOCAL =
  "El PDF se guarda solo en este navegador (IndexedDB). No está cifrado, no tiene control de acceso real y no es un repositorio clínico de producción.";

const MIME_ACEPTADO = new Set([
  "",
  "application/pdf",
  "application/x-pdf",
  "application/octet-stream",
]);

const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export interface EntradaPdf {
  nombreArchivo: string;
  tipoMime: string;
  bytes: Uint8Array;
}

export interface AsociarPdfInput extends EntradaPdf {
  expedienteId: string;
  fechaToma: string;
  fechaResultado: string;
  laboratorio: string;
  clasificacion: ClasificacionBethesda;
  ahora?: Date;
  idResultado?: string;
  idDocumento?: string;
}

export type ValidacionPdf =
  | { ok: true; nombreArchivo: string; tamanoBytes: number; tamanoKb: number }
  | { ok: false; error: string };

export function validarPdf(entrada: EntradaPdf): ValidacionPdf {
  const nombreArchivo = nombreSeguro(entrada.nombreArchivo);
  if (!nombreArchivo) {
    return { ok: false, error: "El nombre del archivo no es válido." };
  }
  if (!nombreArchivo.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "El archivo debe terminar en .pdf." };
  }
  const mime = entrada.tipoMime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!MIME_ACEPTADO.has(mime)) {
    return {
      ok: false,
      error: "El tipo del archivo no es PDF. Se esperaba application/pdf.",
    };
  }
  if (entrada.bytes.byteLength === 0) {
    return { ok: false, error: "El archivo está vacío." };
  }
  if (entrada.bytes.byteLength > PDF_MAX_BYTES) {
    return {
      ok: false,
      error: "El PDF supera el máximo de 2 MB permitido en esta demo local.",
    };
  }
  if (!tieneCabeceraPdf(entrada.bytes)) {
    return {
      ok: false,
      error: "El contenido no tiene formato PDF: falta la cabecera %PDF-.",
    };
  }
  return {
    ok: true,
    nombreArchivo,
    tamanoBytes: entrada.bytes.byteLength,
    tamanoKb: bytesAKb(entrada.bytes.byteLength),
  };
}

export function bytesAKb(bytes: number): number {
  const kb = Math.round((bytes / 1024) * 10) / 10;
  return Math.max(kb, 0.1);
}

export async function huellaSha256(bytes: Uint8Array): Promise<string> {
  const copia = new Uint8Array(bytes.byteLength);
  copia.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copia);
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

export async function prepararResultadoConPdf(
  input: AsociarPdfInput,
  rol: Rol,
): Promise<{ ok: true; valor: ResultadoPapanicolaou } | { ok: false; error: string }> {
  if (rol !== "Capturista") {
    return {
      ok: false,
      error: "Solo el rol simulado Capturista puede asociar un PDF. No es un inicio de sesión.",
    };
  }
  if (!esFechaISO(input.fechaToma) || !esFechaISO(input.fechaResultado)) {
    return { ok: false, error: "Las fechas deben tener formato yyyy-mm-dd." };
  }
  if (input.fechaResultado < input.fechaToma) {
    return {
      ok: false,
      error: "La fecha de resultado no puede ser anterior a la fecha de toma.",
    };
  }
  if (input.laboratorio.trim().length < 2) {
    return { ok: false, error: "Indica el laboratorio." };
  }
  if (!input.expedienteId.trim()) {
    return { ok: false, error: "Falta el expediente." };
  }

  const validacion = validarPdf(input);
  if (!validacion.ok) return validacion;

  const huella = await huellaSha256(input.bytes);
  const ahora = input.ahora ?? new Date();
  const sello = ahora.getTime();
  const valor: ResultadoPapanicolaou = {
    id: input.idResultado ?? `res-local-${sello}`,
    expedienteId: input.expedienteId,
    fechaToma: input.fechaToma,
    fechaResultado: input.fechaResultado,
    laboratorio: input.laboratorio.trim(),
    clasificacion: input.clasificacion,
    estado: "cargado",
    documento: {
      id: input.idDocumento ?? `doc-local-${sello}`,
      nombreArchivo: validacion.nombreArchivo,
      tipo: "PDF",
      tamanoKb: validacion.tamanoKb,
      hashSimulado: huella,
      almacenamiento: "local-navegador",
    },
    historial: [
      {
        fecha: ahora.toISOString(),
        estadoAnterior: null,
        estadoNuevo: "cargado",
        actor: "Capturista Demo",
        rol: "Capturista",
        nota: `PDF de prueba “${validacion.nombreArchivo}” asociado al expediente. Quedó en el almacenamiento local del navegador. No es un repositorio clínico seguro y todavía no puede entregarse.`,
      },
    ],
  };
  return { ok: true, valor };
}

function esFechaISO(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function nombreSeguro(nombre: string): string | null {
  const base = nombre.replace(/\\/g, "/").split("/").pop()?.trim() ?? "";
  if (!base || base.length > 120 || base.includes("\0")) return null;
  if (base === ".pdf" || base === "..pdf") return null;
  return base;
}

function tieneCabeceraPdf(bytes: Uint8Array): boolean {
  const limite = Math.min(bytes.length, 1024);
  for (let i = 0; i <= limite - FIRMA_PDF.length; i++) {
    let coincide = true;
    for (let j = 0; j < FIRMA_PDF.length; j++) {
      if (bytes[i + j] !== FIRMA_PDF[j]) {
        coincide = false;
        break;
      }
    }
    if (coincide) return true;
  }
  return false;
}

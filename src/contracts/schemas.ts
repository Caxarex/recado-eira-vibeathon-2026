/**
 * Esquemas zod espejo de `types.ts`.
 * Úsalos para validar filas de Excel/CSV y cualquier dato externo antes
 * de meterlo al repositorio.
 */
import { z } from "zod";
import {
  ALMACENAMIENTOS_DOCUMENTO,
  CANALES_NOTIFICACION,
  CLASIFICACIONES_BETHESDA,
  ESTADOS_RESULTADO,
  ROLES,
} from "./types.ts";

const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado yyyy-mm-dd");

export const estadoResultadoSchema = z.enum(ESTADOS_RESULTADO);
export const clasificacionSchema = z.enum(CLASIFICACIONES_BETHESDA);
export const rolSchema = z.enum(ROLES);
export const canalSchema = z.enum(CANALES_NOTIFICACION);

export const pacienteSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(3),
  curp: z.string().length(18, "CURP debe tener 18 caracteres"),
  fechaNacimiento: fechaISO,
  telefono: z.string().min(10).max(15),
  municipio: z.string().min(2),
});

export const expedienteSchema = z.object({
  id: z.string().min(1),
  folio: z.string().min(3),
  pacienteId: z.string().min(1),
  unidadMedica: z.string().min(2),
  fechaApertura: fechaISO,
});

export const almacenamientoDocumentoSchema = z.enum(ALMACENAMIENTOS_DOCUMENTO);

export const documentoSchema = z.object({
  id: z.string(),
  nombreArchivo: z.string().min(1),
  tipo: z.enum(["PDF", "Imagen"]),
  tamanoKb: z.number().positive(),
  hashSimulado: z.string(),
  almacenamiento: almacenamientoDocumentoSchema.optional(),
});

export const eventoHistorialSchema = z.object({
  fecha: z.string(),
  estadoAnterior: estadoResultadoSchema.nullable(),
  estadoNuevo: estadoResultadoSchema,
  actor: z.string(),
  rol: rolSchema,
  nota: z.string().optional(),
});

export const resultadoSchema = z.object({
  id: z.string(),
  expedienteId: z.string(),
  fechaToma: fechaISO,
  fechaResultado: fechaISO,
  laboratorio: z.string().min(2),
  clasificacion: clasificacionSchema,
  estado: estadoResultadoSchema,
  documento: documentoSchema,
  historial: z.array(eventoHistorialSchema),
});

/** Fila plana de Excel/CSV. Punto de entrada del importador (Ana). */
export const filaExcelResultadoSchema = z.object({
  folio_expediente: z.string().min(3),
  curp: z.string().length(18),
  nombre_paciente: z.string().min(3),
  fecha_nacimiento: fechaISO,
  telefono: z.string().min(10),
  municipio: z.string().min(2),
  unidad_medica: z.string().min(2),
  fecha_toma: fechaISO,
  fecha_resultado: fechaISO,
  laboratorio: z.string().min(2),
  clasificacion: clasificacionSchema,
  nombre_archivo: z.string().min(1),
});

export type FilaExcelResultadoValidada = z.infer<typeof filaExcelResultadoSchema>;

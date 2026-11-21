/**
 * DATOS FICTICIOS PARA DEMO. Ninguna persona, CURP, teléfono o unidad
 * médica aquí listada es real.
 */
import type {
  ClasificacionBethesda,
  EstadoResultado,
  EventoHistorial,
  Expediente,
  Paciente,
  ResultadoPapanicolaou,
} from "@/contracts/types";

const municipios = [
  "Municipio Demo Norte",
  "Municipio Demo Sur",
  "Municipio Demo Centro",
];
const unidades = ["CS Demo Norte", "CS Demo Sur", "Hospital Demo Central"];
const laboratorios = ["Laboratorio Ficticio A", "Laboratorio Ficticio B"];

const nombres = [
  "Paciente Ficticia Uno",
  "Paciente Ficticia Dos",
  "Paciente Ficticia Tres",
  "Paciente Ficticia Cuatro",
  "Paciente Ficticia Cinco",
  "Paciente Ficticia Seis",
  "Paciente Ficticia Siete",
  "Paciente Ficticia Ocho",
  "Paciente Ficticia Nueve",
  "Paciente Ficticia Diez",
  "Paciente Ficticia Once",
  "Paciente Ficticia Doce",
];

export const pacientesMock: Paciente[] = nombres.map((nombre, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `pac-${n}`,
    nombre,
    curp: `DEMO${n}0101MDFXXX${n}`.padEnd(18, "0").slice(0, 18),
    fechaNacimiento: `19${70 + i}-0${(i % 9) + 1}-1${i % 9}`,
    telefono: `55500000${n}`,
    municipio: municipios[i % municipios.length],
  };
});

export const expedientesMock: Expediente[] = pacientesMock.map((p, i) => ({
  id: `exp-${String(i + 1).padStart(2, "0")}`,
  folio: `EXP-2026-${String(i + 1).padStart(4, "0")}`,
  pacienteId: p.id,
  unidadMedica: unidades[i % unidades.length],
  fechaApertura: `2026-0${(i % 8) + 1}-05`,
}));

interface Semilla {
  exp: number;
  clasificacion: ClasificacionBethesda;
  estado: EstadoResultado;
}

const semillas: Semilla[] = [
  { exp: 1, clasificacion: "Negativo", estado: "cargado" },
  { exp: 2, clasificacion: "ASC-US", estado: "cargado" },
  { exp: 3, clasificacion: "LSIL", estado: "en_revision" },
  { exp: 4, clasificacion: "Negativo", estado: "en_revision" },
  { exp: 5, clasificacion: "HSIL", estado: "en_revision" },
  { exp: 6, clasificacion: "Negativo", estado: "autorizado" },
  { exp: 7, clasificacion: "Insuficiente", estado: "rechazado" },
  { exp: 8, clasificacion: "Negativo", estado: "notificado" },
  { exp: 9, clasificacion: "LSIL", estado: "notificado" },
  { exp: 10, clasificacion: "Negativo", estado: "entregado" },
  { exp: 11, clasificacion: "HSIL", estado: "en_seguimiento" },
  { exp: 12, clasificacion: "Negativo", estado: "en_seguimiento" },
  { exp: 1, clasificacion: "Negativo", estado: "entregado" },
  { exp: 3, clasificacion: "Negativo", estado: "en_seguimiento" },
  { exp: 5, clasificacion: "ASC-US", estado: "autorizado" },
];

const ORDEN: EstadoResultado[] = [
  "cargado",
  "en_revision",
  "autorizado",
  "notificado",
  "entregado",
  "en_seguimiento",
];

function historialHasta(
  estado: EstadoResultado,
  base: Date,
): EventoHistorial[] {
  const pasos: EstadoResultado[] =
    estado === "rechazado"
      ? ["cargado", "en_revision", "rechazado"]
      : ORDEN.slice(0, ORDEN.indexOf(estado) + 1);
  const actores: Record<EstadoResultado, { actor: string; rol: EventoHistorial["rol"] }> = {
    cargado: { actor: "Capturista Demo", rol: "Capturista" },
    en_revision: { actor: "Revisor Demo", rol: "Revisor" },
    autorizado: { actor: "Dra. Demo Autorizadora", rol: "Médico autorizador" },
    rechazado: { actor: "Dra. Demo Autorizadora", rol: "Médico autorizador" },
    notificado: { actor: "Trabajo Social Demo", rol: "Trabajo social" },
    entregado: { actor: "Trabajo Social Demo", rol: "Trabajo social" },
    en_seguimiento: { actor: "Trabajo Social Demo", rol: "Trabajo social" },
  };
  return pasos.map((p, i) => ({
    fecha: new Date(base.getTime() + i * 6 * 36e5).toISOString(),
    estadoAnterior: i === 0 ? null : pasos[i - 1],
    estadoNuevo: p,
    ...actores[p],
    nota:
      p === "autorizado"
        ? "Documento legible y consistente con el expediente. (SIMULADO)"
        : p === "rechazado"
          ? "Muestra insuficiente, solicitar nueva toma. (SIMULADO)"
          : undefined,
  }));
}

export const resultadosMock: ResultadoPapanicolaou[] = semillas.map((s, i) => {
  const n = String(i + 1).padStart(4, "0");
  const base = new Date(2026, 9, 1 + i, 9, 0, 0);
  const historial = historialHasta(s.estado, base);
  const autoEv = historial.find(
    (h) => h.estadoNuevo === "autorizado" || h.estadoNuevo === "rechazado",
  );
  const notifEv = historial.find((h) => h.estadoNuevo === "notificado");
  const entEv = historial.find((h) => h.estadoNuevo === "entregado");
  const segEv = historial.find((h) => h.estadoNuevo === "en_seguimiento");
  return {
    id: `res-${n}`,
    expedienteId: `exp-${String(s.exp).padStart(2, "0")}`,
    fechaToma: `2026-09-${String(10 + (i % 15)).padStart(2, "0")}`,
    fechaResultado: `2026-10-${String(1 + i).padStart(2, "0")}`,
    laboratorio: laboratorios[i % laboratorios.length],
    clasificacion: s.clasificacion,
    estado: s.estado,
    documento: {
      id: `doc-${n}`,
      nombreArchivo: `PAP-${n}.pdf`,
      tipo: "PDF",
      tamanoKb: 180 + i * 7,
      hashSimulado: `sha256:demo${n}…`,
    },
    historial,
    autorizacion: autoEv
      ? {
          fecha: autoEv.fecha,
          medico: autoEv.actor,
          decision: autoEv.estadoNuevo as "autorizado" | "rechazado",
          nota: autoEv.nota ?? "",
          confirmacionHumana: true,
        }
      : undefined,
    notificacion: notifEv
      ? {
          fecha: notifEv.fecha,
          canal: "SMS",
          mensaje: "Su resultado está disponible. Acuda a su unidad. (SIMULADO)",
          simulado: true,
        }
      : undefined,
    entrega: entEv
      ? { fecha: entEv.fecha, codigoEntrega: `ENT-${n}`, entregadoPor: entEv.actor }
      : undefined,
    seguimiento: segEv
      ? {
          fechaProgramada: "2026-12-15",
          responsable: "Trabajo Social Demo",
          motivo: "Cita de control (SIMULADO)",
        }
      : undefined,
  };
});

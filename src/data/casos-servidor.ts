/**
 * Archivo compartido de casos DEMO y eventos.
 * Todas las ventanas que hablan con este proceso leen y escriben el mismo JSON.
 * Preparar añade casos que falten. Restaurar archiva eventos y no borra otros casos.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  aOperativo,
  casoContratoSchema,
  CLAVE_DEMO,
  copiarCaso,
  decidirDocumento,
  efectoAcompanamiento,
  efectoAutorizar,
  efectoConfirmar,
  efectoIniciar,
  efectoNota,
  efectoSinRespuesta,
  efectoVerificar,
  eventoSchema,
  metricasDe,
  type Barrera,
  type CasoContrato,
  type CasoOperativo,
  type Efecto,
  type EstadoPublico,
  type EventoCaso,
} from "../contracts/casos-ana.ts";
import type { Rol } from "../contracts/types.ts";

interface EstadoDisco {
  casos: CasoOperativo[];
  eventos: EventoCaso[];
  archivados: EventoCaso[];
}

export interface RespuestaMutacion extends EstadoPublico {
  ok: true;
  mensaje: string;
  duplicado?: boolean;
  resultado?: "correcta" | "reintento" | "escalado" | "duplicado";
  caso?: CasoOperativo;
}

export type RespuestaCaso =
  | RespuestaMutacion
  | { ok: false; status: number; error: string };

function publicar(estado: EstadoDisco): EstadoPublico {
  return {
    casos: estado.casos,
    eventos: estado.eventos,
    archivados: estado.archivados,
    claveDemo: CLAVE_DEMO,
    vozDisponible: false,
    metricas: metricasDe(estado.eventos),
  };
}

export function crearAlmacen(opciones: { directorio: string; semillaPath: string }) {
  const archivo = path.join(opciones.directorio, "casos.json");
  let cadena: Promise<unknown> = Promise.resolve();

  function encolar<T>(trabajo: () => T): Promise<T> {
    const corre = cadena.then(trabajo, trabajo);
    cadena = corre.then(
      () => undefined,
      () => undefined,
    );
    return corre;
  }

  function leerSemilla(): CasoContrato[] {
    const raw = readFileSync(opciones.semillaPath, "utf8");
    const data = JSON.parse(raw) as unknown;
    return casoContratoSchema.array().parse(data);
  }

  function guardar(estado: EstadoDisco) {
    mkdirSync(opciones.directorio, { recursive: true });
    const tmp = `${archivo}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(estado, null, 2), "utf8");
    try {
      unlinkSync(archivo);
    } catch {
      /* El archivo todavía no existe. */
    }
    renameSync(tmp, archivo);
  }

  function leer(): EstadoDisco {
    if (!existsSync(archivo)) {
      const inicial: EstadoDisco = {
        casos: leerSemilla().map((contrato) => aOperativo(contrato)),
        eventos: [],
        archivados: [],
      };
      guardar(inicial);
      return inicial;
    }
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(archivo, "utf8"));
    } catch (error) {
      const detalle = error instanceof Error ? error.message : "JSON ilegible";
      throw new Error(`No se leyó data/servidor/casos.json y no se borró. ${detalle}`);
    }
    if (!json || typeof json !== "object") {
      throw new Error("No se leyó data/servidor/casos.json y no se borró. El archivo no es un objeto.");
    }
    const datos = json as { casos?: unknown; eventos?: unknown; archivados?: unknown };
    if (!Array.isArray(datos.casos) || !Array.isArray(datos.eventos)) {
      throw new Error("No se leyó data/servidor/casos.json y no se borró. Faltan casos o eventos.");
    }
    const archivados = Array.isArray(datos.archivados) ? datos.archivados : [];
    return {
      casos: datos.casos.map((item) => {
        const contrato = casoContratoSchema.parse(item);
        return aOperativo({ ...(item as CasoOperativo), ...contrato, demo: contrato.demo });
      }),
      eventos: datos.eventos.map((item) => eventoSchema.parse(item)),
      archivados: archivados.map((item) => eventoSchema.parse(item)),
    };
  }

  function aplicar(caseId: string, fn: (caso: CasoOperativo, eventos: EventoCaso[], ahora: string) => Efecto) {
    const estado = leer();
    const actual = estado.casos.find((c) => c.caseId === caseId);
    if (!actual) return { ok: false as const, status: 404, error: "Caso no encontrado" };
    const ahora = new Date().toISOString();
    const efecto = fn(actual, estado.eventos, ahora);
    if (!efecto.ok) return efecto;
    estado.casos = estado.casos.map((c) => (c.caseId === caseId ? efecto.caso : c));
    estado.eventos = [...estado.eventos, ...efecto.nuevosEventos];
    guardar(estado);
    return {
      ok: true as const,
      ...publicar(estado),
      caso: efecto.caso,
      mensaje: efecto.mensaje,
      duplicado: efecto.duplicado,
      resultado: efecto.resultado,
    };
  }

  return {
    archivo,
    leer(): Promise<EstadoPublico> {
      return encolar(() => publicar(leer()));
    },
    preparar() {
      return encolar(() => {
        const estado = leer();
        const presentes = new Set(estado.casos.map((c) => c.caseId));
        const agregados: string[] = [];
        const yaPresentes: string[] = [];
        for (const contrato of leerSemilla()) {
          if (presentes.has(contrato.caseId)) {
            yaPresentes.push(contrato.caseId);
            continue;
          }
          estado.casos.push(aOperativo(contrato));
          agregados.push(contrato.caseId);
        }
        guardar(estado);
        return {
          ok: true as const,
          ...publicar(estado),
          agregados,
          yaPresentes,
          mensaje:
            agregados.length === 0
              ? "Los casos del JSON ya estaban. No se modificó ninguno ni sus eventos."
              : `Se agregaron ${agregados.join(", ")}. Los casos y eventos que ya existían siguen igual.`,
        };
      });
    },
    restaurarEscenario() {
      return encolar(() => {
        const estado = leer();
        const semilla = leerSemilla();
        const ids = new Set(semilla.map((c) => c.caseId));
        const porId = new Map(estado.casos.map((c) => [c.caseId, c]));
        const restaurados: string[] = [];
        for (const contrato of semilla) {
          const previo = porId.get(contrato.caseId);
          const nota = previo?.notaOperativa ?? "";
          porId.set(contrato.caseId, aOperativo({ ...contrato, notaOperativa: nota }));
          restaurados.push(contrato.caseId);
        }
        const conservados = estado.casos.filter((c) => !ids.has(c.caseId));
        const siguen = estado.eventos.filter((e) => !ids.has(e.caseId));
        const pasanArchivo = estado.eventos.filter((e) => ids.has(e.caseId));
        const siguiente: EstadoDisco = {
          casos: [...semilla.map((c) => porId.get(c.caseId)!), ...conservados.map(copiarCaso)],
          eventos: siguen,
          archivados: [...estado.archivados, ...pasanArchivo],
        };
        guardar(siguiente);
        return {
          ok: true as const,
          ...publicar(siguiente),
          restaurados,
          eventosArchivados: pasanArchivo.length,
          casosConservados: conservados.map((c) => c.caseId),
          mensaje:
            "Los seis casos demo volvieron a los campos del JSON. Sus eventos quedaron archivados, no borrados. Los demás casos y las notas operativas siguen.",
        };
      });
    },
    nota(caseId: string, nota: string) {
      return encolar(() => aplicar(caseId, (caso) => efectoNota(caso, nota)));
    },
    iniciar(caseId: string) {
      return encolar(() => aplicar(caseId, (caso, eventos, ahora) => efectoIniciar(caso, eventos, ahora)));
    },
    verificar(caseId: string, digitos: string) {
      return encolar(() => aplicar(caseId, (caso, _eventos, ahora) => efectoVerificar(caso, digitos, ahora)));
    },
    confirmar(caseId: string) {
      return encolar(() => aplicar(caseId, (caso, eventos, ahora) => efectoConfirmar(caso, eventos, ahora)));
    },
    acompanamiento(caseId: string, barrier: Barrera) {
      return encolar(() =>
        aplicar(caseId, (caso, eventos, ahora) => efectoAcompanamiento(caso, eventos, barrier, ahora)),
      );
    },
    sinRespuesta(caseId: string) {
      return encolar(() => aplicar(caseId, (caso, eventos, ahora) => efectoSinRespuesta(caso, eventos, ahora)));
    },
    autorizar(caseId: string, rol: Rol) {
      return encolar(() => aplicar(caseId, (caso, _eventos, ahora) => efectoAutorizar(caso, rol, ahora)));
    },
    documento(caseId: string, audiencia: "personal" | "paciente", rol: Rol) {
      return encolar(() => {
        const estado = leer();
        const caso = estado.casos.find((c) => c.caseId === caseId);
        if (!caso) return { ok: false as const, status: 404, error: "Caso no encontrado" };
        const decision = decidirDocumento(caso, audiencia, rol);
        if (!decision.ok) return decision;
        const ahora = new Date().toISOString();
        const id =
          decision.tipoEvento === "acceso_pdf"
            ? `evt-${caseId}-acceso_pdf-${randomUUID()}`
            : `evt-${caseId}-revision_personal-${randomUUID()}`;
        estado.eventos = [
          ...estado.eventos,
          {
            id,
            caseId,
            tipo: decision.tipoEvento,
            fecha: ahora,
            audiencia,
            rol,
          },
        ];
        guardar(estado);
        return { ok: true as const, tipoEvento: decision.tipoEvento, id };
      });
    },
  };
}

export const almacenCasos = crearAlmacen({
  directorio: path.join(process.cwd(), "data", "servidor"),
  semillaPath: path.join(process.cwd(), "src", "data", "casos-demo.json"),
});

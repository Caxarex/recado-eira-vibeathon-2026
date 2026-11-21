"use client";

/**
 * Repositorio en memoria con persistencia en localStorage.
 * Es la única puerta de entrada para leer/mutar resultados en la demo.
 * El Bot de Ana puede usar `agregarResultado` para el importador de Excel.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { prepararResultadoConPdf, type AsociarPdfInput } from "@/contracts/pdf";
import {
  evaluarTransicion,
  type EstadoResultado,
  type Expediente,
  type Paciente,
  type ResultadoPapanicolaou,
  type Rol,
} from "@/contracts/types";
import { expedientesMock, pacientesMock, resultadosMock } from "./mock";
import { guardarPdfLocal, limpiarPdfsLocales } from "./pdf-local";

const STORAGE_KEY = "recado-demo-v1";

interface Estado {
  pacientes: Paciente[];
  expedientes: Expediente[];
  resultados: ResultadoPapanicolaou[];
  rol: Rol;
  hidratado: boolean;
}

type Accion =
  | { tipo: "hidratar"; estado: Partial<Estado> }
  | { tipo: "setRol"; rol: Rol }
  | { tipo: "agregar"; resultado: ResultadoPapanicolaou }
  | { tipo: "reemplazar"; resultado: ResultadoPapanicolaou }
  | { tipo: "reiniciar" };

const inicial: Estado = {
  pacientes: pacientesMock,
  expedientes: expedientesMock,
  resultados: resultadosMock,
  rol: "Capturista",
  hidratado: false,
};

function normalizarResultados(resultados: ResultadoPapanicolaou[]): ResultadoPapanicolaou[] {
  return resultados.map((r) => ({
    ...r,
    documento: {
      ...r.documento,
      almacenamiento: r.documento?.almacenamiento ?? "solo-metadatos",
    },
  }));
}

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case "hidratar": {
      const base = { ...estado, ...accion.estado, hidratado: true };
      return { ...base, resultados: normalizarResultados(base.resultados) };
    }
    case "setRol":
      return { ...estado, rol: accion.rol };
    case "agregar":
      return { ...estado, resultados: [accion.resultado, ...estado.resultados] };
    case "reemplazar":
      return {
        ...estado,
        resultados: estado.resultados.map((r) =>
          r.id === accion.resultado.id ? accion.resultado : r,
        ),
      };
    case "reiniciar":
      return { ...inicial, hidratado: true };
  }
}

export interface TransicionInput {
  nuevoEstado: EstadoResultado;
  actor: string;
  nota?: string;
  extra?: Partial<
    Pick<ResultadoPapanicolaou, "autorizacion" | "notificacion" | "entrega" | "seguimiento">
  >;
}

interface Contexto extends Estado {
  setRol: (rol: Rol) => void;
  obtenerResultado: (id: string) => ResultadoPapanicolaou | undefined;
  obtenerExpediente: (id: string) => Expediente | undefined;
  obtenerPaciente: (id: string) => Paciente | undefined;
  resultadosDeExpediente: (expedienteId: string) => ResultadoPapanicolaou[];
  agregarResultado: (resultado: ResultadoPapanicolaou) => void;
  asociarPdfAExpediente: (
    input: AsociarPdfInput,
  ) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
  transicionarEstado: (
    id: string,
    input: TransicionInput,
  ) => { ok: true } | { ok: false; error: string };
  reiniciarDemo: () => void;
}

const Ctx = createContext<Contexto | null>(null);

export function RepositorioProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, inicial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      dispatch({ tipo: "hidratar", estado: raw ? JSON.parse(raw) : {} });
    } catch {
      dispatch({ tipo: "hidratar", estado: {} });
    }
  }, []);

  useEffect(() => {
    if (!estado.hidratado) return;
    const { resultados, rol } = estado;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ resultados, rol }));
  }, [estado]);

  const asociarPdfAExpediente = useCallback<Contexto["asociarPdfAExpediente"]>(
    async (input) => {
      if (!estado.expedientes.some((e) => e.id === input.expedienteId)) {
        return { ok: false, error: "Expediente no encontrado" };
      }
      const preparado = await prepararResultadoConPdf(input, estado.rol);
      if (!preparado.ok) return preparado;
      try {
        await guardarPdfLocal(preparado.valor.documento.id, input.bytes);
      } catch {
        return {
          ok: false,
          error: "No se pudo guardar el PDF en este navegador. El resultado no se asoció.",
        };
      }
      dispatch({ tipo: "agregar", resultado: preparado.valor });
      return { ok: true, id: preparado.valor.id };
    },
    [estado.expedientes, estado.rol],
  );

  const obtenerResultado = useCallback(
    (id: string) => estado.resultados.find((r) => r.id === id),
    [estado.resultados],
  );

  const transicionarEstado = useCallback<Contexto["transicionarEstado"]>(
    (id, { nuevoEstado, actor, nota, extra }) => {
      const actual = estado.resultados.find((r) => r.id === id);
      if (!actual) return { ok: false, error: "Resultado no encontrado" };
      const decision = evaluarTransicion({
        estadoActual: actual.estado,
        nuevoEstado,
        rol: estado.rol,
      });
      if (!decision.ok) return decision;
      dispatch({
        tipo: "reemplazar",
        resultado: {
          ...actual,
          ...extra,
          estado: nuevoEstado,
          historial: [
            ...actual.historial,
            {
              fecha: new Date().toISOString(),
              estadoAnterior: actual.estado,
              estadoNuevo: nuevoEstado,
              actor,
              rol: estado.rol,
              nota,
            },
          ],
        },
      });
      return { ok: true };
    },
    [estado.resultados, estado.rol],
  );

  const value = useMemo<Contexto>(
    () => ({
      ...estado,
      setRol: (rol) => dispatch({ tipo: "setRol", rol }),
      obtenerResultado,
      obtenerExpediente: (id) => estado.expedientes.find((e) => e.id === id),
      obtenerPaciente: (id) => estado.pacientes.find((p) => p.id === id),
      resultadosDeExpediente: (expedienteId) =>
        estado.resultados.filter((r) => r.expedienteId === expedienteId),
      agregarResultado: (resultado) => dispatch({ tipo: "agregar", resultado }),
      asociarPdfAExpediente,
      transicionarEstado,
      reiniciarDemo: () => {
        dispatch({ tipo: "reiniciar" });
        void limpiarPdfsLocales().catch(() => {
          /* La semilla se restaura aunque IndexedDB no responda. */
        });
      },
    }),
    [estado, obtenerResultado, asociarPdfAExpediente, transicionarEstado],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRepositorio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRepositorio debe usarse dentro de RepositorioProvider");
  return ctx;
}

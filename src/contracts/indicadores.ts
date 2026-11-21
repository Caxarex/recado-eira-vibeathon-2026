/**
 * Contrato de indicadores. La lógica de cálculo definitiva corresponde al
 * módulo de datos (Ana). Aquí sólo se define la forma del resultado y un
 * cálculo básico de referencia para que la UI tenga algo que mostrar.
 */
import type { EstadoResultado, ResultadoPapanicolaou } from "./types";

export interface IndicadorResumen {
  totalResultados: number;
  porEstado: Record<EstadoResultado, number>;
  porcentajeAnormales: number; // ASC-US, LSIL, HSIL sobre total
  /** Horas promedio desde `cargado` hasta `autorizado`. null si no hay datos. */
  horasPromedioAutorizacion: number | null;
  pendientesAutorizacion: number;
  pendientesNotificacion: number;
}

/**
 * STUB de referencia. El Bot de Ana puede reemplazar/ampliar esta función
 * manteniendo la firma y el tipo de retorno.
 */
export function calcularIndicadores(
  resultados: ResultadoPapanicolaou[],
): IndicadorResumen {
  const porEstado = {
    cargado: 0,
    en_revision: 0,
    autorizado: 0,
    rechazado: 0,
    notificado: 0,
    entregado: 0,
    en_seguimiento: 0,
  } satisfies Record<EstadoResultado, number>;
  for (const r of resultados) porEstado[r.estado]++;

  const anormales = resultados.filter((r) =>
    ["ASC-US", "LSIL", "HSIL"].includes(r.clasificacion),
  ).length;

  const tiempos: number[] = [];
  for (const r of resultados) {
    const cargado = r.historial.find((h) => h.estadoNuevo === "cargado");
    const autorizado = r.historial.find((h) => h.estadoNuevo === "autorizado");
    if (cargado && autorizado) {
      tiempos.push(
        (new Date(autorizado.fecha).getTime() - new Date(cargado.fecha).getTime()) /
          36e5,
      );
    }
  }

  return {
    totalResultados: resultados.length,
    porEstado,
    porcentajeAnormales: resultados.length
      ? Math.round((anormales / resultados.length) * 100)
      : 0,
    horasPromedioAutorizacion: tiempos.length
      ? Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 10) / 10
      : null,
    pendientesAutorizacion: porEstado.en_revision,
    pendientesNotificacion: porEstado.autorizado,
  };
}

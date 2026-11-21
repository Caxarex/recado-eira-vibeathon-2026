import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularIndicadores } from "./indicadores.ts";
import { documentoSchema, filaExcelResultadoSchema, resultadoSchema } from "./schemas.ts";
import { PDF_MAX_BYTES, prepararResultadoConPdf, validarPdf } from "./pdf.ts";
import {
  ESTADOS_RESULTADO,
  entregaHabilitada,
  evaluarTransicion,
  puedeTransicionar,
  rutaOperativa,
  type ResultadoPapanicolaou,
} from "./types.ts";

function pdfMinimo(texto = "%PDF-1.4\n1 0 obj<<>>endobj\n"): Uint8Array {
  return new TextEncoder().encode(texto);
}

const entradaBase = {
  expedienteId: "exp-01",
  fechaToma: "2026-11-01",
  fechaResultado: "2026-11-15",
  laboratorio: "Laboratorio Ficticio A",
  clasificacion: "Negativo" as const,
  nombreArchivo: "pap-ficticio.pdf",
  tipoMime: "application/pdf",
  bytes: pdfMinimo(),
  ahora: new Date("2026-11-20T15:00:00.000Z"),
  idResultado: "res-test",
  idDocumento: "doc-test",
};

describe("máquina de estados", () => {
  it("permite el recorrido clínico y rechaza saltos hacia la entrega", () => {
    assert.equal(puedeTransicionar("cargado", "en_revision"), true);
    assert.equal(puedeTransicionar("en_revision", "autorizado"), true);
    assert.equal(puedeTransicionar("en_revision", "rechazado"), true);
    assert.equal(puedeTransicionar("rechazado", "cargado"), true);
    assert.equal(puedeTransicionar("autorizado", "notificado"), true);
    assert.equal(puedeTransicionar("notificado", "entregado"), true);
    assert.equal(puedeTransicionar("entregado", "en_seguimiento"), true);

    assert.equal(puedeTransicionar("cargado", "autorizado"), false);
    assert.equal(puedeTransicionar("cargado", "entregado"), false);
    assert.equal(puedeTransicionar("en_revision", "entregado"), false);
    assert.equal(puedeTransicionar("autorizado", "entregado"), false);
    assert.equal(puedeTransicionar("rechazado", "entregado"), false);
    assert.equal(puedeTransicionar("en_seguimiento", "entregado"), false);
  });

  it("solo ofrece entrega en notificado y no enruta antes hacia /entregas", () => {
    for (const estado of ESTADOS_RESULTADO) {
      assert.equal(entregaHabilitada(estado), estado === "notificado");
      const ruta = rutaOperativa(estado, "res-1");
      if (estado !== "notificado" && estado !== "entregado") {
        assert.equal(Boolean(ruta?.includes("/entregas")), false);
      }
    }
    assert.equal(rutaOperativa("autorizado", "res-1"), "/notificaciones/res-1");
    assert.equal(rutaOperativa("notificado", "res-1"), "/entregas/res-1");
  });

  it("exige el rol simulado del paso y no lo trata como sesión autenticada", () => {
    const mal = evaluarTransicion({
      estadoActual: "en_revision",
      nuevoEstado: "autorizado",
      rol: "Capturista",
    });
    assert.equal(mal.ok, false);
    if (!mal.ok) assert.match(mal.error, /simulado/);

    const entregaPrematura = evaluarTransicion({
      estadoActual: "autorizado",
      nuevoEstado: "entregado",
      rol: "Trabajo social",
    });
    assert.equal(entregaPrematura.ok, false);

    const bien = evaluarTransicion({
      estadoActual: "notificado",
      nuevoEstado: "entregado",
      rol: "Trabajo social",
    });
    assert.equal(bien.ok, true);
  });
});

describe("PDF de prueba", () => {
  it("acepta un PDF mínimo y rechaza tipo, formato y tamaño inválidos", () => {
    const ok = validarPdf(entradaBase);
    assert.equal(ok.ok, true);

    const tipo = validarPdf({ ...entradaBase, tipoMime: "image/png" });
    assert.equal(tipo.ok, false);

    const extension = validarPdf({ ...entradaBase, nombreArchivo: "informe.pdf.exe" });
    assert.equal(extension.ok, false);

    const formato = validarPdf({ ...entradaBase, bytes: pdfMinimo("NOTPDF") });
    assert.equal(formato.ok, false);

    const vacio = validarPdf({ ...entradaBase, bytes: new Uint8Array() });
    assert.equal(vacio.ok, false);

    const grande = new Uint8Array(PDF_MAX_BYTES + 1);
    grande.set(pdfMinimo());
    const tamano = validarPdf({ ...entradaBase, bytes: grande });
    assert.equal(tamano.ok, false);
  });

  it("asocia el PDF a un expediente en estado cargado, con historial y sin entrega", async () => {
    const primero = await prepararResultadoConPdf(entradaBase, "Capturista");
    const segundo = await prepararResultadoConPdf(entradaBase, "Capturista");
    assert.equal(primero.ok, true);
    assert.equal(segundo.ok, true);
    if (!primero.ok || !segundo.ok) return;

    assert.equal(primero.valor.estado, "cargado");
    assert.equal(primero.valor.expedienteId, "exp-01");
    assert.equal(primero.valor.documento.almacenamiento, "local-navegador");
    assert.equal(primero.valor.documento.tipo, "PDF");
    assert.equal(primero.valor.autorizacion, undefined);
    assert.equal(primero.valor.notificacion, undefined);
    assert.equal(primero.valor.entrega, undefined);
    assert.equal(primero.valor.historial.length, 1);
    assert.match(primero.valor.historial[0].nota ?? "", /navegador/);
    assert.match(primero.valor.historial[0].nota ?? "", /repositorio clínico/);
    assert.equal(primero.valor.documento.hashSimulado, segundo.valor.documento.hashSimulado);
    assert.match(primero.valor.documento.hashSimulado, /^sha256:[0-9a-f]{64}$/);
    assert.ok(JSON.stringify(primero.valor).length < 4000);
    assert.equal(JSON.stringify(primero.valor).includes("JVBERi"), false);

    documentoSchema.parse(primero.valor.documento);
    resultadoSchema.parse(primero.valor);
  });

  it("rechaza otro rol simulado y una fecha de resultado anterior a la toma", async () => {
    const rol = await prepararResultadoConPdf(entradaBase, "Médico autorizador");
    assert.equal(rol.ok, false);
    if (!rol.ok) assert.match(rol.error, /simulado/);

    const fechas = await prepararResultadoConPdf(
      { ...entradaBase, fechaResultado: "2026-10-01" },
      "Capturista",
    );
    assert.equal(fechas.ok, false);
  });
});

describe("indicadores y contrato de Excel", () => {
  it("calcula los indicadores desde los registros, no desde cifras fijas", () => {
    const indicadores = calcularIndicadores([
      resultado({ id: "a", estado: "cargado", clasificacion: "ASC-US" }),
      resultado({ id: "c", estado: "en_revision", clasificacion: "Negativo" }),
      resultado({
        id: "b",
        estado: "autorizado",
        clasificacion: "Negativo",
        historial: [
          evento("2026-11-01T00:00:00.000Z", "cargado"),
          evento("2026-11-01T02:00:00.000Z", "autorizado"),
        ],
      }),
    ]);

    assert.equal(indicadores.totalResultados, 3);
    assert.equal(indicadores.porEstado.cargado, 1);
    assert.equal(indicadores.porEstado.en_revision, 1);
    assert.equal(indicadores.porEstado.autorizado, 1);
    assert.equal(indicadores.porcentajeAnormales, 33);
    assert.equal(indicadores.horasPromedioAutorizacion, 2);
    assert.equal(indicadores.pendientesAutorizacion, 1);
    assert.equal(indicadores.pendientesNotificacion, 1);
  });

  it("acepta la fila de ejemplo del contrato Excel", () => {
    const fila = filaExcelResultadoSchema.parse({
      folio_expediente: "EXP-2026-0001",
      curp: "XXXX000000XXXXXX00",
      nombre_paciente: "Paciente Ficticia Uno",
      fecha_nacimiento: "1985-03-12",
      telefono: "5550000001",
      municipio: "Municipio Demo",
      unidad_medica: "CS Demo Norte",
      fecha_toma: "2026-10-01",
      fecha_resultado: "2026-10-10",
      laboratorio: "Laboratorio Ficticio A",
      clasificacion: "Negativo",
      nombre_archivo: "PAP-0001.pdf",
    });
    assert.equal(fila.folio_expediente, "EXP-2026-0001");
  });
});

function evento(fecha: string, estado: ResultadoPapanicolaou["estado"]) {
  return {
    fecha,
    estadoAnterior: null,
    estadoNuevo: estado,
    actor: "Demo",
    rol: "Capturista" as const,
  };
}

function resultado({
  historial,
  ...parcial
}: Pick<ResultadoPapanicolaou, "id" | "estado" | "clasificacion"> &
  Partial<Pick<ResultadoPapanicolaou, "historial">>): ResultadoPapanicolaou {
  return {
    expedienteId: "exp-01",
    fechaToma: "2026-10-01",
    fechaResultado: "2026-10-02",
    laboratorio: "Laboratorio Ficticio A",
    documento: {
      id: `doc-${parcial.id}`,
      nombreArchivo: "PAP-0001.pdf",
      tipo: "PDF",
      tamanoKb: 12,
      hashSimulado: "sha256:demo",
      almacenamiento: "solo-metadatos",
    },
    historial: historial ?? [evento("2026-10-02T00:00:00.000Z", "cargado")],
    ...parcial,
  };
}

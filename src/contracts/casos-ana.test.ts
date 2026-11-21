import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { crearAlmacen } from "../data/casos-servidor.ts";
import {
  ANOTADO_TRANSPORTE,
  BLOQUEO_AUTORIZACION,
  BLOQUEO_CONSENTIMIENTO,
  CLAVE_DEMO,
  CLAVE_ESCALADO,
  CLAVE_REINTENTO,
  decidirDocumento,
  efectoAcompanamiento,
  efectoConfirmar,
  efectoSinRespuesta,
  efectoVerificar,
  entregaCompletada,
  estadoVisible,
  MENSAJE_APROBADO_DEMO,
  metricasDe,
  SIN_RESPUESTA_TEXTO,
  aOperativo,
  type CasoOperativo,
  type EventoCaso,
} from "./casos-ana.ts";

const SEMILLA = path.join(process.cwd(), "src", "data", "casos-demo.json");

const ESPERADO = [
  ["DEMO-001", "Persona demo 01", true, true, true, "Correcta", "Entrega exitosa", null, true],
  ["DEMO-002", "Persona demo 02", true, true, true, "Correcta", "Apoyo por transporte", "TRANSPORT", true],
  ["DEMO-003", "Persona demo 03", true, true, false, "Correcta", "Sin autorización médica", null, false],
  ["DEMO-004", "Persona demo 04", true, true, true, "Incorrecta", "Identidad incorrecta", null, true],
  ["DEMO-005", "Persona demo 05", false, true, true, "Correcta", "Sin consentimiento", null, true],
  ["DEMO-006", "Persona demo 06", true, true, true, "Sin respuesta", "Nadie contesta", null, true],
] as const;

function almacenTemporal() {
  const directorio = mkdtempSync(path.join(tmpdir(), "recado-casos-"));
  after(() => rmSync(directorio, { recursive: true, force: true }));
  return crearAlmacen({ directorio, semillaPath: SEMILLA });
}

function casoDe(id: string, casos: CasoOperativo[]) {
  const caso = casos.find((c) => c.caseId === id);
  assert.ok(caso, id);
  return caso;
}

describe("semilla de Ana", () => {
  it("conserva los seis IDs, alias y banderas del JSON", () => {
    const casos = JSON.parse(readFileSync(SEMILLA, "utf8")) as Array<{
      caseId: string;
      alias: string;
      contactConsent: boolean;
      administrativeReviewed: boolean;
      medicalAuthorized: boolean;
      approvedScript: string;
      demo: { identityScenario: string; scenario: string; barrier: string | null };
    }>;
    assert.equal(casos.length, 6);
    for (const [id, alias, consentimiento, revision, autorizacion, identidad, escenario, barrera, conMensaje] of ESPERADO) {
      const caso = casos.find((c) => c.caseId === id);
      assert.ok(caso);
      assert.equal(caso.alias, alias);
      assert.equal(caso.contactConsent, consentimiento);
      assert.equal(caso.administrativeReviewed, revision);
      assert.equal(caso.medicalAuthorized, autorizacion);
      assert.equal(caso.demo.identityScenario, identidad);
      assert.equal(caso.demo.scenario, escenario);
      assert.equal(caso.demo.barrier, barrera);
      assert.equal(caso.approvedScript, conMensaje ? MENSAJE_APROBADO_DEMO : "");
    }
  });
});

describe("reglas de acceso y eventos distintos", () => {
  it("deja revisar el documento al personal antes de autorizar y se lo niega a la paciente", () => {
    const caso = aOperativo({
      caseId: "DEMO-003",
      alias: "Persona demo 03",
      synthetic: true,
      contactConsent: true,
      administrativeReviewed: true,
      medicalAuthorized: false,
      approvedScript: "",
      demo: { identityScenario: "Correcta", scenario: "Sin autorización médica", expected: "", barrier: null },
      identidadVerificada: true,
    });
    const personal = decidirDocumento(caso, "personal", "Revisor");
    const medico = decidirDocumento(caso, "personal", "Médico autorizador");
    const paciente = decidirDocumento(caso, "paciente", "Revisor");
    assert.equal(personal.ok, true);
    assert.equal(medico.ok, true);
    if (personal.ok) assert.equal(personal.tipoEvento, "revision_personal");
    assert.equal(paciente.ok, false);
    if (!paciente.ok) assert.equal(paciente.error, BLOQUEO_AUTORIZACION);
    assert.equal(decidirDocumento(caso, "personal", "Capturista").ok, false);
  });

  it("no cuenta el acompañamiento como entrega y no mezcla los tres eventos", () => {
    const caso = aOperativo({
      caseId: "DEMO-002",
      alias: "Persona demo 02",
      synthetic: true,
      contactConsent: true,
      administrativeReviewed: true,
      medicalAuthorized: true,
      approvedScript: MENSAJE_APROBADO_DEMO,
      demo: { identityScenario: "Correcta", scenario: "Apoyo por transporte", expected: "", barrier: "TRANSPORT" },
      identidadVerificada: true,
      llamadaAbierta: true,
    });
    const primero = efectoAcompanamiento(caso, [], "TRANSPORT", "2026-11-21T18:00:00.000Z");
    assert.equal(primero.ok, true);
    if (!primero.ok) return;
    assert.equal(primero.nuevosEventos[0]?.tipo, "acompanamiento");
    assert.equal(primero.nuevosEventos[0]?.barrier, "TRANSPORT");
    assert.equal(primero.mensaje, ANOTADO_TRANSPORTE);
    assert.equal(entregaCompletada(primero.nuevosEventos, caso.caseId), false);

    const repetido = efectoAcompanamiento(primero.caso, primero.nuevosEventos, "TRANSPORT", "2026-11-21T18:01:00.000Z");
    assert.equal(repetido.ok, true);
    if (!repetido.ok) return;
    assert.equal(repetido.duplicado, true);
    assert.equal(repetido.nuevosEventos.length, 0);

    const recepción = efectoConfirmar(primero.caso, primero.nuevosEventos, "2026-11-21T18:02:00.000Z");
    assert.equal(recepción.ok, true);
    if (!recepción.ok) return;
    const juntos = [...primero.nuevosEventos, ...recepción.nuevosEventos];
    assert.deepEqual(
      juntos.map((e) => e.tipo),
      ["acompanamiento", "recepcion_aviso"],
    );
    assert.equal(metricasDe(juntos).recepciones, 1);
    assert.equal(metricasDe(juntos).entregasCompletadas, 0);
    assert.equal(metricasDe(juntos).acompanamientos, 1);
    assert.equal(metricasDe(juntos).accesosPdf, 0);
    assert.equal(entregaCompletada(juntos, caso.caseId), false);
    assert.equal(estadoVisible(recepción.caso, juntos), "Acompañamiento solicitado");
    assert.equal(metricasDe(primero.nuevosEventos).entregasCompletadas, 0);
  });

  it("exige tres fallos de teclado para escalar y no revela el mensaje antes", () => {
    let caso = aOperativo({
      caseId: "DEMO-004",
      alias: "Persona demo 04",
      synthetic: true,
      contactConsent: true,
      administrativeReviewed: true,
      medicalAuthorized: true,
      approvedScript: MENSAJE_APROBADO_DEMO,
      demo: { identityScenario: "Incorrecta", scenario: "Identidad incorrecta", expected: "", barrier: null },
      llamadaAbierta: true,
    });
    for (let i = 1; i <= 2; i += 1) {
      const fallo = efectoVerificar(caso, "0000", `2026-11-21T18:00:0${i}.000Z`);
      assert.equal(fallo.ok, true);
      if (!fallo.ok) return;
      assert.equal(fallo.mensaje, CLAVE_REINTENTO);
      assert.equal(fallo.mensaje.includes("disponible"), false);
      assert.equal(fallo.caso.identidadVerificada, false);
      caso = fallo.caso;
    }
    const tercero = efectoVerificar(caso, "1111", "2026-11-21T18:00:03.000Z");
    assert.equal(tercero.ok, true);
    if (!tercero.ok) return;
    assert.equal(tercero.mensaje, CLAVE_ESCALADO);
    assert.equal(tercero.caso.escaladoHumano, true);
    assert.equal(tercero.mensaje.includes(MENSAJE_APROBADO_DEMO), false);
    const cuarto = efectoVerificar(tercero.caso, CLAVE_DEMO, "2026-11-21T18:00:04.000Z");
    assert.equal(cuarto.ok, false);
  });

  it("deja la llamada sin recepción cuando nadie contesta", () => {
    const caso = aOperativo({
      caseId: "DEMO-006",
      alias: "Persona demo 06",
      synthetic: true,
      contactConsent: true,
      administrativeReviewed: true,
      medicalAuthorized: true,
      approvedScript: MENSAJE_APROBADO_DEMO,
      demo: { identityScenario: "Sin respuesta", scenario: "Nadie contesta", expected: "", barrier: null },
      llamadaAbierta: true,
    });
    const efecto = efectoSinRespuesta(caso, [], "2026-11-21T18:00:00.000Z");
    assert.equal(efecto.ok, true);
    if (!efecto.ok) return;
    assert.equal(efecto.mensaje, SIN_RESPUESTA_TEXTO);
    assert.equal(efecto.mensaje.includes("documento"), false);
    assert.equal(efecto.nuevosEventos[0]?.tipo, "sin_respuesta");
    assert.equal(entregaCompletada(efecto.nuevosEventos, caso.caseId), false);
  });
});

describe("persistencia en archivo", () => {
  it("comparte casos y eventos entre dos lecturas y no duplica recepción ni transporte", async () => {
    const almacen = almacenTemporal();
    const inicio = await almacen.leer();
    assert.equal(inicio.casos.length, 6);
    assert.equal(inicio.vozDisponible, false);
    assert.equal(casoDe("DEMO-001", inicio.casos).alias, "Persona demo 01");

    assert.equal((await almacen.iniciar("DEMO-005")).ok, false);
    const bloqueo = await almacen.iniciar("DEMO-003");
    assert.equal(bloqueo.ok, false);
    if (!bloqueo.ok) assert.equal(bloqueo.error, BLOQUEO_AUTORIZACION);

    await almacen.iniciar("DEMO-001");
    const mal = await almacen.verificar("DEMO-001", "0000");
    assert.equal(mal.ok, true);
    if (mal.ok) assert.equal(mal.resultado, "reintento");
    const bien = await almacen.verificar("DEMO-001", CLAVE_DEMO);
    assert.equal(bien.ok, true);
    if (!bien.ok) return;
    assert.match(bien.mensaje, /documento está disponible/);

    const pdfAntes = await almacen.documento("DEMO-001", "paciente", "Trabajo social");
    assert.equal(pdfAntes.ok, true);
    if (pdfAntes.ok) assert.equal(pdfAntes.tipoEvento, "acceso_pdf");

    const recepción = await almacen.confirmar("DEMO-001");
    assert.equal(recepción.ok, true);
    if (!recepción.ok) return;
    const otra = await almacen.confirmar("DEMO-001");
    assert.equal(otra.ok, true);
    if (!otra.ok) return;
    assert.equal(otra.duplicado, true);
    assert.equal(otra.metricas.recepciones, 1);
    assert.equal(otra.metricas.accesosPdf, 1);
    assert.notEqual(
      otra.eventos.find((e) => e.tipo === "recepcion_aviso")?.id,
      otra.eventos.find((e) => e.tipo === "acceso_pdf")?.id,
    );

    const recien = crearAlmacen({ directorio: path.dirname(almacen.archivo), semillaPath: SEMILLA });
    const recargado = await recien.leer();
    assert.equal(casoDe("DEMO-001", recargado.casos).identidadVerificada, true);
    assert.equal(recargado.metricas.recepciones, 1);
    assert.equal(recargado.metricas.entregasCompletadas, 0);
    assert.equal(estadoVisible(casoDe("DEMO-001", recargado.casos), recargado.eventos), "Aviso recibido");

    await almacen.iniciar("DEMO-002");
    await almacen.verificar("DEMO-002", CLAVE_DEMO);
    const transporte = await almacen.acompanamiento("DEMO-002", "TRANSPORT");
    assert.equal(transporte.ok, true);
    if (!transporte.ok) return;
    const repetido = await almacen.acompanamiento("DEMO-002", "TRANSPORT");
    assert.equal(repetido.ok, true);
    if (!repetido.ok) return;
    assert.equal(repetido.duplicado, true);
    assert.equal(
      transporte.eventos.find((e) => e.caseId === "DEMO-002" && e.tipo === "acompanamiento")?.id,
      repetido.eventos.find((e) => e.caseId === "DEMO-002" && e.tipo === "acompanamiento")?.id,
    );
    assert.equal(entregaCompletada(repetido.eventos, "DEMO-002"), false);
    assert.equal(estadoVisible(casoDe("DEMO-002", repetido.casos), repetido.eventos), "Acompañamiento solicitado");
    assert.equal(repetido.metricas.acompanamientos, 1);
    assert.equal(repetido.metricas.recepciones, 1);
    assert.equal(repetido.metricas.entregasCompletadas, 0);
  });

  it("archiva eventos al restaurar y no borra otro caso ni la nota", async () => {
    const almacen = almacenTemporal();
    const personal = await almacen.documento("DEMO-003", "personal", "Revisor");
    assert.equal(personal.ok, true);
    if (personal.ok) assert.equal(personal.tipoEvento, "revision_personal");
    const paciente = await almacen.documento("DEMO-003", "paciente", "Revisor");
    assert.equal(paciente.ok, false);
    const capturista = await almacen.autorizar("DEMO-003", "Capturista");
    assert.equal(capturista.ok, false);
    const autorizada = await almacen.autorizar("DEMO-003", "Médico autorizador");
    assert.equal(autorizada.ok, true);
    if (!autorizada.ok) return;
    assert.equal(casoDe("DEMO-003", autorizada.casos).approvedScript, MENSAJE_APROBADO_DEMO);
    await almacen.nota("DEMO-003", "nota de Felipe");

    await almacen.iniciar("DEMO-006");
    const nadie = await almacen.sinRespuesta("DEMO-006");
    assert.equal(nadie.ok, true);
    if (nadie.ok) {
      assert.equal(nadie.mensaje.includes("documento"), false);
      assert.equal(entregaCompletada(nadie.eventos, "DEMO-006"), false);
    }

    const preparado = await almacen.preparar();
    assert.deepEqual(preparado.agregados, []);
    assert.equal(casoDe("DEMO-003", preparado.casos).medicalAuthorized, true);
    assert.equal(casoDe("DEMO-003", preparado.casos).notaOperativa, "nota de Felipe");

    const disco = JSON.parse(readFileSync(almacen.archivo, "utf8")) as {
      casos: CasoOperativo[];
      eventos: EventoCaso[];
      archivados: EventoCaso[];
    };
    disco.casos.push(
      aOperativo({
        caseId: "EXTRA-1",
        alias: "No borrar",
        synthetic: true,
        contactConsent: true,
        administrativeReviewed: true,
        medicalAuthorized: false,
        approvedScript: "",
        demo: { identityScenario: "Correcta", scenario: "Extra", expected: "", barrier: null },
      }),
    );
    disco.eventos.push({
      id: "evt-extra",
      caseId: "EXTRA-1",
      tipo: "sin_respuesta",
      fecha: "2026-11-21T18:00:00.000Z",
    });
    writeFileSync(almacen.archivo, JSON.stringify(disco));

    const restaurado = await almacen.restaurarEscenario();
    assert.equal(casoDe("DEMO-003", restaurado.casos).medicalAuthorized, false);
    assert.equal(casoDe("DEMO-003", restaurado.casos).approvedScript, "");
    assert.equal(casoDe("DEMO-003", restaurado.casos).alias, "Persona demo 03");
    assert.equal(casoDe("DEMO-003", restaurado.casos).notaOperativa, "nota de Felipe");
    assert.ok(restaurado.casosConservados.includes("EXTRA-1"));
    assert.equal(casoDe("EXTRA-1", restaurado.casos).alias, "No borrar");
    assert.ok(restaurado.eventos.some((e) => e.id === "evt-extra"));
    assert.ok(restaurado.archivados.some((e) => e.tipo === "revision_personal"));
    assert.ok(restaurado.archivados.some((e) => e.tipo === "autorizacion_medica"));
    assert.equal(restaurado.eventos.some((e) => e.caseId === "DEMO-003"), false);
  });
});

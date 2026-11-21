import { esBarrera, esRol } from "@/contracts/casos-ana";
import { almacenCasos } from "@/data/casos-servidor";
import { capturar, json } from "../responder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Cuerpo {
  accion?: string;
  rol?: unknown;
  nota?: unknown;
  digitos?: unknown;
  barrier?: unknown;
}

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return capturar(async () => {
    const { id } = await ctx.params;
    const estado = await almacenCasos.leer();
    const caso = estado.casos.find((c) => c.caseId === id);
    if (!caso) return json({ ok: false, error: "Caso no encontrado" }, 404);
    return json({
      ...estado,
      caso,
      eventos: estado.eventos.filter((e) => e.caseId === id),
      archivados: estado.archivados.filter((e) => e.caseId === id),
    });
  });
}

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return capturar(async () => {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Cuerpo | null;
    if (!body?.accion) return json({ ok: false, error: "Falta la acción." }, 400);
    if (body.accion !== "nota" && !esRol(body.rol)) {
      return json({ ok: false, error: "Rol simulado no reconocido." }, 400);
    }
    const rol = esRol(body.rol) ? body.rol : "Capturista";

    const respuesta = await (async () => {
      switch (body.accion) {
        case "nota":
          return almacenCasos.nota(id, typeof body.nota === "string" ? body.nota : "");
        case "iniciar":
          return almacenCasos.iniciar(id);
        case "verificar":
          return almacenCasos.verificar(id, typeof body.digitos === "string" ? body.digitos : "");
        case "confirmar-recepcion":
          return almacenCasos.confirmar(id);
        case "acompanamiento":
          if (!esBarrera(body.barrier)) {
            return { ok: false as const, status: 400, error: "Barrera no reconocida." };
          }
          return almacenCasos.acompanamiento(id, body.barrier);
        case "sin-respuesta":
          return almacenCasos.sinRespuesta(id);
        case "autorizar":
          return almacenCasos.autorizar(id, rol);
        default:
          return { ok: false as const, status: 400, error: "Acción no reconocida." };
      }
    })();

    if (!respuesta.ok) return json({ ok: false, error: respuesta.error }, respuesta.status);
    return json(respuesta);
  });
}

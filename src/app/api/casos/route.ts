import { almacenCasos } from "@/data/casos-servidor";
import { capturar, json } from "./responder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return capturar(async () => json(await almacenCasos.leer()));
}

export function POST(req: Request) {
  return capturar(async () => {
    const body = (await req.json().catch(() => null)) as { accion?: string } | null;
    if (body?.accion === "preparar") return json(await almacenCasos.preparar());
    if (body?.accion === "restaurar-escenario") return json(await almacenCasos.restaurarEscenario());
    return json(
      { ok: false, error: "Acción no reconocida. Usa preparar o restaurar-escenario." },
      400,
    );
  });
}

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { esRol } from "@/contracts/casos-ana";
import { almacenCasos } from "@/data/casos-servidor";
import { capturar, json } from "../../responder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDF = path.join(process.cwd(), "public", "muestras", "pap-ficticio.pdf");

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return capturar(async () => {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as {
      audiencia?: unknown;
      rol?: unknown;
    } | null;
    if (body?.audiencia !== "personal" && body?.audiencia !== "paciente") {
      return json({ ok: false, error: "La audiencia debe ser personal o paciente." }, 400);
    }
    if (!esRol(body.rol)) return json({ ok: false, error: "Rol simulado no reconocido." }, 400);
    if (!existsSync(PDF)) {
      return json({ ok: false, error: "No está el PDF de prueba en el servidor." }, 500);
    }
    const decision = await almacenCasos.documento(id, body.audiencia, body.rol);
    if (!decision.ok) return json({ ok: false, error: decision.error }, decision.status);
    const bytes = new Uint8Array(readFileSync(PDF));
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="documento-demo-ficticio.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}

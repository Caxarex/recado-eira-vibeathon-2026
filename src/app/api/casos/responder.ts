import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function capturar(trabajo: () => Promise<Response>) {
  try {
    return await trabajo();
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error del servidor";
    return json({ ok: false, error: mensaje }, 500);
  }
}

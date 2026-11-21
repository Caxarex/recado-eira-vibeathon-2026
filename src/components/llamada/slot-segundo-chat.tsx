"use client";

import type { ComponenteLlamadaProps } from "./contrato";
import { ComponenteLlamada } from "./externo";

/** Monta el componente del segundo chat si `externo.tsx` deja de devolver null. */
export function SlotSegundoChat(props: ComponenteLlamadaProps) {
  return (
    <div data-slot="segundo-chat">
      <ComponenteLlamada {...props} />
    </div>
  );
}

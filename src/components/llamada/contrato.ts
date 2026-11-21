/**
 * Contrato del componente de llamada del segundo chat.
 * Ese chat puede reemplazar `externo.tsx`. Este archivo solo describe las props.
 */
export interface ComponenteLlamadaProps {
  caseId: string;
  alias: string;
  llamadaAbierta: boolean;
  contactoBloqueado: boolean;
  motivoBloqueo: string | null;
}

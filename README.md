# RECADO – EIRA Movimiento Rosa

Demo interactiva (Vibeathon 2026) del recorrido de un resultado de Papanicolaou:

**Asociar a expediente → Revisión documental → Autorización clínica humana → Notificación → Entrega segura → Seguimiento**

> **SIMULACIÓN.** Todos los pacientes, CURP, teléfonos, unidades y laboratorios son ficticios. No se envía ningún SMS, WhatsApp ni llamada. Un PDF de prueba se queda en este navegador. No es un repositorio clínico.

## Correr la demo

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Cómo recorrer el flujo

1. Arriba a la derecha selecciona el **rol simulado**. Cada paso requiere un rol:
   - Capturista → asociar un PDF de prueba al expediente (`/expedientes/[id]`). En el diálogo se puede descargar `pap-ficticio.pdf`, un documento inventado para la demo.
   - Revisor → checklist y enviar a autorización (`/revision`)
   - Médico autorizador → autorizar / rechazar con nota y confirmación humana (`/autorizaciones`)
   - Trabajo social → notificar (llamada demo, SMS, WhatsApp), entregar con código y agendar seguimiento (`/notificaciones`, `/entregas`)
2. El historial de cada resultado se ve en su expediente.
3. El botón ↺ del header reinicia la demo a los datos iniciales y borra los PDF locales. Los metadatos se guardan en `localStorage`. El binario, si lo hay, vive en IndexedDB.

## Limitaciones de seguridad

Esta demo no es un sistema de entrega clínica:

- El selector **Rol simulado** no autentica a nadie. No hay usuarios, sesión ni permisos reales.
- El PDF se valida (extensión, tipo, cabecera `%PDF-` y máximo 2 MB) y se guarda solo en IndexedDB de este navegador. No hay cifrado, control de acceso, respaldo ni borrado certificado.
- La huella SHA-256 se calcula en el equipo para la demo. No es un sello clínico ni una firma.
- La entrega no se ofrece hasta que el resultado está **notificado**, estado que solo se alcanza después de la autorización de un médico humano.
- No hay backend, mensajería real ni custodia fuera de esta computadora.

## Contratos compartidos

Ver [`src/contracts/README.md`](src/contracts/README.md). Son la base para el módulo de datos / Excel / indicadores.

## Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · zod · sonner

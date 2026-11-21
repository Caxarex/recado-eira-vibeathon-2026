# RECADO – EIRA Movimiento Rosa

Demo interactiva (Vibeathon 2026) del recorrido de un resultado de Papanicolaou:

**Asociar a expediente → Revisión documental → Autorización clínica humana → Notificación → Entrega segura → Seguimiento**

> **SIMULACIÓN.** Todos los pacientes, CURP, teléfonos, unidades y laboratorios son ficticios. No se envía ningún SMS, WhatsApp ni llamada; no se almacena ningún archivo real.

## Correr la demo

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Cómo recorrer el flujo

1. Arriba a la derecha selecciona el **rol simulado**. Cada paso requiere un rol:
   - Capturista → asociar resultado (`/expedientes/[id]`)
   - Revisor → checklist y enviar a autorización (`/revision`)
   - Médico autorizador → autorizar / rechazar con nota y confirmación humana (`/autorizaciones`)
   - Trabajo social → notificar (llamada demo, SMS, WhatsApp), entregar con código y agendar seguimiento (`/notificaciones`, `/entregas`)
2. El historial de cada resultado se ve en su expediente.
3. El botón ↺ del header reinicia la demo a los datos iniciales. El estado se guarda en `localStorage`.

## Contratos compartidos

Ver [`src/contracts/README.md`](src/contracts/README.md). Son la base para el módulo de datos / Excel / indicadores.

## Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · zod · sonner

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

Para que otro equipo abra la misma demo, el proceso tiene que escuchar en todas las interfaces:

```bash
npx next dev --hostname 0.0.0.0 --port 3000
```

La ruta de los casos es `/casos`. Si hace falta salir de la red local, un túnel apunta a ese puerto. La URL del túnel cambia cada vez que se abre.

## Casos DEMO en el servidor

`/casos` muestra DEMO-001 a DEMO-006, con los IDs y alias de `src/data/casos-demo.json`. Ana usa DEMO-002 y Felipe usa DEMO-001.

- La clave de teclado, igual en los seis casos, es `2580`. La respuesta por voz no está implementada.
- Recepción del aviso, acceso al PDF y acompañamiento son eventos distintos. Pedir transporte no cuenta como entrega.
- El Revisor y el Médico autorizador pueden revisar el documento antes de la autorización. La paciente no lo abre sin autorización médica y sin la clave.
- **Preparar casos que falten** agrega un DEMO que no esté. No toca los existentes ni sus eventos.
- **Restaurar escenario demo** devuelve los campos de esos seis casos al JSON, archiva sus eventos y conserva cualquier otro caso y las notas operativas.
- El botón ↺ del encabezado solo reinicia los expedientes de este navegador.

Las 23 pruebas PR-* siguen en Pendiente hasta que Ana las ejecute en su equipo. El programa no las marca como aprobadas.

## Cómo recorrer el flujo de expedientes

1. Arriba a la derecha selecciona el **rol simulado**. Cada paso requiere un rol:
   - Capturista → asociar un PDF de prueba al expediente (`/expedientes/[id]`). En el diálogo se puede descargar `pap-ficticio.pdf`, un documento inventado para la demo.
   - Revisor → checklist y enviar a autorización (`/revision`)
   - Médico autorizador → autorizar / rechazar con nota y confirmación humana (`/autorizaciones`)
   - Trabajo social → notificar (llamada demo, SMS, WhatsApp), entregar con código y agendar seguimiento (`/notificaciones`, `/entregas`)
2. El historial de cada resultado se ve en su expediente.
3. El botón ↺ del header reinicia los expedientes de este navegador y borra los PDF locales. No borra los casos DEMO del servidor. Los metadatos de expedientes se guardan en `localStorage`. El binario asociado por el capturista, si lo hay, vive en IndexedDB.

## Limitaciones de seguridad

Esta demo no es un sistema de entrega clínica:

- El selector **Rol simulado** no autentica a nadie. No hay usuarios, sesión ni permisos reales.
- El PDF se valida (extensión, tipo, cabecera `%PDF-` y máximo 2 MB) y se guarda solo en IndexedDB de este navegador. No hay cifrado, control de acceso, respaldo ni borrado certificado.
- La huella SHA-256 se calcula en el equipo para la demo. No es un sello clínico ni una firma.
- La entrega no se ofrece hasta que el resultado está **notificado**, estado que solo se alcanza después de la autorización de un médico humano.
- Los casos DEMO y sus eventos sí se guardan en `data/servidor/casos.json`, en el proceso que está corriendo. No es una base clínica, no hay usuarios y quien tenga la URL puede modificar esos datos ficticios.
- El archivo `public/muestras/pap-ficticio.pdf` sigue público: es el PDF de práctica para que el capturista lo asocie a un expediente. El acceso del caso pasa por el servidor y exige rol o clave, según quién lo pide.
- No hay mensajería real ni respuesta por voz.

## Contratos compartidos

Ver [`src/contracts/README.md`](src/contracts/README.md). Son la base para el módulo de datos / Excel / indicadores.

## Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · zod · sonner

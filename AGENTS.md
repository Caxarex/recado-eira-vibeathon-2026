# RECADO – EIRA Movimiento Rosa (demo Vibeathon 2026)

App Next.js 15 (App Router, `src/`) + TypeScript + Tailwind v4 + shadcn/ui (estilo base-nova, primitivas Base UI) + zod + sonner.
**Todo es simulación con datos ficticios.** No hay backend, login ni envíos reales.

## Comandos
- `npm run dev` – servidor de desarrollo (http://localhost:3000)
- `npm run lint` – ESLint
- `npm run build` – build de producción (también valida tipos)
- `npx tsc --noEmit` – sólo tipos

## Estructura
- `src/contracts/` – **contratos compartidos** (tipos, zod, máquina de estados, indicadores). Leer `src/contracts/README.md`.
- `src/data/mock/` – datos ficticios iniciales.
- `src/data/repository.tsx` – Context + useReducer + localStorage (`recado-demo-v1`). Única vía para mutar estado.
- `src/components/` – shell, badges, tabla, panel de resultado, historial. `components/ui/` es shadcn (no editar a mano salvo necesidad).
- `src/app/` – rutas: `/`, `/expedientes[/id]`, `/revision[/id]`, `/autorizaciones[/id]`, `/notificaciones[/id]`, `/entregas[/id]`, `/indicadores`.

## Convenciones
- shadcn Base UI usa `render={<Link />}` en lugar de `asChild`.
- Select/Tabs: `onValueChange` puede recibir `null`; validar antes de castear.
- Toda transición de estado pasa por `transicionarEstado` (valida `puedeTransicionar`).
- Rol simulado se cambia en el header; cada paso del flujo exige un rol concreto.

## Pendiente / delegable al módulo de datos (Ana)
- Importador Excel/CSV con `filaExcelResultadoSchema`.
- `calcularIndicadores` definitivo.
- Validación operativa (duplicados, consistencia de fechas).
- Exportación de reportes.

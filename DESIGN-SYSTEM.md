# RECADO · Design System v2 (rama `feature/recado-design-system`)

Capa visual aislada: **no toca lógica, contratos, máquina de estados ni datos**.
Solo cambia presentación + 9 sitios donde se añadió `nativeButton={false}` a
`Button render={<Link/>}` (corrige warning de Base UI y accesibilidad).

## Tipografía
| Uso | Fuente | Variable | Fallback |
|---|---|---|---|
| Títulos / marca / KPIs | **Manrope** 500–800 | `--font-display` → `font-heading` | system-ui |
| Cuerpo, UI, tablas | **Inter** | `--font-body` → `font-sans` | system-ui |
| Código, folios, claves | Geist Mono | `--font-geist-mono` | Consolas |

Jerarquía base en `globals.css` (`h1` 3xl/4xl, `h2` xl/2xl, `h3` lg; cuerpo 16px/1.55).
Utilidades: `.eyebrow` (etiquetas), `.numeric` (cifras tabulares), `.bg-editorial` (hero).

## Tokens de color (oklch, en `:root` de `globals.css`)
- Marca: `--brand-wine` (#6e1e40 ≈ oklch .38/.14/356), `--brand-wine-deep`, `--brand-rose`, `--brand-rose-soft`, `--brand-rose-pale`, `--brand-ivory`, `--brand-ink`.
- Semánticos shadcn remapeados: `background`=marfil, `primary`=vino, `secondary`=rosa pálido, `muted-foreground` ≥ 6:1.
- Estado: `--success/-soft/-foreground`, `--warning/*`, `--danger/*`, `--info/*` (texto oscuro sobre fondo suave, ≥ 7:1).
- Otros: `--surface`, `--surface-2`, `--border`, `--ring`/`--focus`, `--disabled`.
- Clases Tailwind disponibles: `bg-brand-wine`, `text-warning-foreground`, `border-danger`, `bg-disabled`…

## Componentes nuevos (`src/components/ds/`)
`BrandMark` · `PageHeader`/`SectionTitle` · `AlertPanel` (info/success/warning/danger/**locked**/**simulation**) · `EmptyState` · `KpiCard` · `SimulationBanner`.
Importar así: `import { AlertPanel } from "@/components/ds"`.

## Decisiones
- Estados clínicos: color **+ icono + texto** (badges en `estado-badge.tsx`), nunca solo color.
- Botones ≥ 40px táctil (`ui/button.tsx`: default h-10, sm h-9, lg h-11).
- Foco visible global `:focus-visible` + skip-link en `app-shell`.
- `prefers-reduced-motion` respetado (utilidades `motion-reduce:`).

## Para integrar en Cursor (sugerencia, sin sobreescribir su trabajo)
1. Copiar `src/app/globals.css`, `src/components/ds/` y los cambios de `ui/button.tsx`, `ui/card.tsx` (presentación).
2. `app-shell.tsx`: Cursor puede adoptar la navegación completa o solo las clases/tokens; sus rutas `/casos` heredan el shell sin cambios.
3. En `src/app/casos/page.tsx` hay un `Button render={<Link/>}` que necesita el mismo `nativeButton={false}` que el resto (warning de Base UI en consola). Cursor decide dónde aplicarlo.
4. `panel-resultado.tsx` expone `Encabezado`/`AvisoRol` (ahora sobre DS) reutilizables en pantallas nuevas.
5. No hay dependencias nuevas: solo fuentes vía `next/font/google`.

## Verificado
`tsc` 0 errores · `eslint` 0 errores (2 warnings preexistentes ajenos) · 15/15 tests · `next build` OK ·
flujos DEMO-003/DEMO-002 verificados con clics (ver informe de entrega).

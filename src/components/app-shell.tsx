"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardCheck,
  FolderOpen,
  Home,
  LineChart,
  PackageCheck,
  Phone,
  ShieldCheck,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandMark, SimulationBanner } from "@/components/ds";
import { ROLES, type Rol } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/casos", label: "Casos demo", icon: Phone },
  { href: "/expedientes", label: "Expedientes", icon: FolderOpen },
  { href: "/revision", label: "Bandeja de revisión", icon: ClipboardCheck },
  { href: "/autorizaciones", label: "Autorizaciones", icon: ShieldCheck },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/entregas", label: "Entregas y seguimiento", icon: PackageCheck },
  { href: "/indicadores", label: "Indicadores", icon: LineChart },
];

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { rol, setRol, reiniciarDemo } = useRepositorio();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-brand-wine focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <SimulationBanner>
        Datos ficticios. Los casos DEMO y sus eventos se guardan en el servidor de esta demo; el PDF que asocia el
        capturista permanece solo en este navegador. Ningún paciente ni envío es real.
      </SimulationBanner>

      <div className="flex flex-1">
        {/* Sidebar escritorio */}
        <aside className="hidden w-[17rem] shrink-0 flex-col border-r bg-sidebar lg:flex">
          <div className="px-5 py-5">
            <BrandMark />
          </div>
          <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1 px-3 pb-4">
            <div className="eyebrow px-3 pb-2 pt-1">Recorrido</div>
            {NAV.map(({ href, label, icon: Icon }) => {
              const activo = esActivo(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[0.95rem] font-medium text-sidebar-foreground/80 transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activo && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                  )}
                >
                  {activo && (
                    <span aria-hidden className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-wine" />
                  )}
                  <Icon
                    className={cn("size-[1.15rem] shrink-0 text-muted-foreground transition-colors group-hover:text-brand-wine", activo && "text-brand-wine")}
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            Reto 4 · Nerdearla Vibeathon 2026
            <br />
            Demo con datos ficticios.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="border-b bg-surface">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-6">
              <div className="lg:hidden">
                <BrandMark />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <label className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex" htmlFor="rol-simulado">
                  <UserRound className="size-4" aria-hidden />
                  Rol simulado
                </label>
                <Select value={rol} onValueChange={(v) => v && setRol(v as Rol)}>
                  <SelectTrigger id="rol-simulado" className="h-10 w-[12.5rem] rounded-xl bg-surface text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reiniciar expedientes locales"
                  onClick={() => {
                    reiniciarDemo();
                    toast.info("Se reiniciaron los expedientes de este navegador. Los casos DEMO del servidor no se borraron.");
                  }}
                  title="Reinicia los expedientes locales. No borra los casos DEMO del servidor."
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>

            {/* Nav móvil / tableta */}
            <nav aria-label="Secciones" className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden [scrollbar-width:none]">
              {NAV.map(({ href, label, icon: Icon }) => {
                const activo = esActivo(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
                      activo
                        ? "border-brand-wine bg-brand-wine text-primary-foreground"
                        : "border-border bg-surface text-foreground/80 hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main id="contenido" className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

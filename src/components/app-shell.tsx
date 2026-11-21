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
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, type Rol } from "@/contracts/types";
import { useRepositorio } from "@/data/repository";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/expedientes", label: "Expedientes", icon: FolderOpen },
  { href: "/revision", label: "Bandeja de revisión", icon: ClipboardCheck },
  { href: "/autorizaciones", label: "Autorizaciones", icon: ShieldCheck },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/entregas", label: "Entregas y seguimiento", icon: PackageCheck },
  { href: "/indicadores", label: "Indicadores", icon: LineChart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { rol, setRol, reiniciarDemo } = useRepositorio();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 border-b border-pink-300 bg-pink-100 px-4 py-1.5 text-center text-xs font-semibold text-pink-900">
        SIMULACIÓN – Datos ficticios. Ningún paciente, resultado ni envío es real.
      </div>
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
          <div className="border-b px-5 py-4">
            <div className="text-lg font-bold text-pink-700">RECADO</div>
            <div className="text-xs text-muted-foreground">EIRA Movimiento Rosa</div>
          </div>
          <nav className="flex flex-col gap-0.5 p-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const activo = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-pink-50",
                    activo && "bg-pink-100 font-medium text-pink-900",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2 md:px-6">
            <div className="text-sm text-muted-foreground md:hidden">
              <Link href="/" className="font-bold text-pink-700">RECADO</Link>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rol simulado:</span>
              <Select value={rol} onValueChange={(v) => v && setRol(v as Rol)}>
                <SelectTrigger size="sm" className="w-48">
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
                size="sm"
                onClick={() => {
                  reiniciarDemo();
                  toast.info("Demo reiniciada a los datos ficticios iniciales");
                }}
                title="Reiniciar demo"
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b bg-white px-2 py-1 md:hidden">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded px-2 py-1 text-xs",
                  pathname === href && "bg-pink-100 text-pink-900",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <main className="flex-1 bg-slate-50 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

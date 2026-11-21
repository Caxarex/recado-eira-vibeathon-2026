import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RepositorioProvider } from "@/data/repository";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RECADO – EIRA Movimiento Rosa (Demo)",
  description:
    "Simulación de revisión, autorización clínica, notificación y entrega de resultados de Papanicolaou. Datos ficticios.",
};

export const viewport: Viewport = {
  themeColor: "#6e1e40",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${body.variable} ${display.variable} ${mono.variable}`}>
      <body className="antialiased">
        <RepositorioProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </RepositorioProvider>
      </body>
    </html>
  );
}

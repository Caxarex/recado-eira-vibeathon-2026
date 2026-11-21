import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RepositorioProvider } from "@/data/repository";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RECADO – EIRA Movimiento Rosa (Demo)",
  description:
    "Simulación de revisión, autorización clínica, notificación y entrega de resultados de Papanicolaou. Datos ficticios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RepositorioProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </RepositorioProvider>
      </body>
    </html>
  );
}

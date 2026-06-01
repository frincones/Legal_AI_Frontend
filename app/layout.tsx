import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal AI",
  description: "Agente legal multi-tenant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

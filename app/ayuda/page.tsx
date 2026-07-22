import type { Metadata } from "next";
import AyudaClient from "./AyudaClient";

export const metadata: Metadata = {
  title: "Centro de ayuda · Jurovia",
  description: "Preguntas frecuentes y soporte de Jurovia. Escríbenos a soporte@juroviapp.com; respondemos entre 24 y 72 horas.",
};

export default function AyudaPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  return <AyudaClient backendUrl={backendUrl} />;
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Landing from "@/components/marketing/Landing";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://juroviapp.com"),
  title: "Jurovia — Software de gestión y redacción para firmas de abogados en Colombia",
  description:
    "Plataforma de software (SaaS) para firmas de abogados: automatiza la redacción de documentos, organiza tus casos y contrasta tus citas con las fuentes oficiales. No es un bufete ni presta asesoría legal; el abogado revisa y decide. Prueba el software gratis.",
  openGraph: {
    title: "Jurovia — Software para firmas de abogados",
    description:
      "Software (SaaS) que ayuda a las firmas a redactar documentos y verificar sus citas contra las fuentes oficiales. No es asesoría legal; el abogado revisa y decide.",
    locale: "es_CO",
    type: "website",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  return <Landing authed={!!user} backendUrl={backendUrl} />;
}

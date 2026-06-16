import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Landing from "@/components/marketing/Landing";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://juroviapp.com"),
  title: "Juridica — Copiloto jurídico verificable para abogados en Colombia",
  description:
    "IA legal que verifica cada ley y sentencia contra las fuentes oficiales, redacta tus escritos en Word y vigila tus casos. Empieza gratis.",
  openGraph: {
    title: "Juridica — Copiloto jurídico verificable",
    description:
      "Fundamenta cada escrito con citas verificadas contra las fuentes oficiales. Pruébalo gratis.",
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

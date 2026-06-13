import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JuridicaApp from "@/components/juridica/App";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  // Resuelve el flag mission_control en el SERVER para que el HTML salga ya en el modo correcto
  // (sin el flash de 1-2s al refrescar). Resiliente: si falla, cae a false y el cliente reconcilia.
  let initialMissionMode = false;
  try {
    const r = await fetch(`${backendUrl}/api/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    if (r.ok) {
      const m = await r.json();
      initialMissionMode = !!m?.features?.mission_control;
    }
  } catch {
    // ignora — el cliente reconcilia con su propio fetch
  }

  return (
    <JuridicaApp
      backendUrl={backendUrl}
      accessToken={session.access_token}
      email={session.user.email ?? null}
      initialMissionMode={initialMissionMode}
    />
  );
}

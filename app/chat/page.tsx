import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JuridicaApp from "@/components/juridica/App";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <JuridicaApp
      backendUrl={process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}
      accessToken={session.access_token}
      email={session.user.email ?? null}
    />
  );
}

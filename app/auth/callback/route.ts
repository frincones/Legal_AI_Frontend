import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback del Magic Link (F6.1): Supabase redirige aquí con ?code=...; lo intercambiamos por
// sesión (cookies SSR) y mandamos al usuario a /chat.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/chat";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

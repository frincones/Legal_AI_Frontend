"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else router.push("/chat");
  }

  async function signUp() {
    setBusy(true);
    setMsg(null);
    const { error } = await createClient().auth.signUp({ email, password });
    setBusy(false);
    setMsg(error ? error.message : "Cuenta creada. Revisa tu correo si requiere confirmación.");
  }

  return (
    <main style={{ maxWidth: 360, margin: "12vh auto", padding: 24 }}>
      <h1 style={{ fontSize: 22 }}>Legal AI</h1>
      <p style={{ color: "var(--muted)", marginTop: -8 }}>Acceso</p>
      <form onSubmit={signIn} style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inp}
        />
        <input
          type="password"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inp}
        />
        <button type="submit" disabled={busy} style={btn}>
          {busy ? "..." : "Entrar"}
        </button>
        <button type="button" onClick={signUp} disabled={busy} style={{ ...btn, background: "transparent", border: "1px solid #2a2f3a" }}>
          Crear cuenta
        </button>
      </form>
      {msg && <p style={{ color: "var(--muted)", marginTop: 12 }}>{msg}</p>}
    </main>
  );
}

const inp: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #2a2f3a",
  background: "var(--panel)",
  color: "var(--text)",
};
const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent)",
  color: "#06101f",
  fontWeight: 600,
  cursor: "pointer",
};

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
  const [mode, setMode] = useState<"magic" | "password">("magic");

  // F6.1 — Magic Link (zero-config, sin GCP/Azure): enviamos un enlace al correo.
  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    setMsg(error ? error.message : "✉️ Te enviamos un enlace mágico. Ábrelo desde tu correo para entrar.");
  }

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
    <main style={{ maxWidth: 380, margin: "12vh auto", padding: 24 }}>
      <h1 style={{ fontSize: 22 }}>Juridica</h1>
      <p style={{ color: "var(--muted)", marginTop: -8 }}>Acceso</p>

      {/* Selector de método */}
      <div style={{ display: "flex", gap: 6, margin: "16px 0 14px" }}>
        <button type="button" onClick={() => { setMode("magic"); setMsg(null); }} style={{ ...tab, ...(mode === "magic" ? tabOn : {}) }}>
          Enlace mágico
        </button>
        <button type="button" onClick={() => { setMode("password"); setMsg(null); }} style={{ ...tab, ...(mode === "password" ? tabOn : {}) }}>
          Contraseña
        </button>
      </div>

      {mode === "magic" ? (
        <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 10 }}>
          <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inp} />
          <button type="submit" disabled={busy || !email} style={btn}>
            {busy ? "Enviando…" : "Enviarme el enlace"}
          </button>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>Sin contraseña: te llega un enlace a tu correo y entras con un clic.</p>
        </form>
      ) : (
        <form onSubmit={signIn} style={{ display: "grid", gap: 10 }}>
          <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inp} />
          <input type="password" placeholder="contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={inp} />
          <button type="submit" disabled={busy} style={btn}>{busy ? "..." : "Entrar"}</button>
          <button type="button" onClick={signUp} disabled={busy} style={{ ...btn, background: "transparent", border: "1px solid #2a2f3a" }}>
            Crear cuenta
          </button>
        </form>
      )}
      {msg && <p style={{ color: "var(--muted)", marginTop: 12, lineHeight: 1.5 }}>{msg}</p>}
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
const tab: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #2a2f3a",
  background: "transparent",
  color: "var(--muted)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const tabOn: React.CSSProperties = { background: "var(--accent)", color: "#06101f", border: "1px solid var(--accent)" };

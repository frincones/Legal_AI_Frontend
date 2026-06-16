"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo, Icon } from "@/components/juridica/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("magic");

  // Si un enlace de email rebotó aquí (p.ej. token expirado/consumido por un escáner),
  // muestra un mensaje claro en vez de dejar al usuario sin contexto.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errCode = hash.get("error_code") || q.get("error");
    if (errCode) {
      setMsg(errCode.includes("otp_expired") || errCode === "auth"
        ? "El enlace expiró o ya se usó. Pide un código nuevo e ingrésalo aquí."
        : decodeURIComponent(errCode));
    }
  }, []);

  // Paso 1: envía un CÓDIGO de 6 dígitos al correo (a prueba de escáneres de enlaces).
  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else setSent(true);
  }

  // Paso 2: verifica el código y crea la sesión. Sirve para login (type 'email') y para
  // confirmación de registro de usuario nuevo (type 'signup') — probamos ambos.
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const tok = code.trim();
    let { error } = await supabase.auth.verifyOtp({ email, token: tok, type: "email" });
    if (error) {
      const r2 = await supabase.auth.verifyOtp({ email, token: tok, type: "signup" });
      error = r2.error;
    }
    setBusy(false);
    if (error) setMsg(error.message);
    else router.push("/chat");
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
    <div style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", background: "var(--bg-base)", overflow: "hidden", padding: 20 }}>
      {/* Fondo aurora mesh (igual que el template) */}
      <div style={{ position: "absolute", inset: 0, background: "var(--grad-mesh)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 120%, rgba(247,248,251,0) 40%, var(--bg-base) 80%)" }} />

      <div className="fade-up" style={{ position: "relative", zIndex: 2, width: 412, maxWidth: "92vw" }}>
        {/* Marca */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
          <Logo size={52} />
          <h1 style={{ fontSize: 26, fontWeight: 650, letterSpacing: "-0.02em", margin: "16px 0 4px" }}>Jurovia</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14.5, margin: 0 }}>Tu copiloto jurídico verificable</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28, boxShadow: "var(--sh-3)", borderRadius: "var(--r-xl)" }}>
          {sent ? (
            <form onSubmit={verifyCode} style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--primary-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Icon name="send" size={24} style={{ color: "var(--primary)" }} />
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 6px" }}>Ingresa el código</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 18px", lineHeight: 1.55 }}>
                Te enviamos un código de 6 dígitos a <strong style={{ color: "var(--text)" }}>{email}</strong>. Escríbelo aquí para entrar.
              </p>
              <input
                inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required placeholder="••••••"
                className="focus-ring"
                style={{ ...inp, textAlign: "center", fontSize: 26, letterSpacing: 10, fontWeight: 700, height: 56 }}
              />
              <button type="submit" className="btn btn-primary btn-lg" disabled={busy || code.length < 6} style={{ width: "100%", marginTop: 16 }}>
                {busy ? "Verificando…" : <>Entrar <Icon name="arrowRight" size={17} stroke={2.2} /></>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setSent(false); setCode(""); setMsg(null); }} style={{ width: "100%", marginTop: 10 }}>
                Usar otro correo
              </button>
            </form>
          ) : (
            <>
              <h2 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 4px" }}>Inicia sesión</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "0 0 22px" }}>Accede a tu espacio de la firma.</p>

              {mode === "magic" ? (
                <form onSubmit={sendMagicLink}>
                  <label style={lbl}>Correo</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@correo.com" className="focus-ring" style={inp} />
                  <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !email} style={{ width: "100%", marginTop: 22 }}>
                    {busy ? "Enviando…" : <>Enviarme el enlace <Icon name="arrowRight" size={17} stroke={2.2} /></>}
                  </button>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "14px 0 0", textAlign: "center", lineHeight: 1.5 }}>
                    Sin contraseña: te llega un código de 6 dígitos a tu correo.
                  </p>
                </form>
              ) : (
                <form onSubmit={signIn}>
                  <label style={lbl}>Correo</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@correo.com" className="focus-ring" style={inp} />
                  <label style={{ ...lbl, marginTop: 16, display: "block" }}>Contraseña</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="focus-ring" style={inp} />
                  <button type="submit" className="btn btn-primary btn-lg" disabled={busy} style={{ width: "100%", marginTop: 22 }}>
                    {busy ? "…" : <>Entrar <Icon name="arrowRight" size={17} stroke={2.2} /></>}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={signUp} disabled={busy} style={{ width: "100%", marginTop: 10 }}>
                    Crear cuenta
                  </button>
                </form>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>o</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <button className="btn btn-secondary" onClick={() => { setMode(mode === "magic" ? "password" : "magic"); setMsg(null); }} style={{ width: "100%" }}>
                <Icon name={mode === "magic" ? "command" : "send"} size={16} />
                {mode === "magic" ? "Prefiero usar contraseña" : "Usar código por correo"}
              </button>
            </>
          )}

          {msg && <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 16, lineHeight: 1.5, textAlign: "center" }}>{msg}</p>}
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", marginTop: 20, lineHeight: 1.5 }}>
          Verificado contra fuentes oficiales · Datos aislados por usuario.
        </p>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" };
const inp: React.CSSProperties = {
  width: "100%", height: 44, marginTop: 6, padding: "0 14px", borderRadius: "var(--r-md)",
  border: "1px solid var(--border)", background: "var(--bg-base)", fontSize: 14.5, color: "var(--text)", outline: "none",
};

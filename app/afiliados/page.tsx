"use client";
import { useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export default function AfiliadosPage() {
  const [form, setForm] = useState({ name: "", email: "", instagram: "", phone: "", terms: false });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link: string; existing?: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.terms) { setErr("Acepta las condiciones para continuar."); return; }
    setBusy(true);
    try {
      const r = await fetch(`${BACKEND}/api/affiliates/apply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, instagram: form.instagram, phone: form.phone, accepted_terms: form.terms }),
      });
      const j = await r.json();
      if (r.ok && j.link) setResult({ link: j.link, existing: j.existing });
      else setErr(j.detail || "No se pudo registrar. Intenta de nuevo.");
    } catch { setErr("Error de red. Intenta de nuevo."); }
    setBusy(false);
  }
  const copy = (s: string) => { try { navigator.clipboard.writeText(s); } catch { /* ignore */ } };

  const wrap: React.CSSProperties = { fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", maxWidth: 600, margin: "0 auto", padding: "32px 18px 64px", color: "#1a1626", background: "#faf7fc", minHeight: "100vh", lineHeight: 1.55 };
  const brand = <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", background: "linear-gradient(100deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Jurov·ia</div>;
  const input: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #eadff5", fontSize: "1rem", background: "#fff", color: "#1a1626", marginTop: 6 };
  const label: React.CSSProperties = { fontSize: ".82rem", fontWeight: 700, color: "#5b4d68" };

  if (result) return (
    <main style={wrap}>{brand}
      <h1 style={{ fontSize: "1.5rem", margin: "18px 0 6px" }}>🎉 ¡Ya eres afiliado de Jurovia!</h1>
      <p style={{ color: "#6b5d78" }}>{result.existing ? "Ya tenías tu cuenta — este es tu link:" : "Este es tu link único. Compártelo con tu audiencia y ganas 30% por cada abogado que se suscriba."}</p>
      <div style={{ background: "#f1ecfd", border: "1px solid #e0d4f7", borderRadius: 14, padding: 16, margin: "16px 0" }}>
        <div style={{ fontFamily: "ui-monospace,monospace", fontSize: ".95rem", wordBreak: "break-all", marginBottom: 10 }}>{result.link}</div>
        <button onClick={() => copy(result.link)} style={{ background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 700, border: "none", padding: "10px 18px", borderRadius: 999, cursor: "pointer" }}>Copiar link</button>
      </div>
      <a href="/afiliado" style={{ display: "inline-block", background: "#1a1626", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Ir a mi panel de afiliado →</a>
      <p style={{ fontSize: ".82rem", color: "#9a8fac", marginTop: 18 }}>En tu panel ves tus clics, ventas y ganancias. El pago se hace por transferencia según las <a href="/afiliados/terminos" style={{ color: "#7c3aed" }}>condiciones</a>.</p>
    </main>
  );

  return (
    <main style={wrap}>
      {brand}
      <div style={{ display: "inline-block", background: "#f1ecfd", color: "#7c3aed", fontWeight: 700, fontSize: ".78rem", padding: "5px 12px", borderRadius: 999, margin: "18px 0 10px" }}>PROGRAMA DE AFILIADOS</div>
      <h1 style={{ fontSize: "1.7rem", lineHeight: 1.15, margin: "0 0 10px" }}>Monetiza tu contenido legal: gana <span style={{ color: "#7c3aed" }}>30%</span> por cada abogado que se suscriba con tu link.</h1>
      <p style={{ color: "#6b5d78", margin: "0 0 16px" }}>Tu audiencia ya confía en ti. Recomienda Jurovia —la IA legal que a los abogados les encanta— y gana comisión recurrente. Gratis, sin exclusividad, con un panel para ver tus ganancias.</p>

      <div style={{ display: "grid", gap: 8, margin: "0 0 20px" }}>
        {[["🔗", "Recibe tu link único y compártelo en tu contenido"],
          ["💸", "Ganas 30% por cada suscripción que venga de tu link"],
          ["📊", "Panel propio: clics, ventas y ganancias en tiempo real"],
          ["🏦", "Pago por transferencia · sin costo ni permanencia"]].map(([e, t]) => (
          <div key={t} style={{ display: "flex", gap: 10, background: "#fff", border: "1px solid #eadff5", borderRadius: 12, padding: "10px 13px", fontSize: ".92rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{e}</span><span>{t}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #eadff5", borderRadius: 16, padding: 18 }}>
        <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 4 }}>Regístrate en 1 minuto</div>
        <div style={{ marginTop: 10 }}><span style={label}>Nombre completo *</span><input style={input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div style={{ marginTop: 10 }}><span style={label}>Correo *</span><input style={input} required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div style={{ marginTop: 10 }}><span style={label}>Instagram / TikTok</span><input style={input} placeholder="@tuusuario" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
        <div style={{ marginTop: 10 }}><span style={label}>WhatsApp (opcional)</span><input style={input} placeholder="+57…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: ".85rem", color: "#5b4d68" }}>
          <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} style={{ marginTop: 3 }} />
          <span>Acepto las <a href="/afiliados/terminos" target="_blank" style={{ color: "#7c3aed" }}>condiciones del programa</a> y el tratamiento de mis datos.</span>
        </label>
        {err && <div style={{ color: "#c23b52", fontSize: ".85rem", marginTop: 10 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 800, fontSize: "1.05rem", border: "none", padding: "14px", borderRadius: 12, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Creando tu link…" : "Quiero ser afiliado →"}
        </button>
      </form>
      <p style={{ textAlign: "center", fontSize: ".78rem", color: "#9a8fac", marginTop: 20 }}>Jurovia · IA legal para abogados de Colombia · <a href="https://juroviapp.com" style={{ color: "#7c3aed", textDecoration: "none" }}>juroviapp.com</a></p>
    </main>
  );
}

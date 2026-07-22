"use client";
import { useState } from "react";
import { api } from "@/components/juridica/mission/data";
import { FAQS, FAQS_SUPPORT } from "@/components/faq";
import { COMPANY } from "@/components/company";

const CATEGORIES: [string, string][] = [
  ["consulta", "Consulta general"],
  ["facturacion", "Facturación y pagos"],
  ["datos", "Datos y privacidad"],
  ["error", "Reportar un error"],
  ["otro", "Otro"],
];

// Derechos Habeas Data (Ley 1581) — L12
const RIGHTS: [string, string][] = [
  ["conocer", "Conocer mis datos"],
  ["actualizar", "Actualizar mis datos"],
  ["rectificar", "Rectificar mis datos"],
  ["suprimir", "Suprimir / eliminar mis datos"],
  ["revocar", "Revocar mi autorización"],
];

const field: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)",
  background: "var(--bg-base)", fontSize: 14.5, color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none",
};

export default function AyudaClient({ backendUrl }: { backendUrl: string }) {
  const [open, setOpen] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("consulta");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Formulario de derechos (Habeas Data)
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rType, setRType] = useState("conocer");
  const [rDetail, setRDetail] = useState("");
  const [rBusy, setRBusy] = useState(false);
  const [rSent, setRSent] = useState(false);
  const [rErr, setRErr] = useState<string | null>(null);
  const rCanSend = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rEmail.trim()) && !rBusy;

  async function submitRights() {
    if (!rCanSend) return;
    setRBusy(true); setRErr(null);
    const label = (RIGHTS.find(([v]) => v === rType) || ["", rType])[1];
    try {
      const r = await api.submitSupport(backendUrl, {
        email: rEmail.trim().toLowerCase(), name: rName.trim() || undefined,
        category: "datos", subject: `Habeas Data — ${label}`,
        message: `Solicitud de derecho (Habeas Data): ${label}.\n\n${rDetail.trim() || "(sin detalle adicional)"}`,
        source: "derechos",
      });
      if (r?.ok) setRSent(true);
      else setRErr("No pudimos enviar tu solicitud. Escríbenos a " + COMPANY.email + ".");
    } catch {
      setRErr("No pudimos enviar tu solicitud. Escríbenos a " + COMPANY.email + ".");
    }
    setRBusy(false);
  }

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const canSend = validEmail && message.trim().length >= 5 && !busy;
  const faqs = [...FAQS, ...FAQS_SUPPORT];

  async function submit() {
    if (!canSend) return;
    setBusy(true); setErr(null);
    try {
      const r = await api.submitSupport(backendUrl, {
        email: email.trim().toLowerCase(), name: name.trim() || undefined,
        category, subject: subject.trim() || undefined, message: message.trim(), source: "ayuda",
      });
      if (r?.ok) setSent(true);
      else setErr("No pudimos enviar tu mensaje. Escríbenos a " + COMPANY.email + ".");
    } catch {
      setErr("No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos a " + COMPANY.email + ".");
    }
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg-base)", color: "var(--text)", fontFamily: "var(--font-ui, system-ui)" }}>
      {/* Header */}
      <div style={{ background: "var(--grad-aurora, linear-gradient(120deg,#FF3D7F,#D23BE0,#7B3DF5,#2F6BFF))" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "48px 22px 40px" }}>
          <a href="/" style={{ color: "rgba(255,255,255,.9)", fontSize: 13, textDecoration: "none" }}>← Volver a Jurovia</a>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "16px 0 6px" }}>Centro de ayuda</h1>
          <p style={{ color: "rgba(255,255,255,.92)", fontSize: 15, margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
            Encuentra respuestas rápidas o escríbenos. Respondemos <b>entre 24 y 72 horas</b>.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "36px 22px 64px", display: "grid", gap: 40, gridTemplateColumns: "1fr", }}>
        {/* FAQ */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 750, margin: "0 0 16px" }}>Preguntas frecuentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-surface)", overflow: "hidden" }}>
                  <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
                    style={{ width: "100%", textAlign: "left", padding: "15px 18px", background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "var(--text)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    {q}<span style={{ color: "var(--primary)", fontSize: 20, flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform .2s" }}>+</span>
                  </button>
                  <div style={{ maxHeight: isOpen ? 300 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                    <p style={{ padding: "0 18px 16px", margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contacto */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 750, margin: "0 0 6px" }}>¿No encontraste lo que buscabas?</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 18px" }}>
            Escríbenos a <a href={`mailto:${COMPANY.email}`} style={{ color: "var(--primary)", fontWeight: 600 }}>{COMPANY.email}</a> o usa este formulario. Te respondemos entre 24 y 72 horas.
          </p>

          {sent ? (
            <div className="card" style={{ padding: 28, textAlign: "center", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-surface)" }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>¡Mensaje enviado!</div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>Te enviamos una confirmación a <b>{email.trim().toLowerCase()}</b>. Te responderemos entre 24 y 72 horas.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
              {err && <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(220,38,38,.1)", color: "var(--danger, #DC2626)", fontSize: 13 }}>{err}</div>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input style={{ ...field, flex: "1 1 220px" }} placeholder="Tu nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
                <input style={{ ...field, flex: "1 1 220px" }} type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <select style={field} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input style={field} placeholder="Asunto (opcional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <textarea style={{ ...field, resize: "vertical", minHeight: 120, lineHeight: 1.5 }} placeholder="Cuéntanos en qué te ayudamos…" value={message} onChange={(e) => setMessage(e.target.value)} />
              <button className="btn btn-primary btn-lg" style={{ width: "100%", opacity: canSend ? 1 : 0.6 }} disabled={!canSend} onClick={submit}>
                {busy ? "Enviando…" : "Enviar mensaje"}
              </button>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
                Al enviar aceptas el tratamiento de tus datos según la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "var(--primary)" }}>Política de Privacidad</a>.
              </p>
            </div>
          )}
        </section>

        {/* Derechos Habeas Data (L12) */}
        <section id="derechos">
          <h2 style={{ fontSize: 20, fontWeight: 750, margin: "0 0 6px" }}>Ejercer mis derechos sobre mis datos</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 4px" }}>
            Conforme a la <b>Ley 1581 de 2012</b>, puedes conocer, actualizar, rectificar o suprimir tus datos personales, y revocar tu autorización.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px" }}>
            Atendemos las <b>consultas en máximo 10 días hábiles</b> y los <b>reclamos en 15 días hábiles</b> (prorrogables conforme al Decreto 1377 de 2013).
          </p>
          {rSent ? (
            <div className="card" style={{ padding: 28, textAlign: "center", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-surface)" }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>¡Solicitud enviada!</div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>Te confirmamos a <b>{rEmail.trim().toLowerCase()}</b>. Atenderemos tu solicitud dentro de los plazos legales.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
              {rErr && <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(220,38,38,.1)", color: "var(--danger, #DC2626)", fontSize: 13 }}>{rErr}</div>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input style={{ ...field, flex: "1 1 220px" }} placeholder="Tu nombre (opcional)" value={rName} onChange={(e) => setRName(e.target.value)} />
                <input style={{ ...field, flex: "1 1 220px" }} type="email" placeholder="tu@correo.com" value={rEmail} onChange={(e) => setREmail(e.target.value)} />
              </div>
              <select style={field} value={rType} onChange={(e) => setRType(e.target.value)}>
                {RIGHTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <textarea style={{ ...field, resize: "vertical", minHeight: 100, lineHeight: 1.5 }} placeholder="Cuéntanos qué necesitas (opcional)…" value={rDetail} onChange={(e) => setRDetail(e.target.value)} />
              <button className="btn btn-primary btn-lg" style={{ width: "100%", opacity: rCanSend ? 1 : 0.6 }} disabled={!rCanSend} onClick={submitRights}>
                {rBusy ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          )}
        </section>

        {/* Identidad del prestador */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {COMPANY.brand} es un servicio de <b>{COMPANY.legalName}</b> · NIT {COMPANY.nit} · {COMPANY.address} · <a href={`mailto:${COMPANY.email}`} style={{ color: "var(--primary)" }}>{COMPANY.email}</a><br />
          <a href="/privacidad" style={{ color: "var(--primary)" }}>Política de Privacidad</a> · <a href="/cancelacion" style={{ color: "var(--primary)" }}>Cancelación y Reembolsos</a>
        </div>
      </div>
    </main>
  );
}

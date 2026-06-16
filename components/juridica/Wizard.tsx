"use client";

import { useEffect, useState } from "react";
import { Icon, Logo } from "./icons";

type IntegrationRow = { toolkit: string; label: string; connected: boolean; enabled: boolean };

const INT_ICON: Record<string, string> = {
  gmail: "send", outlook: "send", googlecalendar: "clock", googledrive: "folder",
  googledocs: "fileText", googlesheets: "copy", microsoft_teams: "message",
};

/* Logo oficial de la herramienta (Composio los expone en logos.composio.dev). Con fallback a icono. */
export function ToolLogo({ slug, size = 26 }: { slug: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 7, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}>
        <Icon name={INT_ICON[slug] || "command"} size={Math.round(size * 0.58)} style={{ color: "var(--primary)" }} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logos.composio.dev/api/${slug}`}
      width={size}
      height={size}
      alt=""
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 7, display: "block", objectFit: "contain", background: "#fff", border: "1px solid var(--border)", padding: 3 }}
    />
  );
}

/* ---------- Tour: qué es cada módulo y cómo usarlo ---------- */
const TOUR: { icon: string; title: string; body: string }[] = [
  { icon: "message", title: "Chat con fundamentación verificada", body: "Pregúntale al agente o pídele un escrito. Verifica cada ley y sentencia contra las fuentes oficiales y te deja la cita con su enlace." },
  { icon: "folder", title: "Misiones (expedientes)", body: "Crea una misión por caso: cronología, partes, documentos, calendario y avance, todo en un solo lugar." },
  { icon: "fileText", title: "Documentos en Word", body: "Los documentos se generan en .docx (y PDF), listos para descargar y editar. Tus plantillas se reutilizan." },
  { icon: "radar", title: "Autopilot · vigilancia", body: "Deja que Jurovia vigile tus casos y te avise si una norma cambió o hay novedades — incluso desde tu correo." },
  { icon: "coins", title: "Créditos", body: "Cada consulta o documento consume créditos del plan. Revisa tu saldo y tu plan en Ajustes." },
];

/* F6.3 — Onboarding multi-paso: bienvenida → perfil → integraciones → tour. Persiste en DB. */
export function Wizard({ backendUrl, accessToken, onClose }: { backendUrl: string; accessToken: string; onClose: () => void }) {
  const [step, setStep] = useState(0); // 0 bienvenida · 1 perfil · 2 integraciones · 3 tour
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prof, setProf] = useState({ full_name: "", bar_number: "", entity_name: "", jurisdiction: "", practice_areas: "" });
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

  async function load() {
    try {
      const r = await fetch(`${backendUrl}/api/integrations`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      if (d && Array.isArray(d.available)) setRows(d.available);
    } catch { /* ignore */ }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Guarda el perfil + marca onboarded (best-effort; nunca bloquea el avance).
  async function saveProfile() {
    setSaving(true);
    try {
      await fetch(`${backendUrl}/api/onboarding`, { method: "POST", headers, body: JSON.stringify(prof) });
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  async function connect(toolkit: string) {
    setBusy(toolkit);
    try {
      const r = await fetch(`${backendUrl}/api/integrations/connect`, {
        method: "POST", headers,
        body: JSON.stringify({ toolkit, callback_url: window.location.origin + "/chat?connected=1" }),
      });
      const d = await r.json();
      if (d?.redirect_url) {
        const popup = window.open(d.redirect_url, "_blank", "width=520,height=700");
        const t = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(t); setBusy(null);
            fetch(`${backendUrl}/api/integrations/sync`, { method: "POST", headers })
              .then((x) => x.json()).then((d2) => d2?.available && setRows(d2.available)).catch(() => {});
          }
        }, 1000);
      } else setBusy(null);
    } catch { setBusy(null); }
  }

  const connectedCount = rows.filter((r) => r.connected).length;
  const STEPS = ["Bienvenida", "Tu perfil", "Integraciones", "Tour"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,12,20,0.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 580, background: "var(--bg-surface)", borderRadius: "var(--r-xl)", border: "1px solid var(--border)", boxShadow: "var(--sh-pop)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        {/* header + progreso */}
        <div style={{ padding: "22px 28px 16px", background: "var(--grad-aurora-soft)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Logo size={28} withText />
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{step + 1} / {STEPS.length}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? "var(--aurora)" : "var(--bg-elevated-2)", transition: "background .25s" }} />
            ))}
          </div>
        </div>

        <div className="no-scrollbar" style={{ padding: 24, overflow: "auto", flex: 1 }}>
          {step === 0 && (
            <div className="fade-up" style={{ textAlign: "center", padding: "12px 6px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--aurora)", display: "grid", placeItems: "center", margin: "0 auto 18px", boxShadow: "var(--glow-primary)" }}><Icon name="sparkles" size={30} style={{ color: "#fff" }} /></div>
              <h2 style={{ fontSize: 22, fontWeight: 680, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Bienvenido a Jurovia</h2>
              <p style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                Tu copiloto jurídico verificable. En menos de un minuto te dejamos listo: cuéntanos de ti, conecta tus herramientas (opcional) y te mostramos cómo usar cada módulo.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="fade-up">
              <h2 style={{ fontSize: 19, fontWeight: 650, margin: "0 0 4px" }}>Cuéntanos de ti</h2>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 18px" }}>Esto ayuda al agente a redactar con tu contexto. Puedes cambiarlo luego en Ajustes.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {([
                  ["full_name", "Tu nombre", "Ej. Natalia Gómez"],
                  ["entity_name", "Despacho / firma", "Ej. Gómez & Asociados (o tu nombre)"],
                  ["jurisdiction", "Ciudad / jurisdicción", "Ej. Bogotá D.C."],
                  ["practice_areas", "Área(s) de práctica", "Ej. Laboral, Civil, Familia"],
                  ["bar_number", "Tarjeta profesional (opcional)", "Ej. 123456"],
                ] as [keyof typeof prof, string, string][]).map(([k, label, ph]) => (
                  <label key={k} style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>{label}</span>
                    <input value={prof[k]} onChange={(e) => setProf((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph}
                      style={{ width: "100%", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", padding: "10px 12px", fontSize: 14, background: "var(--bg-base)", color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none" }} />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up">
              <h2 style={{ fontSize: 19, fontWeight: 650, margin: "0 0 4px" }}>Conecta tus herramientas</h2>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px" }}>Para que el asistente pueda leer tu calendario, enviar correos o que Autopilot vigile tu bandeja. Es opcional y privado de tu usuario.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rows.map((it) => {
                  const b = busy === it.toolkit;
                  return (
                    <div key={it.toolkit} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "11px 13px", background: "var(--bg-base)" }}>
                      <ToolLogo slug={it.toolkit} size={30} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>
                      {it.connected ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "var(--success)", flexShrink: 0 }}><Icon name="check" size={15} /> Conectado</span>
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled={b} onClick={() => connect(it.toolkit)} style={{ flexShrink: 0 }}>
                          <Icon name={b ? "sparkles" : "plus"} size={14} style={b ? { animation: "spin 2s linear infinite" } : undefined} />
                          {b ? "Conectando…" : "Conectar"}
                        </button>
                      )}
                    </div>
                  );
                })}
                {rows.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 18 }}>Cargando…</div>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-up">
              <h2 style={{ fontSize: 19, fontWeight: 650, margin: "0 0 4px" }}>Cómo usar Jurovia</h2>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px" }}>Un vistazo rápido a cada módulo. Lo tienes siempre a mano en la barra lateral.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TOUR.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 13px", background: "var(--bg-base)" }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={t.icon} size={18} style={{ color: "var(--primary)" }} /></span>
                    <div><div style={{ fontSize: 14, fontWeight: 650, marginBottom: 2 }}>{t.title}</div><div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.body}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* footer / navegación */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          {step === 2 && (
            <span style={{ fontSize: 12.5, color: "var(--text-muted)", flex: 1, minWidth: 0 }}>
              {connectedCount > 0 ? `${connectedCount} conectada${connectedCount === 1 ? "" : "s"}` : "Puedes hacerlo luego en Ajustes → Integraciones"}
            </span>
          )}
          {step !== 2 && <span style={{ flex: 1 }} />}
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} style={{ flexShrink: 0 }}>Atrás</button>}
          {step < 3 ? (
            <button className="btn btn-primary" disabled={saving} style={{ flexShrink: 0 }}
              onClick={async () => { if (step === 1) await saveProfile(); setStep((s) => s + 1); }}>
              {saving ? "Guardando…" : step === 0 ? "Empezar" : step === 2 ? "Continuar" : "Siguiente"}
              <Icon name="arrowRight" size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onClose} style={{ flexShrink: 0 }}>Ir a Jurovia<Icon name="arrowRight" size={16} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

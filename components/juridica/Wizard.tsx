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

/* F6.3 — Wizard de onboarding: tras el primer login, ofrece conectar herramientas. Opcional. */
export function Wizard({ backendUrl, accessToken, onClose }: { backendUrl: string; accessToken: string; onClose: () => void }) {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

  async function load() {
    try {
      const r = await fetch(`${backendUrl}/api/integrations`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await r.json();
      if (d && Array.isArray(d.available)) setRows(d.available);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            clearInterval(t);
            setBusy(null);
            fetch(`${backendUrl}/api/integrations/sync`, { method: "POST", headers })
              .then((x) => x.json())
              .then((d2) => d2?.available && setRows(d2.available))
              .catch(() => {});
          }
        }, 1000);
      } else {
        setBusy(null);
      }
    } catch {
      setBusy(null);
    }
  }

  const connectedCount = rows.filter((r) => r.connected).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,12,20,0.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 580, background: "var(--bg-surface)", borderRadius: "var(--r-xl)", border: "1px solid var(--border)", boxShadow: "var(--sh-pop)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "26px 28px 18px", background: "var(--grad-aurora-soft)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Logo size={28} />
            <span style={{ fontWeight: 700, fontSize: 15.5 }}>Bienvenido a Juridica</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 650, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Conecta tus herramientas</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Para que el asistente pueda leer tu calendario, enviar correos o buscar en tu Drive. Es opcional y cada cuenta es privada de tu usuario.
          </p>
        </div>

        <div className="no-scrollbar" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
          {rows.map((it) => {
            const b = busy === it.toolkit;
            return (
              <div key={it.toolkit} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "11px 13px", background: "var(--bg-base)" }}>
                <ToolLogo slug={it.toolkit} size={30} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>
                {it.connected ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "var(--success)", flexShrink: 0 }}>
                    <Icon name="check" size={15} /> Conectado
                  </span>
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

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)", flex: 1, minWidth: 0 }}>
            {connectedCount > 0 ? `${connectedCount} conectada${connectedCount === 1 ? "" : "s"} · gestiona el resto en Ajustes` : "También puedes hacerlo luego en Ajustes → Integraciones"}
          </span>
          <button className="btn btn-ghost" onClick={onClose} style={{ flexShrink: 0 }}>Omitir</button>
          <button className="btn btn-primary" onClick={onClose} style={{ flexShrink: 0 }}>
            {connectedCount > 0 ? "Empezar" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

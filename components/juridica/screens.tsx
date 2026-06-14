"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Icon } from "./icons";
import { Tooltip } from "./atoms";
import { Composer } from "./shell";
import { SUGGESTIONS, type LibraryItem } from "./data";
import { ToolLogo } from "./Wizard";

/* ============================ HOME ============================ */
function QuickCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textAlign: "left", cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .15s", background: "var(--bg-surface)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
        e.currentTarget.style.boxShadow = "var(--sh-2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "var(--sh-1)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={20} style={{ color: "var(--primary)" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>{desc}</div>
      </div>
      <Icon name="arrowRight" size={18} style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

export function Home({
  composerStyle = "elevated",
  onSubmit,
  onNavigate,
  draft,
  setDraft,
  setMode,
  backendUrl,
  accessToken,
  blocked,
}: {
  composerStyle?: "elevated" | "bordered" | "pill";
  onSubmit: (text: string, modeOverride?: string, documentIds?: string[]) => void;
  onNavigate: (r: string) => void;
  draft: string;
  setDraft: (v: string) => void;
  mode?: string;
  setMode: (m: string) => void;
  jurisdiction?: string;
  setJurisdiction?: (j: string) => void;
  backendUrl?: string;
  accessToken?: string;
  blocked?: boolean;
}) {
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 28px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ padding: "60px 0 40px" }}>
          {/* Greeting */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 8px", borderRadius: "var(--r-pill)", background: "var(--grad-aurora-soft)", border: "1px solid var(--border)", marginBottom: 20 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center" }}>
                <Icon name="sparkles" size={12} style={{ color: "#fff" }} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Verificado contra fuentes oficiales</span>
            </div>
            <h1 style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 650, letterSpacing: "-0.025em", margin: 0 }}>
              ¿Qué documento o consulta
              <br />
              legal trabajamos <span className="gradient-text">hoy</span>?
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "12px 0 0" }}>Redacta, verifica normas y jurisprudencia, y reutiliza tus documentos.</p>
          </div>

          {/* Composer */}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={(docIds) => onSubmit(draft, undefined, docIds)}
            style={composerStyle}
            autoFocus
            backendUrl={backendUrl}
            accessToken={accessToken}
            blocked={blocked}
            placeholder="Ej. Redacta una demanda ejecutiva por un pagaré de $50.000.000…"
          />

          {/* Suggestions */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 18 }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => {
                  setMode(s.mode);
                  onSubmit(s.label, s.mode);
                }}
              >
                <Icon name={s.icon} size={15} style={{ color: "var(--primary)" }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Quick access */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 34 }}>
            <QuickCard icon="book" title="Reusar de mi biblioteca" desc="Parte de un documento existente" onClick={() => onNavigate("library")} />
            <QuickCard icon="template" title="Plantillas de la firma" desc="Patrones compartidos y verificados" onClick={() => onNavigate("templates")} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ LIBRARY ============================ */
function DocThumb({ accent, type }: { accent: string; type: string }) {
  return (
    <div style={{ height: 138, background: "var(--bg-elevated-2)", borderBottom: "1px solid var(--border)", position: "relative", overflow: "hidden", display: "grid", placeItems: "center" }}>
      <div style={{ width: 108, background: "#fff", borderRadius: 4, boxShadow: "var(--sh-2)", padding: "12px 11px 0", transform: "translateY(8px)", border: "1px solid var(--border)" }}>
        <div style={{ height: 5, width: "70%", margin: "0 auto 9px", borderRadius: 2, background: accent, opacity: 0.85 }} />
        {[100, 92, 96, 70, 88, 94, 60].map((w, i) => (
          <div key={i} style={{ height: 3, width: w + "%", margin: "0 0 5px", borderRadius: 2, background: "var(--border-strong)" }} />
        ))}
      </div>
      <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10.5, fontWeight: 700, color: accent, background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 999 }}>{type}</span>
    </div>
  );
}

function DocCard({ it, onReuse }: { it: LibraryItem; onReuse: () => void }) {
  return (
    <div
      className="card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow .15s, transform .15s", cursor: "default" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--sh-2)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--sh-1)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <DocThumb accent={it.accent} type={it.type} />
      <div style={{ padding: "13px 15px 15px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontWeight: 600, fontSize: 14.5, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px" }}>v{it.version}</span>
          {it.verified && (
            <Tooltip content="Contiene citas verificadas contra fuentes oficiales" width={230}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--grad-gold)", boxShadow: "0 0 0 3px var(--gold-soft)" }} />
            </Tooltip>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{it.subtitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11.5, color: "var(--text-muted)" }}>
          <Icon name="refresh" size={13} /> Usado {it.used} veces
          {it.shared && (
            <>
              <span>·</span>
              <Icon name="building" size={13} /> Firma
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onReuse}>
            <Icon name="arrowRight" size={15} />
            Reusar
          </button>
          <button className="btn btn-secondary btn-sm btn-icon">
            <Icon name="eye" size={16} />
          </button>
          <button className="btn btn-secondary btn-sm btn-icon">
            <Icon name="more" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Library({
  initialTab,
  onReuse,
  docs,
  templates,
}: {
  initialTab: string;
  onReuse: (it: LibraryItem) => void;
  docs?: LibraryItem[];        // F4: documentos reales del org (/api/artifacts); si vacío, usa mock
  templates?: LibraryItem[];   // F4: patrones reales (/api/patrones); si vacío, usa mock
}) {
  const [tab, setTab] = useState(initialTab === "templates" ? "Plantillas" : "Mis documentos");
  const [q, setQ] = useState("");

  const tabs = ["Mis documentos", "Plantillas", "Compartidos"];
  // Solo datos reales del usuario/org (sin mock).
  const realDocs = docs || [];
  const realTemplates = templates || [];
  const items =
    tab === "Plantillas" ? realTemplates : tab === "Compartidos" ? realTemplates.filter((t) => t.shared) : realDocs;
  const filtered = items.filter((it) => (it.title + it.subtitle).toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 36px 60px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
          <div>
            <h1 className="t-h1" style={{ margin: 0 }}>Biblioteca</h1>
            <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: 14.5 }}>Reutiliza documentos y plantillas verificadas de la firma.</p>
          </div>
          <button className="btn btn-primary">
            <Icon name="plus" size={17} stroke={2.2} />
            Nuevo documento
          </button>
        </div>

        {/* Tabs + search */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated-2)", padding: 4, borderRadius: "var(--r-pill)" }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ border: "none", height: 34, padding: "0 16px", borderRadius: "var(--r-pill)", fontSize: 13.5, fontWeight: 600, background: tab === t ? "var(--bg-surface)" : "transparent", color: tab === t ? "var(--primary)" : "var(--text-secondary)", boxShadow: tab === t ? "var(--sh-1)" : "none" }}>
                {t}
              </button>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)", background: "var(--bg-surface)", minWidth: 220 }}>
            <Icon name="search" size={16} style={{ color: "var(--text-muted)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar documentos…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, flex: 1, color: "var(--text)" }} />
          </div>
          <button className="btn btn-secondary btn-sm" style={{ height: 38 }}>
            <Icon name="filter" size={15} />
            Tipo
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bg-elevated-2)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
              <Icon name={tab === "Plantillas" ? "template" : "book"} size={24} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
              {tab === "Plantillas" ? "Aún no tienes plantillas" : "Aún no tienes documentos"}
            </div>
            <div style={{ fontSize: 13.5 }}>
              {tab === "Plantillas" ? "Cada documento que generes se guarda como plantilla reutilizable." : "Genera tu primer documento desde el inicio y aparecerá aquí."}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))", gap: 18 }}>
            {filtered.map((it) => (
              <DocCard key={it.id} it={it} onReuse={() => onReuse(it)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ SETTINGS ============================ */
function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 22, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        <Icon name={icon} size={18} style={{ color: "var(--primary)" }} />
        <h2 style={{ fontSize: 16, fontWeight: 650, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: hint ? 2 : 8 }}>{label}</div>
      {hint && <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 9 }}>{hint}</div>}
      {children}
    </div>
  );
}
function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: "inline-flex", gap: 4, background: "var(--bg-elevated-2)", padding: 4, borderRadius: "var(--r-md)", flexWrap: "wrap" }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{ border: "none", height: 34, padding: "0 16px", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 600, background: value === o ? "var(--bg-surface)" : "transparent", color: value === o ? "var(--primary)" : "var(--text-secondary)", boxShadow: value === o ? "var(--sh-1)" : "none" }}>
          {o}
        </button>
      ))}
    </div>
  );
}
function SelectBox({ value, options }: { value: string; options: string[] }) {
  const [v, setV] = useState(value);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", maxWidth: 360 }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 42, padding: "0 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-base)", fontSize: 14, color: "var(--text)", textAlign: "left" }}>
        <Icon name="globe" size={16} style={{ color: "var(--text-muted)" }} />
        <span style={{ flex: 1 }}>{v}</span>
        <Icon name="chevronDown" size={16} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div className="fade-up" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-pop)", padding: 6, zIndex: 50 }}>
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setV(o);
                  setOpen(false);
                }}
                style={{ display: "block", width: "100%", padding: "9px 10px", border: "none", borderRadius: 8, background: o === v ? "var(--primary-soft)" : "transparent", color: o === v ? "var(--primary)" : "var(--text)", fontSize: 13.5, textAlign: "left", fontWeight: o === v ? 600 : 450 }}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ProfileData = {
  firm?: { name?: string; plan?: string; members?: number };
  profile?: { entity_name?: string; primary_jurisdiction?: string };
  ui?: { theme?: string; tone?: string; lang?: string };
  usage?: { documentos?: number; verificaciones?: number; input_tokens?: number; output_tokens?: number; estimated_cost_usd?: number };
};
type VerifRow = { id: string; consulta?: string; tipo_fuente?: string; estado?: string; tier?: number; confianza?: number; created_at?: string };
type IntegrationRow = { toolkit: string; label: string; icon: string; provider: string; connected: boolean; enabled: boolean; account_label?: string | null };

export function Settings({
  pushToast,
  onLogout,
  backendUrl,
  accessToken,
  email,
}: {
  pushToast?: (t: string, k?: string) => void;
  onLogout?: () => void;
  backendUrl?: string;
  accessToken?: string;
  email?: string | null;
}) {
  const [tone, setTone] = useState("Formal jurídico");
  const [theme, setTheme] = useState("Claro");
  const [lang, setLang] = useState("Español");
  const [data, setData] = useState<ProfileData | null>(null);
  const [verifs, setVerifs] = useState<VerifRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [intBusy, setIntBusy] = useState<string | null>(null);

  // F5 — perfil + uso reales (/api/profile) y auditoría (/api/verificaciones). Aditivo; si falla, usa defaults.
  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    let cancel = false;
    const auth = { Authorization: `Bearer ${accessToken}` };
    fetch(`${backendUrl}/api/profile`, { headers: auth })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancel || !d) return;
        setData(d);
        if (d.ui?.theme) setTheme(d.ui.theme);
        if (d.ui?.tone) setTone(d.ui.tone);
        if (d.ui?.lang) setLang(d.ui.lang);
      })
      .catch(() => {});
    fetch(`${backendUrl}/api/verificaciones?limit=40`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!cancel && Array.isArray(rows)) setVerifs(rows);
      })
      .catch(() => {});
    fetch(`${backendUrl}/api/integrations`, { headers: auth })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && d && Array.isArray(d.available)) setIntegrations(d.available);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [backendUrl, accessToken]);

  // F6.4 — Integraciones (Composio). connect abre el OAuth gestionado; al cerrar, sincroniza.
  const intHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
  async function syncIntegrations() {
    try {
      const r = await fetch(`${backendUrl}/api/integrations/sync`, { method: "POST", headers: intHeaders });
      const d = await r.json();
      if (d && Array.isArray(d.available)) setIntegrations(d.available);
    } catch {
      /* ignore */
    }
  }
  async function connectTool(toolkit: string) {
    if (!backendUrl || !accessToken) return;
    setIntBusy(toolkit);
    try {
      const r = await fetch(`${backendUrl}/api/integrations/connect`, {
        method: "POST", headers: intHeaders,
        body: JSON.stringify({ toolkit, callback_url: window.location.origin + "/chat?connected=1" }),
      });
      const d = await r.json();
      if (d?.redirect_url) {
        const popup = window.open(d.redirect_url, "_blank", "width=520,height=700");
        const timer = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(timer);
            setIntBusy(null);
            syncIntegrations();
          }
        }, 1000);
      } else {
        setIntBusy(null);
        pushToast && pushToast(d?.error || "No se pudo iniciar la conexión", "info");
      }
    } catch {
      setIntBusy(null);
    }
  }
  async function toggleTool(toolkit: string, enabled: boolean) {
    setIntegrations((xs) => xs.map((x) => (x.toolkit === toolkit ? { ...x, enabled } : x)));
    try {
      await fetch(`${backendUrl}/api/integrations/toggle`, { method: "POST", headers: intHeaders, body: JSON.stringify({ toolkit, enabled }) });
    } catch {
      /* ignore */
    }
  }
  async function disconnectTool(toolkit: string) {
    setIntBusy(toolkit);
    try {
      await fetch(`${backendUrl}/api/integrations/${toolkit}`, { method: "DELETE", headers: intHeaders });
      await syncIntegrations();
    } catch {
      /* ignore */
    }
    setIntBusy(null);
  }

  async function save() {
    if (backendUrl && accessToken) {
      try {
        await fetch(`${backendUrl}/api/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ theme, tone, lang }),
        });
      } catch {
        /* ignore */
      }
    }
    pushToast && pushToast("Cambios guardados", "success");
  }

  const firmName = data?.firm?.name || "Mi firma";
  const planLabel = data?.firm?.plan ? `Plan ${data.firm.plan}` : "Plan Firma";
  const members = data?.firm?.members ?? 1;
  const u = data?.usage;

  return (
    <div style={{ height: "100%", maxHeight: "100dvh", overflow: "auto" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 36px 60px" }}>
        <h1 className="t-h1" style={{ margin: "0 0 4px" }}>Perfil de la firma</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 28px", fontSize: 14.5 }}>Configura el contexto que Juridica usa al redactar y verificar.</p>

        {/* Firm header card */}
        <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--aurora)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 6px 18px -6px rgba(91,77,227,0.5)" }}>
            <Icon name="building" size={28} style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 650 }}>{firmName}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              {(data?.profile?.primary_jurisdiction || "Colombia")} · {members} {members === 1 ? "miembro" : "miembros"} · {planLabel}
            </div>
          </div>
          <button className="btn btn-secondary">
            <Icon name="pencil" size={15} />
            Editar
          </button>
        </div>

        <Section title="Jurisdicción y redacción" icon="scale">
          <Field label="Jurisdicción principal" hint="Define las fuentes oficiales que se consultan por defecto.">
            <SelectBox value="Colombia · Bogotá D.C." options={["Colombia · Bogotá D.C.", "Colombia · Nacional", "Antioquia", "Valle del Cauca"]} />
          </Field>
          <Field label="Tono de los documentos" hint="Estilo de redacción aplicado a los borradores.">
            <Segmented value={tone} onChange={setTone} options={["Formal jurídico", "Claro y directo", "Conciliador"]} />
          </Field>
          <Field label="Membrete / plantilla base" hint="Documento de referencia (.docx) con el estilo del bufete.">
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-base)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}>
                <Icon name="fileText" size={17} style={{ color: "var(--primary)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>membrete-restrepo-2026.docx</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Subido el 12 may 2026 · 84 KB</div>
              </div>
              <button className="btn btn-secondary btn-sm">
                <Icon name="upload" size={15} />
                Reemplazar
              </button>
            </div>
          </Field>
        </Section>

        <Section title="Equipo" icon="user">
          {/* Datos reales: el usuario actual (admin). Sin nombres mock. */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: members > 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--aurora)", color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600 }}>
              {(email || "T").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email || "Tu cuenta"}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Administrador</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "var(--primary-soft)", padding: "3px 9px", borderRadius: 999 }}>TÚ</span>
          </div>
          {members > 1 && (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "10px 0 0" }}>
              y {members - 1} {members - 1 === 1 ? "miembro más" : "miembros más"} en tu organización.
            </div>
          )}
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={() => pushToast && pushToast("Invitaciones próximamente", "info")}>
            <Icon name="plus" size={15} />
            Invitar miembro
          </button>
        </Section>

        <Section title="Apariencia e idioma" icon="settings">
          <Field label="Tema" hint="El modo claro premium es el predeterminado.">
            <Segmented value={theme} onChange={setTheme} options={["Claro", "Oscuro", "Sistema"]} />
          </Field>
          <Field label="Idioma">
            <Segmented value={lang} onChange={setLang} options={["Español", "English"]} />
          </Field>
        </Section>

        <Section title="Integraciones" icon="command">
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "-6px 0 16px" }}>
            Conecta tus herramientas para que el asistente pueda usarlas (leer tu calendario, enviar correos, buscar en tu Drive…). Cada cuenta es privada de tu usuario.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {integrations.map((it) => {
              const busy = intBusy === it.toolkit;
              return (
                <div key={it.toolkit} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "13px 14px", background: "var(--bg-base)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ToolLogo slug={it.toolkit} size={34} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</div>
                      <div style={{ fontSize: 11.5, color: it.connected ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: it.connected ? "var(--success)" : "var(--border-strong)" }} />
                        {it.connected ? (it.account_label || "Conectado") : "Sin conectar"}
                      </div>
                    </div>
                  </div>
                  {it.connected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer", flex: 1 }}>
                        <input type="checkbox" checked={it.enabled} onChange={(e) => toggleTool(it.toolkit, e.target.checked)} />
                        Habilitada para el agente
                      </label>
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => disconnectTool(it.toolkit)} title="Desconectar">
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => connectTool(it.toolkit)} style={{ width: "100%" }}>
                      <Icon name={busy ? "sparkles" : "plus"} size={14} style={busy ? { animation: "spin 2s linear infinite" } : undefined} />
                      {busy ? "Conectando…" : "Conectar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {integrations.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Cargando integraciones…</div>
          )}
        </Section>

        <Section title="Uso" icon="layers">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {(
              [
                ["Documentos generados", String(u?.documentos ?? 0), "acumulado"],
                ["Verificaciones", String(u?.verificaciones ?? 0), "contra fuentes oficiales"],
                ["Costo estimado", u ? `$${(u.estimated_cost_usd ?? 0).toFixed(2)}` : "$0.00", "USD · tokens"],
              ] as [string, string, string][]
            ).map(([l, v, s], i) => (
              <div key={i} style={{ padding: "16px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-base)" }}>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{l}</div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "4px 0 2px" }}>{v}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{s}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Auditoría de fuentes" icon="shieldCheck">
          {verifs.length === 0 ? (
            <div style={{ padding: 18, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Aún no hay verificaciones registradas. Cada norma o jurisprudencia citada se verifica contra fuentes oficiales y queda aquí.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {verifs.map((v, i) => {
                const est = (v.estado || "").toLowerCase();
                const color = est.includes("vigente") || est.includes("exequible")
                  ? "var(--success)"
                  : est.includes("derog") || est.includes("inexequible")
                  ? "var(--danger, #DC2626)"
                  : "var(--gold, #C98A14)";
                return (
                  <div key={v.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < verifs.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.consulta || "Consulta"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {(v.tipo_fuente || "fuente")} {v.tier != null ? `· tier ${v.tier}` : ""} {v.created_at ? `· ${new Date(v.created_at).toLocaleDateString("es-CO")}` : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.03em", flexShrink: 0 }}>{v.estado || "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          <button className="btn btn-primary" onClick={save}>
            Guardar cambios
          </button>
          <button className="btn btn-ghost" onClick={onLogout}>
            <Icon name="logout" size={16} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

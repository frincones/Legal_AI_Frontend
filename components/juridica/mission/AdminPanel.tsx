/* Panel admin (solo emails admin) — gestiona créditos por org y ve consumo/costo. */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type AdminFeedback, type AdminReferrals, type WaitlistItem, type AnalyticsData, type AnalyticsEvent, type AnalyticsSession, type AnalyticsTop, type AnalyticsKN, type GuestMessage, type AuditOrg, type AuditSession, type AuditMessage, type AuditPart, type WAFeedbackItem, type WAConversation, type WAMessage, type EmailFeedbackItem, type RetentionData, type RetentionUser, type RetentionCohort, type RetentionGrowth, type CampaignKPI, type CampaignRecipient, type Tenant, type TenantDetail, type Subscription, type UsageCosts, type CostsDashboard, type PlanCat, type SupportTicket, type Refund, type Payment } from "./data";
import { PlansFunnelTab } from "./PlansFunnelTab";
import { VSLTab } from "./VSLTab";
import { AttributionTab } from "./AttributionTab";
import { InstagramTab } from "./InstagramTab";

type Org = { id: string; name: string | null; balance: number | null; cap: number | null; members: number; cost_usd: number; actions: number; last_activity: string | null };

// Admin consolidado (Fase 0): 8 grupos → sub-pestañas. Reusa todos los componentes existentes;
// las secciones nuevas (Fase 1) muestran un placeholder por ahora.
const ADMIN_GROUPS: { key: string; label: string; subs: [string, string][] }[] = [
  { key: "resumen", label: "Resumen", subs: [["dashboard", "Dashboard"]] },
  { key: "clientes", label: "Clientes", subs: [["tenants", "Tenants"], ["usuarios", "Usuarios"], ["creditos", "Créditos"]] },
  { key: "ingresos", label: "Ingresos & Cobros", subs: [["costos", "Costos"], ["suscripciones", "Suscripciones"], ["cartera", "Cartera"], ["devoluciones", "Devoluciones"]] },
  { key: "planes", label: "Planes & Acceso", subs: [["planes", "Planes"], ["uso_costos", "Uso & Costos"]] },
  { key: "producto", label: "Producto", subs: [["analytics", "Analytics"], ["embudo_planes", "Embudo de Planes"], ["vsl", "VSL"], ["retencion", "Retención"], ["conversaciones", "Conversaciones"]] },
  { key: "crecimiento", label: "Crecimiento", subs: [["atribucion", "Atribución"], ["waitlist", "Waitlist"], ["referidos", "Referidos"], ["campanas", "Campañas"], ["instagram", "Instagram"]] },
  { key: "soporte", label: "Soporte", subs: [["feedback", "Feedback"], ["whatsapp", "WhatsApp"], ["email", "Email"], ["tickets", "Tickets"]] },
  { key: "sistema", label: "Sistema", subs: [["auditoria", "Auditoría"], ["config", "Config"]] },
];
const ADMIN_DESC: Record<string, string> = {
  costos: "FinOps: gasto casi en línea por proveedor/modelo, proyección mensual, margen vs MRR y alertas.",
  creditos: "Consumo, costo estimado y gestión de saldo de cada org.",
  feedback: "Feedback de usuarios (BETA).",
  waitlist: "Lista de espera: autoriza el acceso individual o masivo.",
  analytics: "Comportamiento en la landing + guest: embudo, eventos y sesiones.",
  retencion: "Retención real: DAU/WAU/MAU, cohortes, quién vuelve y qué le pide al agente.",
  conversaciones: "Auditoría de conversaciones (solo planes free/trial).",
  whatsapp: "Feedback y conversaciones por WhatsApp.",
  email: "Feedback recolectado por la campaña de correo.",
  campanas: "Campañas activas (email + WhatsApp): entrega, apertura, clic, entra.",
  referidos: "Programa de referidos (growth loop).",
  tickets: "Tickets de soporte del formulario de /ayuda.",
  devoluciones: "Reembolsos: pagos reembolsables y devoluciones ejecutadas vía Paddle.",
};
const SOON_TITLES: Record<string, string> = {
  dashboard: "Dashboard general", tenants: "Gestión de tenants (orgs)", usuarios: "Gestión de usuarios",
  suscripciones: "Suscripciones (Paddle)", cartera: "Cartera / Dunning",
  planes: "Planes & entitlements", uso_costos: "Uso & Costos (control de gasto)",
  auditoria: "Auditoría de acciones", config: "Configuración / feature flags",
};

function Soon({ tab }: { tab: string }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--primary-soft)", display: "inline-grid", placeItems: "center" }}>
        <Icon name="sparkles" size={22} style={{ color: "var(--primary)" }} />
      </span>
      <div style={{ fontSize: 16, fontWeight: 650, color: "var(--text)", marginTop: 12 }}>{SOON_TITLES[tab] || "Sección"}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>En construcción — Fase 1</div>
    </div>
  );
}

export function AdminPanel({
  backendUrl, accessToken, pushToast,
}: {
  backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void;
}) {
  const [group, setGroup] = useState("clientes");
  const [tab, setTab] = useState<string>("creditos");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.adminOrgs(backendUrl, accessToken).then((d) => { setOrgs(d.orgs || []); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  async function act(org: Org, action: string) {
    let amount: number | undefined;
    if (action === "grant" || action === "set") {
      const v = window.prompt(action === "grant" ? "¿Cuántos créditos otorgar?" : "Fijar saldo en:", action === "grant" ? "100" : String(org.balance ?? 0));
      if (v == null) return;
      amount = parseInt(v, 10);
      if (Number.isNaN(amount)) { pushToast("Cantidad inválida", "info"); return; }
    }
    const r = await api.adminSetCredits(backendUrl, accessToken, org.id, action, amount);
    if (r?.ok) { pushToast(`Saldo actualizado: ${r.balance}`, "success"); load(); }
    else pushToast("No se pudo actualizar", "info");
  }

  const fmtDate = (s: string | null) => { try { return s ? new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : "—"; } catch { return "—"; } };

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div className="app-pad" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="shieldCheck" size={24} style={{ color: "#fff" }} /></span>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 25, fontWeight: 650, margin: 0 }}>Admin</h1>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 3 }}>{ADMIN_DESC[tab] || (SOON_TITLES[tab] ? SOON_TITLES[tab] + " — próximamente." : "Gestión de la plataforma.")}</div>
          </div>
          {tab === "creditos" && <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>}
        </div>

        {/* Grupos (nivel 1) */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {ADMIN_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => { setGroup(g.key); setTab(g.subs[0][0]); }}
              style={{ border: `1px solid ${group === g.key ? "var(--primary)" : "var(--border)"}`, background: group === g.key ? "var(--primary-soft)" : "transparent", color: group === g.key ? "var(--primary)" : "var(--text-secondary)", padding: "6px 13px", fontSize: 13, fontWeight: 650, cursor: "pointer", borderRadius: "var(--r-pill)" }}
            >
              {g.label}
            </button>
          ))}
        </div>
        {/* Sub-pestañas (nivel 2) del grupo activo */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          {(ADMIN_GROUPS.find((g) => g.key === group) || ADMIN_GROUPS[0]).subs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ border: "none", background: "transparent", padding: "8px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: tab === id ? "var(--primary)" : "var(--text-muted)", borderBottom: tab === id ? "2px solid var(--primary)" : "2px solid transparent", marginBottom: -1 }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "feedback" ? (
          <FeedbackTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "referidos" ? (
          <ReferralsTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "waitlist" ? (
          <WaitlistTab backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />
        ) : tab === "analytics" ? (
          <AnalyticsTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "embudo_planes" ? (
          <PlansFunnelTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "vsl" ? (
          <VSLTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "atribucion" ? (
          <AttributionTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "retencion" ? (
          <RetentionTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "conversaciones" ? (
          <AuditTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "whatsapp" ? (
          <WhatsAppTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "email" ? (
          <EmailTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "instagram" ? (
          <InstagramTab backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />
        ) : tab === "campanas" ? (
          <CampaignsTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "tickets" ? (
          <TicketsTab backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />
        ) : tab === "devoluciones" ? (
          <DevolucionesTab backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />
        ) : tab === "tenants" ? (
          <TenantsTab backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />
        ) : tab === "suscripciones" ? (
          <SubscriptionsTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "costos" ? (
          <CostsTab backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />
        ) : tab === "uso_costos" ? (
          <UsageCostsTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "planes" ? (
          <PlanesTab backendUrl={backendUrl} accessToken={accessToken} />
        ) : tab === "creditos" ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated-2)" }}>
                {["Organización", "Miembros", "Saldo", "Acciones", "Costo (USD)", "Última act.", "Gestionar"].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 1 && i <= 4 ? "right" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{o.name || o.id.slice(0, 8)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{o.members}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: (o.balance ?? 0) <= 0 ? "var(--danger, #DC2626)" : "var(--text)", fontWeight: 600 }}>{o.balance ?? "—"} / {o.cap ?? "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{o.actions}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>${o.cost_usd.toFixed(3)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{fmtDate(o.last_activity)}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => act(o, "grant")}>Otorgar</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => act(o, "set")}>Fijar</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => act(o, "reset")}>Reset</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && orgs.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin organizaciones.</td></tr>}
              {loading && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
        ) : (
          <Soon tab={tab} />
        )}
      </div>
    </div>
  );
}

/* ---------- KPI card reutilizable ---------- */
function Kpi({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="card" style={{ flex: "1 1 130px", minWidth: 130, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );
}

const _fmtDate = (s: string | null | undefined) => { try { return s ? new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "2-digit" }) : "—"; } catch { return "—"; } };
const _statusChip = (st: string | null | undefined) => {
  const s = (st || "").toLowerCase();
  const meta = s === "active" || s === "trialing" ? { bg: "var(--success-soft)", c: "var(--success)" }
    : s === "past_due" ? { bg: "var(--warning-soft)", c: "var(--warning)" }
    : s === "canceled" || s === "paused" ? { bg: "rgba(220,38,38,.12)", c: "var(--danger, #DC2626)" }
    : { bg: "var(--bg-elevated-2)", c: "var(--text-muted)" };
  return <span style={{ fontSize: 11.5, fontWeight: 600, background: meta.bg, color: meta.c, borderRadius: "var(--r-pill)", padding: "3px 9px", whiteSpace: "nowrap" }}>{st || "—"}</span>;
};

/* ---------- Pestaña Tenants (orgs: plan, estado, uso, suspender/plan) ---------- */
function TenantsTab({ backendUrl, accessToken, pushToast }: { backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void }) {
  const [data, setData] = useState<{ tenants: Tenant[]; mrr_usd: number; mrr_gross_usd: number; total: number; paying: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Tenant | null>(null);
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [dLoading, setDLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.adminTenants(backendUrl, accessToken).then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const openDetail = (t: Tenant) => {
    setOpen(t); setDetail(null); setDLoading(true);
    api.adminTenantDetail(backendUrl, accessToken, t.id).then((d) => { setDetail(d); setDLoading(false); });
  };

  const toggleSuspend = async (t: Tenant) => {
    const r = await api.adminSuspendTenant(backendUrl, accessToken, t.id, !t.suspended);
    if (r?.ok) { pushToast(r.suspended ? "Tenant suspendido" : "Tenant reactivado", "success"); load(); setOpen(null); }
    else pushToast("No se pudo actualizar", "info");
  };
  const changePlan = async (t: Tenant) => {
    const v = window.prompt("Nuevo plan (free / estandar / pro / firma):", t.plan);
    if (!v) return;
    const r = await api.adminSetTenantPlan(backendUrl, accessToken, t.id, v.trim());
    if (r?.ok) { pushToast(`Plan → ${r.plan}`, "success"); load(); setOpen(null); }
    else pushToast("No se pudo cambiar el plan", "info");
  };

  const rows = data?.tenants || [];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi label="Tenants" value={data?.total ?? 0} />
        <Kpi label="De pago" value={data?.paying ?? 0} color="var(--success)" />
        <Kpi label="MRR neto" value={`$${(data?.mrr_usd ?? 0).toFixed(0)}`} color="var(--primary)" />
        <Kpi label="MRR bruto" value={`$${(data?.mrr_gross_usd ?? 0).toFixed(0)}`} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Neto = lo que recibimos tras IVA (19%) + fee de Paddle (5% + $0.50). Bruto = lo que paga el cliente.</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Organización", "Plan", "Estado", "Miembros", "Neto/mes", "Costo (USD)", "Margen", "Últ. act.", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 3 && i <= 6 ? "right" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} onClick={() => openDetail(t)} style={{ cursor: "pointer", opacity: t.suspended ? 0.55 : 1 }}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{t.name || t.id.slice(0, 8)}{t.suspended && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--danger, #DC2626)" }}>⛔</span>}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{t.plan_name || t.plan}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{t.plan === "free" ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span> : _statusChip(t.sub_status)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{t.members}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text)" }} title={t.price_usd ? `Bruto $${t.price_usd}` : undefined}>{t.net_usd == null ? "—" : `$${t.net_usd.toFixed(2)}`}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>${t.cost_usd.toFixed(3)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: t.margin_usd == null ? "var(--text-muted)" : t.margin_usd >= 0 ? "var(--success)" : "var(--danger, #DC2626)", fontWeight: 600 }}>{t.margin_usd == null ? "—" : `$${t.margin_usd.toFixed(2)}`}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{_fmtDate(t.last_activity)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, whiteSpace: "nowrap" }}>Ver →</span></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin tenants.</td></tr>}
              {loading && <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 720, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 500, maxWidth: "96vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{open.name || open.id.slice(0, 8)}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{open.plan_name || open.plan} · {open.members} miembro(s)</div>
              </div>
              <button onClick={() => setOpen(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              {dLoading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando…</div>}
              {detail && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => changePlan(open)}>Cambiar plan</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleSuspend(open)} style={{ color: open.suspended ? "var(--success)" : "var(--danger, #DC2626)" }}>{open.suspended ? "Reactivar" : "Suspender"}</button>
                  </div>
                  {/* Ingresos (desglose bruto → IVA → fee → neto) */}
                  {detail.revenue && (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>INGRESOS / MES <span style={{ fontWeight: 500, textTransform: "none" }}>({detail.revenue.source})</span></div>
                      {[["Cliente paga (bruto)", detail.revenue.gross_usd, "var(--text)"], ["IVA (19%)", detail.revenue.tax_usd != null ? -detail.revenue.tax_usd : null, "var(--text-muted)"], ["Fee Paddle", detail.revenue.fee_usd != null ? -detail.revenue.fee_usd : null, "var(--text-muted)"]].map(([lbl, val, col], i) => (
                        <div key={i} style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ color: "var(--text-secondary)" }}>{lbl as string}</span><span style={{ color: col as string }}>{val == null ? "—" : `${(val as number) < 0 ? "−" : ""}$${Math.abs(val as number).toFixed(2)}`}</span></div>
                      ))}
                      <div style={{ fontSize: 13.5, display: "flex", justifyContent: "space-between", padding: "6px 0 3px", borderTop: "1px solid var(--border)", marginTop: 4, fontWeight: 700 }}><span>Neto que recibimos</span><span style={{ color: "var(--success)" }}>${(detail.revenue.net_usd ?? 0).toFixed(2)}</span></div>
                      <div style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ color: "var(--text-secondary)" }}>Margen (neto − COGS)</span><span style={{ fontWeight: 700, color: (detail.usage.margin_usd ?? 0) >= 0 ? "var(--success)" : "var(--danger, #DC2626)" }}>{detail.usage.margin_usd == null ? "—" : `$${detail.usage.margin_usd.toFixed(2)}`}</span></div>
                    </div>
                  )}
                  {/* Uso rolling */}
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>USO (ventanas rolling)</div>
                    <UsageBar label="Sesión (5h)" n={detail.usage.session_5h} d={detail.usage.limit_session} />
                    <UsageBar label="Semanal (7d)" n={detail.usage.weekly_7d} d={detail.usage.limit_weekly} />
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>Costo total: <b style={{ color: "var(--text)" }}>${detail.usage.total_cost_usd.toFixed(3)}</b></div>
                  </div>
                  {/* Suscripción */}
                  {detail.subscription && (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>SUSCRIPCIÓN</div>
                      <div style={{ fontSize: 13 }}>Estado: {_statusChip(String(detail.subscription.status || ""))}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>Próximo cobro: {_fmtDate(String(detail.subscription.current_period_end || ""))}</div>
                    </div>
                  )}
                  {/* Miembros */}
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>MIEMBROS</div>
                    {detail.members.map((m) => (
                      <div key={m.user_id} style={{ fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>{m.email || m.user_id.slice(0, 8)} <span style={{ color: "var(--text-muted)", fontSize: 12 }}>· {m.role}</span></div>
                    ))}
                  </div>
                  {/* Costo por modelo */}
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>COSTO POR MODELO</div>
                    {Object.entries(detail.usage.by_model).map(([m, v]) => (
                      <div key={m} style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ color: "var(--text-secondary)" }}>{m}</span><span>{v.calls} · ${v.cost_usd.toFixed(3)}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({ label, n, d }: { label: string; n: number; d: number | null }) {
  const w = d && d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0;
  const color = w >= 90 ? "var(--danger, #DC2626)" : w >= 70 ? "var(--warning)" : "var(--primary)";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}><span style={{ color: "var(--text-secondary)" }}>{label}</span><span style={{ color: "var(--text-muted)" }}>{n}{d ? ` / ${d}` : ""}</span></div>
      <div style={{ height: 6, borderRadius: 4, background: "var(--bg-elevated-2)", overflow: "hidden" }}><div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 4 }} /></div>
    </div>
  );
}

/* ---------- Pestaña Suscripciones ---------- */
function SubscriptionsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<{ subscriptions: Subscription[]; by_status: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); api.adminSubscriptions(backendUrl, accessToken).then((d) => { setData(d); setLoading(false); }); }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);
  const subs = data?.subscriptions || [];
  const bs = data?.by_status || {};
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi label="Activas" value={(bs["active"] || 0) + (bs["trialing"] || 0)} color="var(--success)" />
        <Kpi label="En mora" value={bs["past_due"] || 0} color="var(--warning)" />
        <Kpi label="Canceladas" value={(bs["canceled"] || 0) + (bs["paused"] || 0)} color="var(--danger, #DC2626)" />
        <Kpi label="Total" value={subs.length} />
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Organización", "Plan", "Estado", "Próximo cobro", "Cancela al final", "Paddle ID"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{s.org_name || s.org_id.slice(0, 8)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{s.plan}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{_statusChip(s.status)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{_fmtDate(s.current_period_end)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{s.cancel_at_period_end ? "Sí" : "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{s.paddle_subscription_id || "—"}</td>
                </tr>
              ))}
              {!loading && subs.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin suscripciones todavía. (Paddle aún no cablea cobros.)</td></tr>}
              {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pestaña Uso & Costos (control de gasto, estilo Claude) ---------- */
function UsageCostsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<UsageCosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const load = useCallback(() => { setLoading(true); api.adminUsageCosts(backendUrl, accessToken, days).then((d) => { setData(d); setLoading(false); }); }, [backendUrl, accessToken, days]);
  useEffect(() => { load(); }, [load]);
  const byModel = data ? Object.entries(data.by_model).sort((a, b) => b[1].cost_usd - a[1].cost_usd) : [];
  const maxDay = data ? Math.max(1, ...data.by_day.map((x) => x.cost_usd)) : 1;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
          {[7, 30, 90].map((d) => <option key={d} value={d}>Últimos {d} días</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <Kpi label="MRR neto" value={`$${(data?.mrr_usd ?? 0).toFixed(0)}`} color="var(--primary)" />
        <Kpi label="MRR bruto" value={`$${(data?.mrr_gross_usd ?? 0).toFixed(0)}`} />
        <Kpi label="COGS / mes ≈" value={`$${(data?.cogs_month_usd ?? 0).toFixed(2)}`} color="var(--danger, #DC2626)" />
        <Kpi label="Margen ≈" value={`$${(data?.gross_margin_usd ?? 0).toFixed(0)}`} color={(data?.gross_margin_usd ?? 0) >= 0 ? "var(--success)" : "var(--danger, #DC2626)"} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>MRR neto = tras IVA + fee de Paddle. Margen ≈ MRR neto − COGS mensualizado. COGS total del período: <b>${(data?.total_cost_usd ?? 0).toFixed(2)}</b>.</div>
      {/* Gasto por día */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>GASTO POR DÍA</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}>
          {(data?.by_day || []).map((x) => (
            <div key={x.day} title={`${x.day}: $${x.cost_usd.toFixed(3)}`} style={{ flex: 1, minWidth: 3, height: `${Math.max(2, (x.cost_usd / maxDay) * 100)}%`, background: "var(--primary)", borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
          ))}
          {(!data || data.by_day.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos.</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Por modelo */}
        <div className="card" style={{ flex: "1 1 320px", padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>COSTO POR MODELO</div>
          {byModel.map(([m, v]) => (
            <div key={m} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}><span style={{ color: "var(--text-secondary)" }}>{m}</span><span>{v.calls} llamadas · <b>${v.cost_usd.toFixed(3)}</b></span></div>
          ))}
          {byModel.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos.</div>}
        </div>
        {/* Top orgs */}
        <div className="card" style={{ flex: "1 1 320px", padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>TOP ORGS POR COSTO</div>
          {(data?.top_orgs || []).map((o) => (
            <div key={o.org_id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}><span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{o.name || o.org_id.slice(0, 8)}</span><span><b>${o.cost_usd.toFixed(3)}</b></span></div>
          ))}
          {(!data || data.top_orgs.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos.</div>}
        </div>
      </div>
      {loading && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>Cargando…</div>}
    </div>
  );
}

/* ---------- Pestaña Costos (FinOps — observabilidad casi en línea) ---------- */
const PROVIDER_COLOR: Record<string, string> = {
  anthropic: "#7B3DF5", openai: "#10A37F", railway: "#8A63D2", vercel: "#111827",
  supabase: "#3ECF8E", groq: "#F55036", e2b: "#FF8A00", firecrawl: "#E8590C",
  brave: "#FB542B", resend: "#5B6EF5", whatsapp: "#25D366", supadata: "#0EA5E9", composio: "#6366F1",
};

function CostsTab({ backendUrl, accessToken, pushToast }: { backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void }) {
  const [data, setData] = useState<CostsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setLoading(true); api.adminCosts(backendUrl, accessToken, days).then((d) => { setData(d); setLoading(false); }); }, [backendUrl, accessToken, days]);
  useEffect(() => { load(); }, [load]);

  async function collectNow() {
    setBusy(true);
    const r = await api.adminCostCollect(backendUrl, accessToken);
    setBusy(false);
    if (r.error) pushToast(`Error al recolectar: ${r.error}`, "warning");
    else { pushToast(`Rollup listo · hoy $${(r.total_usd ?? 0).toFixed(2)}`, "success"); load(); }
  }
  async function toggleAlert(id: string, enabled: boolean) {
    await api.adminSetCostAlert(backendUrl, accessToken, id, { enabled });
    load();
  }

  const maxDay = data ? Math.max(1, ...data.trend.map((x) => x.usd)) : 1;
  const paidProviders = (data?.by_provider || []).filter((p) => p.source !== "free" && p.usd > 0);
  const freeProviders = data?.free_providers || [];
  const maxProv = Math.max(1, ...paidProviders.map((x) => x.usd));
  const firing = (data?.alerts || []).filter((a) => a.state === "firing");
  const marginNeg = (data?.margin_usd ?? 0) < 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Uso real (Anthropic/OpenAI) + membresías validadas por API (Firecrawl/Railway) · cada minuto
        </div>
        <span style={{ flex: 1 }} />
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
          {[7, 30, 90].map((d) => <option key={d} value={d}>Últimos {d} días</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={collectNow} disabled={busy}><Icon name={busy ? "refresh" : "sparkles"} size={15} style={busy ? { animation: "spin 1s linear infinite" } : {}} />Recolectar ahora</button>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      {firing.length > 0 && (
        <div className="card" style={{ padding: "12px 16px", marginBottom: 14, border: "1px solid var(--danger, #DC2626)", background: "rgba(220,38,38,.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger, #DC2626)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="alert" size={15} />{firing.length} alerta{firing.length > 1 ? "s" : ""} activa{firing.length > 1 ? "s" : ""}: {firing.map((a) => a.name).join(" · ")}
          </div>
        </div>
      )}

      {marginNeg && (
        <div className="card" style={{ padding: "12px 16px", marginBottom: 14, border: "1px solid var(--danger, #DC2626)", background: "rgba(220,38,38,.06)" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--danger, #DC2626)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="alert" size={16} />Estás gastando más de lo que ingresas
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
            Proyección de costo <b>${(data?.projection_usd ?? 0).toFixed(0)}/mes</b> vs MRR neto <b>${(data?.mrr_net_usd ?? 0).toFixed(0)}/mes</b> → pérdida de <b>${Math.abs(data?.margin_usd ?? 0).toFixed(0)}/mes</b>.
          </div>
        </div>
      )}

      {/* KPIs principales */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <Kpi label="Gasto hoy" value={`$${(data?.today_usd ?? 0).toFixed(2)}`} color="var(--primary)" />
        <Kpi label="Mes a la fecha" value={`$${(data?.mtd_usd ?? 0).toFixed(2)}`} />
        <Kpi label="Proyección mes" value={`$${(data?.projection_usd ?? 0).toFixed(0)}`} color="var(--danger, #DC2626)" />
        <Kpi label="MRR neto" value={`$${(data?.mrr_net_usd ?? 0).toFixed(0)}`} color="var(--success)" />
        <Kpi label="Margen ≈" value={`$${(data?.margin_usd ?? 0).toFixed(0)}`} color={(data?.margin_usd ?? 0) >= 0 ? "var(--success)" : "var(--danger, #DC2626)"} />
        <Kpi label="Margen %" value={`${(data?.margin_pct ?? 0).toFixed(0)}%`} color={(data?.margin_pct ?? 0) >= 0 ? "var(--success)" : "var(--danger, #DC2626)"} />
      </div>
      {/* Desglose por tipo de costo */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: "var(--text-secondary)", margin: "8px 0 16px" }}>
        <span>💠 <b>Uso</b> (Anthropic/OpenAI): <b>${(data?.breakdown?.usage ?? 0).toFixed(2)}</b></span>
        <span>📦 <b>Membresías</b> (Railway/Firecrawl/Resend): <b>${(data?.breakdown?.membership ?? 0).toFixed(2)}</b></span>
        <span>🆓 <b>Free tier</b>: $0</span>
        <span style={{ color: "var(--text-muted)" }}>Margen ≈ MRR neto − proyección del costo. Actualiza cada minuto.</span>
      </div>

      {/* Gasto por día */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>GASTO POR DÍA (USD)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}>
          {(data?.trend || []).map((x) => (
            <div key={x.day} title={`${x.day}: $${x.usd.toFixed(3)}`} style={{ flex: 1, minWidth: 3, height: `${Math.max(2, (x.usd / maxDay) * 100)}%`, background: "var(--primary)", borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
          ))}
          {(!data || data.trend.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos aún (el worker está llenando el histórico).</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        {/* Por proveedor */}
        <div className="card" style={{ flex: "1 1 340px", padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>COSTO POR PROVEEDOR (mes)</div>
          {paidProviders.map((p) => {
            const overprov = p.util_pct != null && p.util_pct < 20;
            return (
              <div key={p.provider} style={{ marginBottom: 11 }}>
                <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{p.provider} <span style={{ fontSize: 10, color: p.source === "api" ? "var(--success)" : p.source === "membership" ? "var(--primary)" : "var(--text-secondary)" }}>· {p.source === "api" ? "real" : p.source === "membership" ? "membresía" : "uso"}</span></span>
                  <span><b>${p.usd.toFixed(2)}</b></span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--bg-elevated-2)" }}>
                  <div style={{ height: "100%", width: `${(p.usd / maxProv) * 100}%`, background: PROVIDER_COLOR[p.provider] || "var(--primary)", borderRadius: 3 }} />
                </div>
                {p.util_pct != null && p.allowance != null && (
                  <div style={{ fontSize: 11, color: overprov ? "var(--warning)" : "var(--text-muted)", marginTop: 3 }}>
                    {p.util_pct}% usado · {(p.qty ?? 0).toLocaleString()}/{p.allowance.toLocaleString()} {p.allowance_unit || ""}{overprov ? " · sobredimensionado" : ""}
                  </div>
                )}
              </div>
            );
          })}
          {freeProviders.length > 0 && (
            <div title={freeProviders.join(", ")} style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", padding: "7px 0 0", borderTop: "1px solid var(--border)", marginTop: 4 }}>
              <span style={{ color: "var(--text-muted)" }}>🆓 Free tier · {freeProviders.length} servicios</span>
              <span style={{ color: "var(--text-muted)" }}><b>$0.00</b></span>
            </div>
          )}
          {paidProviders.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos.</div>}
        </div>
        {/* Por modelo Claude */}
        <div className="card" style={{ flex: "1 1 300px", padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>ANTHROPIC — POR MODELO (mes)</div>
          {(data?.by_model || []).map((m) => (
            <div key={m.model} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>{m.model}</span>
              <span><b>${m.usd.toFixed(2)}</b></span>
            </div>
          ))}
          {(!data || data.by_model.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos.</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Top tenants por costo */}
        <div className="card" style={{ flex: "1 1 340px", padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>TOP CLIENTES POR COSTO (30d)</div>
          {(data?.top_tenants || []).map((o) => (
            <div key={o.org_id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210 }}>{o.name} {o.plan && <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>· {o.plan}</span>}</span>
              <span><b>${o.cost_usd.toFixed(2)}</b></span>
            </div>
          ))}
          {(!data || data.top_tenants.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos.</div>}
        </div>
        {/* Alertas */}
        <div className="card" style={{ flex: "1 1 340px", padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>ALERTAS DE GASTO</div>
          {(data?.alerts || []).map((a) => (
            <div key={a.id} style={{ fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name} {a.state === "firing" && <span style={{ color: "var(--danger, #DC2626)", fontWeight: 700 }}>· activa</span>}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{a.provider || "total"} · {a.metric} · umbral ${a.threshold_usd}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => toggleAlert(a.id, !a.enabled)} style={{ color: a.enabled ? "var(--success)" : "var(--text-muted)" }}>{a.enabled ? "Activa" : "Off"}</button>
            </div>
          ))}
          {(!data || data.alerts.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin alertas.</div>}
        </div>
      </div>
      {loading && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>Cargando…</div>}
    </div>
  );
}

/* ---------- Pestaña Planes (catálogo + entitlements) ---------- */
function PlanesTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [plans, setPlans] = useState<PlanCat[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.plansCatalog(backendUrl, accessToken).then((d) => { setPlans(d.plans || []); setLoading(false); }); }, [backendUrl, accessToken]);
  return (
    <div>
      {loading && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando…</div>}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {plans.map((p) => {
          const e = p.entitlements || {};
          return (
            <div key={p.tier} className="card" style={{ flex: "1 1 210px", minWidth: 210, padding: 18, border: p.active ? "1px solid var(--primary)" : "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{p.name}</div>
                <span style={{ fontSize: 11, fontWeight: 600, borderRadius: "var(--r-pill)", padding: "2px 8px", background: p.active ? "var(--success-soft)" : "var(--bg-elevated-2)", color: p.active ? "var(--success)" : "var(--text-muted)" }}>{p.active ? "Activo" : "Próximamente"}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 750, marginTop: 6 }}>{p.price_usd != null ? `$${p.price_usd}` : "—"}<span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{p.price_usd ? " / mes" : ""}</span></div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{p.blurb}</div>
              <div style={{ marginTop: 12, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 4 }}>
                {p.credits != null && <div style={{ color: "var(--text-secondary)" }}>🎁 {p.credits} créditos {p.trial_days ? `· ${p.trial_days} días` : ""}</div>}
                {e.limit_session != null && <div style={{ color: "var(--text-secondary)" }}>⚡ {String(e.limit_session)} / sesión (5h)</div>}
                {e.limit_weekly != null && <div style={{ color: "var(--text-secondary)" }}>📅 {String(e.limit_weekly)} / semana</div>}
                {e.max_members != null && <div style={{ color: "var(--text-secondary)" }}>👥 {String(e.max_members)} usuario(s)</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Pestaña Devoluciones (reembolsos) ---------- */
function refundChip(st: string | null | undefined) {
  const s = (st || "").toLowerCase();
  const meta = s === "approved" ? { bg: "var(--success-soft)", c: "var(--success)" }
    : s === "pending_approval" ? { bg: "var(--warning-soft)", c: "var(--warning)" }
    : s === "rejected" ? { bg: "rgba(220,38,38,.12)", c: "var(--danger, #DC2626)" }
    : { bg: "var(--bg-elevated-2)", c: "var(--text-muted)" };
  const label = s === "approved" ? "Aprobado" : s === "pending_approval" ? "Pendiente" : s === "rejected" ? "Rechazado" : (st || "—");
  return <span style={{ fontSize: 11.5, fontWeight: 600, background: meta.bg, color: meta.c, borderRadius: "var(--r-pill)", padding: "3px 9px", whiteSpace: "nowrap" }}>{label}</span>;
}

function DevolucionesTab({ backendUrl, accessToken, pushToast }: { backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void }) {
  const [data, setData] = useState<{ refunds: Refund[]; payments: Payment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.adminRefunds(backendUrl, accessToken).then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const doRefund = async () => {
    if (!target || !reason.trim()) return;
    setBusy(true);
    const r = await api.adminCreateRefund(backendUrl, accessToken, target.paddle_transaction_id, reason.trim());
    setBusy(false);
    if (r?.ok) { pushToast(`Reembolso ${r.status || "creado"}`, "success"); setTarget(null); setReason(""); load(); }
    else pushToast("No se pudo crear el reembolso", "info");
  };

  const payments = (data?.payments || []).filter((p) => !p.refunded);
  const refunds = data?.refunds || [];
  const fmt = (s: string | null | undefined) => { try { return s ? new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "2-digit" }) : "—"; } catch { return "—"; } };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>El reembolso es <b>total</b> y lo procesa Paddle (en producción queda pendiente de aprobación de Paddle). El dinero vuelve al método de pago del cliente.</div>

      {/* Pagos reembolsables */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", margin: "6px 0 8px" }}>PAGOS REEMBOLSABLES</div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Organización", "Fecha", "Bruto", "Neto", "Transacción", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 2 && i <= 3 ? "right" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.paddle_transaction_id}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{p.org_name || (p.org_id || "").slice(0, 8) || "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{fmt(p.occurred_at)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{p.gross_usd != null ? `$${p.gross_usd}` : "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{p.net_usd != null ? `$${p.net_usd}` : "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{p.paddle_transaction_id.slice(0, 18)}…</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}><button className="btn btn-secondary btn-sm" onClick={() => { setTarget(p); setReason(""); }} style={{ color: "var(--danger, #DC2626)" }}>Reembolsar</button></td>
                </tr>
              ))}
              {!loading && payments.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin pagos reembolsables.</td></tr>}
              {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reembolsos ejecutados */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", margin: "6px 0 8px" }}>REEMBOLSOS</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Organización", "Fecha", "Monto", "Motivo", "Por", "Estado"].map((h, i) => (
                <th key={i} style={{ textAlign: i === 2 ? "right" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.org_name || (r.org_id || "").slice(0, 8) || "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{fmt(r.created_at)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{r.amount_usd != null ? `$${r.amount_usd}` : "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", maxWidth: 260 }} title={r.reason || undefined}>{r.reason ? (r.reason.length > 60 ? r.reason.slice(0, 60) + "…" : r.reason) : "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12 }}>{r.created_by === "paddle_dashboard" ? "Paddle" : (r.created_by || "—")}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{refundChip(r.status)}</td>
                </tr>
              ))}
              {!loading && refunds.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin reembolsos todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal reembolsar */}
      {target && (
        <div onClick={() => setTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(440px,96vw)", padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 750, marginBottom: 6 }}>Reembolsar pago</div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 14 }}>
              Se reembolsará el <b>total</b> de este pago ({target.gross_usd != null ? `$${target.gross_usd} ${target.currency || "USD"}` : "—"}) a <b>{target.org_name || "el cliente"}</b>. Esta acción devuelve dinero real y no se puede deshacer.
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Motivo del reembolso (obligatorio)…" style={{ width: "100%", resize: "vertical", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", fontSize: 13.5, background: "var(--bg-base)", color: "var(--text)", outline: "none", fontFamily: "var(--font-ui)" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setTarget(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" disabled={!reason.trim() || busy} onClick={doRefund} style={{ background: "var(--danger, #DC2626)" }}>{busy ? "Procesando…" : "Reembolsar total"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pestaña Tickets de soporte (L9) ---------- */
const TICKET_CAT: Record<string, string> = { consulta: "Consulta general", facturacion: "Facturación", datos: "Datos y privacidad", error: "Error", otro: "Otro" };
const TICKET_STATUS: [string, string][] = [["open", "Nuevo"], ["in_progress", "En curso"], ["resolved", "Resuelto"], ["closed", "Cerrado"]];
function ticketChip(st: string | null | undefined) {
  const s = (st || "open").toLowerCase();
  const meta = s === "open" ? { bg: "var(--primary-soft)", c: "var(--primary)" }
    : s === "in_progress" ? { bg: "var(--warning-soft)", c: "var(--warning)" }
    : s === "resolved" ? { bg: "var(--success-soft)", c: "var(--success)" }
    : { bg: "var(--bg-elevated-2)", c: "var(--text-muted)" };
  const label = (TICKET_STATUS.find(([v]) => v === s) || [s, s])[1];
  return <span style={{ fontSize: 11.5, fontWeight: 600, background: meta.bg, color: meta.c, borderRadius: "var(--r-pill)", padding: "3px 9px", whiteSpace: "nowrap" }}>{label}</span>;
}

function TicketsTab({ backendUrl, accessToken, pushToast }: { backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void }) {
  const [data, setData] = useState<{ items: SupportTicket[]; by_status: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<SupportTicket | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.adminTickets(backendUrl, accessToken, filter).then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken, filter]);
  useEffect(() => { load(); }, [load]);

  const openTicket = (t: SupportTicket) => { setOpen(t); setNote(t.admin_note || ""); };
  const update = async (patch: { status?: string; admin_note?: string }) => {
    if (!open) return;
    setBusy(true);
    const r = await api.adminUpdateTicket(backendUrl, accessToken, open.id, patch);
    setBusy(false);
    if (r?.ok) { pushToast("Ticket actualizado", "success"); setOpen(null); load(); }
    else pushToast("No se pudo actualizar", "info");
  };

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const items = data?.items || [];
  const bs = data?.by_status || {};

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
          <option value="">Todos</option>
          {TICKET_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi label="Nuevos" value={bs["open"] || 0} color="var(--primary)" />
        <Kpi label="En curso" value={bs["in_progress"] || 0} color="var(--warning)" />
        <Kpi label="Resueltos" value={bs["resolved"] || 0} color="var(--success)" />
        <Kpi label="Total" value={Object.values(bs).reduce((a, b) => a + b, 0)} />
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Fecha", "De", "Categoría", "Mensaje", "Estado"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} onClick={() => openTicket(t)} style={{ cursor: "pointer" }}>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(t.created_at)}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
                    <div>{t.name || "—"}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{t.email}</div>
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{TICKET_CAT[t.category || ""] || t.category || "—"}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", maxWidth: 320 }} title={t.message}>{t.subject ? <b>{t.subject}: </b> : null}{(t.message || "").length > 80 ? t.message.slice(0, 80) + "…" : t.message}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>{ticketChip(t.status)}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin tickets todavía.</td></tr>}
              {loading && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 720, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 500, maxWidth: "96vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{TICKET_CAT[open.category || ""] || "Ticket"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{open.name ? open.name + " · " : ""}{open.email}</div>
              </div>
              {ticketChip(open.status)}
              <button onClick={() => setOpen(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {open.subject && <div style={{ fontSize: 14, fontWeight: 600 }}>{open.subject}</div>}
              <div style={{ fontSize: 13.5, color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.5, background: "var(--bg-elevated-2)", padding: 14, borderRadius: 10 }}>{open.message}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDateTime(open.created_at)}{open.ip ? ` · ${open.ip}` : ""}</div>
              <a className="btn btn-primary btn-sm" href={`mailto:${open.email}?subject=${encodeURIComponent("Re: " + (open.subject || "Tu solicitud en Jurovia"))}`} style={{ textDecoration: "none", alignSelf: "flex-start" }}><Icon name="send" size={14} />Responder por correo</a>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>ESTADO</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TICKET_STATUS.map(([v, l]) => (
                    <button key={v} className="btn btn-secondary btn-sm" disabled={busy || open.status === v} onClick={() => update({ status: v })} style={open.status === v ? { borderColor: "var(--primary)", color: "var(--primary)" } : undefined}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>NOTA INTERNA</div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Nota interna (no visible para el usuario)…" style={{ width: "100%", resize: "vertical", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", fontSize: 13.5, background: "var(--bg-base)", color: "var(--text)", outline: "none", fontFamily: "var(--font-ui)" }} />
                <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => update({ admin_note: note })} style={{ marginTop: 8 }}>Guardar nota</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pestaña WhatsApp ---------- */
function WhatsAppTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [fb, setFb] = useState<{ items: WAFeedbackItem[]; summary: { total: number; up: number; down: number } } | null>(null);
  const [convs, setConvs] = useState<Record<string, WAConversation>>({});
  const [loading, setLoading] = useState(true);
  const [openCid, setOpenCid] = useState<string | null>(null);
  const [thread, setThread] = useState<WAMessage[] | null>(null);
  const [tLoading, setTLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.adminWAFeedback(backendUrl, accessToken), api.adminWAConversations(backendUrl, accessToken)])
      .then(([f, c]) => {
        setFb(f);
        const m: Record<string, WAConversation> = {};
        (c.items || []).forEach((x) => { m[x.id] = x; });
        setConvs(m); setLoading(false);
      });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const openThread = (cid: string) => {
    setOpenCid(cid); setThread(null); setTLoading(true);
    api.adminWAThread(backendUrl, accessToken, cid).then((d) => { setThread(d.messages || []); setTLoading(false); });
  };

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const items = fb?.items || [];
  const s = fb?.summary;

  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Total" value={s?.total ?? 0} />
        <Card label="😍 Positivos" value={s?.up ?? 0} color="var(--success)" />
        <Card label="😕 Negativos" value={s?.down ?? 0} color="var(--danger, #DC2626)" />
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Fecha", "Usuario", "Voto", "Comentario", "Estado", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((it) => {
                const c = it.wa_conversation_id ? convs[it.wa_conversation_id] : undefined;
                const optOut = c && !c.reminders_opt_in;
                return (
                  <tr key={it.id} onClick={() => it.wa_conversation_id && openThread(it.wa_conversation_id)} style={{ cursor: it.wa_conversation_id ? "pointer" : "default" }}>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(it.created_at)}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
                      <div>{it.user_name || "—"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{it.phone ? "+" + it.phone : "—"}</div>
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>{it.verdict === "up" ? "😍" : it.verdict === "down" ? "😕" : "—"}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", maxWidth: 320 }} title={it.comment || undefined}>{it.comment ? (it.comment.length > 90 ? it.comment.slice(0, 90) + "…" : it.comment) : "—"}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 9px", background: optOut ? "rgba(220,38,38,.12)" : "rgba(16,185,129,.12)", color: optOut ? "var(--danger, #DC2626)" : "var(--success)" }}>{optOut ? "🔕 Opt-out" : "🔔 Activo"}</span>
                    </td>
                    <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>{it.wa_conversation_id && <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, whiteSpace: "nowrap" }}>Ver chat →</span>}</td>
                  </tr>
                );
              })}
              {!loading && items.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin feedback de WhatsApp todavía.</td></tr>}
              {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {openCid && (
        <div onClick={() => setOpenCid(null)} style={{ position: "fixed", inset: 0, zIndex: 720, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 480, maxWidth: "96vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Chat de WhatsApp</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{convs[openCid]?.name || convs[openCid]?.display_phone || "—"}</div>
              </div>
              <button onClick={() => setOpenCid(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {tLoading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando chat…</div>}
              {!tLoading && thread && thread.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin mensajes.</div>}
              {(thread || []).map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.direction === "inbound" ? "flex-start" : "flex-end" }}>
                  <div style={{ maxWidth: "82%", padding: "9px 12px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.45, background: m.direction === "inbound" ? "var(--bg-elevated-2)" : "var(--primary)", color: m.direction === "inbound" ? "var(--text)" : "#fff", whiteSpace: "pre-wrap" }}>{m.content || <span style={{ opacity: .7 }}>[{m.msg_type}]</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pestaña Email (feedback de la campaña por correo) ---------- */
/* ---------- Pestaña Campañas (email + WhatsApp: indicadores por envío/destinatario) ---------- */
function CampaignsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [rows, setRows] = useState<CampaignKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [open, setOpen] = useState<CampaignKPI | null>(null);
  const [recs, setRecs] = useState<CampaignRecipient[] | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.adminCampaigns(backendUrl, accessToken, days).then((d) => { setRows(d.campaigns || []); setLoading(false); });
  }, [backendUrl, accessToken, days]);
  useEffect(() => { load(); }, [load]);

  const openRecipients = useCallback((c: CampaignKPI) => {
    setOpen(c); setRecs(null); setRecsLoading(true);
    api.adminCampaignRecipients(backendUrl, accessToken, c.key, Math.max(days, 90)).then((d) => { setRecs(d.recipients || []); setRecsLoading(false); });
  }, [backendUrl, accessToken, days]);

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const pct = (n: number) => `${(n ?? 0).toFixed(1)}%`;
  const chan = (c: string | null) => c === "whatsapp" ? "📱 WhatsApp" : c === "email" ? "✉️ Email" : (c || "—");

  // Totales agregados (todas las campañas)
  const tot = rows.reduce((a, r) => ({
    enviados: a.enviados + (r.enviados || 0), entregados: a.entregados + (r.entregados || 0),
    abiertos: a.abiertos + (r.abiertos || 0), clics: a.clics + (r.clics || 0),
    entraron: a.entraron + (r.entraron || 0), respondieron: a.respondieron + (r.respondieron || 0),
  }), { enviados: 0, entregados: 0, abiertos: 0, clics: 0, entraron: 0, respondieron: 0 });

  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 110px", minWidth: 110, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );

  const Bar = ({ n, d, color }: { n: number; d: number; color: string }) => {
    const w = d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 40, height: 6, borderRadius: 4, background: "var(--bg-elevated-2)", overflow: "hidden" }}>
          <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 58, textAlign: "right" }}>{n} · {w}%</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
          {[7, 30, 90, 365].map((d) => <option key={d} value={d}>Últimos {d} días</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Enviados" value={tot.enviados} />
        <Card label="Entregados" value={tot.entregados} />
        <Card label="Abiertos" value={tot.abiertos} color="var(--primary)" />
        <Card label="Clics" value={tot.clics} color="var(--success)" />
        <Card label="Respondieron" value={tot.respondieron} color="var(--success)" />
        <Card label="Entraron" value={tot.entraron} color="var(--gold, #C9A24B)" />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Campaña", "Canal", "Enviados", "Apertura", "Clics", "Entraron", "Últ. envío", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 2 && i <= 5 ? "left" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.key}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{c.name || c.key}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{chan(c.channel)}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{c.enviados}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", minWidth: 130 }}><Bar n={c.abiertos} d={c.enviados} color="var(--primary)" /></td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", minWidth: 130 }}><Bar n={c.clics} d={c.enviados} color="var(--success)" /></td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600, color: "var(--gold, #C9A24B)" }}>{c.entraron}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(c.ultimo_envio)}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openRecipients(c)}>Ver destinatarios</button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin campañas todavía.</td></tr>}
              {loading && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down por destinatario */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(920px, 96vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{open.name || open.key}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{chan(open.channel)} · {open.enviados} enviados · apertura {pct(open.open_rate)} · clics {pct(open.click_rate)}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setOpen(null)}><Icon name="x" size={15} />Cerrar</button>
            </div>
            <div style={{ overflow: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
                <thead><tr style={{ background: "var(--bg-elevated-2)", position: "sticky", top: 0 }}>
                  {["Destinatario", "Estado", "Enviado", "Entregado", "Abrió", "Clic", "Respondió", "Entró"].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "9px 12px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(recs || []).map((r, i) => {
                    const m = (r.meta || {}) as Record<string, unknown>;
                    const detalle = [
                      m.device ? `Disp.: ${String(m.device).slice(0, 60)}` : "",
                      m.last_click_link ? `Clic en: ${m.last_click_link}` : "",
                      m.bounce_type ? `Rebote ${m.bounce_type}${m.bounce_reason ? `: ${m.bounce_reason}` : ""}` : "",
                      m.fail_reason ? `Falla: ${m.fail_reason}` : "",
                    ].filter(Boolean).join("  ·  ");
                    return (
                    <tr key={i}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={detalle ? `${r.recipient}\n${detalle}` : r.recipient}>{r.recipient}{detalle ? <span style={{ marginLeft: 6, color: "var(--text-muted)", fontWeight: 400 }} title={detalle}>ⓘ</span> : null}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: "var(--r-pill)", padding: "2px 8px" }}>{r.status || "—"}</span></td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(r.sent_at)}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{r.delivered_at ? "✓" : "—"}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.opened_at ? <span style={{ color: "var(--primary)", fontWeight: 600 }} title={fmtDateTime(r.opened_at)}>✓{r.opened_count > 1 ? ` ×${r.opened_count}` : ""}</span> : "—"}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.clicked_at ? <span style={{ color: "var(--success)", fontWeight: 600 }} title={fmtDateTime(r.clicked_at)}>✓{r.clicked_count > 1 ? ` ×${r.clicked_count}` : ""}</span> : "—"}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.replied_at ? <span style={{ color: "var(--success)", fontWeight: 600 }}>✓</span> : "—"}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.entered_at ? <span style={{ color: "var(--gold, #C9A24B)", fontWeight: 700 }}>✓</span> : (r.unsubscribed_at ? <span style={{ color: "var(--danger, #DC2626)" }}>baja</span> : (r.bounced_at ? <span style={{ color: "var(--danger, #DC2626)" }}>rebote</span> : "—"))}</td>
                    </tr>
                  ); })}
                  {!recsLoading && (recs || []).length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin destinatarios en el período.</td></tr>}
                  {recsLoading && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [fb, setFb] = useState<{ items: EmailFeedbackItem[]; summary: { total: number; up: number; down: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.adminEmailFeedback(backendUrl, accessToken).then((f) => { setFb(f); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const items = fb?.items || [];
  const s = fb?.summary;

  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Total" value={s?.total ?? 0} />
        <Card label="😍 Positivos" value={s?.up ?? 0} color="var(--success)" />
        <Card label="😕 Negativos" value={s?.down ?? 0} color="var(--danger, #DC2626)" />
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Fecha", "Usuario", "Correo", "Voto", "Comentario"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(it.created_at)}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{it.user_name || "—"}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{it.context?.email || "—"}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>{it.verdict === "up" ? "😍" : it.verdict === "down" ? "😕" : "—"}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", maxWidth: 320 }} title={it.comment || undefined}>{it.comment ? (it.comment.length > 90 ? it.comment.slice(0, 90) + "…" : it.comment) : "—"}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin feedback por correo todavía.</td></tr>}
              {loading && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pestaña Feedback ---------- */
function FeedbackTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<AdminFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.adminFeedback(backendUrl, accessToken).then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const verdictChip = (v: "up" | "down" | null) =>
    v === "up" ? <span style={{ color: "var(--success)", fontWeight: 700 }}>👍</span>
    : v === "down" ? <span style={{ color: "var(--danger, #DC2626)", fontWeight: 700 }}>👎</span>
    : <span style={{ color: "var(--text-muted)" }}>—</span>;

  const s = data?.summary;
  const items = data?.items || [];
  const topReasons = s ? Object.entries(s.by_reason).sort((a, b) => b[1] - a[1]).slice(0, 6) : [];
  const byKind = s ? Object.entries(s.by_kind).sort((a, b) => b[1] - a[1]) : [];

  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Total" value={s?.total ?? 0} />
        <Card label="👍 Positivos" value={s?.up ?? 0} color="var(--success)" />
        <Card label="👎 Negativos" value={s?.down ?? 0} color="var(--danger, #DC2626)" />
        <div className="card" style={{ flex: "2 1 220px", minWidth: 200, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Top razones</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {topReasons.length === 0 ? <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>—</span>
              : topReasons.map(([r, n]) => (
                <span key={r} style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: "var(--r-pill)", padding: "3px 9px" }}>{r} · {n}</span>
              ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, margin: "10px 0 6px" }}>Por tipo</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {byKind.length === 0 ? <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>—</span>
              : byKind.map(([k, n]) => (
                <span key={k} style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", background: "var(--primary-soft)", borderRadius: "var(--r-pill)", padding: "3px 9px" }}>{k} · {n}</span>
              ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Fecha", "Tipo", "Voto", "Razón", "Comentario", "Contexto"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const ctx = it.context ? JSON.stringify(it.context) : "";
              return (
                <tr key={it.id}>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(it.created_at)}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{it.kind}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>{verdictChip(it.verdict)}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{it.reason || "—"}</td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text)", maxWidth: 280 }} title={it.comment || undefined}>
                    {it.comment ? (it.comment.length > 90 ? it.comment.slice(0, 90) + "…" : it.comment) : "—"}
                  </td>
                  <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", maxWidth: 220, fontFamily: "var(--font-mono)", fontSize: 11.5 }} title={ctx}>
                    {ctx ? (ctx.length > 60 ? ctx.slice(0, 60) + "…" : ctx) : "—"}
                  </td>
                </tr>
              );
            })}
            {!loading && items.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin feedback todavía.</td></tr>}
            {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pestaña Referidos (growth loop) ---------- */
function ReferralsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<AdminReferrals | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.adminReferrals(backendUrl, accessToken).then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const shortId = (id: string | null) => (id ? id.slice(0, 8) : "—");

  const statusChip = (status: string) => {
    const s = (status || "").toLowerCase();
    const meta: { bg: string; color: string } =
      s === "rewarded" ? { bg: "var(--success-soft)", color: "var(--success)" }
      : s === "capped" || s === "blocked" ? { bg: "var(--warning-soft)", color: "var(--warning)" }
      : { bg: "var(--bg-elevated-2)", color: "var(--text-muted)" };
    return <span style={{ fontSize: 12, fontWeight: 600, background: meta.bg, color: meta.color, borderRadius: "var(--r-pill)", padding: "3px 9px", whiteSpace: "nowrap" }}>{status || "—"}</span>;
  };

  const s = data?.summary;
  const items = data?.items || [];

  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Total" value={s?.total ?? 0} />
        <Card label="Pendientes" value={s?.pending ?? 0} color="var(--text-muted)" />
        <Card label="Premiados" value={s?.rewarded ?? 0} color="var(--success)" />
        <Card label="Capped" value={s?.capped ?? 0} color="var(--warning)" />
        <Card label="Turnos otorgados" value={s?.turns_granted ?? 0} color="var(--primary)" />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Fecha", "Código", "Referente", "Referido", "Estado", "Turnos"].map((h, i) => (
                <th key={i} style={{ textAlign: i === 5 ? "right" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(it.created_at)}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{it.code}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11.5 }} title={it.referrer_user_id}>{shortId(it.referrer_user_id)}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11.5 }} title={it.referee_user_id}>{shortId(it.referee_user_id)}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>{statusChip(it.status)}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>{it.reward_credits}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin referidos todavía.</td></tr>}
            {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pestaña Waitlist (acceso por invitación) ---------- */
function WaitlistTab({ backendUrl, accessToken, pushToast }: { backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void }) {
  const [data, setData] = useState<{ items: WaitlistItem[]; counts: { total: number; pending: number; authorized: number; registered: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "pending" | "authorized">("all");

  const load = useCallback(() => {
    setLoading(true);
    api.adminWaitlist(backendUrl, accessToken).then((d) => { setData(d); setSel(new Set()); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const all = data?.items || [];
  const items = all.filter((w) => filter === "all" || w.status === filter);
  const counts = data?.counts;
  const fmtDate = (s: string | null) => { try { return s ? new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };

  async function authorize(emails: string[]) {
    if (!emails.length) return;
    const r = await api.adminAuthorizeWaitlist(backendUrl, accessToken, emails, true);
    if (r.ok) { pushToast(`Autorizados: ${r.authorized} · invitación enviada`, "success"); load(); }
    else pushToast("No se pudo autorizar", "info");
  }
  const toggle = (email: string) => setSel((s) => { const n = new Set(s); if (n.has(email)) n.delete(email); else n.add(email); return n; });

  const statusChip = (s: string) => {
    const meta = s === "authorized" ? { bg: "var(--success-soft)", color: "var(--success)", t: "Autorizado" }
      : s === "registered" ? { bg: "var(--primary-soft)", color: "var(--primary)", t: "Registrado" }
      : { bg: "var(--warning-soft)", color: "var(--warning)", t: "Pendiente" };
    return <span style={{ fontSize: 12, fontWeight: 600, background: meta.bg, color: meta.color, borderRadius: "var(--r-pill)", padding: "3px 9px", whiteSpace: "nowrap" }}>{meta.t}</span>;
  };
  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["all", "pending", "authorized"] as const).map((f) => (
          <button key={f} className="btn btn-sm" onClick={() => setFilter(f)}
            style={{ background: filter === f ? "var(--primary-soft)" : "var(--bg-elevated-2)", color: filter === f ? "var(--primary)" : "var(--text-secondary)", border: "none", fontWeight: 600 }}>
            {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Autorizadas"}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" disabled={sel.size === 0} style={{ opacity: sel.size ? 1 : 0.5 }} onClick={() => authorize([...sel])}>
          <Icon name="check" size={15} stroke={2.4} />Autorizar seleccionados ({sel.size})
        </button>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Total" value={counts?.total ?? 0} />
        <Card label="Pendientes" value={counts?.pending ?? 0} color="var(--warning)" />
        <Card label="Autorizados" value={counts?.authorized ?? 0} color="var(--success)" />
        <Card label="Registrados" value={counts?.registered ?? 0} color="var(--primary)" />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated-2)" }}>
              {["", "Email", "Tipo", "Área", "Ciudad", "WhatsApp", "Origen", "Estado", "Fecha", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id}>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={sel.has(w.email)} onChange={() => toggle(w.email)} disabled={w.status !== "pending"} />
                </td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }} title={w.email}>{w.email}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{w.user_type || "—"}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{w.practice_area || "—"}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{w.city || "—"}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  {w.phone
                    ? <a href={`https://wa.me/${w.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>{w.phone}</a>
                    : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11.5 }}>{w.source || "—"}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>{statusChip(w.status)}</td>
                <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(w.created_at)}</td>
                <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
                  {w.status === "pending" && <button className="btn btn-secondary btn-sm" onClick={() => authorize([w.email])}>Autorizar</button>}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && <tr><td colSpan={10} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin solicitudes.</td></tr>}
            {loading && <tr><td colSpan={10} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pestaña Retención (DAU/WAU/MAU, cohortes, quién vuelve y qué pide) ---------- */
function RetentionTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [openUser, setOpenUser] = useState<RetentionUser | null>(null);
  const [userSessions, setUserSessions] = useState<AuditSession[] | null>(null);
  const [uBlocked, setUBlocked] = useState(false);
  const [openTid, setOpenTid] = useState<string | null>(null);
  const [thread, setThread] = useState<AuditMessage[] | null>(null);
  const [sort, setSort] = useState<"ultima" | "dias" | "mensajes">("ultima");

  const rangeActive = !!(appliedFrom && appliedTo);
  const load = useCallback(() => {
    setLoading(true);
    api.adminRetention(backendUrl, accessToken, days, appliedFrom || undefined, appliedTo || undefined)
      .then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken, days, appliedFrom, appliedTo]);
  useEffect(() => { load(); }, [load]);

  const validRange = !!(from && to) && new Date(to).getTime() > new Date(from).getTime();
  const applyRange = () => { if (validRange) { setAppliedFrom(new Date(from).toISOString()); setAppliedTo(new Date(to).toISOString()); } };
  const pickDays = (d: number) => { setAppliedFrom(""); setAppliedTo(""); setDays(d); };
  const clearRange = () => { setFrom(""); setTo(""); setAppliedFrom(""); setAppliedTo(""); };

  const openUserDrawer = (u: RetentionUser) => {
    setOpenUser(u); setUserSessions(null); setUBlocked(false); setOpenTid(null); setThread(null);
    if (u.org_id) api.adminAuditSessions(backendUrl, accessToken, u.org_id).then((d) => { setUBlocked(!!d.blocked); setUserSessions(d.sessions || []); });
    else setUserSessions([]);
  };
  const openThreadDrawer = (sid: string) => {
    setOpenTid(sid); setThread(null);
    api.adminAuditThread(backendUrl, accessToken, sid).then((d) => setThread(d.messages || []));
  };

  const fmtDate = (s: string | null) => { try { return s ? new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : "—"; } catch { return "—"; } };
  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const ov = data?.overview || {};
  const users = (data?.users || []).slice().sort((a, b) =>
    sort === "dias" ? b.dias_activos_total - a.dias_activos_total
    : sort === "mensajes" ? b.mensajes_total - a.mensajes_total
    : (new Date(b.ultima_actividad || 0).getTime() - new Date(a.ultima_actividad || 0).getTime()));
  const growth = data?.growth || [];
  const cohorts = data?.cohorts || [];
  const intents = data?.intents || [];
  const hooks = data?.hooks;
  const serie = ov.serie || [];
  const serieMax = Math.max(1, ...serie.map((s) => s.activos));
  const intentMax = Math.max(1, ...intents.map((i) => i.n));

  const Card = ({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
  const estChip = (e: RetentionUser["estado"]) => {
    const m = e === "activo" ? { b: "var(--success-soft)", c: "var(--success)", t: "Activo" }
      : e === "en_riesgo" ? { b: "var(--warning-soft)", c: "var(--warning)", t: "En riesgo" }
      : e === "churned" ? { b: "rgba(220,38,38,.12)", c: "var(--danger, #DC2626)", t: "Churned" }
      : { b: "var(--bg-elevated-2)", c: "var(--text-muted)", t: "Sin uso" };
    return <span style={{ fontSize: 11, fontWeight: 600, background: m.b, color: m.c, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{m.t}</span>;
  };
  const cohortColor = (pct: number) => pct >= 60 ? "rgba(16,185,129,.85)" : pct >= 30 ? "rgba(16,185,129,.5)" : pct > 0 ? "rgba(16,185,129,.22)" : "var(--bg-elevated-2)";

  return (
    <div>
      {/* Filtro días + rango exacto (mismo patrón que Analytics) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {([7, 30, 90] as const).map((d) => (
          <button key={d} className="btn btn-sm" onClick={() => pickDays(d)}
            style={{ background: days === d && !rangeActive ? "var(--primary-soft)" : "var(--bg-elevated-2)", color: days === d && !rangeActive ? "var(--primary)" : "var(--text-secondary)", border: "none", fontWeight: 600 }}>
            {d === 7 ? "7 días" : d === 30 ? "30 días" : "90 días"}
          </button>
        ))}
        <span style={{ width: 1, height: 22, background: "var(--border)", margin: "0 2px" }} />
        <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Desde"
          style={{ padding: "6px 9px", borderRadius: "var(--r-md)", border: `1px solid ${rangeActive ? "var(--primary)" : "var(--border-strong)"}`, background: "var(--bg-base)", fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-ui)" }} />
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>→</span>
        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Hasta"
          style={{ padding: "6px 9px", borderRadius: "var(--r-md)", border: `1px solid ${rangeActive ? "var(--primary)" : "var(--border-strong)"}`, background: "var(--bg-base)", fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-ui)" }} />
        <button className="btn btn-primary btn-sm" disabled={!validRange} style={{ opacity: validRange ? 1 : 0.5 }} onClick={applyRange}>Aplicar</button>
        {rangeActive && <button className="btn btn-ghost btn-sm" onClick={clearRange}>Limpiar</button>}
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      {/* Cards núcleo */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="DAU" value={ov.dau ?? 0} sub="activos hoy" />
        <Card label="WAU" value={ov.wau ?? 0} sub="últimos 7 días" color="var(--primary)" />
        <Card label="MAU" value={ov.mau ?? 0} sub="últimos 30 días" color="var(--primary)" />
        <Card label="Stickiness" value={`${ov.stickiness ?? 0}%`} sub="DAU prom / MAU" color="var(--aurora-2, var(--primary))" />
        <Card label="Nuevos" value={ov.nuevos_periodo ?? 0} sub="en el periodo" color="var(--success)" />
        <Card label="Recurrentes" value={ov.recurrentes_periodo ?? 0} sub="ya usaban antes" color="var(--warning)" />
        <Card label="Con actividad" value={`${ov.con_actividad_total ?? 0}/${ov.registrados_total ?? 0}`} sub="usaron el agente" />
      </div>

      {/* Serie de usuarios activos por día */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>Usuarios activos por día</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 90, overflowX: "auto" }}>
          {serie.length === 0 ? <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Sin datos.</span>
            : serie.map((s, i) => (
              <div key={i} title={`${s.d}: ${s.activos}`} style={{ flex: "1 0 6px", minWidth: 4, height: `${Math.round((s.activos / serieMax) * 100)}%`, background: s.activos > 0 ? "var(--primary)" : "var(--bg-elevated-2)", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
            ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
        {/* Cohortes de retención */}
        <div className="card" style={{ flex: "1 1 420px", minWidth: 340, padding: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", padding: "14px 16px 8px" }}>Cohortes de retención <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· % activos por mes desde registro</span></div>
          <div className="table-wrap">
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
              <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
                {["Cohorte", "Usuarios", "M0", "M1", "M2", "M3", "M4", "M5"].map((h, i) => <th key={i} style={{ textAlign: i <= 1 ? "left" : "center", padding: "8px 10px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.cohorte}>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", fontWeight: 600, whiteSpace: "nowrap" }}>{c.cohorte}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{c.tam}</td>
                    {[0, 1, 2, 3, 4, 5].map((k) => {
                      const cell = c.retencion.find((r) => r.k === k);
                      return <td key={k} style={{ padding: "7px 6px", borderBottom: "1px solid var(--border)", textAlign: "center", background: cell ? cohortColor(cell.pct) : undefined, color: cell && cell.pct >= 30 ? "#0B3B2E" : "var(--text-secondary)", fontWeight: cell && cell.pct > 0 ? 700 : 400 }}>{cell && cell.pct > 0 ? `${cell.pct}%` : "·"}</td>;
                    })}
                  </tr>
                ))}
                {!loading && cohorts.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Sin cohortes.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Qué le piden al agente (intención) */}
        <div className="card" style={{ flex: "1 1 260px", minWidth: 240, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>Qué le piden al agente</div>
          {intents.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Sin datos.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {intents.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 120, fontSize: 12.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={it.categoria}>{it.categoria}</div>
                  <div style={{ flex: 1, height: 9, background: "var(--bg-elevated-2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((it.n / intentMax) * 100)}%`, height: "100%", background: "var(--primary)", opacity: 0.8 }} />
                  </div>
                  <div style={{ width: 28, textAlign: "right", fontSize: 12, fontWeight: 600 }}>{it.n}</div>
                </div>
              ))}
            </div>}
        </div>
      </div>

      {/* Rendimiento de hooks (Nir Eyal) — qué chips retienen (CTR por tipo) */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />Rendimiento de hooks
          <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· {hooks?.total_clicks ?? 0}/{hooks?.total_shown ?? 0} clics · CTR {hooks?.total_shown ? Math.round((100 * (hooks?.total_clicks || 0)) / hooks.total_shown) : 0}%</span>
        </div>
        {(hooks?.por_tipo || []).length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Aún sin datos (aparecen cuando los abogados vean y toquen los chips de próxima acción).</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
            {(hooks?.por_tipo || []).map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 104, fontSize: 12.5, fontWeight: 600, textTransform: "capitalize" }}>{h.tipo}</div>
                <div style={{ flex: 1, height: 9, background: "var(--bg-elevated-2)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, h.ctr)}%`, height: "100%", background: "var(--primary)", opacity: 0.8 }} />
                </div>
                <div style={{ width: 150, textAlign: "right", fontSize: 12, color: "var(--text-secondary)" }}>{h.clicks}/{h.shown} · <strong style={{ color: "var(--text)" }}>{h.ctr}% CTR</strong></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Growth accounting (mensual) */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", padding: "14px 16px 8px" }}>Contabilidad de crecimiento <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· mensual</span></div>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Mes", "Activos", "Nuevos", "Retenidos", "Resucitados", "Churned", "Quick Ratio"].map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "9px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {growth.map((g) => (
                <tr key={g.periodo}>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{g.periodo}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{g.activos}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--success)", fontWeight: 600 }}>+{g.nuevos}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--primary)", fontWeight: 600 }}>{g.retenidos}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--warning)" }}>+{g.resucitados}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--danger, #DC2626)" }}>{g.churned}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 700, color: (g.quick_ratio ?? 0) >= 1 ? "var(--success)" : "var(--text-secondary)" }}>{g.quick_ratio ?? "—"}</td>
                </tr>
              ))}
              {!loading && growth.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Sin datos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Usuarios <span style={{ fontWeight: 500, color: "var(--text-muted)", fontSize: 12.5 }}>· clic para ver qué pide y su conversación</span></div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Ordenar:</span>
        {(["ultima", "dias", "mensajes"] as const).map((s) => (
          <button key={s} className="btn btn-sm" onClick={() => setSort(s)} style={{ background: sort === s ? "var(--primary-soft)" : "var(--bg-elevated-2)", color: sort === s ? "var(--primary)" : "var(--text-secondary)", border: "none", fontWeight: 600 }}>{s === "ultima" ? "Última actividad" : s === "dias" ? "Días activos" : "Mensajes"}</button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Email", "Plan", "Estado", "Registro", "Últ. actividad", "Días act.", "Sem.", "Sesiones", "Mensajes", "Docs", "Créd.", "Qué pide"].map((h, i) => <th key={i} style={{ textAlign: i >= 5 && i <= 10 ? "right" : "left", padding: "9px 12px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} onClick={() => openUserDrawer(u)} style={{ cursor: "pointer" }} className="hover-row">
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", fontWeight: 600, maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis" }} title={u.email}>
                    {u.email}{u.recurrente && <span title="Recurrente (activo en ≥2 semanas)" style={{ marginLeft: 5, color: "var(--warning)" }}>★</span>}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{u.plan}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>{estChip(u.estado)}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(u.signup)}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(u.ultima_actividad)}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{u.dias_activos_total}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{u.semanas_activas}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{u.sesiones}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>{u.mensajes_total}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{u.documentos}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-muted)" }}>{u.creditos}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={(u.consultas || []).join(" · ")}>{u.consultas && u.consultas.length ? u.consultas[0] : (u.plan !== "free" && u.plan !== "trial" ? "🔒 privado" : "—")}</td>
                </tr>
              ))}
              {!loading && users.length === 0 && <tr><td colSpan={12} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin usuarios con actividad.</td></tr>}
              {loading && <tr><td colSpan={12} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de usuario: qué pide + sesiones + conversación */}
      {openUser && (
        <div onClick={() => setOpenUser(null)} style={{ position: "fixed", inset: 0, zIndex: 720, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 560, maxWidth: "97vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{openUser.email}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{openUser.plan} · {openUser.dias_activos_total} días activos · {openUser.mensajes_total} mensajes · {openUser.documentos} docs</div>
              </div>
              <button onClick={() => setOpenUser(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              {!openTid ? (<>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>Últimas consultas al agente</div>
                {openUser.consultas === null ? <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>🔒 Contenido privado (plan de pago).</div>
                  : (openUser.consultas.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Sin consultas.</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                      {openUser.consultas.map((q, i) => <div key={i} style={{ fontSize: 13, padding: "8px 11px", background: "var(--bg-elevated-2)", borderRadius: 8, lineHeight: 1.4 }}>{q}</div>)}
                    </div>)}
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>Conversaciones {uBlocked && <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· privadas (plan de pago)</span>}</div>
                {!userSessions ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando…</div>
                  : userSessions.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{uBlocked ? "No visibles." : "Sin conversaciones."}</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {userSessions.map((s) => (
                        <button key={s.id} onClick={() => openThreadDrawer(s.id)} style={{ textAlign: "left", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", background: "var(--bg-base)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name="message" size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || "Sin título"}</span>
                          <span style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(s.created_at)}</span>
                        </button>
                      ))}
                    </div>}
              </>) : (<>
                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => { setOpenTid(null); setThread(null); }}><Icon name="arrowLeft" size={15} />Volver</button>
                {!thread ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Cargando…</div>
                  : thread.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin mensajes.</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {thread.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "85%", padding: "9px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.45, background: m.role === "user" ? "var(--primary)" : "var(--bg-elevated-2)", color: m.role === "user" ? "#fff" : "var(--text)", whiteSpace: "pre-wrap" }}>
                            {m.parts?.map((p) => p.text).filter(Boolean).join("\n") || <span style={{ opacity: .7 }}>[{m.parts?.map((p) => p.type).join(", ") || "—"}]</span>}
                          </div>
                        </div>
                      ))}
                    </div>}
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pestaña Analytics (comportamiento landing + guest) ---------- */
function AnalyticsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [from, setFrom] = useState("");             // borrador del input Desde (datetime-local, hora local)
  const [to, setTo] = useState("");                 // borrador del input Hasta
  const [appliedFrom, setAppliedFrom] = useState(""); // rango aplicado (ISO UTC) que realmente se consulta
  const [appliedTo, setAppliedTo] = useState("");
  const [openSid, setOpenSid] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsEvent[] | null>(null);
  const [tlLoading, setTlLoading] = useState(false);
  const [convSid, setConvSid] = useState<string | null>(null);
  const [conv, setConv] = useState<GuestMessage[] | null>(null);
  const [convLoading, setConvLoading] = useState(false);

  const rangeActive = !!(appliedFrom && appliedTo);
  const load = useCallback(() => {
    setLoading(true);
    api.adminAnalytics(backendUrl, accessToken, days, appliedFrom || undefined, appliedTo || undefined)
      .then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken, days, appliedFrom, appliedTo]);
  useEffect(() => { load(); }, [load]);

  const validRange = !!(from && to) && new Date(to).getTime() > new Date(from).getTime();
  const applyRange = () => {
    if (!validRange) return;
    // datetime-local es hora LOCAL (Colombia); created_at es UTC → convertir a ISO UTC para el rango exacto.
    setAppliedFrom(new Date(from).toISOString());
    setAppliedTo(new Date(to).toISOString());
  };
  const pickDays = (d: number) => { setAppliedFrom(""); setAppliedTo(""); setDays(d); };   // vuelve a modo "días"
  const clearRange = () => { setFrom(""); setTo(""); setAppliedFrom(""); setAppliedTo(""); };

  const openSession = (sid: string) => {
    setOpenSid(sid); setTimeline(null); setTlLoading(true);
    api.adminAnalyticsSession(backendUrl, accessToken, sid).then((d) => { setTimeline(d.events); setTlLoading(false); });
  };
  const openConv = (sid: string) => {
    setConvSid(sid); setConv(null); setConvLoading(true);
    api.adminGuestConversation(backendUrl, accessToken, sid).then((d) => { setConv(d.messages); setConvLoading(false); });
  };

  const fmtDateTime = (s: string | null) => { try { return s ? new Date(s).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const fmtTime = (s: string | null) => { try { return s ? new Date(s).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; } catch { return "—"; } };
  const fmtDur = (sec: number) => { const m = Math.floor((sec || 0) / 60), s = (sec || 0) % 60; return m ? `${m}m ${s}s` : `${s}s`; };

  const f = data?.funnel || {};
  const top: AnalyticsTop[] = data?.top || [];
  const sessions: AnalyticsSession[] = data?.sessions || [];
  const demo = data?.demographics || {};

  const funnelSteps: [string, number, string][] = [
    ["Visitas", f.visitas ?? 0, "var(--text)"],
    ["Interactuaron (click)", f.interactuaron ?? 0, "var(--text-secondary)"],
    ["Leyeron (scroll 50%)", f.scroll_50 ?? 0, "var(--text-secondary)"],
    ["Probaron el chat", f.chat_guest ?? 0, "var(--primary)"],
    ["Abrieron waitlist", f.abrio_waitlist ?? 0, "var(--aurora-2, var(--primary))"],
    ["Se registraron", f.registrados ?? 0, "var(--success)"],
  ];
  const base = Math.max(1, funnelSteps[0][1]);

  const evLabel = (e: AnalyticsEvent): string => {
    const p = e.props || {};
    if (e.event_type === "click") return `Click: ${(p.text as string) || (p.id as string) || (p.href as string) || (p.tag as string) || "elemento"}`;
    if (e.event_type === "scroll") return `Scroll ${p.depth ?? ""}%`;
    if (e.event_type === "form") return e.name === "form_submit" ? "Envió formulario" : `Campo: ${(p.field as string) || ""}`;
    if (e.event_type === "pageview") return "Entró a la página";
    if (e.event_type === "engagement") return `Salió (${p.seconds ?? 0}s · scroll ${p.max_scroll ?? 0}%)`;
    return e.name || "evento";
  };
  const evColor = (t: string) => t === "click" ? "var(--primary)" : t === "scroll" ? "var(--text-muted)" : t === "named" ? "var(--success)" : t === "form" ? "var(--warning)" : "var(--text-secondary)";

  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 120, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );
  const DemoList = ({ title, items }: { title: string; items?: AnalyticsKN[] }) => {
    const list = items || [];
    const max = Math.max(1, ...list.map((i) => i.n));
    return (
      <div className="card" style={{ flex: "1 1 220px", minWidth: 200, padding: "12px 14px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>{title}</div>
        {list.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-muted)" }}>—</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {list.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 96, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={it.k}>{it.k}</div>
                <div style={{ flex: 1, height: 8, background: "var(--bg-elevated-2)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((it.n / max) * 100)}%`, height: "100%", background: "var(--primary)", opacity: 0.8 }} />
                </div>
                <div style={{ width: 30, textAlign: "right", fontSize: 12, fontWeight: 600 }}>{it.n}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {([7, 30, 90] as const).map((d) => (
          <button key={d} className="btn btn-sm" onClick={() => pickDays(d)}
            style={{ background: days === d && !rangeActive ? "var(--primary-soft)" : "var(--bg-elevated-2)", color: days === d && !rangeActive ? "var(--primary)" : "var(--text-secondary)", border: "none", fontWeight: 600 }}>
            {d === 7 ? "7 días" : d === 30 ? "30 días" : "90 días"}
          </button>
        ))}
        <span style={{ width: 1, height: 22, background: "var(--border)", margin: "0 2px" }} />
        {/* Rango exacto de fecha/hora (hora local; se convierte a UTC al aplicar) */}
        <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Desde"
          style={{ padding: "6px 9px", borderRadius: "var(--r-md)", border: `1px solid ${rangeActive ? "var(--primary)" : "var(--border-strong)"}`, background: "var(--bg-base)", fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-ui)" }} />
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>→</span>
        <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Hasta"
          style={{ padding: "6px 9px", borderRadius: "var(--r-md)", border: `1px solid ${rangeActive ? "var(--primary)" : "var(--border-strong)"}`, background: "var(--bg-base)", fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-ui)" }} />
        <button className="btn btn-primary btn-sm" disabled={!validRange} style={{ opacity: validRange ? 1 : 0.5 }} onClick={applyRange}>Aplicar</button>
        {rangeActive && <button className="btn btn-ghost btn-sm" onClick={clearRange}>Limpiar</button>}
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>
      {rangeActive && (
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="calendarClock" size={13} style={{ color: "var(--primary)" }} />
          Rango: <strong>{new Date(appliedFrom).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong>
          → <strong>{new Date(appliedTo).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong>
          <span style={{ color: "var(--text-muted)" }}>· los botones de días están inactivos</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Sesiones" value={f.sesiones ?? 0} />
        <Card label="Eventos" value={f.eventos ?? 0} color="var(--primary)" />
        <Card label="Probaron el chat" value={f.chat_guest ?? 0} color="var(--text)" />
        <Card label="Registrados" value={f.registrados ?? 0} color="var(--success)" />
      </div>

      {/* Embudo */}
      <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12 }}>Embudo de conversión</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {funnelSteps.map(([label, n, color], i) => {
            const pct = Math.round((n / base) * 100);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 160, fontSize: 13, color: "var(--text-secondary)", textAlign: "right", flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1, height: 26, background: "var(--bg-elevated-2)", borderRadius: 7, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: 0.85, borderRadius: 7, transition: "width .3s", minWidth: n > 0 ? 2 : 0 }} />
                </div>
                <div style={{ width: 96, fontSize: 13, fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>{n} <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 12 }}>({pct}%)</span></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demografía */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>Demografía <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· por sesiones únicas</span></div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <DemoList title="🌎 Países" items={demo.paises} />
          <DemoList title="🏙️ Ciudades" items={demo.ciudades} />
          <DemoList title="🗣️ Idiomas" items={demo.idiomas} />
          <DemoList title="📱 Dispositivo" items={demo.dispositivos} />
          <DemoList title="🧭 Navegador" items={demo.navegadores} />
          <DemoList title="💻 Sistema" items={demo.sistemas} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Top eventos */}
        <div className="card" style={{ flex: "1 1 320px", minWidth: 300, padding: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", padding: "14px 16px 8px" }}>Top eventos</div>
          <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Evento", "Tipo", "#", "Sesiones"].map((h, i) => <th key={i} style={{ textAlign: i >= 2 ? "right" : "left", padding: "9px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {top.map((t, i) => (
                <tr key={i}>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.ev}>{t.ev}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11.5 }}>{t.event_type}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>{t.n}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-secondary)" }}>{t.sesiones}</td>
                </tr>
              ))}
              {!loading && top.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin eventos todavía.</td></tr>}
              {loading && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
          </div>
        </div>

        {/* Sesiones */}
        <div className="card" style={{ flex: "1 1 380px", minWidth: 320, padding: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", padding: "14px 16px 8px" }}>Sesiones recientes <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· clic para ver el recorrido</span></div>
          <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Sesión", "Eventos", "Duración", "Chat", "Reg.", "Inicio", ""].map((h, i) => <th key={i} style={{ textAlign: i >= 1 && i <= 2 ? "right" : "left", padding: "9px 12px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} onClick={() => openSession(s.session_id)} style={{ cursor: "pointer" }} className="hover-row">
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--primary)" }}>{s.session_id.slice(0, 8)}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{s.eventos}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-secondary)" }}>{fmtDur(s.duracion_s)}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>{s.uso_chat ? "💬" : "—"}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>{s.registrado ? "✅" : "—"}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDateTime(s.inicio)}</td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    {s.uso_chat && <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); openConv(s.session_id); }}><Icon name="message" size={13} />Ver conversación</button>}
                  </td>
                </tr>
              ))}
              {!loading && sessions.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin sesiones todavía.</td></tr>}
              {loading && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Timeline (recorrido de una sesión) */}
      {openSid && (
        <div onClick={() => setOpenSid(null)} style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 440, maxWidth: "94vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Recorrido de la sesión</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{openSid.slice(0, 12)}…</div>
              </div>
              <button onClick={() => setOpenSid(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              {tlLoading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando recorrido…</div>}
              {!tlLoading && timeline && timeline.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin eventos.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(timeline || []).map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", width: 64, flexShrink: 0, paddingTop: 1 }}>{fmtTime(e.created_at)}</div>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: evColor(e.event_type), flexShrink: 0, marginTop: 5 }} />
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{evLabel(e)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversación del chat invitado */}
      {convSid && (
        <div onClick={() => setConvSid(null)} style={{ position: "fixed", inset: 0, zIndex: 710, background: "rgba(10,13,20,0.55)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 560, maxWidth: "95vw", maxHeight: "88vh", background: "var(--bg-surface)", borderRadius: "var(--r-xl)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Conversación del invitado</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{convSid.slice(0, 12)}…</div>
              </div>
              <button onClick={() => setConvSid(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {convLoading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando conversación…</div>}
              {!convLoading && conv && conv.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin mensajes guardados para esta sesión.</div>}
              {(conv || []).map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                    background: m.role === "user" ? "var(--primary)" : "var(--bg-elevated-2)",
                    color: m.role === "user" ? "#fff" : "var(--text)",
                    borderBottomRightRadius: m.role === "user" ? 4 : 14, borderBottomLeftRadius: m.role === "user" ? 14 : 4 }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pestaña Conversaciones (auditoría free/trial) ---------- */
function AuditTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [orgs, setOrgs] = useState<AuditOrg[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [org, setOrg] = useState<AuditOrg | null>(null);
  const [sessions, setSessions] = useState<AuditSession[] | null>(null);
  const [sLoading, setSLoading] = useState(false);
  const [openSess, setOpenSess] = useState<AuditSession | null>(null);
  const [thread, setThread] = useState<AuditMessage[] | null>(null);
  const [tLoading, setTLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.adminAuditOrgs(backendUrl, accessToken).then((d) => { setOrgs(d.orgs); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const openOrg = (o: AuditOrg) => {
    setOrg(o); setSessions(null); setSLoading(true);
    api.adminAuditSessions(backendUrl, accessToken, o.org_id).then((d) => { setSessions(d.sessions); setSLoading(false); });
  };
  const openThread = (s: AuditSession) => {
    setOpenSess(s); setThread(null); setTLoading(true);
    api.adminAuditThread(backendUrl, accessToken, s.id).then((d) => { setThread(d.messages); setTLoading(false); });
  };

  const fmt = (x: string | null) => { try { return x ? new Date(x).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };
  const j = (v: unknown) => { try { const s = typeof v === "string" ? v : JSON.stringify(v, null, 2); return s.length > 2000 ? s.slice(0, 2000) + "…" : s; } catch { return String(v); } };

  const list = (orgs || []).filter((o) => !q || `${o.emails.join(" ")} ${o.name || ""}`.toLowerCase().includes(q.toLowerCase()));

  const renderPart = (p: AuditPart, i: number) => {
    if (p.type === "text" && p.text) return <p key={i} style={{ margin: "2px 0", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{p.text}</p>;
    if (p.type === "thinking" && p.text) return (
      <details key={i} style={{ margin: "4px 0" }}>
        <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>💭 Pensó</summary>
        <div style={{ whiteSpace: "pre-wrap", fontSize: 12.5, color: "var(--text-secondary)", background: "var(--bg-base)", borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>{p.text}</div>
      </details>
    );
    if (p.type === "tool_use") return (
      <div key={i} style={{ margin: "5px 0", fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>🔧 {p.tool_name || "herramienta"}</span>
        {p.input != null && <pre style={{ margin: "3px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--bg-base)", borderRadius: 8, padding: "6px 9px", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{j(p.input)}</pre>}
      </div>
    );
    if (p.type === "tool_result") return (
      <div key={i} style={{ margin: "5px 0", fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>↳ resultado</span>
        <pre style={{ margin: "3px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--bg-base)", borderRadius: 8, padding: "6px 9px", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{j(p.output ?? p.text)}</pre>
      </div>
    );
    if (p.text) return <p key={i} style={{ margin: "2px 0", fontSize: 12.5, color: "var(--text-secondary)" }}>[{p.type}] {p.text}</p>;
    return null;
  };

  return (
    <div>
      {!org ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <input placeholder="Buscar por email u organización…" value={q} onChange={(e) => setQ(e.target.value)}
              style={{ flex: 1, maxWidth: 360, padding: "9px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--bg-base)", fontSize: 14, color: "var(--text)", outline: "none" }} />
            <span style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
              <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
                {["Organización / usuario", "Plan", "Chats", "Última actividad"].map((h, i) => <th key={i} style={{ textAlign: i >= 2 ? "right" : "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.org_id} onClick={() => openOrg(o)} style={{ cursor: "pointer" }} className="hover-row">
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 600 }}>{o.emails[0] || o.name || o.org_id.slice(0, 8)}</div>
                      {o.emails.length > 1 && <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>+{o.emails.length - 1} más</div>}
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--success)", background: "var(--success-soft)", borderRadius: "var(--r-pill)", padding: "2px 8px" }}>{o.plan}</span></td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>{o.sessions}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(o.last_activity)}</td>
                  </tr>
                ))}
                {!loading && list.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin conversaciones.</td></tr>}
                {loading && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setOrg(null); setSessions(null); }}>← Volver</button>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{org.emails[0] || org.name || org.org_id.slice(0, 8)}</div>
            <span style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={() => openOrg(org)}><Icon name="refresh" size={15} />Actualizar</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
              <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
                {["Título", "Usuario", "Tier", "Creado", "Actualizado"].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(sessions || []).map((s) => (
                  <tr key={s.id} onClick={() => openThread(s)} style={{ cursor: "pointer" }} className="hover-row">
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(sin título)</span>}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12 }}>{s.email || "—"}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11.5 }}>{s.model_tier || "—"}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(s.created_at)}</td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(s.updated_at)}</td>
                  </tr>
                ))}
                {!sLoading && (sessions || []).length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin sesiones.</td></tr>}
                {sLoading && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* Drawer: hilo completo de la sesión */}
      {openSess && (
        <div onClick={() => setOpenSess(null)} style={{ position: "fixed", inset: 0, zIndex: 710, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(3px)", display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 560, maxWidth: "96vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{openSess.title || "Conversación"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{openSess.email || "—"}</div>
              </div>
              <button onClick={() => setOpenSess(null)} className="focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "var(--bg-elevated-2)" }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              {tLoading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando conversación…</div>}
              {!tLoading && thread && thread.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin mensajes.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(thread || []).map((m, mi) => (
                  <div key={mi} style={{ borderLeft: `3px solid ${m.role === "user" ? "var(--primary)" : m.role === "assistant" ? "var(--success)" : "var(--border-strong)"}`, paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                      {m.role === "user" ? "Usuario" : m.role === "assistant" ? "Jurovia" : m.role} {m.model && <span style={{ fontWeight: 400, textTransform: "none" }}>· {m.model}</span>}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--text)" }}>
                      {(m.parts || []).map((p, pi) => renderPart(p, pi))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

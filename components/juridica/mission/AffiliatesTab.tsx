/* Admin · Programa de Afiliados — crear afiliados, ver comisiones/ventas y pagar saldos. */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api } from "./data";

type Stats = { pending: number; approved: number; paid: number; reversed: number; balance: number; count_sales: number };
type Aff = {
  id: string; code: string; name?: string | null; email?: string | null; status?: string;
  commission_pct?: number; commission_type?: string; commission_base?: string; commission_months?: number;
  stats?: Stats;
};

const money = (n?: number) => `$${(Number(n || 0)).toFixed(2)}`;
const pct = (n?: number) => `${Math.round((Number(n || 0)) * 100)}%`;

export function AffiliatesTab({ backendUrl, accessToken, pushToast }: {
  backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void;
}) {
  const [items, setItems] = useState<Aff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", code: "", commission_pct: 30, commission_type: "recurring", commission_base: "net", commission_months: 12 });
  const [detail, setDetail] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!backendUrl || !accessToken) return;
    setLoading(true);
    api.adminAffiliates(backendUrl, accessToken).then((r) => { setItems(r.items || []); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name && !form.code) { pushToast("Pon al menos un nombre o código", "warning"); return; }
    setBusy(true);
    const r = await api.adminAffiliateSave(backendUrl, accessToken, {
      name: form.name || null, email: form.email || null, code: form.code || null,
      commission_pct: Number(form.commission_pct) / 100, commission_type: form.commission_type,
      commission_base: form.commission_base, commission_months: Number(form.commission_months),
    });
    setBusy(false);
    if (r?.id) {
      pushToast(`Afiliado creado · ${r.link || r.code}`, "success");
      setShowNew(false); setForm({ name: "", email: "", code: "", commission_pct: 30, commission_type: "recurring", commission_base: "net", commission_months: 12 });
      load();
    } else pushToast("No se pudo crear (¿código duplicado?)", "warning");
  }

  async function approveDue() {
    setBusy(true);
    const r = await api.adminApproveDue(backendUrl, accessToken);
    setBusy(false);
    pushToast(`Aprobadas ${r?.approved ?? 0} comisiones vencidas`, "success");
    load();
  }

  async function payout(a: Aff) {
    if (!a.stats?.approved) { pushToast("Sin saldo aprobado por pagar", "warning"); return; }
    const ref = window.prompt(`Pagar ${money(a.stats.approved)} a ${a.name || a.code}. Referencia del pago (opcional):`, "");
    if (ref === null) return;
    setBusy(true);
    const r = await api.adminCreatePayout(backendUrl, accessToken, a.id, ref || undefined);
    setBusy(false);
    if (r?.payout_id) { pushToast(`Pagado ${money(r.amount_usd)} (${r.commissions} comisiones)`, "success"); load(); if (detail?.affiliate?.id === a.id) openDetail(a.id); }
    else pushToast("No se pudo registrar el pago", "warning");
  }

  async function openDetail(id: string) {
    const d = await api.adminAffiliateDetail(backendUrl, accessToken, id);
    setDetail(d);
  }

  const copy = (link: string) => { try { navigator.clipboard.writeText(link); pushToast("Link copiado", "success"); } catch { /* ignore */ } };
  const link = (code: string) => `https://juroviapp.com/?ref=${code}`;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Afiliados</h2>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: 14 }}>Da un link a cada influencer; gana comisión por cada suscripción vendida con su link.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={approveDue} disabled={busy}><Icon name="check" size={15} />Aprobar vencidas</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew((v) => !v)}><Icon name="plus" size={15} stroke={2.2} />Nuevo afiliado</button>
        </div>
      </div>

      {showNew && (
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
            <label style={{ fontSize: 12.5 }}>Nombre<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Gary Vee" /></label>
            <label style={{ fontSize: 12.5 }}>Email<input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="opcional" /></label>
            <label style={{ fontSize: 12.5 }}>Código (?ref=)<input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="auto si vacío" /></label>
            <label style={{ fontSize: 12.5 }}>Comisión %<input className="input" type="number" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })} /></label>
            <label style={{ fontSize: 12.5 }}>Tipo<select className="input" value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}><option value="recurring">Recurrente</option><option value="one_time">Única</option></select></label>
            <label style={{ fontSize: 12.5 }}>Base<select className="input" value={form.commission_base} onChange={(e) => setForm({ ...form, commission_base: e.target.value })}><option value="net">Neto</option><option value="gross">Bruto</option></select></label>
            <label style={{ fontSize: 12.5 }}>Meses (recurrente)<input className="input" type="number" value={form.commission_months} onChange={(e) => setForm({ ...form, commission_months: Number(e.target.value) })} /></label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={create} disabled={busy}>Crear afiliado</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>{loading ? "Cargando…" : "Aún no hay afiliados. Crea el primero."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((a) => (
            <div key={a.id} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 650, fontSize: 15 }}>{a.name || a.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: a.status === "active" ? "var(--success)" : "var(--text-muted)", background: a.status === "active" ? "var(--success-soft)" : "var(--bg-elevated-2)", borderRadius: 999, padding: "1px 8px" }}>{a.status}</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{pct(a.commission_pct)} · {a.commission_type === "one_time" ? "única" : "recurrente"} · {a.commission_base}</span>
                  </div>
                  <button onClick={() => copy(link(a.code))} style={{ marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <Icon name="link2" size={12} /> {link(a.code)} · copiar
                  </button>
                </div>
                <div style={{ display: "flex", gap: 16, textAlign: "center", fontSize: 12.5 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{a.stats?.count_sales ?? 0}</div><div style={{ color: "var(--text-muted)" }}>ventas</div></div>
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{money(a.stats?.balance)}</div><div style={{ color: "var(--text-muted)" }}>saldo</div></div>
                  <div><div style={{ fontWeight: 700, fontSize: 16, color: "var(--success)" }}>{money(a.stats?.approved)}</div><div style={{ color: "var(--text-muted)" }}>por pagar</div></div>
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{money(a.stats?.paid)}</div><div style={{ color: "var(--text-muted)" }}>pagado</div></div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openDetail(a.id)}>Ver</button>
                  <button className="btn btn-primary btn-sm" onClick={() => payout(a)} disabled={busy || !a.stats?.approved}>Pagar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(13,19,32,.45)", display: "grid", placeItems: "center", zIndex: 300, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 720, width: "100%", padding: 22, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{detail.affiliate?.name || detail.affiliate?.code}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>{detail.clicks ?? 0} clics · {detail.stats?.count_sales ?? 0} ventas · saldo {money(detail.stats?.balance)} · por pagar {money(detail.stats?.approved)}</div>
            <div style={{ fontWeight: 650, fontSize: 13, marginBottom: 6 }}>Comisiones</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(detail.commissions || []).slice(0, 40).map((c: any) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "7px 10px", background: "var(--bg-elevated-2)", borderRadius: 8 }}>
                  <span>{(c.occurred_at || c.created_at || "").slice(0, 10)} · {c.kind} · {money(c.amount_usd)}</span>
                  <span style={{ fontWeight: 700, color: c.status === "paid" ? "var(--success)" : c.status === "reversed" ? "var(--danger,#DC2626)" : c.status === "approved" ? "var(--primary)" : "var(--text-muted)" }}>{c.status}</span>
                </div>
              ))}
              {(!detail.commissions || detail.commissions.length === 0) && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin comisiones aún.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

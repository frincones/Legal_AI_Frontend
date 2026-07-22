/* Embudo de Planes (Admin) — del demo a la compra, con leads + email para follow-up.
   Solo lectura. Fuente: GET /api/admin/plans-funnel (RPC admin_plans_funnel, migración 0045). */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type PlansFunnel, type PlansFunnelLead } from "./data";

export function PlansFunnelTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<PlansFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "compraron" | "no_compraron" | "abandonaron">("todos");

  const load = useCallback(() => {
    setLoading(true);
    api.adminPlansFunnel(backendUrl, accessToken).then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const num = (x: number | undefined) => x ?? 0;
  const money = (x: number | null | undefined) => (x == null ? "—" : `$${Number(x).toFixed(2)}`);
  const fdate = (s: string | null) => (s ? new Date(s).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

  const F = data?.funnel ?? {};
  const leads = data?.leads ?? [];
  const purchasedLeads = leads.filter((l) => l.purchased);
  const revenue = purchasedLeads.reduce((a, l) => a + (l.gross_usd ?? 0), 0);
  const convRate = leads.length ? Math.round((purchasedLeads.length / leads.length) * 100) : 0;

  const steps = [
    { label: "Demo abierto (chat en vivo)", n: num(F.demo_opened_sess), ev: num(F.demo_opened), color: "var(--text-secondary)" },
    { label: "Abrió la modal de planes", n: num(F.plans_opened_sess), ev: num(F.plans_opened), color: "#7B3DF5" },
    { label: "Seleccionó un plan", n: num(F.plan_selected_sess), ev: num(F.plan_selected), color: "#2F6BFF" },
    { label: "Llegó al checkout", n: num(F.checkout_started_sess), ev: num(F.checkout_started), color: "#D23BE0" },
    { label: "Compró", n: num(F.purchased_sess), ev: num(F.purchased), color: "var(--success)" },
  ];
  const maxN = Math.max(1, ...steps.map((s) => s.n));

  const shown = leads.filter((l) =>
    filter === "todos" ? true : filter === "compraron" ? l.purchased : filter === "abandonaron" ? (l.abandoned && !l.purchased) : !l.purchased);

  function exportCSV() {
    const cols: (keyof PlansFunnelLead)[] = ["email", "name", "city", "user_type", "practice_area", "phone", "source", "status", "created_at", "reached_checkout", "abandoned", "purchased", "gross_usd", "purchased_at"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...leads.map((l) => cols.map((c) => esc((l as Record<string, unknown>)[c])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "embudo_planes_jurovia.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const Kpi = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ padding: 16, flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 750, marginTop: 4, color: color ?? "var(--text)", letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );

  if (loading && !data) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Cargando embudo…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Embudo de Planes</div>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>del demo a la compra · con emails para follow-up</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Icon name="download" size={15} />Exportar CSV</button>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Kpi label="Leads (dejaron email)" value={leads.length} />
        <Kpi label="Compraron" value={purchasedLeads.length} color="var(--success)" />
        <Kpi label="Conversión (lead→compra)" value={`${convRate}%`} color="#7B3DF5" />
        <Kpi label="Ingresos (bruto)" value={money(revenue)} color="var(--success)" />
        <Kpi label="Abandonó checkout" value={num(F.checkout_abandoned)} color="var(--warning)" />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 650, marginBottom: 14 }}>Embudo (sesiones únicas)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 190, fontSize: 13, color: "var(--text-secondary)", flexShrink: 0 }}>{s.label}</div>
              <div style={{ flex: 1, background: "var(--bg-elevated-2)", borderRadius: 8, height: 30, position: "relative", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(3, (s.n / maxN) * 100)}%`, height: "100%", background: s.color, borderRadius: 8, transition: "width .4s", opacity: 0.85 }} />
                <span style={{ position: "absolute", left: 10, top: 0, height: "100%", display: "flex", alignItems: "center", fontSize: 12.5, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.35)" }}>{s.n} sesiones · {s.ev} eventos</span>
              </div>
              <div style={{ width: 60, textAlign: "right", fontSize: 12.5, fontWeight: 700, color: i === 0 ? "var(--text-muted)" : "var(--text)", flexShrink: 0 }}>
                {i === 0 ? "100%" : pct(s.n, steps[i - 1].n)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>El % es la conversión respecto al paso anterior. El tramo alto (abrir/abandonar) es anónimo; el email existe desde “seleccionó un plan”.</div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 650 }}>Personas que entraron al flujo ({shown.length})</div>
          <span style={{ flex: 1 }} />
          {([["todos", "Todos"], ["compraron", "Compraron"], ["no_compraron", "No compraron"], ["abandonaron", "Abandonaron"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className="btn btn-sm" style={{ background: filter === k ? "var(--primary)" : "var(--bg-elevated-2)", color: filter === k ? "#fff" : "var(--text-secondary)", border: "none" }}>{l}</button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated-2)", textAlign: "left" }}>
                {["Correo", "Nombre", "Ciudad", "Tipo", "Origen", "Estado", "Checkout", "Compró", "Monto", "Registro"].map((h) => (
                  <th key={h} style={{ padding: "9px 12px", fontWeight: 650, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: l.purchased ? "var(--success-soft)" : undefined }}>
                  <td style={{ padding: "9px 12px", fontWeight: 600, whiteSpace: "nowrap" }}>{l.email}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{l.name || "—"}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{l.city || "—"}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{l.user_type || "—"}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}><span style={{ fontSize: 11, background: "var(--bg-elevated-2)", padding: "2px 7px", borderRadius: 6 }}>{l.source || "—"}</span></td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{l.status || "—"}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{l.abandoned ? "🚪 abandonó" : l.reached_checkout ? "🛒 llegó" : "—"}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{l.purchased ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", background: "var(--success-soft)", padding: "2px 8px", borderRadius: 999 }}>✓ Sí</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap", fontWeight: 600 }}>{money(l.gross_usd)}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{fdate(l.created_at)}</td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={10} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin registros para este filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

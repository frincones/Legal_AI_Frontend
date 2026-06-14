/* Panel admin (solo emails admin) — gestiona créditos por org y ve consumo/costo. */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api } from "./data";

type Org = { id: string; name: string | null; balance: number | null; cap: number | null; members: number; cost_usd: number; actions: number; last_activity: string | null };

export function AdminPanel({
  backendUrl, accessToken, pushToast,
}: {
  backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void;
}) {
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
    <div className="no-scrollbar" style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "34px 36px 56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="shieldCheck" size={24} style={{ color: "#fff" }} /></span>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 25, fontWeight: 650, margin: 0 }}>Admin · Créditos por organización</h1>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 3 }}>Consumo, costo estimado y gestión de saldo de cada org.</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => act(o, "grant")} style={{ marginRight: 6 }}>Otorgar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => act(o, "set")} style={{ marginRight: 6 }}>Fijar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => act(o, "reset")}>Reset</button>
                  </td>
                </tr>
              ))}
              {!loading && orgs.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin organizaciones.</td></tr>}
              {loading && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

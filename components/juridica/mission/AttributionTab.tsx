"use client";
/* Admin → Crecimiento → Atribución ("Hyros-lite"): de qué campaña→anuncio llegó cada evento del embudo
   (visitantes → registros → demos → checkouts → trials → compras + ingresos), con toggle first/last touch.
   First-party server-side (sobrevive al pixel roto del in-app de FB). Solo lectura. */
import { useCallback, useEffect, useState } from "react";
import { api, type AttribData } from "./data";

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

export function AttributionTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<AttribData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [model, setModel] = useState<"first" | "last">("first");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.adminAttribution(backendUrl, accessToken, days, model, appliedFrom || undefined, appliedTo || undefined)
      .then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken, days, model, appliedFrom, appliedTo]);
  useEffect(() => { load(); }, [load]);

  const validRange = !!(from && to) && new Date(to).getTime() > new Date(from).getTime();
  const applyRange = () => { if (validRange) { setAppliedFrom(new Date(from).toISOString()); setAppliedTo(new Date(to).toISOString()); } };
  const rangeActive = !!(appliedFrom && appliedTo);
  const pickDays = (d: number) => { setFrom(""); setTo(""); setAppliedFrom(""); setAppliedTo(""); setDays(d); };

  const rows = data?.rows || [];
  const tot = data?.totals || {};
  const Card = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="card" style={{ flex: "1 1 110px", minWidth: 110, padding: "13px 15px" }}>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "var(--text)", marginTop: 3 }}>{value}</div>
    </div>
  );
  const cols: [string, keyof typeof rows[number]][] = [
    ["Visitantes", "visitantes"], ["Registros", "registros"], ["Demos", "demos"],
    ["Checkouts", "checkouts"], ["Trials", "trials"], ["Compras", "compradores"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Atribución de anuncios</span>
        <span style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden", marginLeft: 6 }}>
          <button onClick={() => setModel("first")} className={model === "first" ? "btn btn-primary" : "btn btn-secondary"} style={{ padding: "6px 12px", fontSize: 12, border: "none", borderRadius: 0 }}>First-touch</button>
          <button onClick={() => setModel("last")} className={model === "last" ? "btn btn-primary" : "btn btn-secondary"} style={{ padding: "6px 12px", fontSize: 12, border: "none", borderRadius: 0 }}>Last-touch</button>
        </span>
        <span style={{ flex: 1 }} />
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => pickDays(d)} className={!rangeActive && days === d ? "btn btn-primary" : "btn btn-secondary"} style={{ padding: "6px 12px", fontSize: 12.5 }}>{d}d</button>
        ))}
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" style={{ padding: "6px 10px", fontSize: 12.5 }} />
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>→</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" style={{ padding: "6px 10px", fontSize: 12.5 }} />
        <button onClick={applyRange} disabled={!validRange} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5, opacity: validRange ? 1 : .5 }}>Aplicar</button>
        {rangeActive && <button onClick={() => pickDays(30)} className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: 12.5 }}>Limpiar</button>}
        <button onClick={load} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12.5 }}>↻ Actualizar</button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -6 }}>
        Atribución first-party (server-side), independiente del pixel — recupera el origen que el navegador in-app de Facebook pierde. {model === "first" ? "First-touch = primer anuncio que trajo a la persona." : "Last-touch = último anuncio antes de convertir."}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Card label="Visitantes de ads" value={tot.visitantes ?? 0} color="var(--primary)" />
            <Card label="Registros" value={tot.registros ?? 0} />
            <Card label="Demos" value={tot.demos ?? 0} />
            <Card label="Checkouts" value={tot.checkouts ?? 0} />
            <Card label="Trials" value={tot.trials ?? 0} />
            <Card label="Ingresos" value={money(tot.ingresos ?? 0)} color="var(--success)" />
          </div>

          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 720 }}>
              <thead>
                <tr style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>
                  <th style={{ padding: "11px 14px", textAlign: "left" }}>Campaña</th>
                  <th style={{ padding: "11px 10px", textAlign: "left" }}>Anuncio</th>
                  {cols.map(([label]) => <th key={label} style={{ padding: "11px 10px" }}>{label}</th>)}
                  <th style={{ padding: "11px 14px" }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)", textAlign: "right" }}>
                    <td style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700 }}>{r.campaign}</td>
                    <td style={{ padding: "10px 10px", textAlign: "left", color: "var(--text-secondary)" }}>{r.content}</td>
                    {cols.map(([label, key]) => <td key={label} style={{ padding: "10px 10px", fontVariantNumeric: "tabular-nums" }}>{r[key] as number}</td>)}
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: r.ingresos > 0 ? "var(--success)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{r.ingresos > 0 ? money(r.ingresos) : "—"}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "var(--text-muted)" }}>Aún sin tráfico de anuncios atribuido en este rango. Asegúrate de que las URLs de la pauta lleven UTMs (ej. <code>?planes&utm_campaign=rt_cierre&utm_content=c1</code>) — el fbclid se captura solo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

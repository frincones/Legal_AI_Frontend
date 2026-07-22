"use client";
/* Admin → Producto → VSL: analítica del video del muro al detalle (estilo VTurb).
   Views/Plays/Play rate/Engagement/Hook/Pitch/Completion/Unmute, funnel video→compra, origen del tráfico,
   dispositivos, curva de retención con tooltip interactivo + marcador del pitch, y momento de conversión.
   Filtro de rango de fechas + botón Actualizar. Solo lectura. */
import { useCallback, useEffect, useState } from "react";
import { api, type VslStats } from "./data";
import { JV_AURORA } from "../atoms";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VSLTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [data, setData] = useState<VslStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [pitch, setPitch] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.adminVsl(backendUrl, accessToken, days, appliedFrom || undefined, appliedTo || undefined)
      .then((d) => { setData(d); setLoading(false); });
  }, [backendUrl, accessToken, days, appliedFrom, appliedTo]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.vslConfig(backendUrl).then((c) => setPitch(c.pitch_seconds || 0)).catch(() => {}); }, [backendUrl]);

  const validRange = !!(from && to) && new Date(to).getTime() > new Date(from).getTime();
  const applyRange = () => { if (validRange) { setAppliedFrom(new Date(from).toISOString()); setAppliedTo(new Date(to).toISOString()); } };
  const pickDays = (d: number) => { setFrom(""); setTo(""); setAppliedFrom(""); setAppliedTo(""); setDays(d); };
  const rangeActive = !!(appliedFrom && appliedTo);

  const ret = data?.retention || [];
  const conv = data?.conversions_by_sec || [];
  const funnel = data?.funnel || [];
  const sources = data?.sources || [];
  const devices = data?.devices || [];
  const drops = data?.dropoffs || [];
  const retMax = Math.max(1, ...ret.map((r) => r.viewers));
  const convMax = Math.max(1, ...conv.map((c) => c.n));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.n));
  const devMax = Math.max(1, ...devices.map((d) => d.n));
  const lastSec = ret.length ? ret[ret.length - 1].sec : 1;
  const W = 640, H = 180, pad = 24;
  const px = (i: number) => pad + (ret.length > 1 ? i / (ret.length - 1) : 0) * (W - 2 * pad);
  const py = (v: number) => H - pad - (v / retMax) * (H - 2 * pad);
  const line = ret.map((r, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(r.viewers).toFixed(1)}`).join(" ");
  const area = ret.length ? `${line} L ${W - pad} ${H - pad} L ${pad} ${H - pad} Z` : "";
  const pitchLeft = pitch > 0 && lastSec > 0 ? Math.min(100, (pitch / lastSec) * 100) : null;

  const Card = ({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) => (
    <div className="card" style={{ flex: "1 1 110px", minWidth: 110, padding: "13px 15px" }}>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "var(--text)", marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
  const Panel = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{title} {hint && <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{hint}</span>}</div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controles: rango + actualizar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>VSL del muro</span>
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

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Card label="Aterrizaron" value={data?.views ?? 0} sub="abren el muro" />
            <Card label="Reprodujeron" value={data?.plays ?? 0} sub={`play rate ${data?.play_rate ?? 0}%`} color="var(--primary)" />
            <Card label="Engagement" value={`${data?.engagement_pct ?? 0}%`} sub="% del video visto" />
            <Card label="Watch time" value={fmt(data?.avg_watch_s ?? 0)} sub={`mediana ${fmt(data?.median_watch_s ?? 0)}`} />
            <Card label="Hook (≥10s)" value={`${data?.hook_rate ?? 0}%`} />
            <Card label="Llegaron al pitch" value={data?.pitch_reached ?? 0} sub={`${data?.pitch_rate ?? 0}% de plays`} color="var(--success)" />
            <Card label="Completaron" value={`${data?.completion_rate ?? 0}%`} />
            <Card label="Activaron sonido" value={`${data?.unmute_rate ?? 0}%`} />
            <Card label="Clics CTA" value={data?.cta_clicks ?? 0} />
            <Card label="Intentos de saltar" value={data?.seek_blocks ?? 0} />
          </div>

          {/* Curva de retención con tooltip */}
          <Panel title="Curva de retención" hint="(pasa el cursor para ver el detalle por momento)">
            {ret.length ? (
              <div style={{ position: "relative", width: "100%" }} onMouseLeave={() => setHover(null)}
                onMouseMove={(e) => { const w = e.currentTarget.clientWidth; const f = Math.max(0, Math.min(1, e.nativeEvent.offsetX / w)); setHover(Math.round(f * (ret.length - 1))); }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 180, display: "block" }} preserveAspectRatio="none">
                  {area && <path d={area} fill="var(--primary-soft)" />}
                  <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                  {ret.filter((_, i) => i % Math.ceil(ret.length / 6) === 0).map((r, i) => (
                    <text key={i} x={px(ret.indexOf(r))} y={H - 6} fontSize="10" fill="var(--text-muted)" textAnchor="middle">{fmt(r.sec)}</text>
                  ))}
                </svg>
                {/* marcador del pitch */}
                {pitchLeft != null && (
                  <div style={{ position: "absolute", top: 0, bottom: 18, left: `${pitchLeft}%`, width: 0, borderLeft: "2px dashed var(--gold, #D4AF37)", pointerEvents: "none" }}>
                    <span style={{ position: "absolute", top: -2, left: 4, fontSize: 9.5, fontWeight: 800, color: "var(--gold, #D4AF37)", whiteSpace: "nowrap" }}>pitch {fmt(pitch)}</span>
                  </div>
                )}
                {/* guía + punto + tooltip en hover */}
                {hover != null && ret[hover] && (() => {
                  const r = ret[hover]; const leftPct = ret.length > 1 ? (hover / (ret.length - 1)) * 100 : 0; const yy = py(r.viewers);
                  return <>
                    <div style={{ position: "absolute", top: 0, bottom: 18, left: `${leftPct}%`, width: 0, borderLeft: "1px solid var(--border-strong)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", left: `${leftPct}%`, top: yy, width: 9, height: 9, borderRadius: "50%", background: "var(--primary)", border: "2px solid var(--bg-surface)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", left: `${leftPct}%`, top: 4, transform: `translateX(${leftPct > 60 ? "-105%" : "8px"})`, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 11px", fontSize: 12, boxShadow: "var(--sh-2, 0 8px 20px -10px rgba(0,0,0,.4))", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 3 }}>
                      <div style={{ fontWeight: 800 }}>{fmt(r.sec)}</div>
                      <div style={{ color: "var(--text-muted)", marginTop: 2 }}><b style={{ color: "var(--text)" }}>{r.viewers}</b> viendo · {r.pct}% de plays</div>
                      {r.drop > 0 && <div style={{ color: "var(--danger, #DC2626)", marginTop: 1 }}>▼ {r.drop}% dejaron aquí</div>}
                    </div>
                  </>;
                })()}
              </div>
            ) : <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Aún sin datos de reproducción.</div>}
            {drops.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)", alignSelf: "center" }}>Mayores caídas:</span>
                {drops.map((d, i) => (
                  <span key={i} style={{ fontSize: 11.5, fontWeight: 700, color: "var(--danger, #DC2626)", background: "rgba(220,38,38,.08)", borderRadius: 999, padding: "3px 9px" }}>{fmt(d.sec)} · −{d.drop_pct}%</span>
                ))}
              </div>
            )}
          </Panel>

          {/* Funnel video → compra */}
          <Panel title="Embudo del VSL" hint="(sesiones en cada paso)">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {funnel.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 170, fontSize: 12.5, color: "var(--text-secondary)", flexShrink: 0 }}>{f.step}</div>
                  <div style={{ flex: 1, height: 22, background: "var(--bg-elevated)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(f.n / funnelMax) * 100}%`, background: JV_AURORA, minWidth: f.n ? 4 : 0 }} />
                  </div>
                  <div style={{ width: 84, textAlign: "right", fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                    {f.n}{i > 0 && funnel[0].n > 0 && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> · {Math.round((f.n / funnel[0].n) * 100)}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {/* Origen del tráfico */}
            <div style={{ flex: "1 1 340px", minWidth: 300 }}>
              <Panel title="Origen del tráfico" hint="(dónde aterrizan)">
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ flex: 1 }}>Origen</span><span style={{ width: 70, textAlign: "right" }}>Aterrizan</span><span style={{ width: 60, textAlign: "right" }}>Plays</span><span style={{ width: 56, textAlign: "right" }}>Play %</span>
                  </div>
                  {sources.map((s, i) => (
                    <div key={i} style={{ display: "flex", fontSize: 12.5, alignItems: "center" }}>
                      <span style={{ flex: 1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.source}</span>
                      <span style={{ width: 70, textAlign: "right" }}>{s.views}</span>
                      <span style={{ width: 60, textAlign: "right" }}>{s.plays}</span>
                      <span style={{ width: 56, textAlign: "right", color: s.views && s.plays / s.views < 0.05 ? "var(--danger, #DC2626)" : "var(--text)" }}>{s.views ? Math.round((s.plays / s.views) * 100) : 0}%</span>
                    </div>
                  ))}
                  {!sources.length && <div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>Sin datos.</div>}
                </div>
              </Panel>
            </div>
            {/* Dispositivos */}
            <div style={{ flex: "1 1 240px", minWidth: 220 }}>
              <Panel title="Dispositivos">
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {devices.map((d, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}><span style={{ textTransform: "capitalize" }}>{d.device}</span><b>{d.n}</b></div>
                      <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${(d.n / devMax) * 100}%`, background: "var(--primary)" }} /></div>
                    </div>
                  ))}
                  {!devices.length && <div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>Sin datos.</div>}
                </div>
              </Panel>
            </div>
          </div>

          {/* Momento de mayor conversión */}
          <Panel title="Momento de mayor conversión" hint="(clics de plan / checkout / compra, por segundo del video)">
            {conv.length ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140 }}>
                {conv.map((c, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.n}</div>
                    <div style={{ width: "100%", maxWidth: 26, height: `${(c.n / convMax) * 100}%`, minHeight: 3, background: JV_AURORA, borderRadius: 4 }} />
                    <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>{fmt(c.sec)}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Aún sin conversiones ligadas al video.</div>}
          </Panel>
        </>
      )}
    </div>
  );
}

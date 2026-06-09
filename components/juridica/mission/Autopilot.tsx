/* Autopilot — feed "mientras no estabas". */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type AutopilotSummary } from "./data";
import { ConfirmNote, SEVERITY } from "./atoms";

export function Autopilot({
  backendUrl, accessToken, onOpenMission, onNavigate, pushToast,
}: {
  backendUrl: string; accessToken: string;
  onOpenMission: (id: string) => void; onNavigate: (r: string) => void; pushToast: (t: string, k?: string) => void;
}) {
  const [ap, setAp] = useState<AutopilotSummary | null>(null);
  const load = useCallback(() => { if (backendUrl && accessToken) api.autopilot(backendUrl, accessToken).then(setAp); }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);
  const paused = ap?.status === "En pausa";

  return (
    <div className="no-scrollbar" style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "34px 36px 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
          <span style={{ width: 52, height: 52, borderRadius: 15, background: "var(--aurora)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="radar" size={26} style={{ color: "#fff" }} /></span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 26, fontWeight: 650, margin: 0 }}>Autopilot</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13.5, color: "var(--text-secondary)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: paused ? "var(--text-muted)" : "var(--success)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: paused ? "var(--text-muted)" : "var(--success)" }} />{ap?.status || "Activo"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={async () => { pushToast("Revisando…", "primary"); await api.runAutopilot(backendUrl, accessToken); load(); }}><Icon name="refresh" size={15} />Revisar ahora</button>
            <button className="btn btn-secondary btn-sm" onClick={async () => { await api.pauseAutopilot(backendUrl, accessToken); load(); }}><Icon name={paused ? "play" : "pause"} size={15} />{paused ? "Reanudar" : "Pausar"}</button>
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>Revisé</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {(ap?.reviewed || []).map((r, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                <Icon name={r.icon} size={17} style={{ color: "var(--primary)" }} />
                <div style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 1px" }}>{r.n}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.label}</div>
              </div>
            ))}
            {(!ap || ap.reviewed.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin actividad reciente.</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)" }}>Encontré · requiere tu aprobación</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {(ap?.found || []).map((f) => {
              const m = SEVERITY[f.severity];
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={f.icon} size={18} style={{ color: m.color }} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{f.detail}</div>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => (f.to === "terminos" ? onNavigate("terminos") : f.to ? onOpenMission(f.to) : null)}>{f.action}<Icon name="arrowRight" size={14} /></button>
                </div>
              );
            })}
            {(!ap || ap.found.length === 0) && <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "6px 2px" }}>Nada pendiente. Autopilot sigue vigilando.</div>}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <ConfirmNote icon="shieldCheck">Autopilot detecta y prepara. Nunca actúa ni radica sin tu aprobación.</ConfirmNote>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Autopilot — feed "mientras no estabas". */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type AutopilotSummary } from "./data";
import { ConfirmNote, SEVERITY } from "./atoms";
import { EmptyState } from "../atoms";
import { Coachmark, useFirstVisit } from "../Coachmark";

function fmtWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "hace un momento";
    if (mins < 60) return `hace ${mins} min`;
    if (mins < 1440) return `hace ${Math.round(mins / 60)} h`;
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 16);
  }
}

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
  const [coachShow, coachDismiss] = useFirstVisit("autopilot");
  const isEmpty = !!ap && ap.reviewed.length === 0 && ap.found.length === 0;

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div className="app-pad" style={{ maxWidth: 820, margin: "0 auto" }}>
        <Coachmark
          show={coachShow}
          onDismiss={coachDismiss}
          icon="radar"
          title="Esto es Autopilot"
          body="Jurovia vigila tus casos y te avisa si una norma cambia o si llega algo del juzgado."
        />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
          <span style={{ width: 52, height: 52, borderRadius: 15, background: "var(--aurora)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="radar" size={26} style={{ color: "#fff" }} /></span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className="h2-fluid" style={{ fontWeight: 650, margin: 0 }}>Autopilot</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13.5, color: "var(--text-secondary)", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: paused ? "var(--text-muted)" : "var(--success)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: paused ? "var(--text-muted)" : "var(--success)" }} />{ap?.status || "Activo"}
              </span>
              {ap?.lastRun && <span>· última revisión {fmtWhen(ap.lastRun)}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={async () => { pushToast("Revisando…", "primary"); await api.runAutopilot(backendUrl, accessToken); load(); }}><Icon name="refresh" size={15} />Revisar ahora</button>
            <button className="btn btn-secondary btn-sm" onClick={async () => { await api.pauseAutopilot(backendUrl, accessToken); load(); }}><Icon name={paused ? "play" : "pause"} size={15} />{paused ? "Reanudar" : "Pausar"}</button>
          </div>
        </div>

        {ap?.hint && (
          <div className="card" style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 11, background: "var(--primary-soft-2)", borderColor: "var(--primary)" }}>
            <Icon name="info" size={18} style={{ color: "var(--primary)", marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{ap.hint}</span>
          </div>
        )}

        {isEmpty ? (
          <div className="card" style={{ minHeight: 320 }}>
            <EmptyState
              icon="radar"
              title="Autopilot aún no ha vigilado nada"
              desc="Conecta tu correo y crea un caso para que Jurovia revise tus juzgados, detecte cambios de norma y prepare borradores para tu aprobación."
              cta="Revisar ahora"
              onCta={async () => { pushToast("Revisando…", "primary"); await api.runAutopilot(backendUrl, accessToken); load(); }}
            />
          </div>
        ) : (
        <>
        <div className="card" style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>Revisé</div>
          <div className="grid-resp-3" style={{ gap: 14 }}>
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
        </>
        )}
      </div>
    </div>
  );
}

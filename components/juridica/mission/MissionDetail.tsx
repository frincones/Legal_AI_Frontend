/* Detalle de la misión: header + tabs (Resumen / Actividad / Documentos) + acceso al chat. */
"use client";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type Mission, type TimelineEvent } from "./data";
import { ConfirmNote, ProgressBar, SectionLabel, SEVERITY } from "./atoms";

const TABS: [string, string, string][] = [
  ["resumen", "Resumen", "target"],
  ["actividad", "Actividad", "history"],
  ["documentos", "Documentos", "fileText"],
];

export function MissionDetail({
  backendUrl, accessToken, missionId, onBack, onOpenChat, onApprove, pushToast,
}: {
  backendUrl: string; accessToken: string; missionId: string;
  onBack: () => void; onOpenChat: (id: string) => void; onApprove: () => void; pushToast: (t: string, k?: string) => void;
}) {
  const [m, setM] = useState<Mission | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [tab, setTab] = useState("resumen");

  useEffect(() => {
    if (!backendUrl || !accessToken || !missionId) return;
    api.mission(backendUrl, accessToken, missionId).then(setM);
    api.timeline(backendUrl, accessToken, missionId).then(setTimeline);
  }, [backendUrl, accessToken, missionId]);

  if (!m || !m.id) return <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>Cargando misión…</div>;
  const nt = m.nextTerm;
  const falta = m.requirementsMap?.falta || [];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 22px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} className="btn-ghost focus-ring" style={{ border: "none", width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-secondary)" }}><Icon name="arrowLeft" size={18} /></button>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: `${m.accent}1a`, display: "grid", placeItems: "center" }}><Icon name="folder" size={19} style={{ color: m.accent }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 650, fontSize: 17 }}>{m.title}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 8px" }}>{m.area}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{m.juzgado}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onOpenChat(m.id)}><Icon name="message" size={15} />Trabajar en el chat</button>
        </div>
        {nt?.due && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14, padding: "10px 14px", borderRadius: "var(--r-md)", background: SEVERITY[nt.severity].bg, border: `1px solid ${SEVERITY[nt.severity].color}33` }}>
            <Icon name="calendarClock" size={18} style={{ color: SEVERITY[nt.severity].color }} />
            <span style={{ fontSize: 13.5 }}><strong>Próximo término:</strong> {nt.label} · vence {nt.due} <strong style={{ color: SEVERITY[nt.severity].color }}>({nt.daysLeft} días)</strong></span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "0 22px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        {TABS.map(([id, label, ic]) => (
          <button key={id} onClick={() => setTab(id)} style={{ position: "relative", height: 46, padding: "0 14px", border: "none", background: "transparent", color: tab === id ? "var(--primary)" : "var(--text-secondary)", fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name={ic} size={15} />{label}
            {tab === id && <span style={{ position: "absolute", left: 8, right: 8, bottom: 0, height: 2.5, background: "var(--aurora)", borderRadius: 3 }} />}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div className="no-scrollbar" style={{ flex: 1, minWidth: 0, overflow: "auto", background: "var(--bg-base)", padding: "22px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {tab === "resumen" && <>
            {m.nextBestAction?.label && (
              <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, borderColor: "var(--primary)", background: "var(--primary-soft-2)" }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={20} style={{ color: "#fff" }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--primary)" }}>Próxima acción</div>
                  <div style={{ fontWeight: 650, fontSize: 15.5 }}>{m.nextBestAction.label}</div>
                  {m.nextBestAction.hint && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{m.nextBestAction.hint}</div>}
                </div>
                <button className="btn btn-primary btn-sm" onClick={onApprove}>Revisar<Icon name="arrowRight" size={15} /></button>
              </div>
            )}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontWeight: 650, fontSize: 14.5, flex: 1 }}>Estado de la misión</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--success)", background: "var(--success-soft)", borderRadius: 999, padding: "2px 10px" }}>{m.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 7 }}><span style={{ color: "var(--text-muted)" }}>Progreso</span><strong>{m.progress}%</strong></div>
              <ProgressBar value={m.progress} accent={m.accent} height={7} />
            </div>
            <div style={{ borderRadius: "var(--r-lg)", padding: 1.5, background: "var(--grad-aurora-soft)" }}>
              <div style={{ borderRadius: "calc(var(--r-lg) - 1.5px)", background: "var(--bg-surface)", padding: 18, display: "flex", gap: 13 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={17} style={{ color: "var(--primary)" }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>Recomendación de Juridica</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                    {m.keyFacts || `El caso avanza (${m.progress}%). ${m.nextBestAction?.label ? `La siguiente acción es: ${m.nextBestAction.label.toLowerCase()}.` : "Revisa los datos faltantes para poder avanzar."} ${falta.length > 0 ? "Solicita lo que falta al cliente para evitar demoras." : "Las normas están verificadas."}`}
                  </div>
                  {m.nextBestAction?.label && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-sm btn-primary" onClick={onApprove}><Icon name="check" size={14} />{m.nextBestAction.kind === "approval" ? "Revisar borrador" : "Continuar"}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {falta.length > 0 && (
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Icon name="square" size={16} style={{ color: "var(--gold)" }} /><span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--gold-text)" }}>Datos faltantes</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {falta.map((mm, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={{ width: 17, height: 17, borderRadius: 5, border: "2px solid var(--gold)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5 }}>{mm.label}</span>
                      <button className="btn btn-sm btn-secondary" onClick={() => pushToast("Solicitud enviada al cliente", "success")}><Icon name="message" size={14} />Solicitar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card" style={{ padding: "6px 18px 14px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", margin: "14px 0 4px" }}>Contexto</div>
              {[["Demandante", m.demandante], ["Demandado", m.demandado], ["Radicado", m.radicado], ["Juzgado", m.juzgado]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)", width: 96, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </>}

          {tab === "actividad" && <>
            <SectionLabel icon="history">Línea de tiempo</SectionLabel>
            {timeline.length === 0 && <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Sin eventos todavía.</div>}
            {timeline.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 14, position: "relative", paddingBottom: 18 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0, color: ev.type === "actuacion" ? "var(--gold)" : "var(--primary)" }}><Icon name={ev.type === "actuacion" ? "gavel" : ev.type === "tarea" ? "check" : "fileText"} size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)" }}>{ev.date}</span>
                    {ev.verified && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "var(--gold-text)", background: "var(--gold-soft)", borderRadius: 999, padding: "1px 7px" }}><Icon name="badgeCheck" size={11} stroke={2.4} style={{ color: "var(--gold)" }} />Verificado</span>}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{ev.meta}</div>
                </div>
              </div>
            ))}
          </>}

          {tab === "documentos" && (
            <div className="card" style={{ padding: "30px 22px", textAlign: "center" }}>
              <Icon name="fileText" size={28} style={{ color: "var(--text-muted)" }} />
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 10 }}>Documentos de la misión</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 14 }}>Genera y revisa documentos del caso desde el chat.</div>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenChat(m.id)}><Icon name="message" size={14} />Abrir el chat de la misión</button>
            </div>
          )}

          <ConfirmNote icon="shieldCheck">Los borradores quedan pendientes hasta tu aprobación.</ConfirmNote>
        </div>
        </div>
        <MissionChatPanel title={m.title} onOpenChat={() => onOpenChat(m.id)} />
      </div>
    </div>
  );
}

/* Panel lateral "Asistente de la misión" — abre el chat de la misión. */
function MissionChatPanel({ title, onOpenChat }: { title: string; onOpenChat: () => void }) {
  const sugs = ["¿Qué falta en este caso?", "Redacta el siguiente escrito", "Resume el último auto"];
  return (
    <div className="mission-chat-panel" style={{ width: 360, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={15} style={{ color: "var(--primary)" }} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>Asistente de la misión</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Pregunta sobre este expediente</div>
        </div>
      </div>
      <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: "18px 18px 8px" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>Pregúntame lo que necesites sobre <strong>{title}</strong> — su estado, qué falta, o pídeme que redacte algo.</div>
        <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 9 }}>Sugerencias</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sugs.map((s) => (
            <button key={s} onClick={onOpenChat} style={{ textAlign: "left", border: "1px solid var(--border)", background: "var(--bg-base)", borderRadius: "var(--r-md)", padding: "10px 12px", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--primary-soft-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-base)"; }}>
              <Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />{s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--border)" }}>
        <button onClick={onOpenChat} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "11px 14px", background: "var(--bg-base)", color: "var(--text-muted)", fontSize: 14, cursor: "pointer" }}>
          <Icon name="message" size={16} style={{ color: "var(--primary)" }} />
          <span style={{ flex: 1, textAlign: "left" }}>Pregúntale a esta misión…</span>
          <Icon name="arrowUp" size={16} stroke={2.4} />
        </button>
      </div>
    </div>
  );
}

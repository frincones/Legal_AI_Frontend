/* Inicio operativo (Mission Control) — fidelidad TemplateV2 con data real. */
"use client";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type AttentionData, type AutopilotSummary, type Briefing, type Mission } from "./data";
import { ProgressBar, SectionLabel, SEVERITY } from "./atoms";
import { Coachmark, useFirstVisit } from "../Coachmark";
import { EmptyState } from "../atoms";

type Card = { severity: "critico" | "pronto" | "ok"; gold?: boolean; icon: string; eyebrow: string; title: string; sub: string; suggestion: string; action: string; onAction: () => void };

function HomeCard({ card }: { card: Card }) {
  const m = SEVERITY[card.severity] || SEVERITY.ok;
  const accent = card.gold ? "var(--gold)" : m.color;
  const accentBg = card.gold ? "var(--gold-soft)" : m.bg;
  return (
    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: 168 }}>
      <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: card.gold ? "var(--grad-gold)" : m.dot }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: accentBg, display: "grid", placeItems: "center" }}><Icon name={card.icon} size={16} style={{ color: accent }} /></span>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: accent }}>{card.eyebrow}</span>
      </div>
      <div style={{ fontWeight: 650, fontSize: 15.5, lineHeight: 1.3, marginBottom: 4 }}>{card.title}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.45, marginBottom: 12 }}>{card.sub}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 14, marginTop: "auto" }}>{card.suggestion}</div>
      <button className={`btn btn-sm ${card.severity === "critico" ? "btn-primary" : "btn-secondary"}`} onClick={card.onAction} style={{ alignSelf: "flex-start" }}>
        {card.action}<Icon name="arrowRight" size={15} />
      </button>
    </div>
  );
}

function MissionRow({ exp, onClick }: { exp: Mission; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px", border: "none", borderRadius: "var(--r-md)", background: "transparent", textAlign: "left", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{exp.title}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{exp.progress}%</span>
        </div>
        <ProgressBar value={exp.progress} accent={exp.accent} height={5} />
        {exp.nextBestAction?.label && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}><Icon name="arrowRight" size={12} style={{ color: "var(--primary)" }} />{exp.nextBestAction.label}</div>}
      </div>
      <Icon name="chevronRight" size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
    </button>
  );
}

export function MissionControl({
  backendUrl, accessToken, email, onOpenMission, onNavigate, onNewMission,
}: {
  backendUrl: string; accessToken: string; email: string | null;
  onOpenMission: (id: string) => void; onNavigate: (r: string) => void; onNewMission: () => void;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [att, setAtt] = useState<AttentionData>({ criticos: 0, terminos: 0, actuaciones: 0, items: [] });
  const [ap, setAp] = useState<AutopilotSummary | null>(null);
  const [brief, setBrief] = useState<Briefing | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    api.missions(backendUrl, accessToken).then(setMissions);
    api.attention(backendUrl, accessToken).then(setAtt);
    api.autopilot(backendUrl, accessToken).then(setAp);
    api.briefing(backendUrl, accessToken).then(setBrief);
    try {
      setDateStr(new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" }));
    } catch { /* ignore */ }
  }, [backendUrl, accessToken]);

  const [coachShow, coachDismiss] = useFirstVisit("missioncontrol");
  const name = (email || "").split("@")[0] || "abogado";
  const allClear = att.criticos === 0 && att.terminos === 0 && att.actuaciones === 0;
  const daysLeftOf = (d?: string | null): number | null => {
    if (!d) return null;
    const due = new Date(d + "T00:00:00");
    if (isNaN(due.getTime())) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  };
  const pend = att.pendientesItems || [];

  // Deriva las 3 tarjetas (Urgente / Preparado / Faltante) de la data real.
  const urg = att.items.find((i) => i.severity === "critico") || att.items.find((i) => i.kind === "deadline");
  const prep = att.actuaciones;
  const faltantes = missions.filter((m) => (m.requirementsMap?.falta?.length || 0) > 0);
  const cards: Card[] = [];
  if (urg) cards.push({ severity: "critico", icon: "alert", eyebrow: "Lo urgente", title: urg.title, sub: urg.sub, suggestion: "Acción sugerida: revisar el borrador", action: "Revisar", onAction: () => (urg.expId ? onOpenMission(urg.expId) : onNavigate("terminos")) });
  if (prep > 0) cards.push({ severity: "ok", gold: true, icon: "sparkles", eyebrow: "Lo preparado", title: `Jurovia preparó ${prep} documento${prep > 1 ? "s" : ""}`, sub: "Verificados · listos para tu revisión", suggestion: "Listos para aprobar", action: "Ver", onAction: () => onNavigate("autopilot") });
  if (faltantes.length > 0) {
    const f0 = faltantes[0].requirementsMap?.falta?.[0]?.label || "documentos del cliente";
    cards.push({ severity: "pronto", icon: "paperclip", eyebrow: "Lo faltante", title: `Faltan datos en ${faltantes.length} caso${faltantes.length > 1 ? "s" : ""}`, sub: f0, suggestion: "Puedes solicitarlos en un toque", action: "Solicitar", onAction: () => onOpenMission(faltantes[0].id) });
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div className="app-pad" style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Coachmark
          show={coachShow}
          onDismiss={coachDismiss}
          title="Bienvenido a Mission Control"
          body="Aquí gestionas cada caso: cronología, documentos y avance en un solo lugar."
        />
        {/* Saludo operativo + fecha */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
          <div>
            <h1 className="h1-fluid" style={{ fontWeight: 650, letterSpacing: "-0.025em", margin: 0, textTransform: "capitalize" }}>Hola, {name}.</h1>
            <p style={{ fontSize: 15.5, color: "var(--text-secondary)", margin: "8px 0 0" }}>
              {allClear ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="circleCheck" size={17} style={{ color: "var(--success)" }} />Nada urgente hoy. Tu oficina está al día.</span>
              ) : (
                <>Tu oficina tiene <strong style={{ color: "var(--danger)" }}>{att.criticos} críticos</strong> · <strong style={{ color: "var(--gold-text)" }}>{att.terminos} términos</strong> · <strong>{att.actuaciones} por aprobar</strong>.</>
              )}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Badge de créditos oculto: el uso es 100% interno (no visible para el usuario). */}
            {dateStr && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: "var(--r-pill)", background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 500, textTransform: "capitalize", boxShadow: "var(--sh-1)" }}>
                <Icon name="sun" size={16} style={{ color: "var(--gold)" }} />{dateStr}
              </div>
            )}
          </div>
        </div>

        {/* 🌐 Capa 1 — Inteligencia jurídica del día (valor desde el minuto cero) */}
        {brief?.legal_intel && brief.legal_intel.items.length > 0 && (
          <div style={{ marginBottom: 26 }}>
            <SectionLabel icon="sparkles">Novedades para tu práctica{brief.legal_intel.area ? ` · ${brief.legal_intel.area.charAt(0).toUpperCase() + brief.legal_intel.area.slice(1)}` : ""}</SectionLabel>
            <div className="grid-resp-3" style={{ gridTemplateColumns: `repeat(${Math.min(brief.legal_intel.items.length, 3)}, 1fr)` }}>
              {brief.legal_intel.items.slice(0, 3).map((it, i) => (
                <button key={i} onClick={onNewMission} className="card" style={{ padding: 14, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.03em", color: "var(--primary)", textTransform: "uppercase" }}>{it.tipo}</span>
                  <span style={{ fontWeight: 650, fontSize: 13.5, lineHeight: 1.3 }}>{it.titulo}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{it.resumen}</span>
                  <span style={{ fontSize: 11.5, color: "var(--primary)", fontWeight: 700, marginTop: 2 }}>Resolver en Jurovia →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🛡️ Escudo / racha (aversión a la pérdida) */}
        {brief && (brief.escudo.vigilados > 0 || brief.escudo.dias_sin_vencer != null) && (
          <div className="card" style={{ padding: "16px 20px", marginBottom: 26, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", background: "var(--gold-soft)", borderColor: "var(--gold)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ fontSize: 24 }}>🛡️</span>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: "var(--gold-text)" }}>{brief.escudo.dias_sin_vencer ?? 0}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>días sin vencer un término</div>
              </div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 750 }}>{brief.escudo.vigilados}</div><div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>vigilados 24/7</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 750, color: "var(--success)" }}>{brief.escudo.perdidos}</div><div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>perdidos</div></div>
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("terminos")}>Ver vencimientos<Icon name="arrowRight" size={14} /></button>
          </div>
        )}

        {/* Esto es lo importante — 3 tarjetas */}
        <SectionLabel icon="alert" tone="danger">Esto es lo importante</SectionLabel>
        {cards.length > 0 ? (
          <div className="grid-resp-3" style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, 1fr)`, marginBottom: 30 }}>
            {cards.map((c, i) => <HomeCard key={i} card={c} />)}
          </div>
        ) : (
          <div className="card" style={{ padding: "26px 24px", marginBottom: 30, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--success-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="circleCheck" size={24} style={{ color: "var(--success)" }} /></div>
            <div><div style={{ fontWeight: 600, fontSize: 15 }}>Nada urgente hoy</div><div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Tu oficina está al día. Autopilot sigue vigilando tus términos.</div></div>
          </div>
        )}

        {/* Tus pendientes (QW1) — tareas/recordatorios abiertos */}
        {pend.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <SectionLabel icon="check">Tus pendientes ({att.pendientes ?? pend.length})</SectionLabel>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {pend.slice(0, 8).map((p, i) => {
                const dl = daysLeftOf(p.due_date);
                const tone = dl == null ? "var(--text-muted)" : dl < 0 ? "var(--danger)" : dl <= 3 ? "var(--gold-text)" : "var(--text-secondary)";
                const when = p.due_date == null ? "sin fecha" : dl! < 0 ? `vencido hace ${Math.abs(dl!)}d` : dl === 0 ? "vence hoy" : dl === 1 ? "vence mañana" : `en ${dl} días`;
                return (
                  <div key={p.id} onClick={() => p.matter_id && onOpenMission(p.matter_id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid var(--border)" : "none", cursor: p.matter_id ? "pointer" : "default" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: tone, whiteSpace: "nowrap" }}>{when}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Autopilot + Misiones */}
        <div className="grid-resp-2" style={{ gap: 22, marginBottom: 30 }}>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center" }}><Icon name="radar" size={17} style={{ color: "var(--primary)" }} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 650, fontSize: 14.5 }}>Mientras no estabas</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />Autopilot · {ap?.status || "Activo"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, margin: "14px 0 4px" }}>
              {/* Movimientos reales de las últimas 24h (con acción); si no hay, cae al resumen del autopilot. */}
              {(brief?.overnight.movimientos || []).length > 0 ? (
                (brief!.overnight.movimientos).slice(0, 4).map((mv, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>🛰️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mv.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mv.summary}</div>
                    </div>
                    <button className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }} onClick={() => onOpenMission(mv.matter_id)}>Revisar</button>
                  </div>
                ))
              ) : (
                <>
                  {(ap?.reviewed || []).map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
                      <Icon name="check" size={15} stroke={2.4} style={{ color: "var(--success)" }} />
                      <strong style={{ color: "var(--text)", fontWeight: 650, minWidth: 24 }}>{r.n}</strong> {r.label}
                    </div>
                  ))}
                  {(!ap || ap.reviewed.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Revisé tus procesos. Sin movimientos nuevos — todo en orden.</div>}
                </>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14, alignSelf: "flex-start" }} onClick={() => onNavigate("autopilot")}><Icon name="radar" size={15} />Ver lo que encontró</button>
          </div>

          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontWeight: 650, fontSize: 14.5, flex: 1 }}>Misiones activas</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated-2)", borderRadius: 999, padding: "2px 9px" }}>{missions.length}</span>
            </div>
            {missions.length === 0 ? (
              <div style={{ minHeight: 200 }}>
                <EmptyState
                  icon="folder"
                  title="Aún no tienes casos"
                  desc="Crea tu primer caso y Jurovia arma el expediente con cronología, documentos y plazos."
                  cta="Crea tu primer caso"
                  onCta={onNewMission}
                />
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {missions.slice(0, 4).map((e) => <MissionRow key={e.id} exp={e} onClick={() => onOpenMission(e.id)} />)}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, alignSelf: "flex-start", color: "var(--primary)" }} onClick={() => onNavigate("expedientes")}>Ver todas<Icon name="arrowRight" size={15} /></button>
              </>
            )}
          </div>
        </div>

        {/* CTA nueva misión */}
        <div style={{ borderRadius: "var(--r-xl)", padding: 1.5, background: "var(--grad-aurora-soft)" }}>
          <div className="card" style={{ borderRadius: "calc(var(--r-xl) - 1.5px)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", boxShadow: "none", border: "none" }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--aurora)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={22} style={{ color: "#fff" }} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 650, fontSize: 16 }}>¿Qué necesitas hoy?</div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Describe tu objetivo y Jurovia arma el expediente.</div>
            </div>
            <button className="btn btn-primary" onClick={onNewMission}><Icon name="plus" size={17} stroke={2.2} />Nueva misión</button>
          </div>
        </div>
      </div>
    </div>
  );
}

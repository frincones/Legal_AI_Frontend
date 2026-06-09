/* Inicio operativo (Mission Control). Reúne misiones + atención + Autopilot. */
"use client";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type AttentionData, type AutopilotSummary, type Mission } from "./data";
import { DeadlineChip, ProgressBar, SectionLabel } from "./atoms";

export function MissionControl({
  backendUrl, accessToken, email, onOpenMission, onNavigate, onNewMission,
}: {
  backendUrl: string; accessToken: string; email: string | null;
  onOpenMission: (id: string) => void; onNavigate: (r: string) => void; onNewMission: () => void;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [att, setAtt] = useState<AttentionData>({ criticos: 0, terminos: 0, actuaciones: 0, items: [] });
  const [ap, setAp] = useState<AutopilotSummary | null>(null);
  const [credits, setCredits] = useState<{ balance: number | null; cap: number | null }>({ balance: null, cap: null });

  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    api.missions(backendUrl, accessToken).then(setMissions);
    api.attention(backendUrl, accessToken).then(setAtt);
    api.autopilot(backendUrl, accessToken).then(setAp);
    api.credits(backendUrl, accessToken).then((c) => setCredits({ balance: c.balance, cap: c.cap }));
  }, [backendUrl, accessToken]);

  const name = (email || "").split("@")[0] || "abogado";
  const allClear = att.criticos === 0 && att.terminos === 0 && att.actuaciones === 0;

  return (
    <div className="no-scrollbar" style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "34px 36px 56px" }}>
        {/* Saludo operativo */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
          <div>
          <h1 style={{ fontSize: 30, fontWeight: 650, letterSpacing: "-0.025em", margin: 0, textTransform: "capitalize" }}>Hola, {name}.</h1>
          <p style={{ fontSize: 15.5, color: "var(--text-secondary)", margin: "8px 0 0" }}>
            {allClear ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="circleCheck" size={17} style={{ color: "var(--success)" }} />Nada urgente hoy. Tu oficina está al día.</span>
            ) : (
              <>Tu oficina tiene <strong style={{ color: "var(--danger)" }}>{att.criticos} críticos</strong> · <strong style={{ color: "var(--gold-text)" }}>{att.terminos} términos</strong> · <strong>{att.actuaciones} por aprobar</strong>.</>
            )}
          </p>
          </div>
          {credits.balance != null && (
            <div title="Créditos disponibles" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: "var(--r-pill)", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-1)" }}>
              <Icon name="sparkles" size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{credits.balance}{credits.cap ? ` / ${credits.cap}` : ""}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>créditos</span>
            </div>
          )}
        </div>

        {/* Atención */}
        <SectionLabel icon="alert" tone="danger">Esto es lo importante</SectionLabel>
        {att.items.length > 0 ? (
          <div className="card" style={{ overflow: "hidden", marginBottom: 30 }}>
            {att.items.slice(0, 6).map((it, i) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: i === Math.min(att.items.length, 6) - 1 ? "none" : "1px solid var(--border)" }}>
                <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: it.severity === "critico" ? "#DC2626" : it.severity === "pronto" ? "#C98A14" : "#16A34A", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{it.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{it.sub}</div>
                </div>
                <button className={`btn btn-sm ${it.severity === "critico" ? "btn-primary" : "btn-secondary"}`} onClick={() => (it.expId ? onOpenMission(it.expId) : onNavigate("terminos"))}>
                  {it.action}<Icon name="arrowRight" size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: "26px 24px", marginBottom: 30, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--success-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="circleCheck" size={24} style={{ color: "var(--success)" }} /></div>
            <div><div style={{ fontWeight: 600, fontSize: 15 }}>Nada urgente hoy</div><div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Tu oficina está al día. Autopilot sigue vigilando tus términos.</div></div>
          </div>
        )}

        {/* Autopilot + Misiones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 30 }}>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center" }}><Icon name="radar" size={17} style={{ color: "var(--primary)" }} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 650, fontSize: 14.5 }}>Mientras no estabas</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Autopilot · {ap?.status || "Activo"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, margin: "14px 0 4px" }}>
              {(ap?.reviewed || []).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
                  <Icon name="check" size={15} stroke={2.4} style={{ color: "var(--success)" }} />
                  <strong style={{ color: "var(--text)", fontWeight: 650, minWidth: 24 }}>{r.n}</strong> {r.label}
                </div>
              ))}
              {(!ap || ap.reviewed.length === 0) && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin actividad reciente.</div>}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14, alignSelf: "flex-start" }} onClick={() => onNavigate("autopilot")}><Icon name="radar" size={15} />Ver lo que encontró</button>
          </div>

          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontWeight: 650, fontSize: 14.5, flex: 1 }}>Misiones activas</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated-2)", borderRadius: 999, padding: "2px 9px" }}>{missions.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {missions.slice(0, 4).map((e) => (
                <button key={e.id} onClick={() => onOpenMission(e.id)} style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", padding: "10px", border: "none", borderRadius: "var(--r-md)", background: "transparent", textAlign: "left", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{e.progress}%</span>
                  </div>
                  <ProgressBar value={e.progress} accent={e.accent} height={5} />
                </button>
              ))}
              {missions.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "6px 10px" }}>Aún no tienes misiones. Crea la primera.</div>}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, alignSelf: "flex-start", color: "var(--primary)" }} onClick={() => onNavigate("expedientes")}>Ver todas<Icon name="arrowRight" size={15} /></button>
          </div>
        </div>

        {/* CTA nueva misión */}
        <div style={{ borderRadius: "var(--r-xl)", padding: 1.5, background: "var(--grad-aurora-soft)" }}>
          <div className="card" style={{ borderRadius: "calc(var(--r-xl) - 1.5px)", padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", boxShadow: "none", border: "none" }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--aurora)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={22} style={{ color: "#fff" }} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 650, fontSize: 16 }}>¿Qué necesitas hoy?</div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Describe tu objetivo y Juridica arma el expediente.</div>
            </div>
            <button className="btn btn-primary" onClick={onNewMission}><Icon name="plus" size={17} stroke={2.2} />Nueva misión</button>
          </div>
        </div>
      </div>
    </div>
  );
}

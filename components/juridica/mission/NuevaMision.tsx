/* Nueva misión — intención → "estoy trabajando" → requirements map → crea (fidelidad TemplateV2). */
"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { api } from "./data";
import { ConfirmNote, ProgressBar } from "./atoms";

const SUGGESTIONS = ["Cobrar una deuda con un pagaré", "Demanda laboral por despido", "Tutela de salud contra la EPS", "Contrato de arrendamiento"];

const WORKING_STEPS = [
  { id: "w1", label: "Creé el expediente de la misión" },
  { id: "w2", label: "Leí lo aportado y extraje los datos clave", verified: true },
  { id: "w3", label: "Verifiqué las normas aplicables contra fuente oficial", verified: true },
  { id: "w4", label: "Generé el borrador inicial" },
  { id: "w5", label: "Preparé el checklist de lo que falta" },
  { id: "w6", label: "Activé Autopilot para vigilar tus términos" },
];

// Requisitos típicos por materia (alimentan el requirements_map de la misión).
function reqsFor(plugin: string): { tengo: { label: string; value: string }[]; falta: { label: string; channel: string }[] } {
  if (plugin === "cobranza-co") return { tengo: [{ label: "Tipo de proceso", value: "Ejecutivo singular" }], falta: [{ label: "Título ejecutivo (pagaré/factura)", channel: "Subir" }, { label: "Datos del deudor y dirección de notificación", channel: "Responder" }, { label: "Poder firmado", channel: "Subir" }] };
  if (plugin === "laboral-co") return { tengo: [{ label: "Materia", value: "Laboral ordinario" }], falta: [{ label: "Contrato y desprendibles de nómina", channel: "Subir" }, { label: "Salario y fechas de ingreso/retiro", channel: "Responder" }, { label: "Poder firmado", channel: "Subir" }] };
  if (plugin === "tutela-co") return { tengo: [{ label: "Mecanismo", value: "Acción de tutela" }], falta: [{ label: "Derecho vulnerado y pruebas", channel: "Responder" }, { label: "Documento de la negativa (EPS/entidad)", channel: "Subir" }] };
  return { tengo: [{ label: "Objetivo", value: "Identificado" }], falta: [{ label: "Documentos del caso", channel: "Subir" }, { label: "Datos de las partes", channel: "Responder" }] };
}

export function NuevaMision({
  backendUrl, accessToken, onCreated, pushToast,
}: {
  backendUrl: string; accessToken: string;
  onCreated: (missionId: string, prompt: string) => void; pushToast: (t: string, k?: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"intent" | "working" | "map">("intent");
  const [steps, setSteps] = useState<Record<string, "pending" | "running" | "done">>({});
  const [plugin, setPlugin] = useState("procesal-co");
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function detectPlugin(v: string): string {
    const l = v.toLowerCase();
    if (l.includes("tutela") || l.includes("eps") || l.includes("salud")) return "tutela-co";
    if (l.includes("labor") || l.includes("despido") || l.includes("prestacion")) return "laboral-co";
    if (l.includes("cobr") || l.includes("pagar") || l.includes("deuda") || l.includes("cartera")) return "cobranza-co";
    if (l.includes("contrato") || l.includes("arrend")) return "contractual-co";
    if (l.includes("sas") || l.includes("sociedad") || l.includes("acta")) return "societario-co";
    if (l.includes("aliment") || l.includes("sucesi")) return "civil-familia-co";
    return "procesal-co";
  }

  function start(text?: string) {
    const v = (text ?? draft).trim();
    if (!v) return;
    setDraft(v);
    setPlugin(detectPlugin(v));
    setPhase("working");
    setSteps({});
    let acc = 350;
    WORKING_STEPS.forEach((s) => {
      timers.current.push(setTimeout(() => setSteps((p) => ({ ...p, [s.id]: "running" })), acc));
      acc += 600;
      timers.current.push(setTimeout(() => setSteps((p) => ({ ...p, [s.id]: "done" })), acc));
    });
    timers.current.push(setTimeout(() => setPhase("map"), acc + 450));
  }

  async function create() {
    if (busy) return;
    setBusy(true);
    pushToast("Creando la misión…", "primary");
    const r = reqsFor(plugin);
    const m = await api.createMission(backendUrl, accessToken, { name: draft.slice(0, 80), plugin_key: plugin, requirements_map: r });
    setBusy(false);
    if (m && m.id) { pushToast("Misión creada", "success"); onCreated(m.id, draft); }
    else pushToast("No se pudo crear la misión", "info");
  }

  const reqs = reqsFor(plugin);
  const completeness = Math.round((reqs.tengo.length / (reqs.tengo.length + reqs.falta.length)) * 100);

  return (
    <div className="no-scrollbar" style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "44px 32px 56px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: phase === "intent" ? "center" : "flex-start" }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 8px", borderRadius: "var(--r-pill)", background: "var(--grad-aurora-soft)", border: "1px solid var(--border)", marginBottom: 18 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="target" size={12} style={{ color: "#fff" }} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Nueva misión</span>
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.12, fontWeight: 650, letterSpacing: "-0.025em", margin: 0 }}>¿Qué quieres <span className="gradient-text">lograr</span>?</h1>
          <p style={{ fontSize: 15.5, color: "var(--text-secondary)", margin: "10px 0 0" }}>Dime tu objetivo en tus palabras. Yo armo la misión y te digo qué falta.</p>
        </div>

        {phase === "intent" && (
          <>
            <div className="composer-shell" style={{ borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)" }}>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); start(); } }}
                placeholder="Ej. Quiero cobrar una deuda de $50M con un pagaré vencido…"
                style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", padding: "20px 22px 6px", fontSize: 16, lineHeight: 1.55, color: "var(--text)", fontFamily: "var(--font-ui)" }} />
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px 12px 14px" }}>
                <span style={{ flex: 1 }} />
                <button onClick={() => start()} disabled={!draft.trim()} style={{ width: 42, height: 42, borderRadius: "var(--r-md)", border: "none", background: draft.trim() ? "var(--aurora)" : "var(--bg-elevated-2)", color: draft.trim() ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center", boxShadow: draft.trim() ? "var(--glow-primary)" : "none" }}>
                  <Icon name="arrowUp" size={20} stroke={2.4} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
              {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => start(s)}><Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />{s}</button>)}
            </div>
          </>
        )}

        {phase === "working" && (
          <div className="fade-up">
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "20px 22px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={18} style={{ color: "#fff" }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 650, fontSize: 16 }}>Estoy trabajando en tu misión…</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Montando el expediente y dejándote el trabajo listo.</div>
                </div>
              </div>
              <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 11 }}>
                {WORKING_STEPS.map((s) => {
                  const st: "pending" | "running" | "done" = steps[s.id] || "pending";
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: st === "pending" ? 0.42 : 1, transition: "opacity .3s" }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: st === "done" ? "var(--success-soft)" : st === "running" ? "var(--primary-soft)" : "var(--bg-elevated-2)", color: st === "done" ? "var(--success)" : "var(--primary)" }}>
                        {st === "running" ? <Icon name="refresh" size={14} style={{ animation: "spin 1s linear infinite" }} /> : st === "done" ? <Icon name="check" size={15} stroke={2.6} /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-muted)" }} />}
                      </span>
                      <span style={{ fontSize: 14.5, color: st === "pending" ? "var(--text-muted)" : "var(--text)", flex: 1 }}>{s.label}</span>
                      {s.verified && st === "done" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "var(--gold-text)", background: "var(--gold-soft)", borderRadius: 999, padding: "2px 8px" }}><Icon name="badgeCheck" size={11} stroke={2.4} style={{ color: "var(--gold)" }} />Verificado</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: 14 }}><ConfirmNote>Estoy preparando todo. Tú revisas y confirmas antes de cualquier actuación.</ConfirmNote></div>
          </div>
        )}

        {phase === "map" && (
          <div className="fade-up" style={{ marginTop: 8 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="target" size={20} style={{ color: "#fff" }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Voy a crear la misión</div>
                  <div style={{ fontWeight: 650, fontSize: 17 }}>{draft.slice(0, 70)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{completeness}%</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>completo</div>
                </div>
              </div>
              <div style={{ padding: "4px 20px 0" }}><ProgressBar value={completeness} height={6} /></div>

              <div style={{ padding: "18px 20px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Icon name="circleCheck" size={16} style={{ color: "var(--success)" }} /><span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--success)" }}>Tengo</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {reqs.tengo.map((it, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: "var(--r-md)", background: "var(--success-soft)", border: "1px solid rgba(22,163,74,0.2)" }}>
                      <Icon name="check" size={15} stroke={2.6} style={{ color: "var(--success)", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}><div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{it.label}</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.value}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "16px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Icon name="square" size={16} style={{ color: "var(--gold)" }} /><span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--gold-text)" }}>Me falta</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reqs.falta.map((it, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r-md)", background: "var(--gold-soft)", border: "1px solid rgba(201,138,20,0.25)" }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid var(--gold)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{it.label}</span>
                      <button className="btn btn-sm btn-secondary" onClick={() => pushToast(it.channel === "Subir" ? "Lo completas dentro de la misión" : "Lo respondes dentro de la misión", "info")}><Icon name={it.channel === "Subir" ? "upload" : "message"} size={14} />{it.channel}</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "var(--bg-base)" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPhase("intent")}><Icon name="arrowLeft" size={15} />Cambiar</button>
                <span style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={create} disabled={busy}><Icon name="sparkles" size={16} />Crear misión<Icon name="arrowRight" size={15} /></button>
              </div>
            </div>
            <div style={{ marginTop: 14 }}><ConfirmNote>Completas lo que falta cuando puedas. Juridica avanza con lo que ya tiene y te avisa.</ConfirmNote></div>
          </div>
        )}
      </div>
    </div>
  );
}

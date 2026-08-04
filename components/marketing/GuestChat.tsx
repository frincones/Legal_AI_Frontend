"use client";
/* Modo invitado (landing sin login) — chat real con fundamentación verificada vía /api/guest/chat.
   Reusa el parser SSE, Markdown y los átomos del chat de la app. El guest_id vive en localStorage. */
import { useEffect, useRef, useState } from "react";
import { Icon, Logo } from "../juridica/icons";
import { AgentAvatar, FeedbackBar, FeedbackNudge, FeedbackPopup, feedbackPopupEligible, markFeedbackPopupShown } from "../juridica/atoms";
import { api } from "../juridica/mission/data";
import { AI_DISCLAIMER } from "../company";
import { Markdown } from "../juridica/Markdown";
import { ThoughtPill, SourcesFooter, type ActStep } from "../juridica/Activity";
import { Sidebar } from "../juridica/shell";
import { metaEvent, metaViewOnce } from "@/lib/analytics";
import { track, getSessionId } from "@/lib/tracker";

const LABELS: Record<string, string> = {
  verificar_fuente: "Verificando contra fuentes oficiales",
  web_search: "Buscando en la web",
  web_fetch: "Leyendo una fuente",
};
const ICON_FOR: Record<string, string> = {
  verificar_fuente: "shieldCheck", web_search: "search", web_fetch: "globe",
};
const labelFor = (n: string) => LABELS[n] ?? n;
const iconFor = (n: string) => ICON_FOR[n] ?? "shieldCheck";

type HookChip = { label: string; tipo: string; prompt: string };
type Turn = { thinking: string; steps: ActStep[]; text: string; startedAt?: number; durationMs?: number | null; blocked?: boolean; hooks?: HookChip[] };
type Msg = { role: "user"; text: string } | { role: "assistant"; turn: Turn };

const HOOK_META: Record<string, { emoji: string; grad: string }> = {
  avanzar: { emoji: "⚡", grad: "linear-gradient(135deg,#7B3DF5,#2F6BFF)" },
  descubrir: { emoji: "🎯", grad: "linear-gradient(135deg,#FF3D7F,#D23BE0)" },
  guardar: { emoji: "📌", grad: "linear-gradient(135deg,#10B981,#059669)" },
  profundizar: { emoji: "🔍", grad: "linear-gradient(135deg,#F2B338,#E8902A)" },
};

async function* parseSSE(res: Response): AsyncGenerator<{ event: string; data: any }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const blocks = buf.split("\n\n");
    buf = blocks.pop() ?? "";
    for (const block of blocks) {
      if (block.startsWith(":")) continue;
      let event = "message"; let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) { try { yield { event, data: JSON.parse(data) }; } catch { /* ignore */ } }
    }
  }
}

// UUID con fallback para WebViews viejos (p. ej. el navegador interno de Facebook en Androids antiguos)
// donde crypto.randomUUID puede no existir → evita que el chat invitado reviente en ese 71% del tráfico.
function uuid(): string {
  try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch { /* WebView viejo */ }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; const v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16);
  });
}

function guestId(): string {
  try {
    let id = localStorage.getItem("juridica_guest_id");
    if (!id) { id = uuid(); localStorage.setItem("juridica_guest_id", id); }
    return id;
  } catch {
    return uuid();
  }
}

export function GuestChat({ seed, demoKey, backendUrl, onBack, onRegister }: {
  seed: string; demoKey?: string; backendUrl: string; onBack: () => void;
  onRegister: (ctx?: { context?: Record<string, unknown> }) => void;
}) {
  const demoMode = !!demoKey;   // deriva el flag; demoKey además nombra el creativo (content_name)
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [demoWall, setDemoWall] = useState(false);   // muro tras la 1ª prueba del lead (solo modo demo)
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const userTries = useRef(0);                        // pruebas propias del lead (el seed no cuenta)
  const [fbPopup, setFbPopup] = useState(false);      // popup muestreado de feedback (invitado)
  const fbPopupTried = useRef(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(-1);   // turno cuyo nudge se descartó (invitado)
  const [nudgeSent, setNudgeSent] = useState(-1);             // turno cuyo nudge ya dio feedback

  // Popup muestreado (invitado): tras ≥3 respuestas, si es elegible, una sola vez. No sobre el muro.
  useEffect(() => {
    if (busy || demoWall || fbPopup || fbPopupTried.current) return;
    const done = messages.filter((m) => m.role === "assistant" && m.turn.text && !m.turn.blocked).length;
    if (done >= 3 && feedbackPopupEligible()) {
      fbPopupTried.current = true;
      markFeedbackPopupShown();
      setFbPopup(true);
    }
  }, [busy, demoWall, messages, fbPopup]);
  const lastTried = useRef("");                       // última consulta del lead → contexto para el waitlist

  function patchTurn(fn: (t: Turn) => void) {
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        const turn = { ...last.turn, steps: [...last.turn.steps] };
        fn(turn);
        copy[copy.length - 1] = { role: "assistant", turn };
      }
      return copy;
    });
  }

  async function run(message: string, isSeed = false) {
    const msg = message.trim();
    if (!msg || busy) return;
    if (!isSeed) { userTries.current += 1; lastTried.current = msg; }   // el seed (turno 0 = demo) no cuenta como prueba
    setMessages((m) => [...m, { role: "user", text: msg }, { role: "assistant", turn: { thinking: "", steps: [], text: "", startedAt: Date.now() } }]);
    setBusy(true);
    try {
      const res = await fetch(`${backendUrl}/api/guest/chat/${uuid()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, guest_id: guestId(), analytics_sid: getSessionId() }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);
      // "Uso del chat" (activación real) = la 1ª prueba PROPIA del lead. El auto-seed del demo NO cuenta
      // (por eso el guard demoMode&&isSeed). En no-demo (hero/chips) sí cuenta, igual que hoy.
      if (!(demoMode && isSeed)) {
        try {
          if (!sessionStorage.getItem("jurovia_chat_tracked")) {
            sessionStorage.setItem("jurovia_chat_tracked", "1");
            metaEvent("Uso del chat", backendUrl);  // pixel + CAPI deduplicado (robusto vs in-app/iOS)
          }
        } catch { /* sessionStorage puede fallar en modo privado → no romper */ }
      }
      track("guest_message_sent");  // analytics first-party · embudo
      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta") patchTurn((t) => { if (!t.durationMs && t.startedAt) t.durationMs = Date.now() - t.startedAt; t.text += data.text; });
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "tool_call") patchTurn((t) => t.steps.push({ name: data.name, label: labelFor(data.name), icon: iconFor(data.name), status: "running", startedAt: Date.now(), input: data.input }));
        else if (event === "tool_result") patchTurn((t) => {
          const s = [...t.steps].reverse().find((x) => x.name === data.name && x.status === "running");
          if (s) { s.status = "done"; s.endedAt = Date.now(); s.output = data.output; if (data.sources?.length) s.sources = data.sources; }
        });
        else if (event === "hooks") patchTurn((t) => { t.hooks = Array.isArray(data.hooks) ? data.hooks : []; });
        else if (event === "blocked") patchTurn((t) => { t.text += data.message || "Alcanzaste el límite de la prueba."; t.blocked = true; });
        else if (event === "error") patchTurn((t) => (t.text += `\n\n⚠️ ${data.message}`));
      }
    } catch (err: any) {
      patchTurn((t) => (t.text += `\n\n⚠️ Error: ${err.message}`));
    } finally {
      patchTurn((t) => {
        t.steps.forEach((s) => { if (s.status === "running") { s.status = "done"; s.endedAt = s.endedAt || Date.now(); } });
        if (t.durationMs == null && t.startedAt) t.durationMs = Date.now() - t.startedAt;
      });
      setBusy(false);
      if (demoMode && !isSeed && userTries.current >= 1) setDemoWall(true);   // tras SU 1ª prueba → muro de registro
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    metaViewOnce("jv_vc_demo", backendUrl, demoKey || "demo_agente");   // ViewContent: vio el demo (todo invitado, no solo ?demo=)
    if (seed && seed.trim()) run(seed, true);   // turno 0 = demo auto-sembrada (isSeed=true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  function send() { const v = input.trim(); if (!v || busy) return; setInput(""); run(v); }

  // Al registrarse DESDE el chat invitado, marca la conversación pendiente para "seguir en el mismo chat"
  // tras el auto-login (la app la importa con /api/guest/claim). Aditivo y fail-open.
  const goRegister = (ctx?: { context?: Record<string, unknown> }) => {
    try { localStorage.setItem("jurovia_pending_guest_chat", JSON.stringify({ sid: getSessionId(), gid: guestId() })); } catch { /* noop */ }
    onRegister(ctx);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "var(--bg-base)", display: "flex", flexDirection: "row" }}>
      {/* Panel izquierdo (mismo Sidebar de la app, gateado a registro en modo invitado) */}
      <div className="land-hide-mobile" style={{ flexShrink: 0 }}>
        <Sidebar
          route=""
          onNavigate={() => goRegister()}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onNew={() => goRegister()}
          email="Invitado"
          recents={[]}
          missionMode
          credits={undefined}
          creditsBlocked={false}
          isAdmin={false}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ paddingLeft: 8 }}><Icon name="arrowLeft" size={16} />Volver</button>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-elevated-2)", borderRadius: 999, padding: "3px 10px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />Modo invitado</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => goRegister()} className="btn btn-ghost btn-sm land-hide-mobile">Iniciar sesión</button>
        <button onClick={() => goRegister()} className="btn btn-primary btn-sm">Empieza gratis</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", background: "var(--grad-aurora-soft)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
        <Icon name="sparkles" size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Estás probando Jurovia sin registrarte. Las respuestas vienen <strong style={{ color: "var(--text)" }}>verificadas con su fuente</strong>. Regístrate gratis para generar documentos y guardar tu conversación.</span>
        <button onClick={() => goRegister()} className="btn btn-gold btn-sm land-hide-mobile" style={{ flexShrink: 0 }}>Crear cuenta</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", padding: "26px 20px 16px" }}>
          {messages.map((m, i) => m.role === "user" ? (
            <div key={i} className="fade-up" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 22 }}>
              <div style={{ maxWidth: "82%", background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", borderBottomRightRadius: 5, padding: "12px 16px", fontSize: 15, lineHeight: 1.55 }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} className="fade-up" style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              <AgentAvatar size={30} generating={busy && i === messages.length - 1} />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {((busy && i === messages.length - 1) || m.turn.thinking || m.turn.steps.length > 0) && (
                    <ThoughtPill busy={busy && i === messages.length - 1 && !m.turn.text} durationMs={m.turn.durationMs ?? null} hasActivity={!!m.turn.thinking || m.turn.steps.length > 0} currentLabel={m.turn.steps.find((s) => s.status === "running")?.label} onOpen={() => { /* sin sidebar en guest */ }} />
                  )}
                  {m.turn.text && <div style={{ color: "var(--text)" }}><Markdown text={m.turn.text} /></div>}
                  {m.turn.text && <SourcesFooter steps={m.turn.steps} />}
                  {/* Hook Model — próximas acciones (chips). Un clic envía ese prompt (cuenta como tu prueba). */}
                  {!demoWall && !(busy && i === messages.length - 1) && m.turn.hooks && m.turn.hooks.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="sparkles" size={13} style={{ color: "var(--primary)" }} />Sigue con esto
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {m.turn.hooks.map((h, k) => {
                          const meta = HOOK_META[h.tipo] || HOOK_META.avanzar;
                          return (
                            <button key={k} className="jv-hook-chip" onClick={() => { if (busy) return; fetch(`${backendUrl}/api/hooks/click`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: h.tipo, label: h.label, session_id: getSessionId() }), keepalive: true }).catch(() => {}); run(h.prompt); }} disabled={busy}
                              style={{ animationDelay: `${k * 70}ms`, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, border: "1.5px solid transparent", backgroundImage: `linear-gradient(var(--bg-surface),var(--bg-surface)), ${meta.grad}`, backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box", cursor: busy ? "default" : "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text)", opacity: busy ? 0.55 : 1 }}>
                              <span style={{ fontSize: 15 }}>{meta.emoji}</span>{h.label}
                              <Icon name="arrowRight" size={14} stroke={2.2} style={{ color: "var(--primary)" }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Feedback en turnos ANTERIORES (el último usa el nudge animado sobre el composer). */}
                  {i !== messages.length - 1 && m.turn.text && !m.turn.blocked && (
                    <FeedbackBar onSend={(verdict, reason, comment) => {
                      api.guestFeedback(backendUrl, { guest_id: guestId(), session: getSessionId(), kind: "response", verdict, reason, comment });
                    }} />
                  )}
                  {m.turn.blocked && (
                    <div className="fade-up" style={{ marginTop: 4, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--grad-aurora-soft)" }}>
                      <div style={{ fontWeight: 650, marginBottom: 6 }}>Regístrate gratis para continuar</div>
                      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 12 }}>Empiezas gratis (3 usos por día) y desbloqueas documentos, misiones y vigilancia. Sin tarjeta.</div>
                      <button className="btn btn-primary" onClick={() => goRegister()}>Empieza gratis<Icon name="arrowRight" size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Modo demo · nudge tras el turno 0: card animada + chips clicables para impulsar la prueba */}
          {demoMode && !demoWall && messages.length === 2 && !busy && (
            <div className="fade-up" style={{ marginBottom: 10 }}>
              <style>{`
                @keyframes demoGlow { 0%,100%{ box-shadow:0 0 0 0 rgba(123,61,245,0); } 50%{ box-shadow:0 0 30px -4px rgba(123,61,245,0.5); } }
                @keyframes demoHand { 0%,100%{ transform:translateY(0) rotate(0); } 30%{ transform:translateY(-5px) rotate(-8deg); } 60%{ transform:translateY(0) rotate(0); } }
                @keyframes demoRise { from{ opacity:0; transform:translateY(8px);} to{ opacity:1; transform:translateY(0);} }
                .demo-cta{ animation: demoGlow 2.1s ease-in-out infinite, demoRise .45s ease both; }
                .demo-cta-hand{ display:inline-block; animation: demoHand 1.3s ease-in-out infinite; }
                .demo-cta-chip{ transition: transform .12s ease, box-shadow .12s ease; }
                .demo-cta-chip:hover{ transform:translateY(-2px); box-shadow: var(--glow-primary); }
              `}</style>
              <div className="demo-cta" style={{ position: "relative", padding: "18px 18px 16px", borderRadius: 16, background: "var(--grad-aurora-soft)", border: "1.5px solid var(--primary)", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 750, color: "var(--text)", letterSpacing: "-0.01em", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                  <span className="demo-cta-hand" style={{ fontSize: 22 }}>👇</span>{demoKey === "caso" ? "Ahora pega TU caso real" : "Ahora te toca a ti"}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5, lineHeight: 1.5 }}>
                  {demoKey === "caso"
                    ? <>Pega los <strong style={{ color: "var(--text)" }}>hechos de tu caso</strong> (o el número de radicado) y te lo organizo igual que arriba: verifico las normas, calculo términos y te digo el siguiente paso.</>
                    : <>Pega una cita o hazme una consulta jurídica — la <strong style={{ color: "var(--text)" }}>verifico en vivo</strong>, igual que arriba. Toca una para probar:</>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 13 }}>
                  {(demoKey === "caso"
                    ? ["Mi cliente fue despedido sin justa causa hace un mes, llevaba 3 años; quiero reclamar la indemnización.",
                       "Tengo un proceso ejecutivo por un pagaré de $50.000.000 sin pagar; ¿cómo lo estructuro?"]
                    : ["¿Sigue vigente el artículo 65 del CST?", "¿Está vigente el artículo 90 del CGP?", "¿Sigue vigente la Ley 100 de 1993?"]
                  ).map((ex) => (
                    <button key={ex} className="chip demo-cta-chip" onClick={() => run(ex)} style={{ fontSize: 13, borderColor: "var(--primary)", color: "var(--primary)", fontWeight: 600, maxWidth: 340, textAlign: "left" }}>{ex}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modo demo · muro tras la 1ª prueba propia (reusa el estilo de la tarjeta 'blocked') */}
          {demoWall && (
            <div className="fade-up" style={{ marginTop: 4 }}>
              {demoKey === "caso" ? (
                <div className="road-card" style={{ padding: "20px 20px 18px", borderRadius: 16, background: "var(--grad-aurora-soft)", border: "1.5px solid var(--primary)" }}>
                  <style>{`
                    @keyframes roadGlow { 0%,100%{ box-shadow:0 0 0 0 rgba(123,61,245,0);} 50%{ box-shadow:0 0 34px -6px rgba(123,61,245,0.5);} }
                    @keyframes roadRise { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }
                    .road-card{ animation: roadGlow 2.3s ease-in-out infinite; }
                    .road-row{ animation: roadRise .5s ease both; }
                    @media (prefers-reduced-motion: reduce){ .road-card{ animation:none; } .road-row{ animation:none; } }
                  `}</style>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--primary)", textAlign: "center" }}>Lo que Jurovia hará con tu caso</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9, margin: "14px 0 4px" }}>
                    {[["✅", "Hoy", "Verifiqué las normas y organicé tu caso."],
                      ["🛰️", "Mañana", "Reviso la Rama Judicial y te aviso de cada actuación y término."],
                      ["📄", "Día 2", "Te dejo el borrador en Word listo para revisar y firmar."],
                      ["⚖️", "Día 3", "Vigilo tus plazos y te recuerdo antes de que venzan."]].map(([em, d, t], idx) => (
                      <div key={d} className="road-row" style={{ display: "flex", alignItems: "flex-start", gap: 11, animationDelay: `${idx * 90}ms`, background: "var(--bg-surface)", borderRadius: 12, padding: "10px 13px" }}>
                        <span style={{ fontSize: 19, flex: "none" }}>{em}</span>
                        <span style={{ fontSize: 13.5, color: "var(--text)" }}><strong>{d}</strong> · <span style={{ color: "var(--text-secondary)" }}>{t}</span></span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--text-secondary)", textAlign: "center", margin: "8px 0 13px" }}>
                    Crea tu cuenta gratis y <strong style={{ color: "var(--text)" }}>guardo este caso como expediente</strong> — sin tarjeta.
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => goRegister({ context: { demo: demoMode, tried: lastTried.current } })}>Crear mi cuenta y guardar el caso<Icon name="arrowRight" size={16} /></button>
                </div>
              ) : (
                <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--grad-aurora-soft)" }}>
                  <div style={{ fontWeight: 650, marginBottom: 6 }}>Desbloquea todo Jurovia</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 12 }}>Ya viste cómo cada afirmación viene con su fuente oficial verificable. Regístrate para desbloquear documentos, misiones y vigilancia.</div>
                  <button className="btn btn-primary" onClick={() => goRegister({ context: { demo: demoMode, tried: lastTried.current } })}>Registrarme<Icon name="arrowRight" size={16} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)", padding: "14px 20px 18px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          {(() => {
            const li = messages.length - 1;
            const last = messages[li];
            const show = !busy && !demoWall && last?.role === "assistant" && last.turn.text && !last.turn.blocked && nudgeDismissed !== li && nudgeSent !== li;
            return show ? (
              <FeedbackNudge
                key={li}
                onSend={(verdict, reason, comment) => api.guestFeedback(backendUrl, { guest_id: guestId(), session: getSessionId(), kind: "response", verdict, reason, comment, context: { via: "nudge" } })}
                onDone={() => setNudgeSent(li)}
                onDismiss={() => setNudgeDismissed(li)}
              />
            ) : null;
          })()}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, border: "1px solid var(--border-strong)", borderRadius: "var(--r-xl)", padding: "8px 8px 8px 18px", background: "var(--bg-surface)", boxShadow: "var(--sh-2)" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} disabled={busy || demoWall} className="land-composer"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={demoWall ? "Regístrate para seguir…" : "Escribe tu consulta jurídica…"}
              style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 15.5, lineHeight: 1.5, color: "var(--text)", fontFamily: "var(--font-ui)", padding: "9px 0", maxHeight: 140 }} />
            <button onClick={send} disabled={!input.trim() || busy || demoWall} style={{ width: 40, height: 40, borderRadius: 11, border: "none", background: input.trim() && !busy && !demoWall ? "var(--aurora)" : "var(--bg-elevated-2)", color: input.trim() && !busy && !demoWall ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="arrowUp" size={19} stroke={2.4} /></button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", margin: "10px 0 0" }}>{AI_DISCLAIMER} No subas datos sensibles de clientes en modo invitado.</p>
        </div>
      </div>
      </div>

      {fbPopup && (
        <FeedbackPopup
          onDismiss={() => setFbPopup(false)}
          onSubmit={(verdict, mood, comment) => {
            api.guestFeedback(backendUrl, {
              guest_id: guestId(), session: getSessionId(),
              kind: "sampled", verdict: verdict || undefined, comment, context: { mood, trigger: "sampled" },
            });
          }}
        />
      )}
    </div>
  );
}

/* Modal de registro (acción bloqueada / signup) */
export function RegisterModal({ onClose, onGo }: { onClose: () => void; onGo: () => void }) {
  const items: [string, string][] = [
    ["fileText", "Genera y descarga escritos en Word (.docx)"],
    ["folder", "Crea misiones y expedientes para tus casos"],
    ["radar", "Activa la vigilancia automática (Autopilot)"],
    ["history", "Guarda tu conversación y tu historial"],
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 440, maxWidth: "94vw", background: "var(--bg-surface)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-3)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ position: "relative", padding: "28px 28px 22px", background: "var(--grad-aurora-soft)", borderBottom: "1px solid var(--border)" }}>
          <button onClick={onClose} className="focus-ring" style={{ position: "absolute", top: 16, right: 16, border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.5)" }}><Icon name="x" size={17} /></button>
          <Logo size={36} />
          <h2 style={{ fontSize: 21, fontWeight: 680, letterSpacing: "-0.02em", margin: "16px 0 6px" }}>Regístrate gratis para continuar</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>Empiezas gratis — 3 usos por día. Sin tarjeta.</p>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 20 }}>
            {items.map(([ic, t], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 14 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--success-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={15} stroke={2.6} style={{ color: "var(--success)" }} /></span>
                {t}
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={onGo}>Empieza gratis<Icon name="arrowRight" size={17} stroke={2.2} /></button>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", margin: "16px 0 0" }}>¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); onGo(); }} style={{ color: "var(--primary)", fontWeight: 600 }}>Inicia sesión</a></p>
        </div>
      </div>
    </div>
  );
}

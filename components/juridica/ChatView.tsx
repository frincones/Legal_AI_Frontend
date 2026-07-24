"use client";

import { useRef, useState, useEffect } from "react";
import { Composer, ChatMessage } from "./shell";
import { ArtifactCard, FeedbackBar, FeedbackNudge, FeedbackPopup, feedbackPopupEligible, markFeedbackPopupShown } from "./atoms";
import { trackChatUsage } from "@/lib/analytics";
import { api } from "./mission/data";
import { AI_DISCLAIMER } from "../company";
import { Icon } from "./icons";
import { Markdown } from "./Markdown";
import { ThoughtPill, InlineActivity, ActivitySidebar, SourcesFooter, type ActStep, type LiveActivity } from "./Activity";
import type { Artifact } from "./Canvas";

type Step = ActStep;
type HookChip = { label: string; tipo: string; prompt: string };
type Turn = { thinking: string; steps: Step[]; text: string; artifacts: Artifact[]; agent?: string;
  activity?: LiveActivity | null; hooks?: HookChip[];
  startedAt?: number; firstTextAt?: number; durationMs?: number | null;
  messageId?: string; runId?: string; feedbackSent?: boolean; agentSkill?: string;
  microPrompt?: boolean; microSent?: boolean;
  // Opción A · resiliencia de red: reintento ante corte de conexión SSE.
  retrying?: boolean; netError?: boolean; retryMsg?: string; retryDocs?: string[] };

// Chips del Hook Model (Nir Eyal) — próximas acciones sugeridas al final de cada respuesta.
const HOOK_META: Record<string, { emoji: string; grad: string }> = {
  avanzar:     { emoji: "⚡", grad: "linear-gradient(135deg,#7B3DF5,#2F6BFF)" },
  descubrir:   { emoji: "🎯", grad: "linear-gradient(135deg,#FF3D7F,#D23BE0)" },
  guardar:     { emoji: "📌", grad: "linear-gradient(135deg,#10B981,#059669)" },
  profundizar: { emoji: "🔍", grad: "linear-gradient(135deg,#F2B338,#E8902A)" },
};
type Msg = { role: "user"; text: string } | { role: "assistant"; turn: Turn };

const LABELS: Record<string, string> = {
  verificar_fuente: "Verificando contra fuentes oficiales",
  web_search: "Buscando en la web",
  web_fetch: "Leyendo una fuente",
  search_documents: "Revisando tus documentos",
  render_letter: "Generando el documento",
  render_memo: "Generando el memo",
  build_table_doc: "Generando la tabla",
  render_document_code: "Redactando el documento (formato avanzado)",
  run_code: "Ejecutando cálculo",
  self_review: "Auto-revisando el documento",
};
const labelFor = (n: string) => LABELS[n] ?? n;

const ICON_FOR: Record<string, string> = {
  verificar_fuente: "shieldCheck",
  web_search: "search",
  web_fetch: "globe",
  search_documents: "book",
  render_letter: "pencil",
  render_memo: "pencil",
  build_table_doc: "layers",
  render_document_code: "pencil",
  run_code: "command",
};
const iconFor = (n: string) => ICON_FOR[n] ?? "shieldCheck";

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
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) {
        try {
          yield { event, data: JSON.parse(data) };
        } catch {
          /* ignore */
        }
      }
    }
  }
}

/* F4 — micro-prompt inline, no-modal, descartable. */
function MicroPrompt({ onSend, onDismiss }: { onSend: (comment: string) => void; onDismiss: () => void }) {
  const [val, setVal] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <div style={{ fontSize: 12.5, color: "var(--success)", fontWeight: 600, padding: "4px 2px" }}>¡Gracias!</div>;
  return (
    <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg-elevated-2)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, color: "var(--text-secondary)", flexShrink: 0 }}>En una línea, ¿qué te gustaría que Jurovia hiciera mejor?</span>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Tu idea…"
        style={{ flex: 1, minWidth: 160, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "6px 10px", fontSize: 12.5, background: "var(--bg-base)", color: "var(--text)", outline: "none" }}
      />
      <button className="btn btn-secondary btn-sm" disabled={!val.trim()} onClick={() => { onSend(val.trim()); setSent(true); }}>Enviar</button>
      <button title="Descartar" onClick={onDismiss} style={{ border: "none", background: "transparent", color: "var(--text-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}>
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}

export function ChatView({
  backendUrl,
  accessToken,
  initialMessage,
  initialDocumentIds,
  loadSessionId,
  mode,
  setMode,
  jurisdiction,
  setJurisdiction,
  matterId,
  compact,
  blocked,
  onCredits,
  onBlocked,
  onOpenArtifact,
  onOpenActa,
}: {
  backendUrl: string;
  accessToken: string;
  initialMessage?: string;
  initialDocumentIds?: string[];   // adjuntos que vienen del composer de Home/NuevaMisión
  loadSessionId?: string;   // abrir una conversación existente desde 'Recientes'
  mode: string;
  setMode: (m: string) => void;
  jurisdiction: string;
  setJurisdiction: (j: string) => void;
  matterId?: string;        // Mission Control: liga el chat a una misión (expediente)
  compact?: boolean;        // embebido en el panel de la misión: padding reducido
  blocked?: boolean;        // sin créditos → composer bloqueado
  onCredits?: (info: { balance?: number | null; cap?: number | null; low?: boolean }) => void;
  onBlocked?: () => void;
  onOpenArtifact?: (a: Artifact) => void;   // abrir un documento generado en el Canvas editable
  onOpenActa?: (sessionId: string) => void;  // "Ver el acta" idempotente → reabre la conversación del acta
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activityIdx, setActivityIdx] = useState<number | null>(null);  // qué turno tiene el sidebar abierto
  const sessionId = useRef<string>(loadSessionId || crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [fbPopup, setFbPopup] = useState(false);   // popup muestreado de feedback (no bloqueante)
  const fbPopupTried = useRef(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(-1);   // índice del turno cuyo nudge se descartó

  // Popup muestreado: al terminar un turno, si ya hubo ≥5 respuestas o se generó un documento, y es
  // elegible (máx 1/sesión y 1/24h), lo mostramos UNA vez. Anti-fatiga vía localStorage/sessionStorage.
  useEffect(() => {
    if (busy || fbPopup || fbPopupTried.current) return;
    const done = messages.filter((m) => m.role === "assistant" && m.turn.text).length;
    const hasDoc = messages.some((m) => m.role === "assistant" && m.turn.artifacts && m.turn.artifacts.length > 0);
    if ((done >= 5 || (hasDoc && done >= 2)) && feedbackPopupEligible()) {
      fbPopupTried.current = true;
      markFeedbackPopupShown();
      setFbPopup(true);
    }
  }, [busy, messages, fbPopup]);

  // Edita un turno assistant arbitrario por índice (feedback puede enviarse en cualquier turno).
  function patchTurnAt(idx: number, fn: (t: Turn) => void) {
    setMessages((m) => {
      const copy = [...m];
      const target = copy[idx];
      if (target && target.role === "assistant") {
        const turn = { ...target.turn, steps: [...target.turn.steps], artifacts: [...target.turn.artifacts] };
        fn(turn);
        copy[idx] = { role: "assistant", turn };
      }
      return copy;
    });
  }

  function patchTurn(fn: (t: Turn) => void) {
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        const turn = { ...last.turn, steps: [...last.turn.steps], artifacts: [...last.turn.artifacts] };
        fn(turn);
        copy[copy.length - 1] = { role: "assistant", turn };
      }
      return copy;
    });
  }

  async function runMessage(rawMsg: string, documentIds?: string[], opts?: { reuse?: boolean; auto?: number }) {
    const userMsg = rawMsg.trim();
    const hasDocs = !!(documentIds && documentIds.length);
    if (!userMsg && !hasDocs) return;
    const baseMsg = userMsg || "Revisa el documento que adjunté y dime de qué se trata.";
    // Subtle prefix when asking a question (vs drafting a document)
    const sendText = mode === "Pregunta" ? `Consulta legal: ${baseMsg}` : baseMsg;
    const displayMsg = userMsg || "📎 Documento adjunto";
    const reuse = !!opts?.reuse;
    const auto = opts?.auto ?? 1;  // presupuesto de auto-reintentos ante corte de red SSE

    if (reuse) {
      // Reintento: resetea el turno del asistente existente (no duplica la burbuja del usuario).
      patchTurn((t) => {
        t.thinking = ""; t.steps = []; t.text = ""; t.artifacts = []; t.activity = null;
        t.startedAt = Date.now(); t.firstTextAt = undefined; t.durationMs = null;
        t.retrying = false; t.netError = false; t.retryMsg = undefined; t.retryDocs = undefined;
      });
    } else {
      setMessages((m) => [...m, { role: "user", text: displayMsg }, { role: "assistant", turn: { thinking: "", steps: [], text: "", artifacts: [], startedAt: Date.now() } }]);
    }
    setBusy(true);

    let gotDone = false, serverError = false, willRetry = false;
    try {
      const res = await fetch(`${backendUrl}/api/chat/${sessionId.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: sendText, matter_id: matterId, document_ids: documentIds }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);
      trackChatUsage("registrado");  // Meta Pixel · activación (1×/sesión)

      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta")
          patchTurn((t) => {
            if (!t.firstTextAt) { t.firstTextAt = Date.now(); t.durationMs = t.startedAt ? t.firstTextAt - t.startedAt : null; }
            t.text += data.text;
          });
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "agent_step") patchTurn((t) => (t.agent = data.agent));
        // Fase en curso: anuncia la actividad ANTES de su ventana muda (p. ej. "Redactando el documento…")
        else if (event === "phase") patchTurn((t) => { t.activity = { name: data.name, label: labelFor(data.name), startedAt: Date.now() }; });
        // Verificación de fuentes: muestra las normas/sentencias que se están verificando.
        else if (event === "verify_progress") patchTurn((t) => {
          if (data.status === "started")
            t.activity = { name: "verificar_fuente", label: labelFor("verificar_fuente"), detail: (data.consultas || []).join(" · ") || null, startedAt: Date.now() };
        });
        else if (event === "tool_call") patchTurn((t) => { t.activity = null; t.steps.push({ name: data.name, label: labelFor(data.name), icon: iconFor(data.name), status: "running", startedAt: Date.now(), input: data.input }); });
        else if (event === "tool_result")
          patchTurn((t) => {
            t.activity = null;
            const s = [...t.steps].reverse().find((x) => x.name === data.name && x.status === "running");
            if (s) { s.status = "done"; s.endedAt = Date.now(); s.output = data.output; if (data.sources?.length) s.sources = data.sources; }
          });
        else if (event === "artifact") patchTurn((t) => {
          const a = {
            id: data.id, kind: data.kind, title: data.title, version: data.version ?? 1,
            uri: data.uri, version_id: data.version_id,
            blocks: Array.isArray(data.blocks) ? data.blocks : [],
            citations: data.citations || {},
          };
          // Dedupe: si una auto-revisión re-genera el documento (F1), reemplaza la tarjeta previa
          // del mismo título por la versión corregida en vez de mostrar dos.
          const prev = t.artifacts.findIndex((x) => x.title === a.title);
          if (prev >= 0) t.artifacts[prev] = a; else t.artifacts.push(a);
          // F4 — micro-prompt muestreado tras hito (primer documento): solo una vez, 50%.
          if (!t.microPrompt) {
            try {
              if (localStorage.getItem("jurovia_micro_asked") == null && Math.random() < 0.5) {
                localStorage.setItem("jurovia_micro_asked", "1");
                t.microPrompt = true;
              }
            } catch { /* ignore */ }
          }
        });
        else if (event === "done") { gotDone = true; patchTurn((t) => { t.messageId = data.message_id; t.runId = data.run_id; }); }
        else if (event === "hooks") patchTurn((t) => { t.hooks = Array.isArray(data.hooks) ? data.hooks : []; });
        else if (event === "credits") onCredits?.(data);
        else if (event === "blocked") { serverError = true; patchTurn((t) => (t.text += data.message || "Sin créditos disponibles.")); onBlocked?.(); }
        else if (event === "error") { serverError = true; patchTurn((t) => (t.text += `\n\n⚠️ ${data.message}`)); }
      }
      // El stream terminó SIN 'done' y sin error del servidor → conexión interrumpida (recuperable).
      if (!gotDone && !serverError) throw new Error("conexión interrumpida");
    } catch {
      if (!serverError) {
        if (auto > 0) {
          // Auto-reintento una vez: la red móvil suele recuperarse en segundos.
          willRetry = true;
          patchTurn((t) => { t.activity = null; t.thinking = ""; t.text = ""; t.steps = []; t.artifacts = []; t.retrying = true; });
          setTimeout(() => runMessage(rawMsg, documentIds, { reuse: true, auto: auto - 1 }), 1500);
        } else {
          // Auto-reintento agotado → ofrece "Reintentar" sin perder el contexto.
          patchTurn((t) => { t.retrying = false; t.netError = true; t.retryMsg = rawMsg; t.retryDocs = documentIds; });
        }
      }
      // serverError (sin créditos / error del servidor): ya se mostró; no se reintenta.
    } finally {
      // Cierra cualquier paso que quedó "running" y fija la duración total si no hubo texto.
      patchTurn((t) => {
        t.steps.forEach((s) => { if (s.status === "running") { s.status = "done"; s.endedAt = s.endedAt || Date.now(); } });
        if (!willRetry && t.durationMs == null && t.startedAt) t.durationMs = Date.now() - t.startedAt;
      });
      if (!willRetry) setBusy(false);
    }
  }

  // Arranca: o carga una conversación existente (Recientes), o lanza el mensaje inicial (Home).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (loadSessionId) {
      fetch(`${backendUrl}/api/sessions/${loadSessionId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.messages && Array.isArray(d.messages)) {
            setMessages(
              d.messages.map((m: any) =>
                m.role === "user"
                  ? { role: "user", text: m.text }
                  : {
                      role: "assistant",
                      turn: {
                        thinking: m.thinking || "",
                        // duración persistida → startedAt=0, endedAt=durationMs para que el sidebar la muestre
                        steps: (m.steps || []).map((s: any) => ({
                          name: s.name, label: labelFor(s.name), icon: iconFor(s.name), status: "done",
                          startedAt: 0, endedAt: s.durationMs ?? undefined, input: s.input, output: s.output,
                          sources: s.sources || [],
                        })),
                        text: m.text || "",
                        hooks: Array.isArray(m.hooks) ? m.hooks : [],
                        artifacts: (m.artifacts || []).map((a: any) => ({
                          id: a.id, kind: a.kind, title: a.title, version: a.version ?? 1,
                          uri: a.uri, version_id: a.version_id,
                          blocks: Array.isArray(a.blocks) ? a.blocks : [],
                          citations: a.citations || {},
                        })),
                        durationMs: m.durationMs ?? null,
                      },
                    },
              ),
            );
          }
        })
        .catch(() => {});
    } else if ((initialMessage && initialMessage.trim()) || (initialDocumentIds && initialDocumentIds.length)) {
      runMessage(initialMessage || "", initialDocumentIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(documentIds?: string[]) {
    if (busy) return;
    const msg = input.trim();
    if (!msg && !(documentIds && documentIds.length)) return;
    setInput("");
    runMessage(msg, documentIds);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: compact ? "100%" : 800, margin: "0 auto", padding: compact ? "18px 16px 12px" : "clamp(12px,4vw,32px) clamp(14px,4vw,28px) 24px" }}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <ChatMessage key={i} role="user">
                {m.text}
              </ChatMessage>
            ) : (
              <ChatMessage key={i} role="assistant" generating={busy && i === messages.length - 1}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {busy && i === messages.length - 1 ? (
                    // Turno vivo → timeline inline con fases + cronómetro (nunca un cursor mudo).
                    <InlineActivity
                      steps={m.turn.steps}
                      activity={m.turn.activity}
                      onOpen={() => setActivityIdx(i)}
                    />
                  ) : (m.turn.thinking || m.turn.steps.length > 0) ? (
                    // Turno terminado / recargado → píldora colapsada "Pensó durante Xs".
                    <ThoughtPill
                      busy={false}
                      durationMs={m.turn.durationMs ?? null}
                      hasActivity={!!m.turn.thinking || m.turn.steps.length > 0}
                      currentLabel={null}
                      onOpen={() => setActivityIdx(i)}
                    />
                  ) : null}
                  {m.turn.text && (
                    <div className={busy && i === messages.length - 1 ? "cursor-blink" : ""} style={{ color: "var(--text)" }}>
                      <Markdown text={m.turn.text} />
                    </div>
                  )}
                  {m.turn.text && <SourcesFooter steps={m.turn.steps} />}
                  {/* Hook Model — próximas acciones (chips branded animados). Un clic = envía ese prompt. */}
                  {!(busy && i === messages.length - 1) && m.turn.hooks && m.turn.hooks.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="sparkles" size={13} style={{ color: "var(--primary)" }} />Sigue con esto
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {m.turn.hooks.map((h, k) => {
                          const meta = HOOK_META[h.tipo] || HOOK_META.avanzar;
                          return (
                            <button key={k} className="jv-hook-chip" onClick={() => { if (busy) return; api.hookClick(backendUrl, { tipo: h.tipo, label: h.label, session_id: sessionId.current }); runMessage(h.prompt); }} disabled={busy}
                              style={{ animationDelay: `${k * 70}ms`, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, border: "1.5px solid transparent", backgroundImage: `linear-gradient(var(--bg-surface),var(--bg-surface)), ${meta.grad}`, backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box", cursor: busy ? "default" : "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text)", opacity: busy ? 0.55 : 1 }}>
                              <span style={{ fontSize: 15 }}>{meta.emoji}</span>{h.label}
                              <Icon name="arrowRight" size={14} stroke={2.2} style={{ color: "var(--primary)" }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {m.turn.artifacts.map((a, j) => (
                    <ArtifactCard
                      key={j}
                      doc={{ title: a.title, version: a.version, uri: a.uri }}
                      sources={Object.keys(a.citations || {}).length || 3}
                      backendUrl={backendUrl}
                      accessToken={accessToken}
                      artifactId={a.id}
                      version={a.version}
                      onOpen={onOpenArtifact && a.kind === "document" ? () => onOpenArtifact(a) : undefined}
                      onDocFeedback={(verdict, comment) => api.submitFeedback(backendUrl, accessToken, { kind: "document", verdict, comment, artifact_id: a.id, session_id: sessionId.current })}
                    />
                  ))}
                  {/* Opción A — resiliencia de red: reconexión / reintento ante corte SSE */}
                  {m.turn.retrying && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>↻ Reconectando…</div>
                  )}
                  {m.turn.netError && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>⚠️ Se perdió la conexión.</span>
                      <button onClick={() => runMessage(m.turn.retryMsg || "", m.turn.retryDocs, { reuse: true, auto: 1 })}
                        className="btn-ghost focus-ring"
                        style={{ fontSize: 13, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated-2)", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>
                        ↻ Reintentar
                      </button>
                    </div>
                  )}
                  {/* F4 — micro-prompt muestreado tras el primer documento */}
                  {!(busy && i === messages.length - 1) && m.turn.microPrompt && !m.turn.microSent && (
                    <MicroPrompt
                      onSend={(comment) => {
                        api.submitFeedback(backendUrl, accessToken, { kind: "micro", comment, session_id: sessionId.current });
                        patchTurnAt(i, (t) => { t.microSent = true; });
                      }}
                      onDismiss={() => patchTurnAt(i, (t) => { t.microSent = true; })}
                    />
                  )}
                  {/* F1 — feedback 👍/👎 en turnos ANTERIORES (el último usa el nudge animado sobre el composer) */}
                  {i !== messages.length - 1 && m.turn.text && !m.turn.feedbackSent && (
                    <FeedbackBar
                      onSend={(verdict, reason, comment) => {
                        api.submitFeedback(backendUrl, accessToken, {
                          kind: "response", verdict, reason, comment,
                          session_id: sessionId.current, message_id: m.turn.messageId, run_id: m.turn.runId,
                          context: { skill: m.turn.agent },
                        });
                        patchTurnAt(i, (t) => { t.feedbackSent = true; });
                      }}
                    />
                  )}
                </div>
              </ChatMessage>
            ),
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: compact ? "100%" : 800, margin: "0 auto", padding: compact ? "12px 14px 14px" : "14px clamp(14px,4vw,28px) 20px" }}>
          {(() => {
            const li = messages.length - 1;
            const last = messages[li];
            const show = !busy && last?.role === "assistant" && last.turn.text && !last.turn.feedbackSent && nudgeDismissed !== li;
            return show ? (
              <FeedbackNudge
                key={li}
                onSend={(verdict, reason, comment) => api.submitFeedback(backendUrl, accessToken, {
                  kind: "response", verdict, reason, comment,
                  session_id: sessionId.current, message_id: (last as { turn: Turn }).turn.messageId, run_id: (last as { turn: Turn }).turn.runId,
                  context: { skill: (last as { turn: Turn }).turn.agent, via: "nudge" },
                })}
                onDone={() => patchTurnAt(li, (t) => { t.feedbackSent = true; })}
                onDismiss={() => setNudgeDismissed(li)}
              />
            ) : null;
          })()}
          <Composer
            value={input}
            onChange={setInput}
            onSend={send}
            style="elevated"
            disabled={busy}
            compact={compact}
            backendUrl={backendUrl}
            accessToken={accessToken}
            matterId={matterId}
            blocked={blocked}
            sessionId={sessionId.current}
            onQuickSend={(text, docs) => runMessage(text, docs)}
            onOpenActa={onOpenActa}
            placeholder={compact ? "Pregúntale a esta misión…" : "Escribe un mensaje de seguimiento…"}
          />
          <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.45 }}>{AI_DISCLAIMER}</p>
        </div>
      </div>

      {activityIdx != null && messages[activityIdx]?.role === "assistant" && (
        <ActivitySidebar
          open
          onClose={() => setActivityIdx(null)}
          thinking={(messages[activityIdx] as { turn: Turn }).turn.thinking}
          steps={(messages[activityIdx] as { turn: Turn }).turn.steps}
          durationMs={(messages[activityIdx] as { turn: Turn }).turn.durationMs ?? null}
        />
      )}

      {fbPopup && (
        <FeedbackPopup
          onDismiss={() => setFbPopup(false)}
          onSubmit={(verdict, mood, comment) => {
            api.submitFeedback(backendUrl, accessToken, {
              kind: "sampled", verdict: verdict || undefined, comment,
              session_id: sessionId.current, context: { mood, trigger: "sampled" },
            });
          }}
        />
      )}
    </div>
  );
}

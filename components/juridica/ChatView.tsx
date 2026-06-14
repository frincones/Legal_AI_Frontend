"use client";

import { useRef, useState, useEffect } from "react";
import { Composer, ChatMessage } from "./shell";
import { ArtifactCard } from "./atoms";
import { Markdown } from "./Markdown";
import { ThoughtPill, ActivitySidebar, SourcesFooter, type ActStep } from "./Activity";

type Step = ActStep;
type Artifact = { title: string; uri: string; kind: string };
type Turn = { thinking: string; steps: Step[]; text: string; artifacts: Artifact[]; agent?: string;
  startedAt?: number; firstTextAt?: number; durationMs?: number | null };
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
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activityIdx, setActivityIdx] = useState<number | null>(null);  // qué turno tiene el sidebar abierto
  const sessionId = useRef<string>(loadSessionId || crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

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

  async function runMessage(rawMsg: string, documentIds?: string[]) {
    const userMsg = rawMsg.trim();
    const hasDocs = !!(documentIds && documentIds.length);
    if (!userMsg && !hasDocs) return;
    const baseMsg = userMsg || "Revisa el documento que adjunté y dime de qué se trata.";
    // Subtle prefix when asking a question (vs drafting a document)
    const sendText = mode === "Pregunta" ? `Consulta legal: ${baseMsg}` : baseMsg;
    const displayMsg = userMsg || "📎 Documento adjunto";

    setMessages((m) => [...m, { role: "user", text: displayMsg }, { role: "assistant", turn: { thinking: "", steps: [], text: "", artifacts: [], startedAt: Date.now() } }]);
    setBusy(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat/${sessionId.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: sendText, matter_id: matterId, document_ids: documentIds }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);

      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta")
          patchTurn((t) => {
            if (!t.firstTextAt) { t.firstTextAt = Date.now(); t.durationMs = t.startedAt ? t.firstTextAt - t.startedAt : null; }
            t.text += data.text;
          });
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "agent_step") patchTurn((t) => (t.agent = data.agent));
        else if (event === "tool_call") patchTurn((t) => t.steps.push({ name: data.name, label: labelFor(data.name), icon: iconFor(data.name), status: "running", startedAt: Date.now(), input: data.input }));
        else if (event === "tool_result")
          patchTurn((t) => {
            const s = [...t.steps].reverse().find((x) => x.name === data.name && x.status === "running");
            if (s) { s.status = "done"; s.endedAt = Date.now(); s.output = data.output; if (data.sources?.length) s.sources = data.sources; }
          });
        else if (event === "artifact") patchTurn((t) => t.artifacts.push({ title: data.title, uri: data.uri, kind: data.kind }));
        else if (event === "credits") onCredits?.(data);
        else if (event === "blocked") { patchTurn((t) => (t.text += data.message || "Sin créditos disponibles.")); onBlocked?.(); }
        else if (event === "error") patchTurn((t) => (t.text += `\n\n⚠️ ${data.message}`));
      }
    } catch (err: any) {
      patchTurn((t) => (t.text += `\n\n⚠️ Error: ${err.message}`));
    } finally {
      // Cierra cualquier paso que quedó "running" y fija la duración total si no hubo texto.
      patchTurn((t) => {
        t.steps.forEach((s) => { if (s.status === "running") { s.status = "done"; s.endedAt = s.endedAt || Date.now(); } });
        if (t.durationMs == null && t.startedAt) t.durationMs = Date.now() - t.startedAt;
      });
      setBusy(false);
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
                        artifacts: [],
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
      <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: compact ? "100%" : 800, margin: "0 auto", padding: compact ? "18px 16px 12px" : "32px 28px 24px" }}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <ChatMessage key={i} role="user">
                {m.text}
              </ChatMessage>
            ) : (
              <ChatMessage key={i} role="assistant" generating={busy && i === messages.length - 1}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {((busy && i === messages.length - 1) || m.turn.thinking || m.turn.steps.length > 0) && (
                    <ThoughtPill
                      busy={busy && i === messages.length - 1 && !m.turn.text}
                      durationMs={m.turn.durationMs ?? null}
                      hasActivity={!!m.turn.thinking || m.turn.steps.length > 0}
                      currentLabel={m.turn.steps.find((s) => s.status === "running")?.label}
                      onOpen={() => setActivityIdx(i)}
                    />
                  )}
                  {m.turn.text && (
                    <div className={busy && i === messages.length - 1 ? "cursor-blink" : ""} style={{ color: "var(--text)" }}>
                      <Markdown text={m.turn.text} />
                    </div>
                  )}
                  {m.turn.text && <SourcesFooter steps={m.turn.steps} />}
                  {m.turn.artifacts.map((a, j) => (
                    <ArtifactCard key={j} doc={{ title: a.title, uri: a.uri }} />
                  ))}
                </div>
              </ChatMessage>
            ),
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: compact ? "100%" : 800, margin: "0 auto", padding: compact ? "12px 14px 14px" : "14px 28px 20px" }}>
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
            placeholder={compact ? "Pregúntale a esta misión…" : "Escribe un mensaje de seguimiento…"}
          />
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
    </div>
  );
}

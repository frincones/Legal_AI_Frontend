"use client";

import { useRef, useState, useEffect } from "react";
import { Icon } from "./icons";
import { Composer, ChatMessage } from "./shell";
import { StepChip, Reasoning, ArtifactCard } from "./atoms";

type Step = { name: string; label: string; icon: string; status: "running" | "done" };
type Artifact = { title: string; uri: string; kind: string };
type Turn = { thinking: string; steps: Step[]; text: string; artifacts: Artifact[]; agent?: string };
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
  loadSessionId,
  mode,
  setMode,
  jurisdiction,
  setJurisdiction,
  matterId,
}: {
  backendUrl: string;
  accessToken: string;
  initialMessage?: string;
  loadSessionId?: string;   // abrir una conversación existente desde 'Recientes'
  mode: string;
  setMode: (m: string) => void;
  jurisdiction: string;
  setJurisdiction: (j: string) => void;
  matterId?: string;        // Mission Control: liga el chat a una misión (expediente)
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
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

  async function runMessage(rawMsg: string) {
    const userMsg = rawMsg.trim();
    if (!userMsg) return;
    // Subtle prefix when asking a question (vs drafting a document)
    const sendText = mode === "Pregunta" ? `Consulta legal: ${userMsg}` : userMsg;

    setMessages((m) => [...m, { role: "user", text: userMsg }, { role: "assistant", turn: { thinking: "", steps: [], text: "", artifacts: [] } }]);
    setBusy(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat/${sessionId.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: sendText, matter_id: matterId }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);

      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta") patchTurn((t) => (t.text += data.text));
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "agent_step") patchTurn((t) => (t.agent = data.agent));
        else if (event === "tool_call") patchTurn((t) => t.steps.push({ name: data.name, label: labelFor(data.name), icon: iconFor(data.name), status: "running" }));
        else if (event === "tool_result")
          patchTurn((t) => {
            const s = [...t.steps].reverse().find((x) => x.name === data.name && x.status === "running");
            if (s) s.status = "done";
          });
        else if (event === "artifact") patchTurn((t) => t.artifacts.push({ title: data.title, uri: data.uri, kind: data.kind }));
        else if (event === "error") patchTurn((t) => (t.text += `\n\n⚠️ ${data.message}`));
      }
    } catch (err: any) {
      patchTurn((t) => (t.text += `\n\n⚠️ Error: ${err.message}`));
    } finally {
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
              d.messages.map((m: { role: string; text: string }) =>
                m.role === "user"
                  ? { role: "user", text: m.text }
                  : { role: "assistant", turn: { thinking: "", steps: [], text: m.text, artifacts: [] } },
              ),
            );
          }
        })
        .catch(() => {});
    } else if (initialMessage && initialMessage.trim()) {
      runMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput("");
    runMessage(msg);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 28px 24px" }}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <ChatMessage key={i} role="user">
                {m.text}
              </ChatMessage>
            ) : (
              <ChatMessage key={i} role="assistant" generating={busy && i === messages.length - 1}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {m.turn.thinking && <Reasoning text={m.turn.thinking} />}
                  {m.turn.steps.map((s, j) => (
                    <StepChip key={j} icon={s.icon} label={s.label} state={s.status} />
                  ))}
                  {m.turn.text && (
                    <div
                      className={busy && i === messages.length - 1 ? "cursor-blink" : ""}
                      style={{ whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.6, color: "var(--text)" }}
                    >
                      {m.turn.text}
                    </div>
                  )}
                  {m.turn.artifacts.map((a, j) => (
                    <ArtifactCard key={j} doc={{ title: a.title, uri: a.uri }} />
                  ))}
                  {!m.turn.text && !m.turn.steps.length && !m.turn.thinking && busy && i === messages.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13.5 }}>
                      <Icon name="sparkles" size={15} style={{ color: "var(--primary)", animation: "spin 2s linear infinite" }} />
                      Pensando…
                    </div>
                  )}
                </div>
              </ChatMessage>
            ),
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "14px 28px 20px" }}>
          <Composer
            value={input}
            onChange={setInput}
            onSend={send}
            mode={mode}
            onMode={setMode}
            jurisdiction={jurisdiction}
            onJurisdiction={setJurisdiction}
            style="elevated"
            disabled={busy}
            placeholder="Escribe un mensaje de seguimiento…"
          />
        </div>
      </div>
    </div>
  );
}

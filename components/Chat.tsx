"use client";

import { useRef, useState } from "react";

type Step = { name: string; label: string; status: "running" | "done" };
type Artifact = { title: string; uri: string; kind: string };
type Turn = { thinking: string; steps: Step[]; text: string; artifacts: Artifact[]; agent?: string };
type Msg = { role: "user"; text: string } | { role: "assistant"; turn: Turn };

const LABELS: Record<string, string> = {
  web_search: "🔎 Buscando en la web",
  web_fetch: "🌐 Leyendo una fuente",
  search_documents: "📚 Revisando tus documentos",
  render_letter: "📝 Generando el documento",
  render_memo: "📝 Generando el memo",
  build_table_doc: "📊 Generando la tabla",
  render_document_code: "📝 Generando el documento (formato avanzado)",
  run_code: "🧮 Ejecutando cálculo",
};
const labelFor = (n: string) => LABELS[n] ?? `⚙️ ${n}`;

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

export default function Chat({
  backendUrl,
  accessToken,
  email,
}: {
  backendUrl: string;
  accessToken: string;
  email: string | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [docs, setDocs] = useState<{ id: string; title: string }[]>([]);
  const sessionId = useRef<string>(crypto.randomUUID());

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

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("session_id", sessionId.current);
    try {
      const res = await fetch(`${backendUrl}/api/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const data = await res.json();
      if (data.document_id) setDocs((d) => [...d, { id: data.document_id, title: data.title }]);
    } catch {
      /* ignore */
    }
    e.target.value = "";
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    const docIds = docs.map((d) => d.id);
    setInput("");
    setDocs([]);
    setMessages((m) => [
      ...m,
      { role: "user", text: userMsg },
      { role: "assistant", turn: { thinking: "", steps: [], text: "", artifacts: [] } },
    ]);
    setBusy(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat/${sessionId.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: userMsg, document_ids: docIds.length ? docIds : undefined }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);

      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta") patchTurn((t) => (t.text += data.text));
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "agent_step") patchTurn((t) => (t.agent = data.agent));
        else if (event === "tool_call") patchTurn((t) => t.steps.push({ name: data.name, label: labelFor(data.name), status: "running" }));
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

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 20, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <strong>Legal AI</strong>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{email}</span>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, padding: "16px 0" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Escribe algo — verás el razonamiento, los pasos y los documentos generados en vivo.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} style={{ alignSelf: "flex-end", background: "var(--accent)", color: "#06101f", padding: "10px 14px", borderRadius: 12, maxWidth: "80%", whiteSpace: "pre-wrap" }}>
              {m.text}
            </div>
          ) : (
            <div key={i} style={{ alignSelf: "flex-start", maxWidth: "92%", display: "flex", flexDirection: "column", gap: 8 }}>
              {m.turn.thinking && (
                <details style={{ background: "#10131b", borderRadius: 10, padding: "6px 12px", border: "1px solid #20242e" }}>
                  <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>💭 Razonamiento</summary>
                  <div style={{ color: "#9aa3b5", fontSize: 13, whiteSpace: "pre-wrap", marginTop: 6 }}>{m.turn.thinking}</div>
                </details>
              )}
              {m.turn.steps.map((s, j) => (
                <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: 13, background: "#10131b", borderRadius: 8, padding: "6px 12px", border: "1px solid #20242e" }}>
                  <span>{s.status === "done" ? "✓" : "⏳"}</span>
                  <span>{s.label}</span>
                </div>
              ))}
              {m.turn.text && (
                <div style={{ background: "var(--panel)", color: "var(--text)", padding: "10px 14px", borderRadius: 12, whiteSpace: "pre-wrap" }}>
                  {m.turn.text || (busy ? "…" : "")}
                </div>
              )}
              {m.turn.artifacts.map((a, j) => (
                <a key={j} href={a.uri} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--panel)", padding: "10px 14px", borderRadius: 10, textDecoration: "none", border: "1px solid #2a2f3a" }}>
                  📄 <span style={{ color: "var(--text)" }}>{a.title}</span>
                  <span style={{ marginLeft: "auto", color: "var(--accent)", fontSize: 13 }}>Descargar ({a.kind})</span>
                </a>
              ))}
              {!m.turn.text && !m.turn.steps.length && !m.turn.thinking && busy && (
                <div style={{ color: "var(--muted)" }}>…</div>
              )}
            </div>
          ),
        )}
      </div>

      {docs.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 6 }}>
          {docs.map((d) => (
            <span key={d.id} style={{ background: "var(--panel)", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>📎 {d.title}</span>
          ))}
        </div>
      )}

      <form onSubmit={send} style={{ display: "flex", gap: 8, paddingBottom: 12 }}>
        <label title="Adjuntar documento" style={{ display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 10, border: "1px solid #2a2f3a", background: "var(--panel)", cursor: "pointer", fontSize: 18 }}>
          📎
          <input type="file" onChange={uploadFile} style={{ display: "none" }} accept=".pdf,.docx,.txt" />
        </label>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mensaje…" style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #2a2f3a", background: "var(--panel)", color: "var(--text)" }} />
        <button type="submit" disabled={busy} style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#06101f", fontWeight: 600, cursor: "pointer" }}>
          {busy ? "…" : "Enviar"}
        </button>
      </form>
    </main>
  );
}

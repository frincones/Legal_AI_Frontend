"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

// Parser mínimo del bridge SSE (Fase 0). En Fase 1 → AssistantTransport state-converter.
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
      if (block.startsWith(":")) continue; // heartbeat
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
  const [artifacts, setArtifacts] = useState<{ title: string; uri: string; kind: string }[]>([]);
  const [tool, setTool] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ id: string; title: string }[]>([]);
  const sessionId = useRef<string>(crypto.randomUUID());

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
    setMessages((m) => [...m, { role: "user", text: userMsg }, { role: "assistant", text: "" }]);
    setBusy(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat/${sessionId.current}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: userMsg, document_ids: docIds.length ? docIds : undefined }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);

      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta") {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + data.text };
            return copy;
          });
        } else if (event === "tool_call") {
          setTool(data.name);
        } else if (event === "tool_result") {
          setTool(null);
        } else if (event === "artifact") {
          setArtifacts((a) => [...a, { title: data.title, uri: data.uri, kind: data.kind }]);
        } else if (event === "error") {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", text: `⚠️ ${data.message}` };
            return copy;
          });
        }
      }
    } catch (err: any) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: `⚠️ Error: ${err.message}` };
        return copy;
      });
    } finally {
      setBusy(false);
      setTool(null);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 20, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
        <strong>Legal AI</strong>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{email}</span>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, padding: "16px 0" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Fase 0 — bridge SSE operativo. Escribe algo para ver el stream del backend.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "var(--accent)" : "var(--panel)",
              color: m.role === "user" ? "#06101f" : "var(--text)",
              padding: "10px 14px",
              borderRadius: 12,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text || (m.role === "assistant" && busy ? "…" : "")}
          </div>
        ))}
        {tool && (
          <div style={{ alignSelf: "flex-start", color: "var(--muted)", fontSize: 13 }}>
            🔧 generando documento ({tool})…
          </div>
        )}
      </div>

      {artifacts.length > 0 && (
        <div style={{ borderTop: "1px solid #2a2f3a", padding: "10px 0", display: "grid", gap: 6 }}>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>Documentos generados</span>
          {artifacts.map((a, i) => (
            <a
              key={i}
              href={a.uri}
              target="_blank"
              rel="noreferrer"
              style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--panel)", padding: "8px 12px", borderRadius: 8, textDecoration: "none" }}
            >
              📄 <span style={{ color: "var(--text)" }}>{a.title}</span>
              <span style={{ marginLeft: "auto", color: "var(--accent)", fontSize: 13 }}>Descargar ({a.kind})</span>
            </a>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 6 }}>
          {docs.map((d) => (
            <span key={d.id} style={{ background: "var(--panel)", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
              📎 {d.title}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={send} style={{ display: "flex", gap: 8, paddingBottom: 12 }}>
        <label
          title="Adjuntar documento"
          style={{ display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 10, border: "1px solid #2a2f3a", background: "var(--panel)", cursor: "pointer", fontSize: 18 }}
        >
          📎
          <input type="file" onChange={uploadFile} style={{ display: "none" }} accept=".pdf,.docx,.txt" />
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mensaje…"
          style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #2a2f3a", background: "var(--panel)", color: "var(--text)" }}
        />
        <button type="submit" disabled={busy} style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#06101f", fontWeight: 600, cursor: "pointer" }}>
          {busy ? "…" : "Enviar"}
        </button>
      </form>
    </main>
  );
}

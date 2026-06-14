"use client";
/* Modo invitado (landing sin login) — chat real con fundamentación verificada vía /api/guest/chat.
   Reusa el parser SSE, Markdown y los átomos del chat de la app. El guest_id vive en localStorage. */
import { useEffect, useRef, useState } from "react";
import { Icon, Logo } from "../juridica/icons";
import { AgentAvatar } from "../juridica/atoms";
import { Markdown } from "../juridica/Markdown";
import { ThoughtPill, SourcesFooter, type ActStep } from "../juridica/Activity";

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

type Turn = { thinking: string; steps: ActStep[]; text: string; startedAt?: number; durationMs?: number | null; blocked?: boolean };
type Msg = { role: "user"; text: string } | { role: "assistant"; turn: Turn };

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

function guestId(): string {
  try {
    let id = localStorage.getItem("juridica_guest_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("juridica_guest_id", id); }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function GuestChat({ seed, backendUrl, onBack, onRegister }: {
  seed: string; backendUrl: string; onBack: () => void; onRegister: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

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

  async function run(message: string) {
    const msg = message.trim();
    if (!msg || busy) return;
    setMessages((m) => [...m, { role: "user", text: msg }, { role: "assistant", turn: { thinking: "", steps: [], text: "", startedAt: Date.now() } }]);
    setBusy(true);
    try {
      const res = await fetch(`${backendUrl}/api/guest/chat/${crypto.randomUUID()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, guest_id: guestId() }),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);
      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta") patchTurn((t) => { if (!t.durationMs && t.startedAt) t.durationMs = Date.now() - t.startedAt; t.text += data.text; });
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "tool_call") patchTurn((t) => t.steps.push({ name: data.name, label: labelFor(data.name), icon: iconFor(data.name), status: "running", startedAt: Date.now(), input: data.input }));
        else if (event === "tool_result") patchTurn((t) => {
          const s = [...t.steps].reverse().find((x) => x.name === data.name && x.status === "running");
          if (s) { s.status = "done"; s.endedAt = Date.now(); s.output = data.output; if (data.sources?.length) s.sources = data.sources; }
        });
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
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (seed && seed.trim()) run(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  function send() { const v = input.trim(); if (!v || busy) return; setInput(""); run(v); }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ paddingLeft: 8 }}><Icon name="arrowLeft" size={16} />Volver</button>
        <Logo size={28} withText />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-elevated-2)", borderRadius: 999, padding: "3px 10px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />Modo invitado</span>
        <span style={{ flex: 1 }} />
        <button onClick={onRegister} className="btn btn-ghost btn-sm land-hide-mobile">Iniciar sesión</button>
        <button onClick={onRegister} className="btn btn-primary btn-sm">Empieza gratis</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", background: "var(--grad-aurora-soft)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
        <Icon name="sparkles" size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Estás probando Juridica sin registrarte. Las respuestas vienen <strong style={{ color: "var(--text)" }}>verificadas con su fuente</strong>. Regístrate gratis para generar documentos y guardar tu conversación.</span>
        <button onClick={onRegister} className="btn btn-gold btn-sm land-hide-mobile" style={{ flexShrink: 0 }}>Crear cuenta</button>
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
                  {m.turn.blocked && (
                    <div className="fade-up" style={{ marginTop: 4, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--grad-aurora-soft)" }}>
                      <div style={{ fontWeight: 650, marginBottom: 6 }}>Regístrate gratis para continuar</div>
                      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 12 }}>Conservas el plan Free y desbloqueas documentos, misiones y vigilancia. Sin tarjeta.</div>
                      <button className="btn btn-primary" onClick={onRegister}>Empieza gratis<Icon name="arrowRight" size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)", padding: "14px 20px 18px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, border: "1px solid var(--border-strong)", borderRadius: "var(--r-xl)", padding: "8px 8px 8px 18px", background: "var(--bg-surface)", boxShadow: "var(--sh-2)" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} disabled={busy} className="land-composer"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escribe tu consulta jurídica…"
              style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 15.5, lineHeight: 1.5, color: "var(--text)", fontFamily: "var(--font-ui)", padding: "9px 0", maxHeight: 140 }} />
            <button onClick={send} disabled={!input.trim() || busy} style={{ width: 40, height: 40, borderRadius: 11, border: "none", background: input.trim() && !busy ? "var(--aurora)" : "var(--bg-elevated-2)", color: input.trim() && !busy ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="arrowUp" size={19} stroke={2.4} /></button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", margin: "10px 0 0" }}>Juridica puede equivocarse. Verifica las citas con su enlace oficial. No subas datos sensibles de clientes en modo invitado.</p>
        </div>
      </div>
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
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>Empiezas con el plan Free. Sin tarjeta.</p>
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

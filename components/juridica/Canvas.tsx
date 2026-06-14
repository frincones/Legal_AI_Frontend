"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { Icon } from "./icons";
import { ChatMessage } from "./shell";
import { AgentAvatar, StepChip, Reasoning, ArtifactCard, VerifiedChip, STATUS_META } from "./atoms";
import type { Citation } from "./data";

/* ============================================================
   Types — the real artifact model from the SSE `artifact` event
   ============================================================ */
export type Block = {
  type: "court" | "ref" | "h" | "p";
  text: string;
  num?: string;
  cites?: string[];
  changed?: boolean;
};

export type Artifact = {
  id: string;
  kind: string;
  title: string;
  version: number;
  uri?: string;
  version_id?: string;
  blocks: Block[];
  citations: Record<string, Citation>;
};

type Step = { name: string; label: string; icon: string; status: "running" | "done" };
type Turn = {
  kind: "gen" | "edit";
  thinking: string;
  steps: Step[];
  text: string;
  artifact?: Artifact;
  sel?: string;
};
type Msg = { role: "user"; text: string; sel?: string } | { role: "assistant"; turn: Turn };

/* Each version we have received, keyed by version number. */
type VersionData = { artifact: Artifact };

/* ============================================================
   SSE helpers (same contract as ChatView)
   ============================================================ */
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

// Tools que producen un documento entregable → disparan el panel de documento (split-pane).
const DOC_TOOLS = new Set(["render_document_code", "render_letter", "render_memo", "build_table_doc"]);

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

/* ============================================================
   Document renderer — ports doc.jsx DocumentView fiel al diseño
   ============================================================ */
function renderBlockText(block: Block, chipVariant: "pill" | "badge" | "underline", pulseSet: Set<string>, citations: Record<string, Citation>): ReactNode {
  if (!block.cites || !block.cites.length) return block.text;
  return (
    <>
      {block.text}{" "}
      <span style={{ whiteSpace: "nowrap", display: "inline-flex", gap: 5, verticalAlign: "baseline" }}>
        {block.cites.map((cid) => (
          <VerifiedChip key={cid} citeId={cid} citations={citations} variant={chipVariant} pulse={pulseSet && pulseSet.has(cid)} />
        ))}
      </span>
    </>
  );
}

export function DocumentView({
  blocks,
  citations,
  chipVariant = "pill",
  compare = false,
  onRequestChange,
  pulseSet,
  reveal = 999,
}: {
  blocks: Block[];
  citations: Record<string, Citation>;
  chipVariant?: "pill" | "badge" | "underline";
  compare?: boolean;
  onRequestChange?: (text: string) => void;
  pulseSet: Set<string>;
  reveal?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<{ top: number; left: number; text: string } | null>(null);

  function handleMouseUp() {
    const s = window.getSelection();
    if (!s || s.isCollapsed || !ref.current) {
      setSel(null);
      return;
    }
    const txt = s.toString().trim();
    if (txt.length < 3) {
      setSel(null);
      return;
    }
    if (!ref.current.contains(s.anchorNode)) {
      setSel(null);
      return;
    }
    const rect = s.getRangeAt(0).getBoundingClientRect();
    const base = ref.current.getBoundingClientRect();
    setSel({ top: rect.top - base.top + ref.current.scrollTop - 6, left: rect.left - base.left + rect.width / 2, text: txt });
  }

  return (
    <div ref={ref} onMouseUp={handleMouseUp} style={{ position: "relative", height: "100%", overflow: "auto", background: "var(--bg-elevated-2)" }}>
      {/* Floating "Pedir cambio" pill */}
      {sel && (
        <button
          className="fade-in"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onRequestChange && onRequestChange(sel.text);
            window.getSelection()?.removeAllRanges();
            setSel(null);
          }}
          style={{
            position: "absolute",
            top: sel.top,
            left: sel.left,
            transform: "translate(-50%, -100%)",
            zIndex: 30,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-pill)",
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "var(--glow-primary)",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="pencil" size={14} /> Pedir cambio
        </button>
      )}

      {/* The "paper" */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "44px 0 80px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "var(--sh-3)",
            padding: "64px 68px",
            fontFamily: "var(--font-doc)",
            color: "#15110B",
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          {blocks.slice(0, reveal).map((b, i) => {
            const changedStyle =
              compare && b.changed ? { background: "rgba(22,163,74,0.12)", boxShadow: "inset 3px 0 0 var(--success)", borderRadius: 3 } : {};
            const hoverProps = {
              onMouseEnter: (e: React.MouseEvent<HTMLParagraphElement>) => {
                if (!compare) e.currentTarget.style.background = "rgba(91,77,227,0.05)";
              },
              onMouseLeave: (e: React.MouseEvent<HTMLParagraphElement>) => {
                if (!compare && !(compare && b.changed)) e.currentTarget.style.background = "";
              },
            };
            const baseSpacing = { transition: "background .15s", padding: "2px 6px", margin: "0 -6px", borderRadius: 3 };

            if (b.type === "court")
              return (
                <p key={i} style={{ textAlign: "center", fontWeight: 700, letterSpacing: "0.02em", margin: "0 0 6px", fontSize: 15.5 }}>
                  {b.text}
                </p>
              );
            if (b.type === "ref")
              return (
                <p key={i} style={{ textAlign: "center", fontStyle: "italic", color: "#6B5E4A", margin: "0 0 30px", fontSize: 14 }}>
                  {b.text}
                </p>
              );
            if (b.type === "h")
              return (
                <h3 key={i} style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.03em", margin: "28px 0 12px", textTransform: "uppercase" }}>
                  {b.text}
                </h3>
              );
            return (
              <p key={i} {...hoverProps} style={{ ...baseSpacing, ...changedStyle, marginTop: 12, marginBottom: 12, textAlign: "justify" }}>
                {b.num && <strong style={{ fontWeight: 700 }}>{b.num} </strong>}
                {renderBlockText(b, chipVariant, pulseSet, citations)}
                {compare && b.changed && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, color: "var(--success)", verticalAlign: "middle" }}>
                    <Icon name="plus" size={11} stroke={3} /> v2
                  </span>
                )}
              </p>
            );
          })}
          {reveal < blocks.length && (
            <p style={{ margin: "12px 0" }}>
              <span className="cursor-blink" style={{ color: "var(--text-muted)" }} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Version bar — ports doc.jsx VersionBar
   ============================================================ */
export function VersionBar({
  versions,
  current,
  onSelect,
  compare,
  onToggleCompare,
  onAccept,
  onReject,
  position = "bottom",
}: {
  versions: number[];
  current: number;
  onSelect: (v: number) => void;
  compare: boolean;
  onToggleCompare: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  position?: "top" | "bottom";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 18px",
        background: "var(--bg-surface)",
        borderTop: position === "bottom" ? "1px solid var(--border)" : "none",
        borderBottom: position === "top" ? "1px solid var(--border)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {versions.map((v) => {
          const isCur = v === current;
          return (
            <button
              key={v}
              onClick={() => onSelect(v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 30,
                padding: "0 12px",
                borderRadius: "var(--r-pill)",
                border: `1px solid ${isCur ? "var(--primary)" : "var(--border)"}`,
                background: isCur ? "var(--primary-soft)" : "var(--bg-surface)",
                color: isCur ? "var(--primary)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isCur ? "var(--primary)" : "var(--border-strong)" }} />
              v{v}
              {isCur && v === Math.max(...versions) ? " · actual" : ""}
            </button>
          );
        })}
      </div>
      <span style={{ flex: 1 }} />
      <button className={`btn btn-sm ${compare ? "btn-primary" : "btn-secondary"}`} onClick={onToggleCompare}>
        <Icon name="gitCompare" size={15} /> Comparar
      </button>
      {compare ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm btn-secondary" onClick={onReject}>
            <Icon name="x" size={14} /> Rechazar
          </button>
          <button className="btn btn-sm btn-primary" onClick={onAccept}>
            <Icon name="check" size={14} /> Aceptar cambios
          </button>
        </div>
      ) : (
        <button className="btn btn-sm btn-gold" onClick={onAccept}>
          <Icon name="check" size={15} /> Aceptar
        </button>
      )}
    </div>
  );
}

/* ============================================================
   Verified sources side panel — ports canvas.jsx SourcesPanel
   ============================================================ */
export function SourcesPanel({ citations, onClose }: { citations: Record<string, Citation>; onClose: () => void }) {
  const ids = Object.keys(citations);
  return (
    <div className="fade-in" style={{ width: 300, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <Icon name="shieldCheck" size={17} style={{ color: "var(--success)" }} />
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Fuentes verificadas</span>
        <button onClick={onClose} style={{ border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {ids.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Sin fuentes aún.</div>
        )}
        {ids.map((id) => {
          const c = citations[id];
          const m = STATUS_META[c.status] || STATUS_META.vigente;
          return (
            <div key={id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 12, background: "var(--bg-surface)", boxShadow: "var(--sh-1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <Icon name={m.icon} size={15} style={{ color: m.color }} />
                <span style={{ fontWeight: 650, fontSize: 13 }}>{c.label}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: m.text, background: m.bg, padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.03em" }}>{m.word}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="link" size={12} />
                {c.source} · tier {c.tier}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
          <Icon name="layers" size={15} />
          Ver auditoría completa
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Canvas — the split-pane star screen, wired to real SSE
   ============================================================ */
export function Canvas({
  backendUrl,
  accessToken,
  initialMessage,
  initialDocumentIds,
  reusePatronId,
  reuseTitle,
  openArtifact,
  narrow = false,
  pushToast,
  blocked,
  onCredits,
  onBlocked,
}: {
  backendUrl: string;
  accessToken: string;
  initialMessage?: string;
  initialDocumentIds?: string[];   // adjuntos del composer de Home (primer mensaje)
  blocked?: boolean;
  onCredits?: (info: { balance?: number | null; cap?: number | null; low?: boolean }) => void;
  onBlocked?: () => void;
  reusePatronId?: string;   // F4: parte de un patrón validado de la biblioteca (reuse_patron_id)
  reuseTitle?: string;      // F4: título de la plantilla reutilizada (para el banner)
  openArtifact?: Artifact;  // abrir un documento ya generado (p.ej. desde el chat de una misión) para editarlo
  narrow?: boolean;
  pushToast?: (text: string, kind?: string) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(999);
  const [pulseSet, setPulseSet] = useState<Set<string>>(new Set());

  // Versions store: each received artifact keyed by version number.
  const [versionStore, setVersionStore] = useState<Record<number, VersionData>>({});
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [compare, setCompare] = useState(false);

  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "doc">("doc");
  // Canvas adaptativo: el split-pane (panel de documento) SOLO aparece cuando el agente
  // realmente está generando un documento. Una pregunta casual no abre el panel.
  const [docMode, setDocMode] = useState(false);

  const [followup, setFollowup] = useState("");
  const [selContext, setSelContext] = useState<string | null>(null);

  const sessionId = useRef<string>(crypto.randomUUID());
  const chatRef = useRef<HTMLDivElement>(null);
  const followRef = useRef<HTMLTextAreaElement>(null);
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(false);
  const editArtifactId = useRef<string | null>(null);
  const reuseConsumed = useRef(false);   // F4: reuse_patron_id se aplica solo en el primer mensaje
  const [pdfBusy, setPdfBusy] = useState(false);   // F5: export PDF on-demand

  const versions = Object.keys(versionStore)
    .map(Number)
    .sort((a, b) => a - b);
  const activeArtifact = currentVersion ? versionStore[currentVersion]?.artifact : undefined;
  const hasDoc = !!activeArtifact;
  // El split-pane aparece solo cuando hay un documento en juego (el agente lo está
  // redactando o ya llegó). Para preguntas/charla casual, el Canvas es un chat normal.
  const showSplit = docMode || hasDoc;

  useEffect(() => () => revealTimers.current.forEach(clearTimeout), []);

  function pulseGold(ids: string[]) {
    setPulseSet(new Set(ids));
    const t = setTimeout(() => setPulseSet(new Set()), 1300);
    revealTimers.current.push(t);
  }

  // Animated per-block reveal once an artifact arrives.
  function startReveal(blocks: Block[], goldIds: string[]) {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setReveal(0);
    const total = blocks.length;
    for (let i = 1; i <= total; i++) {
      const t = setTimeout(() => setReveal(i), i * 90);
      revealTimers.current.push(t);
    }
    const done = setTimeout(() => {
      setReveal(999);
      if (goldIds.length) pulseGold(goldIds);
    }, total * 90 + 200);
    revealTimers.current.push(done);
  }

  function patchTurn(fn: (t: Turn) => void) {
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        const turn: Turn = { ...last.turn, steps: [...last.turn.steps] };
        fn(turn);
        copy[copy.length - 1] = { role: "assistant", turn };
      }
      return copy;
    });
  }

  async function runMessage(rawMsg: string, opts?: { kind?: "gen" | "edit"; sel?: string; documentIds?: string[] }) {
    const userMsg = rawMsg.trim();
    const docs = opts?.documentIds;
    if (!userMsg && !(docs && docs.length)) return;
    const kind = opts?.kind ?? "gen";
    const sel = opts?.sel;
    const baseMsg = userMsg || "Genera un documento a partir del archivo que adjunté.";

    setMessages((m) => [
      ...m,
      { role: "user", text: userMsg || "📎 Documento adjunto", sel },
      { role: "assistant", turn: { kind, thinking: "", steps: [], text: "", sel } },
    ]);
    setBusy(true);

    try {
      const body: Record<string, any> = { message: baseMsg };
      if (docs && docs.length) body.document_ids = docs;
      if (kind === "edit" && editArtifactId.current) {
        body.edit_artifact_id = editArtifactId.current;
        if (sel) body.selection = sel;
      } else if (reusePatronId && !reuseConsumed.current && !editArtifactId.current) {
        // F4: el primer mensaje tras "Reusar plantilla" parte del docx-js validado del patrón
        // (aún no hay artifact que editar). Se aplica una sola vez.
        body.reuse_patron_id = reusePatronId;
        reuseConsumed.current = true;
      }

      const res = await fetch(`${backendUrl}/api/chat/${sessionId.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error(`backend ${res.status}`);

      for await (const { event, data } of parseSSE(res)) {
        if (event === "text_delta") patchTurn((t) => (t.text += data.text));
        else if (event === "thinking") patchTurn((t) => (t.thinking += data.text));
        else if (event === "tool_call") {
          // Apenas el agente decide redactar un documento, abrimos el panel (split).
          if (DOC_TOOLS.has(data.name)) setDocMode(true);
          patchTurn((t) => t.steps.push({ name: data.name, label: labelFor(data.name), icon: iconFor(data.name), status: "running" }));
        }
        else if (event === "tool_result")
          patchTurn((t) => {
            const s = [...t.steps].reverse().find((x) => x.name === data.name && x.status === "running");
            if (s) s.status = "done";
          });
        else if (event === "verify_progress")
          patchTurn((t) => {
            if (data.status === "started") t.steps.push({ name: "verificar_fuente", label: labelFor("verificar_fuente"), icon: iconFor("verificar_fuente"), status: "running" });
            else if (data.status === "done") {
              const s = [...t.steps].reverse().find((x) => x.name === "verificar_fuente" && x.status === "running");
              if (s) s.status = "done";
            }
          });
        else if (event === "credits") onCredits?.(data);
        else if (event === "blocked") { patchTurn((t) => (t.text += data.message || "Sin créditos disponibles.")); onBlocked?.(); }
        else if (event === "artifact") {
          const art: Artifact = {
            id: data.id,
            kind: data.kind,
            title: data.title,
            version: data.version ?? 1,
            uri: data.uri,
            version_id: data.version_id,
            blocks: Array.isArray(data.blocks) ? data.blocks : [],
            citations: data.citations || {},
          };
          editArtifactId.current = art.id;
          setDocMode(true);
          patchTurn((t) => (t.artifact = art));
          setVersionStore((vs) => ({ ...vs, [art.version]: { artifact: art } }));
          setCurrentVersion(art.version);
          setCompare(art.version > 1);
          setTab("doc");
          const goldIds = art.blocks.flatMap((b) => b.cites || []);
          startReveal(art.blocks, goldIds);
          if (pushToast) {
            if (art.version === 1) {
              const n = Object.keys(art.citations).length;
              pushToast(`Versión 1 creada · verificada (${n} ${n === 1 ? "fuente oficial" : "fuentes oficiales"})`, "gold");
            } else {
              pushToast(`Versión ${art.version} creada`, "primary");
            }
          }
        } else if (event === "error") patchTurn((t) => (t.text += `\n\n⚠️ ${data.message}`));
      }
    } catch (err: any) {
      patchTurn((t) => (t.text += `\n\n⚠️ Error: ${err.message}`));
    } finally {
      setBusy(false);
    }
  }

  // Kick off generation with the message typed on Home, o abre un documento ya generado para editarlo.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (openArtifact) {
      // Documento existente (p.ej. generado dentro de una misión) → cargarlo en el panel y dejarlo
      // listo para editar. Las ediciones siguientes parchean este mismo artifact (edit_artifact_id).
      const art = openArtifact;
      editArtifactId.current = art.id;
      setVersionStore({ [art.version]: { artifact: art } });
      setCurrentVersion(art.version);
      setDocMode(true);
      setTab("doc");
      setReveal(999);
      setMessages([{ role: "assistant", turn: { kind: "gen", thinking: "", steps: [], text: "Documento cargado. Selecciona un párrafo o escríbeme abajo para pedir cambios — generaré una versión nueva manteniendo las citas verificadas.", artifact: art } }]);
      return;
    }
    if ((initialMessage && initialMessage.trim()) || (initialDocumentIds && initialDocumentIds.length))
      runMessage(initialMessage || "", { kind: "gen", documentIds: initialDocumentIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, selContext]);

  // highlight-to-edit → set the selection in the follow-up composer
  function handleRequestChange(text: string) {
    setSelContext(text);
    setTab("chat");
    setTimeout(() => followRef.current && followRef.current.focus(), 60);
  }

  // F5 — Export PDF on-demand: el backend convierte el DOCX guardado a PDF (E2B aislado).
  // Descarga vía <a download> (no window.open, que el navegador bloquea como popup tras el await).
  async function downloadPdf() {
    if (!activeArtifact || pdfBusy) return;
    setPdfBusy(true);
    if (pushToast) pushToast("Generando PDF… (puede tardar unos segundos)", "info");
    try {
      const res = await fetch(`${backendUrl}/api/artifacts/${activeArtifact.id}/pdf?version=${activeArtifact.version}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        let detail = `${res.status}`;
        try {
          const j = await res.json();
          if (j?.detail) detail = j.detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(activeArtifact.title || "documento").replace(/[^\w.-]+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      if (pushToast) pushToast("PDF descargado", "gold");
    } catch (err: any) {
      if (pushToast) pushToast(`No se pudo generar el PDF: ${err.message}`, "info");
    } finally {
      setPdfBusy(false);
    }
  }

  function runEdit() {
    if (!followup.trim() || busy) return;
    const instruction = followup.trim();
    const sel = selContext ?? undefined;
    setFollowup("");
    setSelContext(null);
    runMessage(instruction, { kind: "edit", sel });
  }

  const docCitations = activeArtifact?.citations || {};
  const docBlocks = activeArtifact?.blocks || [];

  // ===== chat pane =====
  const chatPane = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-surface)", minWidth: 0 }}>
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "22px 22px 8px" }}>
        {/* F4 — Banner de reutilización: indica con qué plantilla se trabaja en el chat vacío. */}
        {reusePatronId && messages.length === 0 && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", gap: 16, padding: "0 24px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}>
              <Icon name="book" size={26} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div style={{ fontSize: 16.5, fontWeight: 650, marginBottom: 6 }}>
                Reutilizando la plantilla{reuseTitle ? " «" + reuseTitle + "»" : ""}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0, maxWidth: 420 }}>
                Partiré de este documento verificado y solo cambiaré los datos de tu caso. Escribe abajo los datos
                (partes, cuantías, juzgado, fechas…) y generaré una versión nueva.
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          if (m.role === "user")
            return (
              <ChatMessage key={i} role="user">
                {m.sel && (
                  <div
                    style={{
                      borderLeft: "3px solid var(--primary)",
                      background: "var(--primary-soft)",
                      borderRadius: 6,
                      padding: "7px 11px",
                      marginBottom: 9,
                      fontSize: 12.5,
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                      lineHeight: 1.45,
                    }}
                  >
                    &quot;{m.sel.length > 120 ? m.sel.slice(0, 120) + "…" : m.sel}&quot;
                  </div>
                )}
                {m.text}
              </ChatMessage>
            );

          // agent turn
          const t = m.turn;
          const live = busy && i === messages.length - 1;
          return (
            <div key={i} className="fade-up" style={{ display: "flex", gap: 12, marginBottom: 22 }}>
              <AgentAvatar size={30} generating={live} />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                {t.thinking && (
                  <div style={{ marginBottom: 10 }}>
                    <Reasoning text={t.thinking} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {t.steps.map((s, j) => (
                    <StepChip key={j} icon={s.icon} label={s.label} state={s.status} />
                  ))}
                </div>
                {t.text && (
                  <div className="fade-up" style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {t.text}
                  </div>
                )}
                {t.artifact && (
                  <div className="fade-up" style={{ marginTop: 14 }}>
                    <ArtifactCard doc={{ title: t.artifact.title, version: t.artifact.version, uri: t.artifact.uri }} sources={Object.keys(t.artifact.citations).length} onOpen={() => setTab("doc")} backendUrl={backendUrl} accessToken={accessToken} artifactId={t.artifact.id} version={t.artifact.version} />
                    {t.kind === "gen" && (
                      <>
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                          <button className="chip" onClick={() => setSourcesOpen(true)}>
                            <Icon name="shieldCheck" size={14} style={{ color: "var(--success)" }} />
                            Ver fuentes verificadas
                          </button>
                        </div>
                        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon name="pencil" size={14} /> Selecciona un párrafo en el documento para pedir un cambio puntual.
                        </p>
                      </>
                    )}
                  </div>
                )}
                {!t.text && !t.steps.length && !t.thinking && !t.artifact && live && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13.5 }}>
                    <Icon name="sparkles" size={15} style={{ color: "var(--primary)", animation: "spin 2s linear infinite" }} />
                    Pensando…
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* follow-up composer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px 14px", background: "var(--bg-surface)" }}>
        {selContext && (
          <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--primary-soft)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 10px", marginBottom: 8 }}>
            <Icon name="pencil" size={14} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.45 }}>
              &quot;{selContext.length > 90 ? selContext.slice(0, 90) + "…" : selContext}&quot;
            </span>
            <button onClick={() => setSelContext(null)} style={{ border: "none", background: "transparent", color: "var(--text-muted)", padding: 2, cursor: "pointer" }}>
              <Icon name="x" size={14} />
            </button>
          </div>
        )}
        {blocked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 6, borderRadius: "var(--r-md)", background: "var(--warning-soft)", color: "var(--warning)", fontSize: 12.5, fontWeight: 600 }}>
            <Icon name="lock" size={14} /> Sin créditos — el agente está bloqueado.
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "6px 6px 6px 14px", background: "var(--bg-base)" }}>
          <textarea
            ref={followRef}
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
            rows={1}
            disabled={blocked}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!blocked) runEdit();
              }
            }}
            placeholder={selContext ? "Describe el cambio para la selección…" : hasDoc ? "Pide un cambio o una nueva sección…" : "Escribe tu mensaje…"}
            style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 14, lineHeight: 1.5, color: "var(--text)", fontFamily: "var(--font-ui)", padding: "8px 0", maxHeight: 120 }}
          />
          <button
            onClick={runEdit}
            disabled={!followup.trim() || busy || blocked}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "none",
              background: followup.trim() && !busy && !blocked ? "var(--aurora)" : "var(--bg-elevated-2)",
              color: followup.trim() && !busy && !blocked ? "#fff" : "var(--text-muted)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="arrowUp" size={18} stroke={2.4} />
          </button>
        </div>
      </div>
    </div>
  );

  // ===== document pane =====
  const docPane = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="fileText" size={18} style={{ color: "var(--primary)" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeArtifact?.title || "Generando documento…"}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--grad-gold)" }} /> Verificado · v{currentVersion || 1} · DOCX
          </div>
        </div>
        {activeArtifact?.uri ? (
          <a className="btn btn-secondary btn-sm" href={activeArtifact.uri} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <Icon name="download" size={15} />
            DOCX
          </a>
        ) : (
          <button className="btn btn-secondary btn-sm" disabled={!hasDoc}>
            <Icon name="download" size={15} />
            DOCX
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={downloadPdf} disabled={!hasDoc || pdfBusy} style={{ display: narrow ? "none" : undefined }}>
          <Icon name={pdfBusy ? "sparkles" : "download"} size={15} style={pdfBusy ? { animation: "spin 2s linear infinite" } : undefined} />
          {pdfBusy ? "Generando…" : "PDF"}
        </button>
        <button
          onClick={() => setSourcesOpen(!sourcesOpen)}
          className="focus-ring"
          title="Fuentes verificadas"
          style={{ border: "none", width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", color: sourcesOpen ? "var(--primary)" : "var(--text-muted)", background: sourcesOpen ? "var(--primary-soft)" : "transparent" }}
        >
          <Icon name="shieldCheck" size={17} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasDoc ? (
            <DocumentView blocks={docBlocks} citations={docCitations} compare={compare} onRequestChange={handleRequestChange} pulseSet={pulseSet} reveal={reveal} />
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--bg-elevated-2)", color: "var(--text-muted)" }}>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <Icon name="sparkles" size={28} style={{ color: "var(--primary)", animation: "spin 2s linear infinite" }} />
                <span style={{ fontSize: 13.5 }}>Redactando el documento verificado…</span>
              </div>
            </div>
          )}
        </div>
        {sourcesOpen && <SourcesPanel citations={docCitations} onClose={() => setSourcesOpen(false)} />}
      </div>

      {versions.length > 0 && (
        <VersionBar
          versions={versions}
          current={currentVersion}
          onSelect={setCurrentVersion}
          compare={compare}
          onToggleCompare={() => {
            if (!compare) {
              const maxV = Math.max(...versions);
              if (maxV > 1) setCurrentVersion(maxV);
            }
            setCompare(!compare);
          }}
          onAccept={() => {
            // Aceptar los cambios: la versión actual queda como definitiva, salimos de comparación.
            setCompare(false);
            if (pushToast) pushToast(`Cambios aceptados · v${currentVersion} es la versión vigente`, "gold");
          }}
          onReject={() => {
            // Rechazar: volvemos a la versión anterior y salimos de comparación.
            const prev = versions.filter((v) => v < currentVersion).pop() ?? currentVersion;
            setCurrentVersion(prev);
            setCompare(false);
            if (pushToast) pushToast(`Cambios rechazados · volviste a v${prev}`, "info");
          }}
          position="bottom"
        />
      )}
    </div>
  );

  // Sin documento en juego → chat de una sola columna (pregunta/charla casual).
  // No se abre ningún panel ni se muestra "Redactando documento…".
  if (!showSplit) {
    return (
      <div style={{ height: "100%", display: "flex", justifyContent: "center", background: "var(--bg-surface)" }}>
        <div style={{ width: "100%", maxWidth: 860, minWidth: 0 }}>{chatPane}</div>
      </div>
    );
  }

  if (narrow) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 4, padding: "8px 12px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
          {(
            [
              ["chat", "Chat", "message"],
              ["doc", "Documento", "fileText"],
            ] as [("chat" | "doc"), string, string][]
          ).map(([id, label, ic]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ flex: 1, height: 38, border: "none", borderRadius: "var(--r-md)", background: tab === id ? "var(--primary-soft)" : "transparent", color: tab === id ? "var(--primary)" : "var(--text-secondary)", fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              <Icon name={ic} size={16} />
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>{tab === "chat" ? chatPane : docPane}</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex" }}>
      <div style={{ flex: 40, minWidth: 340, borderRight: "1px solid var(--border)" }}>{chatPane}</div>
      <div style={{ flex: 60, minWidth: 0, background: "var(--bg-elevated-2)" }}>{docPane}</div>
    </div>
  );
}

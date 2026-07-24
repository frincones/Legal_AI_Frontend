/* "Thought for Xs" + sidebar de Actividad (estilo ChatGPT).
   - ThoughtPill: mientras piensa muestra shimmer "Pensando…"; al terminar, píldora "Pensó durante Xs"
     (clic → abre el sidebar con la línea de tiempo de pasos).
   - ActivitySidebar: drawer derecho con razonamiento + cada paso ejecutado (input/output/duración). */
"use client";
import { useState, useEffect } from "react";
import { Icon } from "./icons";

export type SourceLink = { consulta?: string; entidad?: string; url: string; estado?: string; tier?: number; verified?: boolean };

export type ActStep = {
  name: string; label: string; icon: string; status: "running" | "done";
  startedAt?: number; endedAt?: number; input?: unknown; output?: string; sources?: SourceLink[];
};

// Color del estado (vigente = ok, derogada/inexequible = alerta)
function estadoColor(estado?: string): string {
  const e = (estado || "").toLowerCase();
  if (/deroga|inexequible|suspendida|no_encontrada/.test(e)) return "var(--danger, #DC2626)";
  if (/modific|condicionad|parcial/.test(e)) return "var(--gold, #C98A14)";
  return "var(--success)";
}

// Etiqueta legible del estado de vigencia (evita labels técnicos con guion_bajo al abogado).
export function estadoLabel(estado?: string): string {
  if (!estado) return "—";
  const e = estado.toLowerCase().replace(/_/g, " ").trim();
  const map: Record<string, string> = {
    "vigente": "Vigente",
    "vigente con modificaciones": "Vigente · con modificaciones",
    "derogada": "Derogada", "derogado": "Derogado",
    "exequible": "Exequible", "inexequible": "Inexequible",
    "exequible condicionada": "Exequible · condicionada",
    "suspendida": "Suspendida", "no encontrada": "No encontrada",
  };
  return map[e] || e.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Badge clicable a la página OFICIAL donde se verificó. Etiqueta = la CITA (norma/sentencia) para que
// el usuario sepa a qué corresponde el link; luego estado y la entidad/portal que lo respalda.
export function SourceBadge({ s }: { s: SourceLink }) {
  // Fuente CONSULTADA (no verificada): enlace simple, sin sello, borde punteado → no implica verificación.
  if (s.verified === false) {
    return (
      <a href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.entidad || s.consulta || ""}\n${s.url}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--r-pill)", border: "1px dashed var(--border-strong)", background: "var(--bg-base)", color: "var(--text-muted)", fontSize: 12, fontWeight: 500, textDecoration: "none", maxWidth: "100%" }}>
        <Icon name="link" size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{s.consulta || s.entidad || "Fuente"}</span>
      </a>
    );
  }
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.consulta || ""} · ${s.entidad || ""} (${s.estado || "—"})\n${s.url}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, textDecoration: "none", maxWidth: "100%" }}>
      <Icon name="shieldCheck" size={12} style={{ color: estadoColor(s.estado), flexShrink: 0 }} />
      <span style={{ fontWeight: 650, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{s.consulta || s.entidad || "Fuente"}</span>
      {s.estado && <span style={{ color: estadoColor(s.estado), fontWeight: 600, flexShrink: 0 }}>· {estadoLabel(s.estado)}</span>}
      {s.entidad && <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>· {s.entidad}</span>}
      <Icon name="link" size={11} style={{ color: "var(--primary)", flexShrink: 0 }} />
    </a>
  );
}

// Footer bajo la respuesta — separa "Fuentes verificadas" (sello oficial) de "Fuentes consultadas"
// (enlaces que el agente leyó pero NO verificó). Retrocompatible: sin `verified` → cuenta como verificada.
export function SourcesFooter({ steps }: { steps: ActStep[] }) {
  const seen = new Set<string>();
  const verified: SourceLink[] = [];
  const consultadas: SourceLink[] = [];
  for (const st of steps) for (const s of st.sources || []) if (s.url && s.verified !== false && !seen.has(s.url)) { seen.add(s.url); verified.push(s); }
  for (const st of steps) for (const s of st.sources || []) if (s.url && s.verified === false && !seen.has(s.url)) { seen.add(s.url); consultadas.push(s); }
  if (verified.length === 0 && consultadas.length === 0) return null;
  return (
    <div style={{ marginTop: 6, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
      {verified.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            <Icon name="shieldCheck" size={13} style={{ color: "var(--success)" }} /> Fuentes verificadas ({verified.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {verified.map((s, i) => <SourceBadge key={i} s={s} />)}
          </div>
        </>
      )}
      {consultadas.length > 0 && (
        <div style={{ marginTop: verified.length > 0 ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            <Icon name="link" size={13} style={{ color: "var(--text-muted)" }} /> Fuentes consultadas ({consultadas.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {consultadas.map((s, i) => <SourceBadge key={i} s={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function fmtDur(ms: number | null | undefined): string {
  if (ms == null) return "";
  const s = ms / 1000;
  if (s < 1) return "menos de 1s";
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function stepDetail(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (Array.isArray(o.consultas)) return (o.consultas as string[]).join(" · ");
  if (typeof o.query === "string") return o.query;
  if (typeof o.url === "string") return o.url;
  if (typeof o.title === "string") return o.title as string;
  return null;
}

// ── Píldora "Pensando… / Pensó durante Xs" ──
export function ThoughtPill({
  busy, durationMs, hasActivity, currentLabel, onOpen,
}: {
  busy: boolean; durationMs: number | null; hasActivity: boolean;
  currentLabel?: string | null; onOpen: () => void;
}) {
  if (busy) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
        <Icon name="sparkles" size={15} style={{ color: "var(--primary)", animation: "spin 2.4s linear infinite", flexShrink: 0 }} />
        <span className="shimmer-text" style={{ fontWeight: 550 }}>{currentLabel || "Pensando…"}</span>
        {hasActivity && (
          <button onClick={onOpen} className="focus-ring" style={{ border: "none", background: "transparent", color: "var(--text-muted)", fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}>
            ver actividad <Icon name="chevronRight" size={13} />
          </button>
        )}
      </div>
    );
  }
  if (!hasActivity) return null;
  return (
    <button
      onClick={onOpen}
      className="fade-in focus-ring"
      style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)", background: "var(--bg-elevated-2)", color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 550, cursor: "pointer", alignSelf: "flex-start", transition: "background .15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated-2)")}
    >
      <Icon name="sparkles" size={13} style={{ color: "var(--primary)" }} />
      {durationMs != null ? `Pensó durante ${fmtDur(durationMs)}` : "Ver razonamiento"}
      <Icon name="chevronRight" size={13} style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

// ── Cronómetro vivo (tickea cada 1s mientras la fase está en curso) ──
function LiveTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0 }}>{fmtDur(Math.max(0, now - startedAt))}</span>;
}

export type LiveActivity = { name: string; label: string; detail?: string | null; startedAt: number };

// ── Timeline INLINE (estilo Claude): pasos hechos + la fase actual con shimmer y cronómetro vivo.
//    Reemplaza el "cursor titilando" mudo durante la generación. El detalle completo (fuentes,
//    razonamiento) sigue en el ActivitySidebar vía "ver actividad". ──
export function InlineActivity({
  steps, activity, onOpen,
}: {
  steps: ActStep[]; activity?: LiveActivity | null; onOpen: () => void;
}) {
  const doneSteps = steps.filter((s) => s.status === "done");
  const runningStep = steps.find((s) => s.status === "running");
  // Fase actual = el paso corriendo (trae sus fuentes/detalle), o la actividad anunciada por 'phase'.
  const current = runningStep
    ? { label: runningStep.label, detail: stepDetail(runningStep.input), startedAt: runningStep.startedAt ?? Date.now() }
    : activity
    ? { label: activity.label, detail: activity.detail ?? null, startedAt: activity.startedAt }
    : null;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {doneSteps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--success-soft)", color: "var(--success)" }}>
            <Icon name="check" size={11} stroke={2.4} />
          </span>
          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</span>
          {s.startedAt && s.endedAt && s.endedAt > s.startedAt && (
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{fmtDur(s.endedAt - s.startedAt)}</span>
          )}
        </div>
      ))}
      {current ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, minWidth: 0 }}>
          <Icon name="sparkles" size={15} style={{ color: "var(--primary)", animation: "spin 2.4s linear infinite", flexShrink: 0 }} />
          <span className="shimmer-text" style={{ fontWeight: 550, flexShrink: 0 }}>{current.label}</span>
          {current.detail && (
            <span style={{ color: "var(--text-muted)", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {current.detail}</span>
          )}
          <LiveTimer startedAt={current.startedAt} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
          <Icon name="sparkles" size={15} style={{ color: "var(--primary)", animation: "spin 2.4s linear infinite", flexShrink: 0 }} />
          <span className="shimmer-text" style={{ fontWeight: 550 }}>Pensando…</span>
        </div>
      )}
      {(doneSteps.length > 0 || runningStep) && (
        <button onClick={onOpen} className="focus-ring" style={{ alignSelf: "flex-start", border: "none", background: "transparent", color: "var(--text-muted)", fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}>
          ver actividad <Icon name="chevronRight" size={13} />
        </button>
      )}
    </div>
  );
}

// ── Sidebar derecho: línea de tiempo de la actividad ──
export function ActivitySidebar({
  open, onClose, thinking, steps, durationMs,
}: {
  open: boolean; onClose: () => void; thinking: string; steps: ActStep[]; durationMs: number | null;
}) {
  const [showReasoning, setShowReasoning] = useState(true);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 290, background: "rgba(10,13,20,0.35)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: 420, maxWidth: "92vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--grad-aurora-soft, var(--primary-soft))", display: "grid", placeItems: "center" }}><Icon name="radar" size={17} style={{ color: "var(--primary)" }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 650, fontSize: 14.5 }}>Actividad</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{steps.length} paso{steps.length === 1 ? "" : "s"}{durationMs != null ? ` · ${fmtDur(durationMs)}` : ""}</div>
          </div>
          <button onClick={onClose} className="btn-ghost focus-ring" style={{ border: "none", width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "transparent" }}><Icon name="x" size={17} /></button>
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
          {thinking && (
            <div style={{ marginBottom: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--bg-elevated-2)" }}>
              <button onClick={() => setShowReasoning((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                <Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} /> Razonamiento
                <span style={{ flex: 1 }} />
                <Icon name="chevronDown" size={15} style={{ transform: showReasoning ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {showReasoning && <div style={{ padding: "0 12px 12px 12px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{thinking}</div>}
            </div>
          )}

          {steps.length === 0 && !thinking && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin pasos registrados.</div>}

          <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.map((s, i) => {
              const detail = stepDetail(s.input);
              const dur = s.startedAt && s.endedAt ? s.endedAt - s.startedAt : null;
              const last = i === steps.length - 1;
              return (
                <div key={i} style={{ display: "flex", gap: 11 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: s.status === "done" ? "var(--success-soft)" : "var(--primary-soft)", color: s.status === "done" ? "var(--success)" : "var(--primary)" }}>
                      {s.status === "running" ? <Icon name="refresh" size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="check" size={13} stroke={2.3} />}
                    </span>
                    {!last && <span style={{ width: 2, flex: 1, background: "var(--border)", margin: "2px 0" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text)" }}>{s.label}</span>
                      {dur != null && <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{fmtDur(dur)}</span>}
                    </div>
                    {detail && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2, wordBreak: "break-word" }}>{detail}</div>}
                    {s.output && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5, maxHeight: 80, overflow: "hidden" }}>{s.output.slice(0, 220)}{s.output.length > 220 ? "…" : ""}</div>}
                    {s.sources && s.sources.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                        {s.sources.map((src, k) => <SourceBadge key={k} s={src} />)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

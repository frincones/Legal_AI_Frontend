"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icons";
import { CITATIONS, type Citation } from "./data";
import { api, type PlanCat } from "./mission/data";
import { COMPANY } from "../company";
import { track } from "@/lib/tracker";
import { metaEvent, fbCookies } from "@/lib/analytics";

/* ---------- Tooltip (hover/focus, dark) ---------- */
export function Tooltip({ content, children, width = 280 }: { content: ReactNode; children: ReactNode; width?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="fade-in"
          style={{
            position: "absolute",
            bottom: "calc(100% + 9px)",
            left: "50%",
            transform: "translateX(-50%)",
            width,
            background: "#11151F",
            color: "#E7EAF1",
            borderRadius: "var(--r-sm)",
            padding: "10px 12px",
            fontSize: 12.5,
            lineHeight: 1.45,
            fontWeight: 450,
            boxShadow: "0 12px 30px -8px rgba(13,19,32,0.4)",
            zIndex: 60,
            pointerEvents: "none",
            fontFamily: "var(--font-ui)",
            letterSpacing: 0,
          }}
        >
          {content}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: 5,
              borderStyle: "solid",
              borderColor: "#11151F transparent transparent transparent",
            }}
          />
        </span>
      )}
    </span>
  );
}

export const STATUS_META: Record<string, { color: string; bg: string; text: string; icon: string; word: string }> = {
  vigente: { color: "var(--gold)", bg: "var(--gold-soft)", text: "var(--gold-text)", icon: "badgeCheck", word: "Verificado" },
  exequible: { color: "var(--success)", bg: "var(--success-soft)", text: "var(--success)", icon: "shieldCheck", word: "Vigente" },
  verificar: { color: "var(--warning)", bg: "var(--warning-soft)", text: "var(--warning)", icon: "alert", word: "Verificar" },
  derogada: { color: "var(--danger)", bg: "var(--danger-soft)", text: "var(--danger)", icon: "x", word: "Derogada" },
};

/* ---------- Verified citation chip — 3 visual treatments ---------- */
/* Resolution order for the citation data:
   1. explicit `citation` object (real data from the backend artifact)
   2. lookup `citeId` in the `citations` registry passed by context (real data)
   3. fallback to the mock CITATIONS registry (legacy / prototype usages) */
export function VerifiedChip({
  citeId,
  citation,
  citations,
  variant = "pill",
  pulse = false,
}: {
  citeId?: string;
  citation?: Citation;
  citations?: Record<string, Citation>;
  variant?: "pill" | "badge" | "underline";
  pulse?: boolean;
}) {
  const c = citation ?? (citeId ? (citations?.[citeId] ?? CITATIONS[citeId]) : undefined);
  if (!c) return null;
  const m = STATUS_META[c.status] || STATUS_META.vigente;
  const tip = (
    <span>
      <strong style={{ color: "#fff", fontWeight: 600 }}>{c.title}</strong>
      <br />
      <span style={{ color: m.color, fontWeight: 600 }}>● {m.word}</span>
      {" · "}
      {c.note}
      <br />
      <span style={{ color: "#AEB7CA" }}>
        {c.source} · consultado {c.consulted} · tier {c.tier}
      </span>
    </span>
  );

  let inner: ReactNode;
  if (variant === "underline") {
    inner = (
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3, cursor: "help", color: m.text, borderBottom: `2px solid ${m.color}`, paddingBottom: 1, fontWeight: 600 }}>
        {c.label}
        <span style={{ display: "inline-grid", placeItems: "center", transform: "translateY(2px)", color: m.color }}>
          <Icon name={m.icon} size={13} stroke={2.2} />
        </span>
      </span>
    );
  } else if (variant === "badge") {
    inner = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "help", border: `1.5px solid ${m.color}`, color: m.text, borderRadius: "var(--r-sm)", padding: "1px 7px 1px 6px", fontSize: "0.82em", fontWeight: 650, lineHeight: 1.5, fontFamily: "var(--font-ui)", verticalAlign: "middle", letterSpacing: "0.01em" }}>
        <Icon name={m.icon} size={12} stroke={2.4} style={{ color: m.color }} />
        {c.label}
      </span>
    );
  } else {
    inner = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "help", background: m.bg, color: m.text, borderRadius: "var(--r-pill)", padding: "1px 9px 1px 7px", fontSize: "0.8em", fontWeight: 650, lineHeight: 1.6, fontFamily: "var(--font-ui)", verticalAlign: "middle", letterSpacing: "0.01em", animation: pulse ? "goldPulse 1.1s ease-out 1" : "none" }}>
        <Icon name={m.icon} size={12} stroke={2.4} style={{ color: m.color }} />
        {c.label}
      </span>
    );
  }
  return (
    <Tooltip content={tip}>
      <span tabIndex={0} style={{ outline: "none" }}>
        {inner}
      </span>
    </Tooltip>
  );
}

/* ---------- Agent avatar (aurora, optional generating ring) ---------- */
export function AgentAvatar({ size = 30, generating = false }: { size?: number; generating?: boolean }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {generating && (
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, #FF3D7F, #7B3DF5, #2F6BFF, #FF3D7F)",
            animation: "auroraRing 1.6s linear infinite",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
      )}
      <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center", boxShadow: "0 2px 8px -2px rgba(123,61,245,0.5)" }}>
        <Icon name="sparkles" size={size * 0.5} stroke={2} style={{ color: "#fff" }} />
      </div>
    </div>
  );
}

/* ---------- Step chip (tool/verification) ---------- */
export function StepChip({ icon, label, state }: { icon: string; label: string; state: "pending" | "running" | "done" }) {
  return (
    <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-1)", overflow: "hidden", position: "relative" }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          background: state === "done" ? "var(--success-soft)" : "var(--primary-soft)",
          color: state === "done" ? "var(--success)" : "var(--primary)",
        }}
      >
        {state === "running" ? (
          <Icon name="refresh" size={14} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Icon name={state === "done" ? "check" : icon} size={14} stroke={2.2} />
        )}
      </span>
      <span style={{ fontSize: 13.5, color: state === "pending" ? "var(--text-muted)" : "var(--text)", flex: 1, fontWeight: 450 }}>{label}</span>
      {state === "done" && <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>✓</span>}
      {state === "running" && (
        <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: "100%", background: "var(--border)" }}>
          <div style={{ height: "100%", width: "45%", background: "var(--aurora)", borderRadius: 2, animation: "indef 1.2s ease-in-out infinite" }} />
        </div>
      )}
    </div>
  );
}

/* ---------- Reasoning accordion ---------- */
export function Reasoning({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}
      >
        <Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />
        Razonamiento
        <span style={{ flex: 1 }} />
        <Icon name="chevronDown" size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="fade-in" style={{ padding: "0 12px 12px 34px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {text}
        </div>
      )}
    </div>
  );
}

/* ---------- Artifact card (document) ----------
   `onOpen` abre el documento (Canvas editable). DOCX descarga el .docx guardado (uri);
   PDF lo convierte on-demand vía el backend. Para que PDF funcione se requieren
   backendUrl + accessToken + artifactId (y opcionalmente version). */
export function ArtifactCard({
  doc, sources = 3, onOpen, backendUrl, accessToken, artifactId, version, onDocFeedback,
}: {
  doc: { title: string; version?: number | string; uri?: string };
  sources?: number;
  onOpen?: () => void;
  backendUrl?: string;
  accessToken?: string;
  artifactId?: string;
  version?: number | string;
  onDocFeedback?: (verdict: "up" | "down", comment?: string) => void;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [docxBusy, setDocxBusy] = useState(false);
  const [fbState, setFbState] = useState<"idle" | "commenting" | "sent">("idle");
  const [fbComment, setFbComment] = useState("");
  const canPdf = !!(backendUrl && accessToken && artifactId);
  const canDocx = !!(backendUrl && accessToken && artifactId);

  async function downloadDocx(e: React.MouseEvent) {
    e.stopPropagation();
    // Descarga FRESCA vía backend (evita signed URLs caducadas). Fallback al uri si no hay artifactId.
    if (!canDocx) {
      if (doc.uri) window.open(doc.uri, "_blank");
      return;
    }
    if (docxBusy) return;
    setDocxBusy(true);
    try {
      const v = version ?? doc.version;
      const q = v != null ? `?version=${v}` : "";
      const res = await fetch(`${backendUrl}/api/artifacts/${artifactId}/docx${q}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(doc.title || "documento").replace(/[^\w.-]+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      if (doc.uri) window.open(doc.uri, "_blank");
    } finally {
      setDocxBusy(false);
    }
  }

  async function downloadPdf(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canPdf || pdfBusy) return;
    setPdfBusy(true);
    try {
      const v = version ?? doc.version;
      const q = v != null ? `?version=${v}` : "";
      const res = await fetch(`${backendUrl}/api/artifacts/${artifactId}/pdf${q}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(doc.title || "documento").replace(/[^\w.-]+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      /* el toast global no está disponible aquí; el botón simplemente vuelve a su estado */
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div
      className="fade-up"
      style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-surface)", boxShadow: "var(--sh-2)", overflow: "hidden", transition: "box-shadow .2s, transform .2s", cursor: onOpen ? "pointer" : "default" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--sh-3)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--sh-2)";
        e.currentTarget.style.transform = "none";
      }}
      onClick={onOpen}
    >
      <div style={{ display: "flex", gap: 13, padding: "14px 16px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="fileText" size={20} style={{ color: "var(--primary)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.title}</span>
            {doc.version != null && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", flexShrink: 0 }}>v{doc.version}</span>
            )}
            <Tooltip content="Documento con citas verificadas contra fuentes oficiales" width={240}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--grad-gold)", boxShadow: "0 0 0 3px var(--gold-soft)", flexShrink: 0 }} />
            </Tooltip>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>
            Generado · verificado contra <strong style={{ color: "var(--gold-text)" }}>{sources} fuentes oficiales</strong>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 16px 14px", flexWrap: "wrap" }}>
        {onOpen && (
          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <Icon name="pencil" size={15} />
            Abrir y editar
          </button>
        )}
        {canDocx || doc.uri ? (
          <button className="btn btn-ghost btn-sm" onClick={downloadDocx} disabled={docxBusy}>
            <Icon name={docxBusy ? "sparkles" : "download"} size={15} style={docxBusy ? { animation: "spin 2s linear infinite" } : undefined} />
            {docxBusy ? "Descargando…" : "DOCX"}
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" disabled>
            <Icon name="download" size={15} />
            DOCX
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={downloadPdf} disabled={!canPdf || pdfBusy}>
          <Icon name={pdfBusy ? "sparkles" : "download"} size={15} style={pdfBusy ? { animation: "spin 2s linear infinite" } : undefined} />
          {pdfBusy ? "Generando…" : "PDF"}
        </button>
      </div>
      {onDocFeedback && (
        <div onClick={(e) => e.stopPropagation()} style={{ borderTop: "1px solid var(--border)", padding: "9px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {fbState === "sent" ? (
            <span style={{ fontSize: 12.5, color: "var(--success)", fontWeight: 600 }}>¡Gracias!</span>
          ) : fbState === "commenting" ? (
            <>
              <input
                value={fbComment}
                onChange={(e) => setFbComment(e.target.value)}
                placeholder="¿Qué mejorarías? (opcional)"
                style={{ flex: 1, minWidth: 160, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "6px 10px", fontSize: 12.5, background: "var(--bg-base)", color: "var(--text)", outline: "none" }}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => { onDocFeedback("down", fbComment.trim() || undefined); setFbState("sent"); }}>Enviar</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>¿Te sirvió este documento?</span>
              <button
                title="Sí"
                onClick={() => { onDocFeedback("up"); setFbState("sent"); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", borderRadius: "var(--r-pill)", padding: "3px 9px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
              >
                <Icon name="thumbsUp" size={13} stroke={2.2} /> Sí
              </button>
              <button
                title="No"
                onClick={() => setFbState("commenting")}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", borderRadius: "var(--r-pill)", padding: "3px 9px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
              >
                <Icon name="thumbsDown" size={13} stroke={2.2} /> No
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Feedback bar (👍/👎 por respuesta) ----------
   Iconos: no existen thumbsUp/thumbsDown en icons.tsx → se usan `check` (up) y `x` (down)
   como sustitutos seguros. Compacto, una línea. */
const FB_REASONS = ["incorrecto", "incompleto", "cita errónea", "formato", "lento", "otro"];

export function FeedbackBar({ onSend }: { onSend: (verdict: "up" | "down", reason?: string, comment?: string) => void }) {
  const [state, setState] = useState<"idle" | "choosing-reason" | "sent">("idle");
  const [reason, setReason] = useState<string>("");
  const [comment, setComment] = useState("");

  if (state === "sent") {
    return <div style={{ fontSize: 12.5, color: "var(--success)", fontWeight: 600, padding: "2px 0" }}>¡Gracias!</div>;
  }

  const tinyBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid var(--border)", background: "transparent",
    color: "var(--text-muted)", borderRadius: "var(--r-pill)", padding: "3px 9px", fontSize: 12, fontWeight: 500, cursor: "pointer",
  };

  if (state === "choosing-reason") {
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "6px 0" }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>¿Qué falló?</span>
          {FB_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{ ...tinyBtn, borderColor: reason === r ? "var(--primary)" : "var(--border)", color: reason === r ? "var(--primary)" : "var(--text-muted)", background: reason === r ? "var(--primary-soft)" : "transparent" }}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario (opcional)"
            style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "6px 10px", fontSize: 12.5, background: "var(--bg-base)", color: "var(--text)", outline: "none", maxWidth: 360 }}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => { onSend("down", reason || undefined, comment.trim() || undefined); setState("sent"); }}>
            Enviar
          </button>
        </div>
      </div>
    );
  }

  // Estado inicial ELEVADO (visible): tarjeta con borde + botones prominentes. Antes era gris diminuto
  // y pasaba desapercibido → captura ≈0. Ahora invita explícitamente a calificar cada respuesta.
  const bigBtn = (active: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6, border: `1.5px solid ${active}`,
    background: "var(--bg-surface)", color: "var(--text)", borderRadius: "var(--r-pill)",
    padding: "6px 15px", fontSize: 13, fontWeight: 650, cursor: "pointer", lineHeight: 1,
  });
  return (
    <div className="fade-in" style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      marginTop: 6, padding: "9px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)",
      background: "var(--bg-elevated-2)" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>¿Te sirvió esta respuesta?</span>
      <button style={bigBtn("var(--success)")} title="Sí, me sirvió" onClick={() => { onSend("up"); setState("sent"); }}>
        <Icon name="thumbsUp" size={14} stroke={2.4} style={{ color: "var(--success)" }} /> Sí
      </button>
      <button style={bigBtn("var(--border)")} title="No, o puede mejorar" onClick={() => setState("choosing-reason")}>
        <Icon name="thumbsDown" size={14} stroke={2.4} style={{ color: "var(--text-muted)" }} /> No
      </button>
    </div>
  );
}


/* ---------- Feedback popup muestreado (no bloqueante) ----------
   Card flotante inferior-derecha que aparece cada ~N turnos / tras un documento. Anti-fatiga por
   localStorage (máx 1 por día) + sessionStorage (1 por sesión). Reusable en app e invitado. */
export function feedbackPopupEligible(): boolean {
  try {
    if (sessionStorage.getItem("jv_fb_popup_session")) return false;   // ya salió en esta sesión
    const last = Number(localStorage.getItem("jv_fb_popup_ts") || 0);
    return Date.now() - last > 24 * 3600 * 1000;                        // no repetir dentro de 24h
  } catch { return false; }
}
export function markFeedbackPopupShown(): void {
  try {
    sessionStorage.setItem("jv_fb_popup_session", "1");
    localStorage.setItem("jv_fb_popup_ts", String(Date.now()));
  } catch { /* modo privado → no romper */ }
}

const FB_MOODS: { emoji: string; label: string; verdict: "up" | "down" | null }[] = [
  { emoji: "😍", label: "Excelente", verdict: "up" },
  { emoji: "🙂", label: "Bien", verdict: "up" },
  { emoji: "😕", label: "Mejorable", verdict: "down" },
];

/* ---------- Feedback Nudge (barra animada anclada sobre el composer) ----------
   Aparece para la ÚLTIMA respuesta con entrada deslizante + glow pulsante para llamar la atención,
   SIN bloquear (vive encima del composer, dismissible). Es la captura per-turno prominente. */
export function FeedbackNudge({ onSend, onDone, onDismiss }: {
  onSend: (verdict: "up" | "down", reason?: string, comment?: string) => void;
  onDone: () => void; onDismiss: () => void;
}) {
  const [state, setState] = useState<"idle" | "reason" | "sent">("idle");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const finish = () => { setState("sent"); setTimeout(onDone, 1500); };

  const yesBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid var(--success)",
    background: "var(--bg-surface)", color: "var(--text)", borderRadius: "var(--r-pill)",
    padding: "7px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", lineHeight: 1,
  };
  const noBtn: React.CSSProperties = { ...yesBtn, border: "1.5px solid var(--border)" };
  const chip = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, background: active ? "var(--primary-soft)" : "var(--bg-surface)",
    color: active ? "var(--primary)" : "var(--text-muted)", borderRadius: "var(--r-pill)", padding: "4px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div className="jv-fb-nudge" style={{
      position: "relative", marginBottom: 10, borderRadius: "var(--r-lg)", border: "1.5px solid var(--primary)",
      background: "var(--grad-aurora-soft, var(--primary-soft))", padding: "12px 14px", overflow: "hidden",
    }}>
      <style>{`
        @keyframes jvFbIn { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes jvFbShake { 0%,100% { transform: translateX(0); } 12% { transform: translateX(-7px); } 26% { transform: translateX(6px); } 40% { transform: translateX(-5px); } 54% { transform: translateX(4px); } 68% { transform: translateX(-3px); } 82% { transform: translateX(2px); } }
        @keyframes jvFbGlow { 0%,100% { box-shadow: 0 2px 10px rgba(123,61,245,.10); } 50% { box-shadow: 0 8px 26px rgba(210,59,224,.30); } }
        @keyframes jvFbWiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-11deg); } 75% { transform: rotate(11deg); } }
        .jv-fb-nudge { animation: jvFbIn .4s cubic-bezier(.2,.85,.25,1) both, jvFbShake .55s ease-in-out .42s 1 both, jvFbGlow 2.6s ease-in-out 1s 2; }
        .jv-fb-emoji { display: inline-block; animation: jvFbWiggle 1s ease-in-out 1s 2; }
        .jv-fb-nudge button { transition: transform .12s ease, background .15s ease; }
        .jv-fb-nudge button:hover { transform: translateY(-1px); }
      `}</style>
      {state === "sent" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 650, color: "var(--success)" }}>
          <span className="jv-fb-emoji" style={{ fontSize: 17 }}>🙌</span> ¡Gracias! Tu opinión mejora Jurovia.
        </div>
      ) : state === "reason" ? (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>¿Qué mejorarías?</span>
            {FB_REASONS.map((r) => (
              <button key={r} style={chip(reason === r)} onClick={() => setReason(r)}>{r}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Cuéntanos más (opcional)"
              style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "7px 11px", fontSize: 13, background: "var(--bg-base)", color: "var(--text)", outline: "none" }} />
            <button className="btn btn-primary btn-sm" onClick={() => { onSend("down", reason || undefined, comment.trim() || undefined); finish(); }}>Enviar</button>
          </div>
        </div>
      ) : (
        <>
          <button onClick={onDismiss} aria-label="Cerrar" title="Ahora no" style={{ position: "absolute", top: 8, right: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4, lineHeight: 1 }}>
            <Icon name="x" size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, paddingRight: 26, fontSize: 13.5, fontWeight: 650, color: "var(--text)" }}>
            <span className="jv-fb-emoji" style={{ fontSize: 17, flexShrink: 0 }}>💬</span>
            <span>¿Te sirvió esta respuesta?</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={yesBtn} onClick={() => { onSend("up"); finish(); }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--success-soft)")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}>
              <Icon name="thumbsUp" size={15} stroke={2.4} style={{ color: "var(--success)" }} /> Sí
            </button>
            <button style={noBtn} onClick={() => setState("reason")}>
              <Icon name="thumbsDown" size={15} stroke={2.4} style={{ color: "var(--text-muted)" }} /> No
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function FeedbackPopup({ onSubmit, onDismiss }: {
  onSubmit: (verdict: "up" | "down" | null, mood: string, comment?: string) => void; onDismiss: () => void;
}) {
  const [mood, setMood] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const send = (idx: number, cmt: string) => {
    const m = FB_MOODS[idx];
    onSubmit(m.verdict, m.label, cmt.trim() || undefined);
    setSent(true);
    setTimeout(onDismiss, 1400);
  };

  return (
    <div className="fade-up" style={{ position: "fixed", right: "clamp(12px,3vw,24px)", bottom: "clamp(12px,3vw,24px)",
      zIndex: 300, width: 340, maxWidth: "calc(100vw - 24px)", background: "var(--bg-surface)",
      border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-3)", overflow: "hidden" }}>
      <div style={{ height: 4, background: "var(--grad-aurora, linear-gradient(135deg,#FF3D7F,#D23BE0,#7B3DF5,#2F6BFF))" }} />
      <div style={{ padding: "16px 18px" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🙌</div>
            <div style={{ fontSize: 14.5, fontWeight: 650, color: "var(--text)" }}>¡Gracias por tu opinión!</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>Nos ayuda a mejorar Jurovia.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>¿Cómo vas con Jurovia? 🙌</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Tu opinión de abogado vale oro.</div>
              </div>
              <button onClick={onDismiss} aria-label="Cerrar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 2, lineHeight: 1 }}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {FB_MOODS.map((m, idx) => (
                <button key={idx} onClick={() => { setMood(idx); if (m.verdict === "up") send(idx, comment); }}
                  style={{ flex: 1, border: `1.5px solid ${mood === idx ? "var(--primary)" : "var(--border)"}`,
                    background: mood === idx ? "var(--primary-soft)" : "var(--bg-surface)", borderRadius: "var(--r-md)",
                    padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</span>
                </button>
              ))}
            </div>
            {mood !== null && FB_MOODS[mood].verdict === "down" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="¿Qué mejorarías? (opcional)"
                  style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 11px", fontSize: 13, background: "var(--bg-base)", color: "var(--text)", outline: "none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => send(mood, comment)}>Enviar</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Popup "sin créditos → invita y gana" ----------
   Aparece al agotar créditos con entrada animada (scale-in + SHAKE + glow). Convierte el momento de
   fricción en loop de crecimiento: CTA a referir (ambos ganan créditos). Cierra por ✕ / click fuera /
   Esc → el usuario puede seguir leyendo su historial y descargando documentos. Reusa el ReferralModal. */
export function OutOfCreditsPopup({ backendUrl, accessToken, onClose, accessModel = "credits" }: {
  backendUrl: string; accessToken: string; onClose: () => void;
  accessModel?: string;   // 'trial_daily' → "usos de hoy"; pago → "límite de tu plan"
}) {
  // Muro de conversión: SIEMPRE prioriza Suscribirme/Mejorar plan (sin CTA de invitar aquí).
  const isTrial = accessModel === "trial_daily";
  const [billingOn, setBillingOn] = useState(false);
  const [showUpg, setShowUpg] = useState(false);
  useEffect(() => {
    let alive = true;
    api.billingConfig(backendUrl, accessToken).then((c) => { if (alive) setBillingOn(!!(c.enabled && c.client_token)); }).catch(() => {});
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { alive = false; window.removeEventListener("keydown", onKey); };
  }, [backendUrl, accessToken, onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 340, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="jv-ooc-card" onClick={(e) => e.stopPropagation()} style={{
        position: "relative", width: 420, maxWidth: "94vw", background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)", overflow: "hidden",
      }}>
        <style>{`
          @keyframes jvOocIn { 0% { opacity: 0; transform: scale(.9) translateY(14px); } 60% { opacity: 1; transform: scale(1.02); } 100% { transform: scale(1); } }
          @keyframes jvOocShake { 0%,100% { transform: translateX(0); } 12% { transform: translateX(-8px); } 26% { transform: translateX(7px); } 40% { transform: translateX(-6px); } 54% { transform: translateX(4px); } 68% { transform: translateX(-3px); } 82% { transform: translateX(2px); } }
          @keyframes jvOocGlow { 0%,100% { box-shadow: 0 6px 22px rgba(123,61,245,.18); } 50% { box-shadow: 0 12px 40px rgba(210,59,224,.42); } }
          @keyframes jvOocPop { 0% { transform: scale(0); } 70% { transform: scale(1.18); } 100% { transform: scale(1); } }
          .jv-ooc-card { animation: jvOocIn .42s cubic-bezier(.2,.85,.25,1) both, jvOocShake .6s ease-in-out .44s 1 both; }
          .jv-ooc-cta { animation: jvOocGlow 2.4s ease-in-out 1s infinite; transition: transform .12s ease; }
          .jv-ooc-cta:hover { transform: translateY(-1px); }
          .jv-ooc-gift { display: inline-block; animation: jvOocPop .5s cubic-bezier(.2,1.4,.4,1) .5s both; }
        `}</style>
        <div style={{ height: 5, background: "var(--grad-aurora, linear-gradient(135deg,#FF3D7F,#D23BE0,#7B3DF5,#2F6BFF))" }} />
        <button onClick={onClose} aria-label="Cerrar" style={{ position: "absolute", top: 12, right: 12, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4, lineHeight: 1 }}>
          <Icon name="x" size={18} />
        </button>
        <div style={{ padding: "26px 24px 22px", textAlign: "center" }}>
          <div className="jv-ooc-gift" style={{ fontSize: 46, lineHeight: 1, marginBottom: 8 }}>🚀</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 750, color: "var(--text)" }}>{isTrial ? "Alcanzaste tus usos de hoy" : "Alcanzaste el límite de tu plan"}</h2>
          <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            {isTrial
              ? <>Suscríbete a un plan para usar Jurovia con <b style={{ color: "var(--text)" }}>mayor capacidad</b>. Tus usos de prueba se renuevan mañana.</>
              : <>Mejora tu plan para seguir usando Jurovia sin toparte con <b style={{ color: "var(--text)" }}>límites</b>.</>}
          </p>
          {billingOn && (
            <button className="jv-ooc-cta btn btn-primary" onClick={() => setShowUpg(true)} style={{ width: "100%", fontSize: 15.5, fontWeight: 700, padding: "13px 20px" }}>
              <Icon name="sparkles" size={18} stroke={2.2} /> {isTrial ? "Suscribirme" : "Mejorar mi plan"}
            </button>
          )}
          <p style={{ margin: "14px 0 0", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
            Mientras tanto puedes <b>seguir leyendo tus chats</b> y <b>descargando tus documentos</b>.
          </p>
        </div>
      </div>
      <UpgradeModal open={showUpg} onClose={() => setShowUpg(false)} backendUrl={backendUrl} accessToken={accessToken} />
    </div>
  );
}

/* ---------- Upgrade / Mejorar plan (Paddle.js checkout) ----------
   Self-contained: lee /api/billing/config, carga Paddle.js, y abre el overlay de checkout con una
   transacción creada server-side (custom_data.org_id). Si billing no está habilitado → "Próximamente".
   AISLADO: no toca ningún flujo existente; solo aparece cuando se abre. */
declare global { interface Window { Paddle?: unknown } }

export function loadPaddle(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { Paddle?: unknown };
    if (w.Paddle) return resolve(w.Paddle);
    const existing = document.getElementById("paddle-js");
    if (existing) { existing.addEventListener("load", () => resolve(w.Paddle)); return; }
    const s = document.createElement("script");
    s.id = "paddle-js"; s.src = "https://cdn.paddle.com/paddle/v2/paddle.js"; s.async = true;
    s.onload = () => resolve((window as unknown as { Paddle?: unknown }).Paddle);
    s.onerror = () => reject(new Error("paddle.js"));
    document.head.appendChild(s);
  });
}

type PaddleNS = {
  Environment?: { set: (e: string) => void };
  Initialize?: (o: unknown) => void;
  Checkout?: { open: (o: unknown) => void; close?: () => void };
};

// Branding + copy de los bundles (valor, no cantidades). Todo incluido en los 3 planes; cambia el perfil.
export const JV_AURORA = "linear-gradient(120deg,#FF3D7F 0%,#D23BE0 42%,#7B3DF5 78%,#2F6BFF 100%)";
export const PLAN_COPY: Record<string, { icon: string; tagline: string; persona: string; usage: string[] }> = {
  estandar: { icon: "⚖️", tagline: "Tu copiloto legal de cada día.", persona: "Para el abogado independiente.",
    usage: ["Uso ideal para tu práctica diaria."] },
  pro: { icon: "🚀", tagline: "Para el abogado que no para.", persona: "Muchos casos, ni un término perdido.",
    usage: ["Trabaja sin toparte con límites, incluso en tus semanas pesadas.", "Acceso prioritario a los modelos y funciones nuevas."] },
  firma: { icon: "🏛️", tagline: "Toda tu firma, en sintonía.", persona: "Para equipos que producen en grande.",
    usage: ["Hasta 5 abogados en una cuenta.", "Tus plantillas y membrete aplicados a cada escrito.", "Uso ampliado para todo el equipo."] },
};
export const JV_INCLUDED = [
  "Citas contrastadas con la fuente oficial",
  "Documentos editables en Word (.docx)",
  "Alertas de cambios en tus procesos",
  "Analiza cualquier documento (PDF, audio, Excel)",
  "Términos y liquidaciones exactos",
  "Integraciones y dictado por voz",
];

// Orden de planes (menor→mayor) para distinguir mejora vs plan actual vs inferior.
const TIER_ORDER = ["free", "estandar", "pro", "firma"];

// Precio en COP para MOSTRAR (redondeado a mil). rate<=0 → null (solo USD). Cobro real siempre USD (Paddle).
const jvCop = (usd: number | null | undefined, rate: number) => (usd != null && rate > 0 ? "$" + (Math.round(usd * rate / 1000) * 1000).toLocaleString("es-CO") : null);

export function UpgradeModal({ open, onClose, backendUrl, accessToken, initialTier, currentTier }: {
  open: boolean; onClose: () => void; backendUrl: string; accessToken: string; initialTier?: string;
  currentTier?: string | null;   // plan pagado vigente → se marca "Plan actual"; solo se ofrecen mejoras
}) {
  const curIdx = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;
  const [cfg, setCfg] = useState<{ enabled: boolean; environment: string; client_token: string; annual_enabled?: boolean } | null>(null);
  const [plans, setPlans] = useState<PlanCat[]>([]);
  const [tier, setTier] = useState<string | null>(null);   // plan elegido → vista de pago inline
  const [cycle, setCycle] = useState<"annual" | "monthly">("annual");   // AOV: default anual (−20%)
  const [copRate, setCopRate] = useState(0);                             // USD→COP (display; cobro real USD)
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const initedRef = useRef(false);
  const tierRef = useRef<string | null>(null);        // para el eventCallback (evita closures stale)
  const priceRef = useRef<number | null>(null);
  const cycleRef = useRef<"annual" | "monthly">("annual");   // ciclo para el eventCallback (sin stale)
  const completedRef = useRef(false);
  const paddleRef = useRef<PaddleNS | null>(null);    // Paddle YA inicializado (desacoplado del open)
  const [paddleReady, setPaddleReady] = useState(false);
  // Anual solo si el backend lo confirma (los 3 price_ids anuales existen). Si no, todo mensual (sin regresión).
  const annualOn = !!cfg?.annual_enabled;
  const effCycle: "annual" | "monthly" = annualOn && cycle === "annual" ? "annual" : "monthly";
  useEffect(() => { cycleRef.current = effCycle; }, [effCycle]);

  // Carga config + planes al abrir. Inicializa Paddle en modo INLINE (checkout embebido).
  useEffect(() => {
    if (!open) return;
    setErr(null); setTier(null); setDone(false);
    Promise.all([api.billingConfig(backendUrl, accessToken), api.plansCatalog(backendUrl, accessToken)])
      .then(([c, p]) => {
        setCfg(c);
        setPlans((p.plans || []).filter((x) => x.tier !== "free" && x.price_usd != null));
        if (typeof p.cop_rate === "number") setCopRate(p.cop_rate);
        // Deep-link BOFU: pre-selecciona el plan → abre directo en la vista de pago.
        // Nunca pre-selecciona el plan que el usuario YA tiene (evita re-suscripción).
        if (initialTier && initialTier !== currentTier) setTier(initialTier);
      }).catch(() => setErr("No se pudo cargar la información de planes."));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, backendUrl, accessToken, onClose, initialTier, currentTier]);

  // #1 PRECARGA: al abrir la modal (con config lista) carga el SDK e Initialize UNA vez → cuando el
  // usuario elige plan, el checkout abre sin condiciones de carrera (patrón del DemoPlansModal que sí sirve).
  useEffect(() => {
    if (!open || !cfg?.enabled || !cfg.client_token || initedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const P = (await loadPaddle()) as PaddleNS;
        if (cancelled || initedRef.current) return;
        try { P.Environment?.set(cfg.environment === "sandbox" ? "sandbox" : "production"); } catch { /* noop */ }
        P.Initialize?.({
          token: cfg.client_token,
          checkout: { settings: {
            displayMode: "inline",
            frameTarget: "jv-paddle-frame",
            frameInitialHeight: 450,
            frameStyle: "width:100%; min-width:312px; background-color: transparent; border: none;",
          } },
          eventCallback: (ev: { name?: string }) => {
            const n = ev?.name;
            if (n === "checkout.loaded") {
              track("checkout_started", { tier: tierRef.current, billing_cycle: cycleRef.current });
              metaEvent("InitiateCheckout", backendUrl, { value: priceRef.current ?? undefined, currency: "USD" });
            } else if (n === "checkout.completed") {
              completedRef.current = true; setDone(true);
              track("purchase_completed", { tier: tierRef.current, billing_cycle: cycleRef.current });
              // Compra directa (Opción B): el Purchase (Meta) lo dispara el webhook de Paddle al cobrar.
            } else if (n === "checkout.closed") {
              if (!completedRef.current) track("checkout_abandoned", { tier: tierRef.current, billing_cycle: cycleRef.current });
            }
          },
        });
        initedRef.current = true; paddleRef.current = P; setPaddleReady(true);
      } catch { /* fail-open: si Paddle no carga, se muestra el error al elegir plan */ }
    })();
    return () => { cancelled = true; };
  }, [open, cfg, backendUrl]);

  // #2 ABRIR checkout: al elegir plan (con Paddle YA inicializado) crea la transacción y monta el frame inline.
  useEffect(() => {
    if (!open || !tier || !paddleReady || !paddleRef.current) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        completedRef.current = false; tierRef.current = tier;
        const selPlan = plans.find((p) => p.tier === tier);
        // valor para Meta = total cobrado (anual = total/año; mensual = /mes)
        priceRef.current = (effCycle === "annual" && selPlan?.annual) ? selPlan.annual.usd : (selPlan?.price_usd ?? null);
        const r = await api.billingCheckout(backendUrl, accessToken, tier, fbCookies(), false, effCycle);   // Opción B: suscripción directa (sin trial), ciclo elegido
        if (!r?.transaction_id) throw new Error("no txn");
        if (cancelled) return;
        paddleRef.current!.Checkout?.open({
          transactionId: r.transaction_id,
          settings: { theme: "light", locale: "es", showAddDiscounts: false, showAddTaxId: false, allowLogout: false, successUrl: (typeof window !== "undefined" ? window.location.origin : "https://juroviapp.com") + "/chat?purchased=1" },
        });
      } catch { if (!cancelled) setErr("No se pudo iniciar el pago. Intenta de nuevo."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, tier, paddleReady, backendUrl, accessToken, plans, effCycle]);

  if (!open) return null;
  const enabled = !!(cfg?.enabled && cfg?.client_token);
  const sel = plans.find((p) => p.tier === tier);
  const wide = tier != null;

  const Wordmark = () => (
    <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em", background: "var(--grad-aurora, linear-gradient(135deg,#FF3D7F,#D23BE0,#7B3DF5,#2F6BFF))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Jurovia</span>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 360, background: "rgba(10,13,20,0.55)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: wide ? 920 : 900, maxWidth: "96vw", maxHeight: "92vh", overflow: "hidden", background: "var(--bg-surface)", borderRadius: 22, border: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column" }}>
        {/* Barra aurora de marca */}
        <div style={{ height: 4, background: JV_AURORA }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          {wide && <button onClick={() => setTier(null)} aria-label="Volver" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", marginRight: 2 }}><Icon name="arrowLeft" size={18} /></button>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 780, color: "var(--text)", letterSpacing: "-.01em" }}>{wide ? "Finaliza tu suscripción" : "Elige tu plan"}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{wide ? "Pago seguro procesado por Paddle." : "Hecho para el derecho colombiano."}</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><Icon name="x" size={18} /></button>
        </div>
        {err && <div style={{ margin: "12px 22px 0", padding: "9px 12px", borderRadius: 10, background: "rgba(220,38,38,.1)", color: "var(--danger, #DC2626)", fontSize: 13 }}>{err}</div>}
        {!enabled && (
          <div style={{ padding: "14px 22px", fontSize: 13, color: "var(--text-muted)" }}>Los pagos estarán disponibles muy pronto.</div>
        )}

        {/* Vista 1 · selección de plan (todo incluido · valor, no cantidades) */}
        {enabled && !wide && (
          <div style={{ padding: "20px 24px 24px", overflow: "auto" }}>
            <style>{`
              @keyframes jvSubGlow { 0%,100% { box-shadow: 0 4px 10px -6px rgba(123,61,245,.2); } 50% { box-shadow: 0 10px 28px -6px rgba(123,61,245,.55); } }
              @keyframes jvSubShake { 0%,90%,100% { transform: translateX(0); } 92% { transform: translateX(-2px); } 94% { transform: translateX(2px); } 96% { transform: translateX(-2px); } 98% { transform: translateX(1px); } }
              .jv-sub-btn { transition: transform .12s ease; }
              .jv-sub-btn:hover { transform: translateY(-2px); }
              .jv-sub-btn-pro { animation: jvSubGlow 2.2s ease-in-out infinite, jvSubShake 4.5s ease-in-out infinite; }
            `}</style>
            {/* Bloque compartido: todos incluyen */}
            <div style={{ borderRadius: 16, padding: "15px 18px", marginBottom: 20, background: "var(--primary-soft)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 11 }}>Todos los planes incluyen</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "9px 20px" }}>
                {JV_INCLUDED.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: "var(--bg-surface)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={12} stroke={2.8} style={{ color: "var(--primary)" }} /></span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            {/* Toggle Mensual / Anual (AOV) — solo si el backend confirma precios anuales */}
            {annualOn && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 999, padding: 4 }}>
                  {(["monthly", "annual"] as const).map((cy) => (
                    <button key={cy} onClick={() => setCycle(cy)} className="focus-ring" style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 750, display: "inline-flex", alignItems: "center", gap: 7, background: cycle === cy ? "var(--bg-surface)" : "transparent", color: cycle === cy ? "var(--text)" : "var(--text-muted)", boxShadow: cycle === cy ? "0 1px 4px -1px rgba(0,0,0,.15)" : "none" }}>
                      {cy === "monthly" ? "Mensual" : "Anual"}
                      {cy === "annual" && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: JV_AURORA, borderRadius: 999, padding: "2px 7px" }}>−20%</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Tarjetas */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch" }}>
              {plans.map((p) => {
                const c = PLAN_COPY[p.tier] || { icon: "•", tagline: p.blurb, persona: "", usage: [] };
                const featured = p.tier === "pro";
                const pIdx = TIER_ORDER.indexOf(p.tier);
                const isCurrent = curIdx >= 0 && p.tier === currentTier;   // plan que YA tiene
                const isLower = curIdx >= 0 && pIdx >= 0 && pIdx < curIdx;  // downgrade (no auto-servicio)
                const locked = isCurrent || isLower;                       // no re-suscribible
                return (
                  <div key={p.tier} style={{
                    flex: "1 1 240px", minWidth: 236, borderRadius: 18, padding: 22, position: "relative",
                    display: "flex", flexDirection: "column",
                    border: isCurrent ? "1.5px solid var(--primary)" : featured ? "1.5px solid transparent" : "1px solid var(--border)",
                    background: featured && !isCurrent
                      ? "linear-gradient(var(--bg-surface),var(--bg-surface)) padding-box, " + JV_AURORA + " border-box"
                      : "var(--bg-surface)",
                    boxShadow: featured && !locked ? "0 16px 40px -16px rgba(123,61,245,.45)" : "none",
                    opacity: isLower ? 0.6 : 1,
                  }}>
                    {isCurrent
                      ? <span style={{ position: "absolute", top: -11, left: 22, fontSize: 10.5, fontWeight: 750, letterSpacing: ".04em", textTransform: "uppercase", background: "var(--primary)", color: "#fff", borderRadius: 999, padding: "4px 11px" }}>Plan actual</span>
                      : featured && <span style={{ position: "absolute", top: -11, left: 22, fontSize: 10.5, fontWeight: 750, letterSpacing: ".04em", textTransform: "uppercase", background: JV_AURORA, color: "#fff", borderRadius: 999, padding: "4px 11px" }}>Más popular</span>}
                    <div style={{ fontSize: 22, lineHeight: 1 }}>{c.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 780, color: "var(--text)", marginTop: 8 }}>{p.name}</div>
                    {(() => {
                      const ann = effCycle === "annual" ? p.annual : null;
                      const shownMonthly = ann ? ann.month_usd : p.price_usd;   // precio/mes que se muestra grande
                      const copM = jvCop(shownMonthly, copRate);
                      return (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 25, fontWeight: 820, letterSpacing: "-.02em", color: "var(--text)" }}>{copM || `$${shownMonthly}`}</span>
                            <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>{copM ? "COP/mes" : "USD/mes"}</span>
                          </div>
                          {ann ? (
                            <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                              antes <s style={{ opacity: .8 }}>{jvCop(p.price_usd, copRate) || `$${p.price_usd}`}/mes</s> · <span style={{ color: "var(--success, #16A34A)", fontWeight: 750 }}>ahorra {ann.save_pct}%</span><br />
                              Facturado anual: <b style={{ color: "var(--text)" }}>{jvCop(ann.usd, copRate) || `$${ann.usd}`}</b> ≈ ${ann.usd} USD · ≈ 2 meses gratis
                            </div>
                          ) : (
                            copM && <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-muted)" }}>≈ ${p.price_usd} USD/mes</div>
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text)", marginTop: 14 }}>{c.tagline}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{c.persona}</div>
                    {p.tier === "firma" && <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--primary)", marginTop: 6 }}>👥 Hasta 5 abogados</div>}
                    <div style={{ margin: "14px 0 18px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      {c.usage.map((u, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          <Icon name="check" size={14} stroke={2.4} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />{u}
                        </div>
                      ))}
                    </div>
                    {isCurrent ? (
                      <button disabled className="btn btn-secondary" style={{ width: "100%", fontWeight: 700, cursor: "default", opacity: 0.75 }}>
                        <Icon name="check" size={15} stroke={2.6} style={{ marginRight: 6 }} />Tu plan actual
                      </button>
                    ) : isLower ? (
                      <button disabled className="btn btn-secondary" style={{ width: "100%", fontWeight: 650, cursor: "default" }}>Incluido en tu plan</button>
                    ) : (
                      <button className={`${featured ? "btn btn-primary jv-sub-btn-pro" : "btn btn-secondary"} jv-sub-btn`} onClick={() => { const val = (effCycle === "annual" && p.annual) ? p.annual.usd : (p.price_usd ?? undefined); track("subscribe_click", { tier: p.tier, billing_cycle: effCycle }); metaEvent("AddToCart", backendUrl, { value: val, currency: "USD" }); setTier(p.tier); }} style={{ width: "100%", fontWeight: 700 }}>{curIdx >= 0 ? "Mejorar a este plan" : "Suscribirme"}</button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Firma enterprise (>5 abogados) → cierre humano / lead a ventas */}
            <a href="mailto:soporte@juroviapp.com?subject=Despacho%20con%20m%C3%A1s%20de%205%20abogados&body=Hola%2C%20somos%20un%20despacho%20con%20m%C3%A1s%20de%205%20abogados%20y%20queremos%20conocer%20un%20plan%20para%20la%20firma."
              onClick={() => { try { track("enterprise_lead_click", { where: "upgrade_modal" }); } catch { /* noop */ } }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18, padding: "12px 16px", borderRadius: 14, border: "1px dashed var(--border-strong, var(--border))", textDecoration: "none", fontSize: 13, fontWeight: 650, color: "var(--text)" }}>
              👥 ¿Despacho con <b style={{ margin: "0 4px" }}>+5 abogados</b>? Habla con nosotros <Icon name="arrowRight" size={15} />
            </a>
            {/* Confianza + identidad del prestador (Estatuto del Consumidor) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-muted)" }}>
              <Icon name="lock" size={13} /> Pago seguro · Cancela cuando quieras · Sin permanencia
            </div>
            <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
              <a href="/cancelacion" target="_blank" rel="noopener" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>Política de cancelación y reembolsos</a>
            </div>
          </div>
        )}

        {/* Vista 2 · checkout inline (estilo Stripe: resumen izq · pago der) */}
        {enabled && wide && (
          <div style={{ display: "flex", flexWrap: "wrap", flex: 1, minHeight: 0, overflow: "auto" }}>
            {/* Resumen del pedido (branding Jurovia) */}
            <div style={{ flex: "1 1 320px", minWidth: 300, padding: "26px 26px", background: "var(--bg-elevated)", borderRight: "1px solid var(--border)" }}>
              <Wordmark />
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 18 }}>Suscripción · plan {sel?.name} · {effCycle === "annual" ? "anual" : "mensual"}</div>
              {effCycle === "annual" && sel?.annual ? (
                <>
                  <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>${sel.annual.month_usd}<span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}> USD/mes</span></div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Se cobra <b style={{ color: "var(--text)" }}>${sel.annual.usd} USD</b> hoy (12 meses) · ahorras {sel.annual.save_pct}%</div>
                </>
              ) : (
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>${sel?.price_usd}<span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}> USD/mes</span></div>
              )}
              <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
                {["Citas verificadas en la fuente oficial", "Escritos radicables en Word", "Autopilot que vigila tus procesos", "Analiza cualquier documento", "Cancela cuando quieras · sin permanencia"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><Icon name="check" size={14} stroke={2.4} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />{f}</div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 24, fontSize: 12, color: "var(--text-muted)" }}>
                <Icon name="lock" size={13} /> Pago cifrado · procesado por Paddle
              </div>
            </div>
            {/* Formulario de pago (Paddle inline) */}
            <div style={{ flex: "1.2 1 360px", minWidth: 320, padding: "22px 24px" }}>
              {done ? (
                <div style={{ textAlign: "center", padding: "36px 12px" }}>
                  <div style={{ fontSize: 46, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 750, color: "var(--text)" }}>¡Pago recibido!</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.55 }}>Tu plan <b>{sel?.name}</b> se activa en unos segundos. Ya puedes seguir usando Jurovia.</div>
                  <button className="btn btn-primary" style={{ marginTop: 20, fontWeight: 700 }} onClick={() => { try { window.location.reload(); } catch { onClose(); } }}>Continuar</button>
                </div>
              ) : (
                <>
                  {loading && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Cargando pago seguro…</div>}
                  <div className="jv-paddle-frame" style={{ minHeight: 420 }} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Feedback modal (botón persistente / banner BETA) ----------
   Overlay no bloqueante intrusivo: cierra por click fuera o Esc. */
export function FeedbackModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (comment: string, kind: string) => void }) {
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (open) { setComment(""); setSent(false); }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(10,13,20,0.45)", backdropFilter: "blur(4px)", display: "grid", placeItems: "start center", paddingTop: "16vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 520, maxWidth: "92vw", background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-3)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--primary-soft)", display: "grid", placeItems: "center", color: "var(--primary)" }}>
            <Icon name="sparkles" size={17} />
          </span>
          <div style={{ flex: 1, fontWeight: 650, fontSize: 15, color: "var(--text)" }}>Enviar feedback</div>
          <button onClick={onClose} title="Cerrar" style={{ border: "none", background: "transparent", color: "var(--text-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 18 }}>
          {sent ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--success)", fontWeight: 600, fontSize: 14, padding: "12px 0" }}>
              <Icon name="check" size={16} stroke={2.2} /> ¡Gracias! Tu feedback nos ayuda a mejorar Jurovia.
            </div>
          ) : (
            <>
              <label style={{ fontSize: 13.5, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                ¿Qué mejorarías o qué te gustaría que Jurovia hiciera?
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Escribe aquí…"
                style={{ width: "100%", resize: "vertical", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", fontSize: 14, background: "var(--bg-base)", color: "var(--text)", outline: "none", fontFamily: "var(--font-ui)", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
                <button className="btn btn-primary btn-sm" disabled={!comment.trim()} onClick={() => { onSubmit(comment.trim(), "general"); setSent(true); }}>
                  <Icon name="send" size={15} /> Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Referral modal (growth loop) ----------
   Iconos: `gift` no existe en icons.tsx → se usa `coins` como acento.
   `users` no existe → se usa `user` en los stats. Mismo patrón de overlay que FeedbackModal. */
export function ReferralModal({
  open, onClose, backendUrl, accessToken,
}: {
  open: boolean;
  onClose: () => void;
  backendUrl: string;
  accessToken: string;
}) {
  const [data, setData] = useState<{ code: string | null; invited: number; rewarded: number; turns_earned: number; bonus_available: number; reward_referrer: number; reward_referee: number; reward_share: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  async function sendInvites() {
    const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
    if (!list.length || sending) return;
    setSending(true);
    setSentMsg(null);
    try {
      const r = await api.referralInvite(backendUrl, accessToken, list);
      if (r?.sent > 0) {
        setSentMsg(r.bonus_turns ? `¡${r.sent} enviada(s)! Ganaste ${r.bonus_turns} turnos al instante 🎉` : `¡${r.sent} invitación(es) enviada(s)!`);
        setEmails("");
        api.referralMe(backendUrl, accessToken).then((d) => setData(d)).catch(() => {});  // refresca turnos disponibles
      }
      else setSentMsg("No se pudo enviar. Revisa los correos e inténtalo de nuevo.");
    } catch { setSentMsg("No se pudo enviar."); }
    finally { setSending(false); setTimeout(() => setSentMsg(null), 4000); }
  }

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setCopied(false);
    let cancel = false;
    api.referralMe(backendUrl, accessToken).then((d) => {
      if (!cancel) { setData(d); setLoading(false); }
    });
    return () => { cancel = true; };
  }, [open, backendUrl, accessToken]);

  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);

  if (!open) return null;

  const code = data?.code ?? null;
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : null;
  const rewardReferrer = data?.reward_referrer ?? 5;
  const rewardReferee = data?.reward_referee ?? 3;
  const rewardShare = data?.reward_share ?? 2;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(10,13,20,0.45)", backdropFilter: "blur(4px)", display: "grid", placeItems: "start center", paddingTop: "14vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 540, maxWidth: "92vw", background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-3)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--grad-gold)", display: "grid", placeItems: "center", color: "#1A1206", flexShrink: 0 }}>
            <Icon name="gift" size={18} stroke={2.2} />
          </span>
          <div style={{ flex: 1, fontWeight: 650, fontSize: 15.5, color: "var(--text)" }}>Invita y gana turnos</div>
          <button onClick={onClose} title="Cerrar" style={{ border: "none", background: "transparent", color: "var(--text-muted)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.55 }}>
            Gana <strong style={{ color: "var(--gold-text, var(--gold))" }}>{rewardReferrer} turnos</strong> por cada colega que se registre y complete su perfil (él recibe <strong style={{ color: "var(--gold-text, var(--gold))" }}>{rewardReferee}</strong> de bienvenida). Y <strong style={{ color: "var(--gold-text, var(--gold))" }}>{rewardShare} turnos al instante</strong> por tu primera invitación del día.
          </p>

          {/* Enlace de referido */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 7, letterSpacing: "0.02em", textTransform: "uppercase" }}>Tu enlace de referido</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "9px 12px", background: "var(--bg-base)", minWidth: 0 }}>
              <Icon name="link" size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                readOnly
                value={loading ? "Generando…" : (link ?? "Generando…")}
                onFocus={(e) => e.currentTarget.select()}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontSize: 13.5, fontFamily: "var(--font-mono, var(--font-ui))", minWidth: 0 }}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={copy}
              disabled={!link}
              style={{ flexShrink: 0, minWidth: 110, justifyContent: "center" }}
            >
              <Icon name={copied ? "check" : "copy"} size={15} stroke={2.2} />
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>

          {/* Invitar por correo (Resend · noreply@juroviapp.com) */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", margin: "18px 0 7px", letterSpacing: "0.02em", textTransform: "uppercase" }}>O invítalos por correo</label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="correos separados por coma o espacio (ej. ana@bufete.com, luis@firma.co)"
            rows={2}
            style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "9px 12px", fontSize: 13.5, background: "var(--bg-base)", color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none", resize: "vertical" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <button className="btn btn-sm" onClick={sendInvites} disabled={sending || !emails.trim()}
              style={{ background: "var(--grad-gold)", color: "#1A1206", fontWeight: 700, border: "none" }}>
              <Icon name={sending ? "refresh" : "send"} size={15} stroke={2.2} style={sending ? { animation: "spin 1s linear infinite" } : undefined} />
              {sending ? "Enviando…" : "Enviar invitación"}
            </button>
            {sentMsg && <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--success)" }}>{sentMsg}</span>}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            {([
              ["user", String(data?.invited ?? 0), "invitados"],
              ["circleCheck", String(data?.rewarded ?? 0), "premiados"],
              ["sparkles", String(data?.bonus_available ?? 0), "turnos disponibles"],
            ] as [string, string, string][]).map(([ic, n, label]) => (
              <div key={label} style={{ flex: "1 1 120px", minWidth: 110, display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-elevated-2)" }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary-soft)", display: "grid", placeItems: "center", color: "var(--primary)", flexShrink: 0 }}>
                  <Icon name={ic} size={15} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>{n}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, desc, cta, onCta }: { icon: string; title: string; desc: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--grad-aurora-soft)", border: "1px solid var(--border)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
          <Icon name={icon} size={32} style={{ color: "var(--primary)" }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 650, margin: "0 0 8px" }}>{title}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14.5, margin: "0 0 22px", lineHeight: 1.55 }}>{desc}</p>
        {cta && (
          <button className="btn btn-primary" onClick={onCta}>
            <Icon name="plus" size={16} stroke={2.2} />
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
export type Toast = { id: number; text: string; kind: string };

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div style={{ position: "fixed", right: 22, bottom: 22, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {items.map((t) => {
        const meta = ({ gold: ["badgeCheck", "var(--gold)"], success: ["check", "var(--success)"], primary: ["sparkles", "var(--primary)"], warning: ["alert", "var(--warning)"], info: ["info", "var(--info)"] } as Record<string, [string, string]>)[t.kind] || ["info", "var(--primary)"];
        return (
          <div key={t.id} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 11, background: "#11151F", color: "#F3F5FA", padding: "12px 16px", borderRadius: "var(--r-md)", boxShadow: "0 16px 40px -12px rgba(13,19,32,0.4)", fontSize: 13.5, fontWeight: 500, maxWidth: 340 }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.08)", color: meta[1], flexShrink: 0 }}>
              <Icon name={meta[0]} size={15} stroke={2.2} />
            </span>
            {t.text}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Command palette ---------- */
export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onNew,
  recents = [],
  onStart,
  onOpenRecent,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (r: string) => void;
  onNew: () => void;
  recents?: { id: string; title: string }[];
  onStart?: (prompt: string, mode?: string) => void;
  onOpenRecent?: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);
  if (!open) return null;
  const actions = [
    { icon: "plus", label: "Nuevo documento", fn: onStart ? () => onStart("", "Documento") : onNew },
    // Tareas que pre-llenan el composer
    { icon: "pencil", label: "Redactar una tutela", fn: () => onStart?.("Redacta una acción de tutela ", "Documento") },
    { icon: "gavel", label: "Redactar una demanda", fn: () => onStart?.("Redacta una demanda ", "Documento") },
    { icon: "shieldCheck", label: "Revisar un contrato", fn: () => onStart?.("Revisa este contrato y dime los riesgos: ", "Documento") },
    { icon: "fileText", label: "Responder un derecho de petición", fn: () => onStart?.("Responde este derecho de petición: ", "Documento") },
    // Navegación
    { icon: "message", label: "Ir a Inicio", fn: () => onNavigate("home") },
    { icon: "folder", label: "Ir a Misiones", fn: () => onNavigate("expedientes") },
    { icon: "calendarClock", label: "Ir a Términos", fn: () => onNavigate("terminos") },
    { icon: "radar", label: "Ir a Autopilot", fn: () => onNavigate("autopilot") },
    { icon: "bell", label: "Ir a Bandeja", fn: () => onNavigate("inbox") },
    { icon: "book", label: "Ir a Biblioteca", fn: () => onNavigate("library") },
    { icon: "template", label: "Ir a Plantillas", fn: () => onNavigate("templates") },
    { icon: "settings", label: "Ajustes de la firma", fn: () => onNavigate("settings") },
    // Conversaciones recientes
    ...recents.map((r) => ({ icon: "message", label: r.title, fn: () => onOpenRecent?.(r.id) })),
  ].filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,13,20,0.45)", backdropFilter: "blur(4px)", display: "grid", placeItems: "start center", paddingTop: "14vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 560, maxWidth: "92vw", background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-3)", overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={19} style={{ color: "var(--text-muted)" }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar acciones, casos, conversaciones…" style={{ flex: 1, border: "none", outline: "none", fontSize: 16, background: "transparent", color: "var(--text)" }} />
          <kbd style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 6px" }}>esc</kbd>
        </div>
        <div style={{ padding: 8, maxHeight: 340, overflow: "auto" }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                a.fn();
                onClose();
              }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", border: "none", borderRadius: "var(--r-sm)", background: "transparent", color: "var(--text)", fontSize: 14, textAlign: "left" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary-soft)", display: "grid", placeItems: "center", color: "var(--primary)" }}>
                <Icon name={a.icon} size={16} />
              </span>
              {a.label}
            </button>
          ))}
          {actions.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13.5 }}>Sin resultados.</div>}
        </div>
      </div>
    </div>
  );
}

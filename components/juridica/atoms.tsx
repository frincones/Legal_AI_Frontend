"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icons";
import { CITATIONS, type Citation } from "./data";

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
            background: "conic-gradient(from 0deg, #7B6CF6, #4F7BFF, #21C7D8, #7B6CF6)",
            animation: "auroraRing 1.6s linear infinite",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
      )}
      <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center", boxShadow: "0 2px 8px -2px rgba(91,77,227,0.5)" }}>
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

/* ---------- Artifact card (document) ---------- */
export function ArtifactCard({ doc, sources = 3, onOpen }: { doc: { title: string; version?: number | string; uri?: string }; sources?: number; onOpen?: () => void }) {
  return (
    <div
      className="fade-up"
      style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-surface)", boxShadow: "var(--sh-2)", overflow: "hidden", transition: "box-shadow .2s, transform .2s", cursor: "pointer" }}
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
        {doc.uri ? (
          <a
            className="btn btn-secondary btn-sm"
            href={doc.uri}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: "none" }}
          >
            <Icon name="download" size={15} />
            Descargar
          </a>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onOpen}>
            <Icon name="eye" size={15} />
            Vista previa
          </button>
        )}
        <button className="btn btn-ghost btn-sm">
          <Icon name="download" size={15} />
          DOCX
        </button>
        <button className="btn btn-ghost btn-sm">
          <Icon name="download" size={15} />
          PDF
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm">
          <Icon name="history" size={15} />
        </button>
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
export function CommandPalette({ open, onClose, onNavigate, onNew }: { open: boolean; onClose: () => void; onNavigate: (r: string) => void; onNew: () => void }) {
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
    { icon: "plus", label: "Nuevo documento", fn: onNew },
    { icon: "book", label: "Ir a Biblioteca", fn: () => onNavigate("library") },
    { icon: "template", label: "Ir a Plantillas", fn: () => onNavigate("templates") },
    { icon: "shieldCheck", label: "Verificar una norma o sentencia", fn: () => onNavigate("home") },
    { icon: "settings", label: "Ajustes de la firma", fn: () => onNavigate("settings") },
  ].filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,13,20,0.45)", backdropFilter: "blur(4px)", display: "grid", placeItems: "start center", paddingTop: "14vh" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 560, maxWidth: "92vw", background: "var(--bg-surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-3)", overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={19} style={{ color: "var(--text-muted)" }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar acciones, documentos, normas…" style={{ flex: 1, border: "none", outline: "none", fontSize: 16, background: "transparent", color: "var(--text)" }} />
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

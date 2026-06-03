"use client";

import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import { Icon, Logo } from "./icons";
import { AgentAvatar } from "./atoms";
import { RECENTS } from "./data";

/* ---------------- Sidebar ---------------- */
export function Sidebar({
  route,
  onNavigate,
  collapsed,
  onToggle,
  onNew,
  email,
  recents,
}: {
  route: string;
  onNavigate: (r: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onNew: () => void;
  email?: string | null;
  recents?: { id: string; title: string }[];
}) {
  const recentList = recents && recents.length ? recents : RECENTS;
  const navItems = [
    { id: "library", icon: "book", label: "Biblioteca" },
    { id: "templates", icon: "template", label: "Plantillas" },
    { id: "cases", icon: "folder", label: "Casos" },
  ];

  const Item = ({ id, icon, label, active, onClick }: { id?: string; icon: string; label: string; active?: boolean; onClick?: () => void }) => (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: collapsed ? "0" : "0 10px",
        height: 38,
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: "var(--r-md)",
        border: "none",
        textAlign: "left",
        background: active ? "var(--primary-soft)" : "transparent",
        color: active ? "var(--primary)" : "var(--text-secondary)",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        transition: "background .15s, color .15s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--bg-elevated-2)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon name={icon} size={18} stroke={1.7} />
      {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
    </button>
  );

  const firmEmail = email || "andres@restrepolegal.co";

  return (
    <aside
      style={{
        width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        flexShrink: 0,
        height: "100%",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width .22s ease",
        overflow: "hidden",
      }}
    >
      {/* Top: logo + collapse */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: collapsed ? "16px 0" : "16px 16px 12px", minHeight: 60 }}>
        {!collapsed && (
          <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", padding: 0 }}>
            <Logo size={28} withText />
          </button>
        )}
        {collapsed && (
          <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", padding: 0, margin: "0 auto" }}>
            <Logo size={30} />
          </button>
        )}
        {!collapsed && (
          <button className="btn-ghost focus-ring" onClick={onToggle} title="Colapsar" style={{ border: "none", borderRadius: 8, width: 30, height: 30, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
            <Icon name="panelLeft" size={18} />
          </button>
        )}
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="btn btn-primary" onClick={onNew} style={{ width: "100%", justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? 0 : "0 14px", height: 42 }} title="Nuevo">
          <Icon name="plus" size={18} stroke={2.2} />
          {!collapsed && <span>Nuevo documento</span>}
        </button>
        {!collapsed ? (
          <button onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 9, height: 38, padding: "0 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-muted)", fontSize: 13.5, textAlign: "left" }}>
            <Icon name="search" size={16} />
            <span style={{ flex: 1 }}>Buscar</span>
            <kbd style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 5px", background: "var(--bg-surface)" }}>⌘K</kbd>
          </button>
        ) : (
          <Item icon="search" label="Buscar" onClick={() => {}} />
        )}
      </div>

      {/* Recents */}
      <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: collapsed ? "14px 12px" : "16px 12px 8px" }}>
        {!collapsed && <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "0 10px 8px" }}>Recientes</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recentList.map((r) => (
            <button
              key={r.id}
              onClick={() => onNavigate("home")}
              title={collapsed ? (r.title || "Conversación") : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: collapsed ? 0 : "0 10px",
                height: 36,
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: "var(--r-sm)",
                border: "none",
                background: "transparent",
                textAlign: "left",
                color: "var(--text-secondary)",
                fontSize: 13.5,
                fontWeight: 450,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-elevated-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon name="message" size={16} stroke={1.6} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((n) => (
          <Item key={n.id} {...n} active={route === n.id} onClick={() => onNavigate(n.id)} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
        <Item icon="settings" label="Ajustes" active={route === "settings"} onClick={() => onNavigate("settings")} />
        <button
          onClick={() => onNavigate("settings")}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? 0 : "6px 8px", height: 48, justifyContent: collapsed ? "center" : "flex-start", borderRadius: "var(--r-md)", border: "none", background: "transparent", textAlign: "left" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-elevated-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#566076,#0D1320)", color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>AR</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Andrés Restrepo</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{firmEmail}</div>
            </div>
          )}
          {!collapsed && <Icon name="chevronRight" size={15} style={{ color: "var(--text-muted)" }} />}
        </button>
        {collapsed && (
          <button className="focus-ring" onClick={onToggle} title="Expandir" style={{ border: "none", borderRadius: 8, height: 32, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "transparent" }}>
            <Icon name="panelLeft" size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}

/* ---------------- Composer ---------------- */
export function Composer({
  value,
  onChange,
  onSend,
  mode,
  onMode,
  jurisdiction,
  onJurisdiction,
  style = "elevated",
  placeholder,
  autoFocus,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  mode: string;
  onMode: (m: string) => void;
  jurisdiction: string;
  onJurisdiction: (j: string) => void;
  style?: "elevated" | "bordered" | "pill";
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);
  useEffect(() => {
    if (autoFocus && taRef.current) taRef.current.focus();
  }, [autoFocus]);

  const [jOpen, setJOpen] = useState(false);
  const jurisdictions = ["Colombia · Nacional", "Bogotá D.C.", "Antioquia", "Valle del Cauca", "Atlántico"];

  const shellStyle: CSSProperties =
    style === "bordered"
      ? { background: "var(--bg-surface)", border: "1.5px solid var(--border-strong)", boxShadow: "none" }
      : style === "pill"
      ? { background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)", borderRadius: 28 }
      : { background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)" };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="composer-shell" style={{ borderRadius: style === "pill" ? 28 : "var(--r-xl)", overflow: "hidden", transition: "box-shadow .2s, border-color .2s", position: "relative", ...shellStyle }}>
      <div
        className="composer-accent"
        style={{ position: "absolute", inset: 0, borderRadius: "inherit", padding: 1.5, background: "var(--aurora)", WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", opacity: 0, transition: "opacity .2s", pointerEvents: "none" }}
      />
      <textarea
        ref={taRef}
        value={value}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          const a = e.currentTarget.parentElement?.querySelector(".composer-accent") as HTMLElement | null;
          if (a) a.style.opacity = "1";
        }}
        onBlur={(e) => {
          const a = e.currentTarget.parentElement?.querySelector(".composer-accent") as HTMLElement | null;
          if (a) a.style.opacity = "0";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={placeholder || "Describe el documento o la consulta legal…"}
        style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", padding: "20px 22px 6px", fontSize: 16, lineHeight: 1.55, color: "var(--text)", fontFamily: "var(--font-ui)", display: "block", maxHeight: 200 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 12px 14px" }}>
        <button className="btn-ghost focus-ring" title="Adjuntar" style={{ border: "none", width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
          <Icon name="paperclip" size={19} />
        </button>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "var(--bg-elevated-2)", borderRadius: "var(--r-pill)", padding: 3, gap: 2 }}>
          {["Documento", "Pregunta"].map((m) => (
            <button
              key={m}
              onClick={() => onMode(m)}
              style={{ border: "none", height: 30, padding: "0 14px", borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 600, background: mode === m ? "var(--bg-surface)" : "transparent", color: mode === m ? "var(--primary)" : "var(--text-muted)", boxShadow: mode === m ? "var(--sh-1)" : "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Icon name={m === "Documento" ? "fileText" : "message"} size={15} />
              {m}
            </button>
          ))}
        </div>

        {/* Jurisdiction */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setJOpen(!jOpen)} className="focus-ring" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 12px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>
            <Icon name="scale" size={15} style={{ color: "var(--primary)" }} />
            <span style={{ maxWidth: 130, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{jurisdiction}</span>
            <Icon name="chevronDown" size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          {jOpen && (
            <>
              <div onClick={() => setJOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div className="fade-up" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, width: 220, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-pop)", padding: 6, zIndex: 50 }}>
                {jurisdictions.map((j) => (
                  <button
                    key={j}
                    onClick={() => {
                      onJurisdiction(j);
                      setJOpen(false);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", border: "none", borderRadius: 8, background: j === jurisdiction ? "var(--primary-soft)" : "transparent", color: j === jurisdiction ? "var(--primary)" : "var(--text)", fontSize: 13.5, fontWeight: j === jurisdiction ? 600 : 450, textAlign: "left" }}
                  >
                    <Icon name="globe" size={15} style={{ opacity: 0.7 }} />
                    {j}
                    {j === jurisdiction && (
                      <span style={{ flex: 1, textAlign: "right" }}>
                        <Icon name="check" size={15} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <span style={{ flex: 1 }} />
        <button
          onClick={() => canSend && onSend()}
          disabled={!canSend}
          className="focus-ring"
          style={{ width: 42, height: 42, borderRadius: style === "pill" ? "50%" : "var(--r-md)", border: "none", background: canSend ? "var(--aurora)" : "var(--bg-elevated-2)", color: canSend ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center", boxShadow: canSend ? "var(--glow-primary)" : "none", transition: "all .15s", cursor: canSend ? "pointer" : "default" }}
        >
          <Icon name="arrowUp" size={20} stroke={2.4} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Chat message ---------------- */
export function ChatMessage({ role, children, generating }: { role: "user" | "assistant"; children: ReactNode; generating?: boolean }) {
  if (role === "user") {
    return (
      <div className="fade-up" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 22 }}>
        <div style={{ maxWidth: "82%", background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", borderBottomRightRadius: 5, padding: "12px 16px", fontSize: 14.5, lineHeight: 1.55, color: "var(--text)", whiteSpace: "pre-wrap" }}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="fade-up" style={{ display: "flex", gap: 12, marginBottom: 22 }}>
      <AgentAvatar size={30} generating={generating} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2, fontSize: 14.5, lineHeight: 1.6, color: "var(--text)" }}>{children}</div>
    </div>
  );
}

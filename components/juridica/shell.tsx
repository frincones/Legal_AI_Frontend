"use client";

import { useState, useRef, useEffect, type ReactNode, type CSSProperties, type ChangeEvent } from "react";
import { Icon, Logo } from "./icons";
import { AgentAvatar } from "./atoms";
import { useDictation } from "./Dictation";

/* ---------------- Sidebar ---------------- */
export function Sidebar({
  route,
  onNavigate,
  collapsed,
  onToggle,
  onNew,
  email,
  recents,
  onOpenRecent,
  missionMode = false,
  credits,
  creditsBlocked = false,
  isAdmin = false,
}: {
  route: string;
  onNavigate: (r: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onNew: () => void;
  email?: string | null;
  recents?: { id: string; title: string }[];
  onOpenRecent?: (id: string) => void;
  missionMode?: boolean;
  credits?: { balance: number | null; cap: number | null };
  creditsBlocked?: boolean;
  isAdmin?: boolean;
}) {
  const recentList = recents || [];   // solo conversaciones reales del usuario (sin mock)
  // Nombre/iniciales reales derivados del correo (sin datos mock).
  const userLocal = (email || "").split("@")[0] || "Mi cuenta";
  const userName = userLocal.charAt(0).toUpperCase() + userLocal.slice(1);
  const userInitials = (email || "MC").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "MC";
  // Mission Control (F2): navegación operativa. Sin el flag, la navegación clásica intacta.
  const missionNav = [
    { id: "home", icon: "target", label: "Inicio" },
    { id: "expedientes", icon: "folder", label: "Misiones" },
    { id: "terminos", icon: "calendarClock", label: "Términos" },
    { id: "autopilot", icon: "radar", label: "Autopilot" },
    { id: "inbox", icon: "bell", label: "Bandeja" },
  ];
  const navItems = missionMode
    ? [{ id: "library", icon: "book", label: "Biblioteca" }]
    : [
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

  const firmEmail = email || "";

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
        <button className="btn btn-primary" onClick={onNew} style={{ width: "100%", justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? 0 : "0 14px", height: 42 }} title={missionMode ? "Nueva misión" : "Nuevo"}>
          <Icon name={creditsBlocked ? "lock" : "plus"} size={18} stroke={2.2} />
          {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{missionMode ? "Nueva misión" : "Nuevo documento"}</span>}
          {!collapsed && creditsBlocked && <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85 }}>BLOQUEADO</span>}
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

      {/* Mission Control — navegación operativa (solo con el flag) */}
      {missionMode && (
        <div style={{ padding: "14px 12px 4px", display: "flex", flexDirection: "column", gap: 2 }}>
          {missionNav.map((n) => (
            <Item key={n.id} {...n} active={n.id === "expedientes" ? route === "expedientes" || route === "expediente" : route === n.id} onClick={() => onNavigate(n.id)} />
          ))}
        </div>
      )}

      {/* Recents */}
      <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: collapsed ? "14px 12px" : "16px 12px 8px" }}>
        {!collapsed && <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "0 10px 8px" }}>Recientes</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recentList.map((r) => (
            <button
              key={r.id}
              onClick={() => (onOpenRecent ? onOpenRecent(r.id) : onNavigate("home"))}
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
          {!collapsed && recentList.length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "4px 10px", lineHeight: 1.5 }}>
              Tus conversaciones aparecerán aquí.
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((n) => (
          <Item key={n.id} {...n} active={route === n.id} onClick={() => onNavigate(n.id)} />
        ))}
      </div>

      {/* Créditos (visible en ambos modos) */}
      {!collapsed && (credits?.balance != null || isAdmin) && (
        <div style={{ padding: "8px 12px 0" }}>
          <div onClick={() => isAdmin && onNavigate("admin")} title={isAdmin ? "Panel admin" : undefined}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: creditsBlocked ? "var(--warning-soft)" : "var(--bg-base)", cursor: isAdmin ? "pointer" : "default" }}>
            <Icon name={creditsBlocked ? "lock" : "coins"} size={16} style={{ color: creditsBlocked ? "var(--warning)" : "var(--primary)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
                {isAdmin ? "Créditos: ilimitado" : `${credits?.balance} / ${credits?.cap ?? "—"}`}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{isAdmin ? "Admin" : creditsBlocked ? "Sin créditos" : "créditos del agente"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
        {isAdmin && <Item icon="shieldCheck" label="Admin" active={route === "admin"} onClick={() => onNavigate("admin")} />}
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
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--aurora)", color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{userInitials}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
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
function fmtSec(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Composer({
  value,
  onChange,
  onSend,
  style = "elevated",
  placeholder,
  autoFocus,
  disabled,
  compact,
  backendUrl,
  accessToken,
  matterId,
  blocked,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (documentIds?: string[]) => void;
  // mode/jurisdiction quedan opcionales por compatibilidad con los llamadores; ya no se renderizan.
  mode?: string;
  onMode?: (m: string) => void;
  jurisdiction?: string;
  onJurisdiction?: (j: string) => void;
  style?: "elevated" | "bordered" | "pill";
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  compact?: boolean;
  backendUrl?: string;      // dictado por voz + adjuntar. Si faltan, se ocultan mic y clip.
  accessToken?: string;
  matterId?: string;        // asocia el adjunto a la misión (opcional)
  blocked?: boolean;        // sin créditos → input deshabilitado + banner
}) {
  const dict = useDictation(backendUrl, accessToken);
  const micEnabled = !!(backendUrl && accessToken);
  async function confirmDictation() {
    const t = await dict.stop();
    if (t) onChange(value.trim() ? `${value.trim()} ${t}` : t);
  }

  // ── Adjuntar documentos (clip) ──
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef(0);
  const [atts, setAtts] = useState<{ key: number; name: string; id?: string; loading: boolean; err?: boolean }[]>([]);
  const attachEnabled = !!(backendUrl && accessToken);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    if (!backendUrl || !accessToken) return;
    for (const file of list) {
      const k = ++keyRef.current;
      setAtts((a) => [...a, { key: k, name: file.name, loading: true }]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (matterId) fd.append("matter_id", matterId);
        const r = await fetch(`${backendUrl}/api/documents`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: fd });
        const j = r.ok ? await r.json() : null;
        setAtts((a) => a.map((x) => (x.key === k ? { ...x, loading: false, id: j?.document_id, err: !j?.document_id } : x)));
      } catch {
        setAtts((a) => a.map((x) => (x.key === k ? { ...x, loading: false, err: true } : x)));
      }
    }
  }

  function doSend() {
    if (!canSend) return;
    const ids = atts.filter((a) => a.id).map((a) => a.id as string);
    onSend(ids.length ? ids : undefined);
    setAtts([]);
  }
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

  const shellStyle: CSSProperties =
    style === "bordered"
      ? { background: "var(--bg-surface)", border: "1.5px solid var(--border-strong)", boxShadow: "none" }
      : style === "pill"
      ? { background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)", borderRadius: 28 }
      : { background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)" };

  const uploading = atts.some((a) => a.loading);
  const canSend = (value.trim().length > 0 || atts.some((a) => a.id)) && !disabled && !uploading && !blocked;

  return (
    <div className="composer-shell" style={{ borderRadius: style === "pill" ? 28 : "var(--r-xl)", overflow: "hidden", transition: "box-shadow .2s, border-color .2s", position: "relative", ...shellStyle }}>
      <div
        className="composer-accent"
        style={{ position: "absolute", inset: 0, borderRadius: "inherit", padding: 1.5, background: "var(--aurora)", WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", opacity: 0, transition: "opacity .2s", pointerEvents: "none" }}
      />

      {blocked && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--warning-soft)", color: "var(--warning)", fontSize: 13, fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
          <Icon name="lock" size={15} /> Sin créditos — el agente está bloqueado. Recarga o espera la renovación.
        </div>
      )}

      {dict.transcribing ? (
        /* Transcribiendo el dictado (estilo ChatGPT "Cargando dictado") */
        <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 11, padding: "22px 22px", minHeight: 70 }}>
          <Icon name="sparkles" size={17} style={{ color: "var(--primary)", animation: "spin 2.4s linear infinite" }} />
          <span className="shimmer-text" style={{ fontWeight: 550, fontSize: 15 }}>Cargando dictado · {fmtSec(dict.seconds)}</span>
        </div>
      ) : dict.recording ? (
        /* Grabando: waveform reactivo + timer + cancelar (X) + listo (✓) */
        <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px", minHeight: 70 }}>
          <button onClick={dict.cancel} title="Cancelar" className="focus-ring" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="x" size={18} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 34, overflow: "hidden" }}>
            {dict.levels.map((lv, i) => (
              <span key={i} style={{ width: 3, borderRadius: 2, background: "var(--primary)", height: Math.max(3, 3 + lv * 26), opacity: 0.35 + lv * 0.65, transition: "height .09s ease, opacity .09s ease" }} />
            ))}
          </div>
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)", minWidth: 40, textAlign: "right", flexShrink: 0 }}>{fmtSec(dict.seconds)}</span>
          <button onClick={confirmDictation} title="Listo" className="focus-ring" style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "var(--aurora)", color: "#fff", display: "grid", placeItems: "center", boxShadow: "var(--glow-primary)", flexShrink: 0 }}>
            <Icon name="check" size={19} stroke={2.5} />
          </button>
        </div>
      ) : (
        <>
          <textarea
            ref={taRef}
            value={value}
            rows={1}
            disabled={blocked}
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
                doSend();
              }
            }}
            placeholder={placeholder || "Describe el documento o la consulta legal…"}
            style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", padding: "20px 22px 6px", fontSize: 16, lineHeight: 1.55, color: "var(--text)", fontFamily: "var(--font-ui)", display: "block", maxHeight: 200 }}
          />
          {atts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "2px 14px 0" }}>
              {atts.map((a) => (
                <span key={a.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)", background: "var(--bg-elevated-2)", fontSize: 12, color: "var(--text-secondary)", maxWidth: 220 }}>
                  <Icon name="fileText" size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
                  {a.loading ? <Icon name="refresh" size={12} style={{ animation: "spin 1s linear infinite" }} />
                    : a.err ? <Icon name="alert" size={12} style={{ color: "var(--danger, #DC2626)" }} />
                    : <Icon name="check" size={12} style={{ color: "var(--success)" }} />}
                  <button onClick={() => setAtts((x) => x.filter((y) => y.key !== a.key))} title="Quitar" style={{ border: "none", background: "transparent", padding: 0, display: "grid", placeItems: "center", color: "var(--text-muted)", cursor: "pointer" }}>
                    <Icon name="x" size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" multiple onChange={handleFiles} style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg" />
          <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 8, padding: compact ? "6px 8px 10px 10px" : "8px 12px 12px 14px", flexWrap: compact ? "wrap" : "nowrap", rowGap: 6 }}>
            {attachEnabled && (
              <button onClick={() => fileRef.current?.click()} className="btn-ghost focus-ring" title="Adjuntar documento" style={{ border: "none", width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
                <Icon name="paperclip" size={19} />
              </button>
            )}
            {micEnabled && (
              <button onClick={() => dict.start()} className="btn-ghost focus-ring" title="Dictar por voz" style={{ border: "none", width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
                <Icon name="mic" size={19} />
              </button>
            )}

            <span style={{ flex: 1 }} />
            <button
              onClick={doSend}
              disabled={!canSend}
              className="focus-ring"
              style={{ width: 42, height: 42, borderRadius: style === "pill" ? "50%" : "var(--r-md)", border: "none", background: canSend ? "var(--aurora)" : "var(--bg-elevated-2)", color: canSend ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center", boxShadow: canSend ? "var(--glow-primary)" : "none", transition: "all .15s", cursor: canSend ? "pointer" : "default" }}
            >
              <Icon name="arrowUp" size={20} stroke={2.4} />
            </button>
          </div>
        </>
      )}
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

/* CRM de ventas (admin) — Kanban por etapa + inbox tipo WhatsApp-app. Fase 4.
   Aditivo: consume /api/admin/crm* (datos del agente de ventas F1). Fail-open (helpers caen a fallback).
   No toca el agente jurídico ni otros tabs. */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { api, type CrmBoard, type CrmItem, type CrmThread } from "./data";

const STAGE_LABEL: Record<string, string> = {
  nuevo: "🆕 Nuevo", contactado: "💬 Contactado", calificado: "✅ Calificado",
  probando: "🔥 Probando", en_cierre: "💳 En cierre", cliente: "🏆 Cliente",
  trial_vencido: "⏳ Trial vencido", reactivacion: "♻️ Reactivación",
};

function fmtWhen(iso: string | null): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export function CrmTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [board, setBoard] = useState<CrmBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<CrmItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.adminCrm(backendUrl, accessToken).then((d) => { setBoard(d); setLoading(false); });
  }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  if (loading && !board) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Cargando CRM…</div>;
  const stages = board?.stages || [];
  const items = board?.items || [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>CRM de ventas</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "3px 0 0" }}>Kanban por etapa + conversación cliente ↔ 🤖 agente. Arrastra con los botones o abre una tarjeta.</p>
        </div>
        <span style={{ flex: 1 }} />
        {board && !board.enabled && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--warning, #B8820E)", background: "rgba(184,130,14,.12)", borderRadius: 999, padding: "5px 11px" }}>Agente OFF (sales_agent_enabled)</span>}
        {board && board.enabled && !board.wa_enabled && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--warning, #B8820E)", background: "rgba(184,130,14,.12)", borderRadius: 999, padding: "5px 11px" }}>WhatsApp OFF</span>}
        <button onClick={load} className="btn btn-secondary" style={{ fontWeight: 700, fontSize: 13 }}><Icon name="refresh" size={15} /> Actualizar</button>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 14 }}>
          Aún no hay conversaciones de ventas. Aparecerán aquí cuando el agente reciba mensajes por WhatsApp.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
          {stages.map((st) => {
            const cards = items.filter((i) => (i.stage || "nuevo") === st);
            return (
              <div key={st} style={{ flex: "0 0 226px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 13, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9, fontSize: 12.5, fontWeight: 800 }}>
                  <span>{STAGE_LABEL[st] || st}</span>
                  <span style={{ color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: 999, padding: "1px 8px", fontSize: 11 }}>{board?.counts[st] ?? cards.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {cards.map((c) => (
                    <button key={c.conversation_id} onClick={() => setSel(c)}
                      style={{ textAlign: "left", cursor: "pointer", background: "var(--bg-surface)", border: `1px solid ${c.needs_human ? "var(--danger,#DC2626)" : "var(--border)"}`, borderRadius: 10, padding: "9px 10px", fontFamily: "inherit" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{c.lead_name || `+${c.phone}`}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.area_practica || "—"}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {c.qualified && <span style={pill("var(--success,#16A34A)")}>calificado</span>}
                        {c.demo_used && <span style={pill("#7B3DF5")}>probó demo</span>}
                        {!c.ai_enabled && <span style={pill("#6B7280")}>humano</span>}
                        {c.needs_human && <span style={pill("var(--danger,#DC2626)")}>requiere humano</span>}
                      </div>
                    </button>
                  ))}
                  {cards.length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 2px" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sel && <ThreadDrawer backendUrl={backendUrl} accessToken={accessToken} item={sel} onClose={() => setSel(null)} onChanged={load} stages={stages} />}
    </div>
  );
}

function pill(color: string): React.CSSProperties {
  return { fontSize: 9.5, fontWeight: 800, color, background: "color-mix(in srgb," + color + " 14%, transparent)", borderRadius: 999, padding: "2px 7px" };
}

// ─────────────────────────── Inbox tipo WhatsApp-app ───────────────────────────
function ThreadDrawer({ backendUrl, accessToken, item, onClose, onChanged, stages }: {
  backendUrl: string; accessToken: string; item: CrmItem; onClose: () => void; onChanged: () => void; stages: string[];
}) {
  const [thread, setThread] = useState<CrmThread | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const convId = item.conversation_id;

  const load = useCallback(() => {
    api.adminCrmThread(backendUrl, accessToken, convId).then(setThread);
  }, [backendUrl, accessToken, convId]);
  useEffect(() => { load(); const id = setInterval(load, 6000); return () => clearInterval(id); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);

  const aiEnabled = (thread?.state?.ai_enabled as boolean) ?? item.ai_enabled;
  const stage = (thread?.state?.stage as string) ?? item.stage;

  async function reply() {
    const t = text.trim(); if (!t || busy) return;
    setBusy(true);
    await api.adminCrmReply(backendUrl, accessToken, convId, t);
    setText(""); setBusy(false); load();
  }
  async function toggleAi() { await api.adminCrmAi(backendUrl, accessToken, convId, !aiEnabled); load(); onChanged(); }
  async function moveStage(s: string) { if (s === stage) return; await api.adminCrmStage(backendUrl, accessToken, convId, s); load(); onChanged(); }

  const msgs = thread?.messages || [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(10,13,20,.5)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "96vw", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{item.lead_name || `+${item.phone}`}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>+{item.phone} · {STAGE_LABEL[stage] || stage}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}><Icon name="x" size={18} /></button>
        </div>

        {/* Controles: etapa + tomar control */}
        <div style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <select value={stage} onChange={(e) => moveStage(e.target.value)} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-strong,var(--border))", background: "var(--bg-base)", color: "var(--text)", fontFamily: "inherit" }}>
            {stages.map((s) => <option key={s} value={s}>{STAGE_LABEL[s] || s}</option>)}
          </select>
          <span style={{ flex: 1 }} />
          <button onClick={toggleAi} className="btn btn-secondary" style={{ fontSize: 12, fontWeight: 700, padding: "6px 11px" }}>
            {aiEnabled ? "⏸️ Tomar el control" : "▶️ Devolver a la IA"}
          </button>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px", background: "var(--bg-base)", display: "flex", flexDirection: "column", gap: 8 }}>
          {msgs.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", marginTop: 20 }}>Sin mensajes aún.</div>}
          {msgs.map((m, i) => {
            const out = m.direction === "outbound";
            return (
              <div key={i} style={{ alignSelf: out ? "flex-end" : "flex-start", maxWidth: "82%", background: out ? "rgba(22,163,74,.12)" : "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, borderBottomRightRadius: out ? 3 : 12, borderBottomLeftRadius: out ? 12 : 3, padding: "7px 11px" }}>
                {out && <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", marginBottom: 2 }}>🤖 Agente / Equipo</div>}
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{m.content || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>[{m.msg_type || "media"}]</span>}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Responder */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={aiEnabled ? "Escribe (toma el control para responder tú)…" : "Escribe tu respuesta…"} rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); reply(); } }}
            style={{ flex: 1, resize: "none", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong,var(--border))", background: "var(--bg-base)", color: "var(--text)", fontFamily: "inherit", fontSize: 13.5, outline: "none" }} />
          <button onClick={reply} disabled={busy || !text.trim()} className="btn btn-primary" style={{ height: 40, fontWeight: 700, opacity: busy || !text.trim() ? .6 : 1 }}>
            {busy ? "…" : <Icon name="arrowRight" size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}

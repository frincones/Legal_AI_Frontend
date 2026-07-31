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
  no_recordatorios: "🔕 No recordatorios",
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
  const [hover, setHover] = useState<{ c: CrmItem; x: number; y: number } | null>(null);

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
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "3px 0 0" }}>Kanban por etapa · pasa el mouse sobre una tarjeta para ver el detalle, o haz clic para abrir la conversación.</p>
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
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12 }}>
          {stages.map((st) => {
            const cards = items.filter((i) => (i.stage || "nuevo") === st);
            return (
              <div key={st} style={{ flex: "0 0 196px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, padding: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 800 }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{STAGE_LABEL[st] || st}</span>
                  <span style={{ color: "var(--text-muted)", background: "var(--bg-surface)", borderRadius: 999, padding: "1px 7px", fontSize: 10.5, flex: "none" }}>{board?.counts[st] ?? cards.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {cards.map((c) => (
                    <button key={c.conversation_id} onClick={() => setSel(c)}
                      onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover({ c, x: r.right, y: r.top }); }}
                      onMouseLeave={() => setHover(null)}
                      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", cursor: "pointer", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 9px", fontFamily: "inherit" }}>
                      {c.needs_human ? <span title="Requiere humano" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger,#DC2626)", flex: "none" }} />
                        : !c.ai_enabled ? <span title="Humano tomó el control" style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B7280", flex: "none" }} />
                        : c.qualified ? <span title="Calificado" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success,#16A34A)", flex: "none" }} /> : null}
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: c.unread ? 750 : 650, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lead_name || `+${c.phone}`}</span>
                      {!!c.unread && c.unread > 0 && (
                        <span title={`${c.unread} sin leer`} style={{ flex: "none", background: "#25D366", color: "#fff", fontSize: 10.5, fontWeight: 800, minWidth: 17, height: 17, borderRadius: 999, display: "grid", placeItems: "center", padding: "0 5px" }}>{c.unread > 99 ? "99+" : c.unread}</span>
                      )}
                    </button>
                  ))}
                  {cards.length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "2px 2px" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hover && <CardTooltip c={hover.c} x={hover.x} y={hover.y} />}
      {sel && <ThreadDrawer backendUrl={backendUrl} accessToken={accessToken} item={sel} onClose={() => setSel(null)} onChanged={load} stages={stages} />}
    </div>
  );
}

// Tooltip rico al pasar el mouse: todo el detalle del lead sin saturar la tarjeta.
function CardTooltip({ c, x, y }: { c: CrmItem; x: number; y: number }) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(x + 12, vw - 296);
  const top = Math.min(Math.max(8, y), vh - 300);
  const row = (label: string, val: React.ReactNode) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11.5, margin: "3px 0" }}>
      <span style={{ color: "var(--text-muted)", flex: "none" }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</span>
    </div>
  );
  const demo = c.demo_used ? "usado ✓" : (c.last_demo_link_at ? "enviado (sin usar)" : "no enviado");
  return (
    <div style={{ position: "fixed", left, top, width: 284, zIndex: 800, background: "var(--bg-surface)", border: "1px solid var(--border-strong, var(--border))", borderRadius: 12, boxShadow: "var(--sh-3, 0 14px 36px -10px rgba(0,0,0,.35))", padding: "12px 14px", pointerEvents: "none" }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)" }}>{c.lead_name || "(sin nombre)"}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 9 }}>+{c.phone}</div>
      {row("Email", c.contact_email || "—")}
      {row("Área", c.area_practica || "—")}
      {row("Etapa", STAGE_LABEL[c.stage] || c.stage)}
      {row("Calificado", c.qualified ? "sí" : "no")}
      {row("Mensajes con Camila", c.messages ?? 0)}
      {row("Sin leer", c.unread ?? 0)}
      {row("Demo", demo)}
      {row("Último contacto", fmtWhen(c.last_agent_at) || "—")}
      {c.next_action_at ? row("Seguimiento", fmtWhen(c.next_action_at)) : null}
      {row("IA", c.ai_enabled ? "activa" : "pausada (humano)")}
      {c.needs_human ? <div style={{ marginTop: 6, fontSize: 11, color: "var(--danger,#DC2626)", fontWeight: 700 }}>⚠ Requiere atención humana</div> : null}
      <div style={{ marginTop: 9, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 10.5, color: "var(--text-muted)", fontStyle: "italic" }}>Clic para abrir la conversación</div>
    </div>
  );
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

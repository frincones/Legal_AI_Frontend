/* Admin → Crecimiento → Instagram (equipo de marketing).
   Gestiona la cola de contenido que el servicio autónomo `ig_service` (Railway) va publicando en @juroviapp.
   Solo administra la cola (no publica). Fuente: /api/admin/ig/* (solo admin). */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type IgQueueItem, type IgSettings } from "./data";

const TYPES = ["reel", "carousel", "image", "story"] as const;
const TRACKS = ["", "hot-take", "educativo", "demo", "podcast"];

function statusMeta(s: string): { bg: string; c: string; label: string } {
  if (s === "published") return { bg: "var(--success-soft)", c: "var(--success)", label: "Publicado" };
  if (s === "scheduled") return { bg: "var(--primary-soft)", c: "var(--primary)", label: "Programado" };
  if (s === "publishing") return { bg: "var(--warning-soft)", c: "var(--warning)", label: "Publicando…" };
  if (s === "failed") return { bg: "rgba(220,38,38,.12)", c: "var(--danger, #DC2626)", label: "Falló" };
  return { bg: "var(--bg-elevated-2)", c: "var(--text-secondary)", label: "En cola" };
}

export function InstagramTab({ backendUrl, accessToken, pushToast }: {
  backendUrl: string; accessToken: string; pushToast: (t: string, k?: string) => void;
}) {
  const [items, setItems] = useState<IgQueueItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [showCfg, setShowCfg] = useState(false);
  const [cfg, setCfg] = useState<IgSettings | null>(null);

  // form
  const [mtype, setMtype] = useState<string>("reel");
  const [urls, setUrls] = useState("");
  const [caption, setCaption] = useState("");
  const [track, setTrack] = useState("");
  const [reusable, setReusable] = useState(false);
  const [priority, setPriority] = useState(100);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.adminIgQueue(backendUrl, accessToken, filter || undefined).then((d) => {
      setItems(d.items); setCounts(d.counts); setLoading(false);
    });
  }, [backendUrl, accessToken, filter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.adminIgSettings(backendUrl, accessToken).then(setCfg); }, [backendUrl, accessToken]);

  async function add() {
    const media_urls = urls.split(/[\n,]/).map((u) => u.trim()).filter(Boolean);
    if (!media_urls.length) { pushToast("Pega al menos una URL pública del media", "error"); return; }
    if (mtype === "carousel" && media_urls.length < 2) { pushToast("Carrusel: 2 a 10 URLs", "error"); return; }
    setBusy(true);
    const r = await api.adminIgAdd(backendUrl, accessToken, { media_type: mtype, media_urls, caption, track: track || null, reusable, priority });
    setBusy(false);
    if (r.ok) { pushToast("Pieza agregada a la cola ✅", "success"); setUrls(""); setCaption(""); setShowAdd(false); load(); }
    else pushToast("No se pudo agregar (revisa el media_type/URLs)", "error");
  }

  async function del(id: string) {
    if (!window.confirm("¿Eliminar esta pieza de la cola?")) return;
    await api.adminIgDelete(backendUrl, accessToken, id); load();
  }
  async function requeue(id: string) {
    await api.adminIgEdit(backendUrl, accessToken, id, { status: "ready", scheduled_at: null }); load();
  }
  async function saveCfg() {
    if (!cfg) return;
    const r = await api.adminIgSetSettings(backendUrl, accessToken, {
      posts_per_day_min: cfg.posts_per_day_min, window_start_hour: cfg.window_start_hour,
      window_end_hour: cfg.window_end_hour, min_gap_minutes: cfg.min_gap_minutes,
      reuse_cooldown_days: cfg.reuse_cooldown_days, max_per_day: cfg.max_per_day, enabled: cfg.enabled,
    });
    if (r.ok) pushToast("Config guardada ✅", "success");
  }

  const fdate = (s: string | null) => (s ? new Date(s).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
  const field: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bg-base)", fontSize: 13.5, color: "var(--text)", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Instagram · @juroviapp</div>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>cola de auto-publicación · el servicio la drena solo</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd((v) => !v)}><Icon name="plus" size={15} />Nueva pieza</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowCfg((v) => !v)}><Icon name="sliders" size={15} />Config</button>
        <button className="btn btn-secondary btn-sm" onClick={load}><Icon name="refresh" size={15} />Actualizar</button>
      </div>

      {/* Estado del servicio + contadores */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {cfg && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: cfg.enabled ? "var(--success-soft)" : "rgba(220,38,38,.12)", color: cfg.enabled ? "var(--success)" : "var(--danger, #DC2626)" }}>
            {cfg.enabled ? "● Servicio activo" : "○ Servicio pausado"} · {cfg.posts_per_day_min}+/día · {cfg.window_start_hour}–{cfg.window_end_hour}h
          </span>
        )}
        {["ready", "scheduled", "published", "failed"].map((s) => (
          <span key={s} onClick={() => setFilter(filter === s ? "" : s)} style={{ cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 999, background: filter === s ? "var(--primary)" : "var(--bg-elevated-2)", color: filter === s ? "#fff" : "var(--text-secondary)" }}>
            {statusMeta(s).label}: <strong>{counts[s] || 0}</strong>
          </span>
        ))}
      </div>

      {/* Alta de pieza */}
      {showAdd && (
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select style={{ ...field, flex: "0 0 130px" }} value={mtype} onChange={(e) => setMtype(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={{ ...field, flex: "0 0 150px" }} value={track} onChange={(e) => setTrack(e.target.value)}>
              {TRACKS.map((t) => <option key={t} value={t}>{t || "track (opcional)"}</option>)}
            </select>
            <input style={{ ...field, flex: "0 0 110px" }} type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} title="prioridad (menor = antes)" />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={reusable} onChange={(e) => setReusable(e.target.checked)} />evergreen
            </label>
          </div>
          <textarea style={{ ...field, minHeight: 52, fontFamily: "var(--font-mono)", fontSize: 12.5 }} placeholder="URL(s) pública(s) del media en Supabase (una por línea; carrusel = 2 a 10)" value={urls} onChange={(e) => setUrls(e.target.value)} />
          <textarea style={{ ...field, minHeight: 60 }} placeholder="Caption (con hashtags)" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={add}>{busy ? "Agregando…" : "Agregar a la cola"}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Config del servicio */}
      {showCfg && cfg && (
        <div className="card" style={{ padding: 18, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          {([["posts_per_day_min", "Mín/día"], ["window_start_hour", "Desde (h)"], ["window_end_hour", "Hasta (h)"], ["min_gap_minutes", "Gap (min)"], ["max_per_day", "Máx/día"], ["reuse_cooldown_days", "Cooldown (d)"]] as const).map(([k, lbl]) => (
            <label key={k} style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>{lbl}
              <input style={{ ...field, width: 90 }} type="number" value={(cfg as unknown as Record<string, number>)[k]} onChange={(e) => setCfg({ ...cfg, [k]: Number(e.target.value) })} />
            </label>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />Servicio activo
          </label>
          <button className="btn btn-primary btn-sm" onClick={saveCfg}>Guardar config</button>
        </div>
      )}

      {/* Tabla de la cola */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 860 }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated-2)", textAlign: "left" }}>
                {["Formato", "Caption", "Estado", "Programado / Publicado", "Métricas", "Veces", ""].map((h) => (
                  <th key={h} style={{ padding: "9px 12px", fontWeight: 650, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
              {!loading && items.map((it) => {
                const m = statusMeta(it.status);
                const ins = it.insights || {};
                return (
                  <tr key={it.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                      <a href={it.media_urls?.[0]} target="_blank" rel="noopener" style={{ color: "var(--primary)", fontWeight: 600 }}>{it.media_type}</a>
                      {it.media_urls?.length > 1 && <span style={{ color: "var(--text-muted)" }}> ×{it.media_urls.length}</span>}
                    </td>
                    <td style={{ padding: "9px 12px", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={it.caption || ""}>{it.caption || "—"}</td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: m.bg, color: m.c }}>{m.label}</span>
                      {it.error && <span title={it.error} style={{ marginLeft: 6, cursor: "help" }}>⚠️</span>}
                    </td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{fdate(it.published_at || it.scheduled_at)}</td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                      {it.status === "published" ? `👁${ins.reach ?? "–"} · ❤${ins.likes ?? "–"} · 🔖${ins.saved ?? "–"}` : "—"}
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "center" }}>{it.times_posted}</td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                      {(it.status === "failed" || it.status === "published") && it.reusable && (
                        <button className="btn btn-ghost btn-sm" title="Volver a la cola" onClick={() => requeue(it.id)}><Icon name="refresh" size={14} /></button>
                      )}
                      {it.status === "failed" && !it.reusable && (
                        <button className="btn btn-ghost btn-sm" title="Reintentar" onClick={() => requeue(it.id)}><Icon name="refresh" size={14} /></button>
                      )}
                      <button className="btn btn-ghost btn-sm" title="Eliminar" onClick={() => del(it.id)}><Icon name="x" size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {!loading && items.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>La cola está vacía. Agrega piezas con “Nueva pieza”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
        El media debe estar en una URL pública (bucket Supabase <code>ugc/ig/</code>). El servicio publica solo:
        planifica horarios aleatorios cada día en la ventana, alterna formatos y respeta el tope diario. Esta pantalla no publica.
      </p>
    </div>
  );
}

"use client";

/**
 * Audiencias — subir/pegar una grabación de audiencia (video/audio o link de YouTube/Vimeo/Cícero/
 * Videoteca de la Rama) → Jurovia la transcribe (efímero) → documento RAG + Acta Inteligente.
 *
 * Todo es ADITIVO y AISLADO: el modal y el tracker son autocontenidos (gestionan su propio ciclo de
 * vida: encolar → polling → sonido + chips). No tocan el runner del agente ni el flujo del composer.
 * Si algo falla, degradan suave (fail-open) y no rompen el chat.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./icons";
import { api, type AudienciaJob } from "./mission/data";

const chipStyle: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: "var(--r-pill)",
  border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text)", fontSize: 12.5, fontWeight: 550, cursor: "pointer",
};

const MAX_HOURS = 15;

function fmtDur(min?: number | null): string {
  if (!min || min <= 0) return "";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

// Un chime corto y agradable (dos notas) por WebAudio — sin depender de ningún asset.
function playChime() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = now + i * 0.14;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* silencio: el sonido es un extra, nunca crítico */
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Modal de carga: link o archivo, pre-chequeo de duración, encolar.
 * ────────────────────────────────────────────────────────────────────────── */
export function AudienciaModal({
  backendUrl,
  accessToken,
  matterId,
  sessionId,
  onClose,
  onQueued,
}: {
  backendUrl: string;
  accessToken: string;
  matterId?: string;
  sessionId?: string;
  onClose: () => void;
  onQueued: (job: { id: string; title: string; durationMin?: number; matterId?: string }) => void;
}) {
  const [tab, setTab] = useState<"link" | "file">("link");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileDurMin, setFileDurMin] = useState<number | null>(null);
  const [numero, setNumero] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [overPlan, setOverPlan] = useState<{ used: number; plan: number; aud: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFile(f: File | null) {
    setErr(null);
    setOverPlan(null);
    setFile(f);
    setFileDurMin(null);
    if (!f) return;
    // Pre-chequeo de duración en el navegador (sin subir nada todavía).
    try {
      const isAudio = /^audio\//.test(f.type) || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name);
      const el = document.createElement(isAudio ? "audio" : "video");
      el.preload = "metadata";
      const objUrl = URL.createObjectURL(f);
      el.src = objUrl;
      await new Promise<void>((resolve) => {
        el.onloadedmetadata = () => resolve();
        el.onerror = () => resolve();
        setTimeout(resolve, 4000);
      });
      const dur = isFinite(el.duration) && el.duration > 0 ? el.duration / 60 : null;
      URL.revokeObjectURL(objUrl);
      if (dur) setFileDurMin(Math.round(dur * 10) / 10);
    } catch {
      /* si no se puede medir, el worker recalcula la duración real */
    }
  }

  async function submit(confirmOverage = false) {
    setErr(null);
    setBusy(true);
    try {
      let body: import("./mission/data").AudienciaBody;
      if (tab === "link") {
        const u = url.trim();
        if (!u) { setErr("Pega el enlace de la audiencia."); setBusy(false); return; }
        body = { source: "url", url: u, matter_id: matterId, session_id: sessionId, numero_proceso: numero.trim() || undefined, confirm_overage: confirmOverage };
      } else {
        if (!file) { setErr("Elige un archivo de video o audio."); setBusy(false); return; }
        if (fileDurMin && fileDurMin > MAX_HOURS * 60) { setErr(`La grabación supera el tope de ${MAX_HOURS}h.`); setBusy(false); return; }
        // Sube el archivo al bucket temporal (directo, por URL firmada) y encola por storage_path.
        const up = await api.audienciaUpload(backendUrl, accessToken, file);
        if (!up.storage_path) { setErr("No se pudo subir el archivo. Intenta de nuevo."); setBusy(false); return; }
        body = { source: "upload", storage_path: up.storage_path, matter_id: matterId, session_id: sessionId, duration_min: fileDurMin || undefined, title: file.name.replace(/\.[^.]+$/, ""), numero_proceso: numero.trim() || undefined, confirm_overage: confirmOverage };
      }
      const res: AudienciaJob = await api.crearAudiencia(backendUrl, accessToken, body);
      if (res.over_plan) {
        setOverPlan({ used: res.used_hours || 0, plan: res.plan_hours || 0, aud: res.audiencia_hours || 0 });
        setBusy(false);
        return;
      }
      if (!res.ok || !res.job_id) { setErr("No se pudo iniciar el análisis. Revisa el enlace o el archivo."); setBusy(false); return; }
      onQueued({ id: res.job_id, title: res.title || "Audiencia", durationMin: res.duration_min ?? undefined, matterId });
    } catch {
      setErr("Ocurrió un error. Intenta de nuevo.");
      setBusy(false);
    }
  }

  const durLabel = tab === "file" ? fmtDur(fileDurMin) : "";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(13,19,32,0.55)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: "min(520px,100%)", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-4, 0 24px 60px -12px rgba(13,19,32,0.45))", overflow: "hidden" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: "var(--aurora)", color: "#fff", flexShrink: 0 }}>
            <Icon name="play" size={19} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 650, fontSize: 15.5, color: "var(--text)" }}>Analizar audiencia</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>La transcribo y genero el acta con minutos exactos</div>
          </div>
          <button onClick={onClose} className="btn-ghost focus-ring" style={{ border: "none", width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {overPlan ? (
          /* Confirmación de sobreuso del plan */
          <div style={{ padding: "22px 20px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
              <Icon name="alert" size={18} style={{ color: "var(--warning)", marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                Esta audiencia (<b>{overPlan.aud}h</b>) supera las horas incluidas de tu plan
                (usaste <b>{overPlan.used}h</b> de <b>{overPlan.plan}h</b> este mes). Se cobrará el excedente a <b>$2/h</b>.
                ¿Deseas continuar?
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} className="btn btn-ghost" disabled={busy}>Cancelar</button>
              <button onClick={() => submit(true)} className="btn btn-primary" disabled={busy}>
                {busy ? <Icon name="refresh" size={15} style={{ animation: "spin 1s linear infinite" }} /> : null} Continuar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "18px 20px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, background: "var(--bg-elevated-2)", padding: 4, borderRadius: 12, marginBottom: 16 }}>
              {(["link", "file"] as const).map((k) => (
                <button key={k} onClick={() => { setTab(k); setErr(null); setOverPlan(null); }} className="focus-ring"
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                    background: tab === k ? "var(--bg-surface)" : "transparent", color: tab === k ? "var(--text)" : "var(--text-muted)",
                    boxShadow: tab === k ? "var(--sh-1, 0 1px 3px rgba(0,0,0,.08))" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Icon name={k === "link" ? "link" : "upload"} size={15} /> {k === "link" ? "Pegar enlace" : "Subir archivo"}
                </button>
              ))}
            </div>

            {tab === "link" ? (
              <div>
                <input value={url} onChange={(e) => setUrl(e.target.value)} autoFocus
                  placeholder="https://www.youtube.com/watch?v=…  ·  Vimeo · Videoteca Rama Judicial"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid var(--border-strong)", background: "var(--bg-surface)", color: "var(--text)", fontSize: 14, outline: "none" }} />
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                  Enlaces públicos de YouTube, Vimeo o la Videoteca/Cícero de la Rama Judicial.
                </div>
              </div>
            ) : (
              <div>
                <input ref={fileRef} type="file" accept="video/*,audio/*,.mp4,.mov,.mkv,.webm,.avi,.mp3,.m4a,.wav,.ogg,.aac,.flac" onChange={(e) => pickFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                <button onClick={() => fileRef.current?.click()} className="focus-ring"
                  style={{ width: "100%", padding: "20px 16px", borderRadius: 12, border: "1.5px dashed var(--border-strong)", background: "var(--bg-elevated)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Icon name={file ? "fileText" : "upload"} size={22} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{file ? file.name : "Elegir video o audio"}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{file ? (durLabel || "Duración se medirá al procesar") : "MP4, MOV, MKV, MP3, M4A…"}</span>
                </button>
              </div>
            )}

            {/* Número de proceso (opcional) */}
            <input value={numero} onChange={(e) => setNumero(e.target.value)}
              placeholder="N.º de radicado / proceso (opcional)"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text)", fontSize: 13.5, outline: "none", marginTop: 12 }} />

            {durLabel && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12.5, color: "var(--text-secondary)" }}>
                <Icon name="clock" size={14} style={{ color: "var(--primary)" }} /> Duración ≈ {durLabel}
              </div>
            )}

            {err && <div style={{ marginTop: 12, fontSize: 13, color: "var(--danger, #DC2626)", display: "flex", alignItems: "center", gap: 7 }}><Icon name="alert" size={15} /> {err}</div>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button onClick={onClose} className="btn btn-ghost" disabled={busy}>Cancelar</button>
              <button onClick={() => submit(false)} className="btn btn-primary" disabled={busy || (tab === "link" ? !url.trim() : !file)}>
                {busy ? <><Icon name="refresh" size={15} style={{ animation: "spin 1s linear infinite" }} /> Iniciando…</> : <><Icon name="sparkles" size={15} /> Analizar</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tracker: tarjeta flotante que sondea el progreso; al terminar suena + chips.
 * ────────────────────────────────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  pending: "En cola…",
  claimed: "Preparando…",
  downloading: "Descargando la grabación…",
  transcribing: "Transcribiendo con IA…",
  analyzing: "Generando el acta…",
  done: "Listo",
  error: "No se pudo procesar",
};

export function AudienciaTracker({
  backendUrl,
  accessToken,
  jobId,
  title,
  onQuickSend,
  onOpenActa,
  onClose,
}: {
  backendUrl: string;
  accessToken: string;
  jobId: string;
  title: string;
  onQuickSend?: (text: string, docIds?: string[]) => void;
  onOpenActa?: (sessionId: string) => void;   // "Ver el acta" idempotente: reabre la conversación del acta ya generada
  onClose: () => void;
}) {
  const [job, setJob] = useState<AudienciaJob | null>(null);
  const [busy, setBusy] = useState(false);          // deshabilita "Ver el acta" on-demand tras el clic (anti-duplicado)
  const [nowMs, setNowMs] = useState(Date.now());   // ticker para ETA/elapsed en vivo
  const doneRef = useRef(false);
  const docId = job?.transcript_document_id || undefined;
  const status = job?.status || "pending";
  const pct = Math.max(3, Math.min(100, job?.progress_pct || (status === "pending" ? 3 : 5)));
  // ETA client-side: elapsed × (100−%)/% (heurística honesta, etiqueta "≈"). Cero columnas nuevas.
  const startMs = job?.created_at ? new Date(job.created_at).getTime() : null;
  const elapsedS = startMs ? Math.max(0, (nowMs - startMs) / 1000) : 0;
  const etaS = (pct > 5 && pct < 99 && elapsedS > 8) ? Math.round((elapsedS * (100 - pct)) / pct) : null;
  const etaLabel = etaS == null ? null : etaS >= 60 ? `≈ ${Math.round(etaS / 60)} min` : `≈ ${etaS}s`;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function tick() {
      if (!alive) return;
      const j = await api.audienciaEstado(backendUrl, accessToken, jobId);
      if (!alive) return;
      if (j && (j.id || j.status)) setJob(j);
      if (j?.status === "done" && !doneRef.current) {
        doneRef.current = true;
        playChime();
      }
      if (j?.status === "done" || j?.status === "error") return; // deja de sondear
      timer = setTimeout(tick, 4000);
    }
    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [backendUrl, accessToken, jobId]);

  const isDone = status === "done";
  const isErr = status === "error";

  // Ticker de 1s para que el ETA/elapsed avance suave (se detiene al terminar).
  useEffect(() => {
    if (isDone || isErr) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isDone, isErr]);

  function chip(text: string, docs?: string[]) {
    onQuickSend?.(text, docs);
  }

  const CHIPS: { label: string; icon: string; prompt: string }[] = [
    { label: "Ver el acta", icon: "sparkles", prompt: "Genera el Acta Inteligente completa de la audiencia que acabo de subir, con la metodología completa: datos, participantes, línea de tiempo con minutos, decisiones del juez, términos con fechas calculadas, verificación de fuentes y análisis estratégico." },
    { label: "Momentos clave", icon: "clock", prompt: "Dame los momentos clave de la audiencia con su minuto exacto [mm:ss]: intervenciones, pruebas, objeciones y decisiones." },
    { label: "Crear recordatorios", icon: "calendarClock", prompt: "Identifica todos los términos y plazos que ordenó el juez en la audiencia, calcula sus fechas y créame los recordatorios." },
    { label: "¿Qué recurso conviene?", icon: "gavel", prompt: "Con base en lo ocurrido en la audiencia, analiza qué recurso o actuación conviene interponer y redáctalo." },
  ];

  return (
    <div className="fade-up" style={{ position: "fixed", left: 22, bottom: 22, zIndex: 210, width: "min(380px, calc(100vw - 44px))", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "0 18px 46px -12px rgba(13,19,32,0.42)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0,
          background: isDone ? "var(--success-soft, rgba(16,185,129,.14))" : isErr ? "var(--danger-soft, rgba(220,38,38,.12))" : "var(--aurora)",
          color: isDone ? "var(--success)" : isErr ? "var(--danger, #DC2626)" : "#fff" }}>
          <Icon name={isDone ? "check" : isErr ? "alert" : "play"} size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 620, fontSize: 13.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          <div style={{ fontSize: 12, color: isErr ? "var(--danger, #DC2626)" : "var(--text-muted)" }}>{STATUS_LABEL[status] || status}{job?.duration_min ? ` · ${fmtDur(job.duration_min)}` : ""}</div>
        </div>
        <button onClick={onClose} className="btn-ghost focus-ring" title="Cerrar" style={{ border: "none", width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", flexShrink: 0 }}>
          <Icon name="x" size={15} />
        </button>
      </div>

      {!isDone && !isErr && (
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ height: 4, background: "var(--bg-elevated-2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--aurora)", borderRadius: 3, transition: "width .5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            <span>{pct}%</span>
            {etaLabel && <span>{etaLabel} restantes</span>}
          </div>
          {(status === "analyzing" || status === "transcribing") && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.45 }}>
              Puedes cerrar y seguir trabajando — te avisamos en la <b>Bandeja</b> cuando esté lista.
            </div>
          )}
        </div>
      )}

      {isDone && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
            Transcripción lista y adjunta al caso. ¿Qué hacemos?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {/* "Ver el acta" IDEMPOTENTE: si el worker ya la generó, REABRE la conversación (no regenera). */}
            {(onOpenActa && job?.acta_session_id) ? (
              <button onClick={() => { onOpenActa(job.acta_session_id as string); onClose(); }} className="focus-ring" style={chipStyle}>
                <Icon name="sparkles" size={13} style={{ color: "var(--primary)" }} /> Ver el acta
              </button>
            ) : onQuickSend ? (
              <button disabled={busy} onClick={() => { if (busy) return; setBusy(true); chip(CHIPS[0].prompt, docId ? [docId] : undefined); onClose(); }}
                className="focus-ring" style={{ ...chipStyle, opacity: busy ? 0.6 : 1, cursor: busy ? "default" : "pointer" }}>
                <Icon name="sparkles" size={13} style={{ color: "var(--primary)" }} /> {busy ? "Generando…" : "Ver el acta"}
              </button>
            ) : null}
            {/* Resto de acciones (siempre disparan al agente en vivo). */}
            {onQuickSend && CHIPS.slice(1).map((c) => (
              <button key={c.label} onClick={() => { chip(c.prompt, docId ? [docId] : undefined); onClose(); }} className="focus-ring" style={chipStyle}>
                <Icon name={c.icon} size={13} style={{ color: "var(--primary)" }} /> {c.label}
              </button>
            ))}
            {!onQuickSend && !onOpenActa && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Abre la misión y pregúntale al agente sobre la audiencia.</div>
            )}
          </div>
        </div>
      )}

      {isErr && (
        <div style={{ padding: "0 14px 14px", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {/* Muestra el mensaje del backend si es accionable (p.ej. YouTube anti-bot → sube el archivo). */}
          {job?.error && /bot|verificaci|archivo|login|p.blico|oficial/i.test(job.error)
            ? job.error
            : "No se pudo procesar la grabación. Verifica que el enlace sea público, o descarga el video y súbelo como archivo."}
        </div>
      )}
    </div>
  );
}

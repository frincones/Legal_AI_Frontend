"use client";
/* Player VSL estilo VTurb: sin controles nativos, autoplay silenciado + tap para sonido, barra de progreso
   NO arrastrable, bloqueo TOTAL de seek (adelantar/retroceder), velocidad fija 1x, PiP/descarga/menú
   bloqueados. Emite eventos (vsl_play/unmute/progress/pitch/complete/seek_blocked) y actualiza secRef con
   el segundo actual. Fail-open: si el video falla al cargar, dispara onError (el muro se revela igual). */
import { useEffect, useRef, useState } from "react";
import { JV_AURORA } from "../juridica/atoms";

type Ev = (name: string, props?: Record<string, unknown>) => void;

export function VSLPlayer({ src, poster, pitchSeconds, onPitch, onError, onEvent, lock = true, maxHeightVh = 62, secRef, autoPlay = true, preload = "auto" }: {
  src: string; poster?: string; pitchSeconds?: number; onPitch?: () => void; onError?: () => void; onEvent?: Ev; lock?: boolean;
  maxHeightVh?: number; secRef?: React.MutableRefObject<number>; autoPlay?: boolean; preload?: "auto" | "metadata" | "none";
}) {
  const vRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [pct, setPct] = useState(0);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [toast, setToast] = useState(false);
  const allowed = useRef(0);            // segundo máximo alcanzado por reproducción NATURAL
  const lastBucket = useRef(-1);
  const pitchFired = useRef(false);
  const startedRef = useRef(false);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const v = vRef.current; if (!v) return;
    v.muted = true;
    if (autoPlay) v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));   // autoplay muted; si el navegador lo bloquea → overlay play
    else setPlaying(false);
  }, [src, autoPlay]);

  const fmt = (s: number) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  function blocked() {
    setToast(true); onEvent?.("vsl_seek_blocked", {});
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(false), 1400);
  }

  function handleTime() {
    const v = vRef.current; if (!v) return;
    const t = v.currentTime;
    if (t > allowed.current) allowed.current = t;         // avance natural
    setCur(t); if (secRef) secRef.current = t;
    const d = v.duration || 0; if (d && d !== dur) setDur(d);
    setPct(d ? Math.min(100, (t / d) * 100) : 0);
    const b = Math.floor(t / 5) * 5;                      // curva de retención: bucket de 5s
    if (b !== lastBucket.current) { lastBucket.current = b; onEvent?.("vsl_progress", { sec: b, pct: d ? Math.round((t / d) * 100) : 0 }); }
    if (pitchSeconds != null && !pitchFired.current && t >= pitchSeconds) { pitchFired.current = true; onEvent?.("vsl_pitch", { sec: Math.round(t) }); onPitch?.(); }
  }
  function handleSeeking() {
    if (!lock) return;
    const v = vRef.current; if (!v) return;
    if (Math.abs(v.currentTime - allowed.current) > 0.4) { v.currentTime = allowed.current; blocked(); }
  }
  function firstPlay() { if (!startedRef.current) { startedRef.current = true; onEvent?.("vsl_play", {}); } }
  function tapPlay() {
    const v = vRef.current; if (!v) return;
    // Si terminó (autoplay lo llevó al final), permite volver a reproducir desde 0 sin que el seek-lock lo bloquee.
    if (v.ended || (v.duration && v.currentTime >= v.duration - 0.3)) { allowed.current = 0; try { v.currentTime = 0; } catch { /* noop */ } }
    v.muted = false; setMuted(false);   // gesto del usuario → reproduce CON sonido
    v.play().then(() => setPlaying(true)).catch(() => { v.muted = true; setMuted(true); v.play().then(() => setPlaying(true)).catch(() => {}); });
    firstPlay();
  }
  function toggleMute() { const v = vRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); if (!v.muted) { onEvent?.("vsl_unmute", {}); if (v.paused) tapPlay(); } }

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: JV_AURORA, aspectRatio: "9 / 16", maxHeight: `${maxHeightVh}vh`, margin: "0 auto", maxWidth: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
      onContextMenu={(e) => e.preventDefault()}>
      <style>{`
        @keyframes vslBlink{50%{opacity:.3}}
        @keyframes vslPulse{0%,100%{transform:scale(1);box-shadow:0 14px 44px rgba(0,0,0,.5),0 0 0 0 rgba(255,255,255,.45)}50%{transform:scale(1.06);box-shadow:0 14px 44px rgba(0,0,0,.5),0 0 0 18px rgba(255,255,255,0)}}
        .vsl-pulse{animation:vslPulse 2s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.vsl-pulse{animation:none}}
      `}</style>
      <video
        ref={vRef} src={src} poster={poster} playsInline muted preload={preload} disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        onPlay={() => { setPlaying(true); firstPlay(); }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={handleTime}
        onSeeking={handleSeeking}
        onLoadedMetadata={(e) => setDur((e.currentTarget.duration) || 0)}
        onRateChange={(e) => { if (e.currentTarget.playbackRate !== 1) e.currentTarget.playbackRate = 1; }}
        onEnded={() => { setPlaying(false); onEvent?.("vsl_complete", {}); }}
        onError={() => onError?.()}
        style={{ position: "absolute", inset: 2, width: "calc(100% - 4px)", height: "calc(100% - 4px)", objectFit: "cover", borderRadius: 14, background: "#0b0a14" }}
      />
      {playing && <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 800, color: "#fff", background: "rgba(255,61,127,.9)", padding: "4px 9px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 5, zIndex: 4 }}><i style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "vslBlink 1s infinite" }} /> EN VIVO</span>}

      {/* estado de play PROMINENTE (clave: el autoplay lo bloquea el navegador in-app de FB → forzamos el tap) */}
      {!playing && (
        <button onClick={tapPlay} aria-label="Ver video" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "linear-gradient(180deg, rgba(8,6,18,.14) 0%, rgba(8,6,18,.52) 100%)", border: "none", cursor: "pointer", zIndex: 5, padding: 20 }}>
          <span className="vsl-pulse" style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,.97)", display: "grid", placeItems: "center", boxShadow: "0 14px 44px rgba(0,0,0,.5)" }}>
            <span style={{ width: 0, height: 0, borderLeft: "27px solid #14121c", borderTop: "17px solid transparent", borderBottom: "17px solid transparent", marginLeft: 7 }} />
          </span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16.5, textShadow: "0 2px 10px rgba(0,0,0,.7)" }}>▶ Ver video</span>
          <span style={{ color: "rgba(255,255,255,.9)", fontWeight: 600, fontSize: 12.5, textShadow: "0 1px 8px rgba(0,0,0,.7)" }}>Toca para reproducir con sonido</span>
        </button>
      )}

      {/* pill activar sonido */}
      {playing && muted && (
        <button onClick={toggleMute} style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 999, cursor: "pointer", border: "none", backdropFilter: "blur(4px)", zIndex: 6 }}>🔊 Toca para activar sonido</button>
      )}
      {playing && !muted && (
        <button onClick={toggleMute} aria-label="Silenciar" style={{ position: "absolute", bottom: 16, right: 12, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 14, padding: "6px 9px", borderRadius: 999, cursor: "pointer", border: "none", zIndex: 6 }}>🔊</button>
      )}

      {/* timer */}
      {playing && <span style={{ position: "absolute", bottom: 16, left: 14, fontSize: 11, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 1px 3px rgba(0,0,0,.6)", zIndex: 6 }}>{fmt(cur)} / {fmt(dur)}</span>}

      {/* barra de progreso NO arrastrable */}
      <div
        onClick={lock ? blocked : undefined}
        onMouseDown={lock ? (e) => { e.preventDefault(); blocked(); } : undefined}
        onTouchStart={lock ? (e) => { e.preventDefault(); blocked(); } : undefined}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(255,255,255,.18)", cursor: lock ? "not-allowed" : "default", zIndex: 6, touchAction: "none" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: JV_AURORA, transition: "width .12s linear" }} />
        {lock && <span style={{ position: "absolute", right: 8, bottom: 9, fontSize: 10, color: "#fff", opacity: .7 }}>🔒</span>}
      </div>

      {/* toast bloqueo */}
      {toast && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(10,10,15,.92)", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "10px 16px", borderRadius: 12, zIndex: 40 }}>🔒 No puedes adelantar el video</div>}
    </div>
  );
}

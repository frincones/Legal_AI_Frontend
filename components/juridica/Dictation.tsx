/* Dictado por voz (estilo ChatGPT): graba con MediaRecorder, muestra waveform en vivo (Web Audio
   AnalyserNode) + timer, y al confirmar envía el audio a /api/transcribe (Groq Whisper) → texto.
   El texto se precarga en el composer; el usuario decide si lo envía. No persiste el audio. */
"use client";
import { useCallback, useRef, useState } from "react";

const BARS = 28;

export function useDictation(backendUrl?: string, accessToken?: string) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));

  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null; ctxRef.current = null;
    setLevels(Array(BARS).fill(0));
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      cancelledRef.current = false;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      setRecording(true); setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      // Waveform reactivo al volumen del micrófono.
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx(); ctxRef.current = ctx;
      const analyser = ctx.createAnalyser(); analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.7;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        setLevels(Array.from({ length: BARS }, (_, i) => Math.min(1, (buf[Math.floor((i * buf.length) / BARS)] || 0) / 170)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      return true;
    } catch {
      cleanup(); setRecording(false);
      return false;
    }
  }, [cleanup]);

  // Detiene, transcribe y devuelve el texto (o null).
  const stop = useCallback(async (): Promise<string | null> => {
    const mr = mrRef.current;
    if (!mr) return null;
    return new Promise<string | null>((resolve) => {
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        cleanup(); setRecording(false);
        if (cancelledRef.current || blob.size < 1200 || !backendUrl || !accessToken) { resolve(null); return; }
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, "audio.webm");
          const r = await fetch(`${backendUrl}/api/transcribe`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: fd });
          const j = r.ok ? await r.json() : null;
          resolve(j?.text ? String(j.text).trim() : null);
        } catch {
          resolve(null);
        } finally {
          setTranscribing(false);
        }
      };
      try { mr.stop(); } catch { resolve(null); }
    });
  }, [backendUrl, accessToken, cleanup]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") { try { mr.stop(); } catch { /* noop */ } }
    cleanup(); setRecording(false);
  }, [cleanup]);

  return { recording, transcribing, seconds, levels, start, stop, cancel };
}

/* Tracker first-party (F1) — captura el comportamiento del visitante en la landing + guest y lo
   envía en lotes a /api/track (Supabase). Sin proveedor externo. Liviano: listeners passive,
   scroll throttled, batch con sendBeacon (sobrevive al cierre). NO captura valores de inputs (PII). */

import { captureAttribution, getAttribution } from "./attribution";

type Ev = { type: string; name?: string; props?: Record<string, unknown>; url?: string; t?: number };

let backend = "";
let sid = "";
let ctx: Record<string, unknown> = {};
let queue: Ev[] = [];
let started = false;
let startedAt = 0;
let maxScroll = 0;
const scrollHits = new Set<number>();
let scrollTimer: ReturnType<typeof setTimeout> | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getSid(): string {
  try {
    let s = localStorage.getItem("jurovia_sid");
    if (!s) {
      s = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      localStorage.setItem("jurovia_sid", s);
    }
    return s;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function buildCtx(): Record<string, unknown> {
  const utm: Record<string, string> = {};
  try {
    const p = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
      const v = p.get(k); if (v) utm[k] = v.slice(0, 80);
    });
  } catch { /* noop */ }
  return {
    referrer: document.referrer || null,
    utm: Object.keys(utm).length ? utm : null,
    attrib: getAttribution(),   // atribución durable (first+last touch) para "Hyros-lite"
    url: window.location.pathname,
    device: {
      w: window.innerWidth, h: window.innerHeight,
      lang: navigator.language, ua: navigator.userAgent.slice(0, 200),
      tz: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; } })(),
    },
  };
}

function flush(beacon = false) {
  if (!queue.length || !backend) return;
  const batch = queue; queue = [];
  const payload = JSON.stringify({ session_id: sid, ctx, events: batch });
  try {
    if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(`${backend}/api/track`, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(`${backend}/api/track`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true,
      }).catch(() => { /* fail-open */ });
    }
  } catch { /* fail-open */ }
}

function enqueue(e: Ev) {
  if (!started) return;
  queue.push({ ...e, url: e.url || window.location.pathname, t: Date.now() });
  if (queue.length >= 20) flush();
}

/** Evento con nombre (embudo): guest_message_sent, waitlist_opened, waitlist_submitted, … */
export function track(name: string, props?: Record<string, unknown>) {
  enqueue({ type: "named", name, props });
}

/** El MISMO session_id anónimo que usa analytics (localStorage 'jurovia_sid'). Lo usa el chat
    invitado para que su conversación se cruce con la sesión del panel. Lo crea si aún no existe. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  return sid || getSid();
}

export function initTracker(backendUrl: string) {
  if (started || typeof window === "undefined") return;
  started = true;
  backend = backendUrl;
  sid = getSid();
  captureAttribution();   // persiste first/last touch antes de armar el ctx
  ctx = buildCtx();
  startedAt = Date.now();
  enqueue({ type: "pageview", name: "pageview" });

  // Clicks (cualquier elemento; prioriza el a/button/[data-track] más cercano).
  document.addEventListener("click", (ev) => {
    const tgt = ev.target as HTMLElement | null;
    if (!tgt || !tgt.closest) return;
    const el = (tgt.closest("a,button,[role=button],[data-track]") as HTMLElement | null) || tgt;
    const cls = typeof el.className === "string" ? el.className.slice(0, 80) : undefined;
    enqueue({
      type: "click",
      name: el.getAttribute?.("data-track") || undefined,
      props: {
        tag: el.tagName ? el.tagName.toLowerCase() : undefined,
        id: el.id || undefined,
        cls,
        text: (el.textContent || "").trim().slice(0, 60) || undefined,
        href: (el as HTMLAnchorElement).href || undefined,
        x: (ev as MouseEvent).clientX, y: (ev as MouseEvent).clientY,
      },
    });
  }, { capture: true, passive: true });

  // Scroll depth (hitos 25/50/75/100, throttled).
  window.addEventListener("scroll", () => {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      const h = document.documentElement;
      const total = h.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const depth = Math.min(100, Math.max(0, Math.round((h.scrollTop / total) * 100)));
      if (depth > maxScroll) maxScroll = depth;
      [25, 50, 75, 100].forEach((m) => {
        if (depth >= m && !scrollHits.has(m)) { scrollHits.add(m); enqueue({ type: "scroll", name: `scroll_${m}`, props: { depth: m } }); }
      });
    }, 400);
  }, { passive: true });

  // Formularios (sin valores): foco en campo + submit.
  document.addEventListener("focusin", (ev) => {
    const el = ev.target as HTMLInputElement | null;
    if (!el || !/^(input|textarea|select)$/i.test(el.tagName)) return;
    enqueue({ type: "form", name: "field_focus", props: { field: el.name || el.placeholder?.slice(0, 40) || el.id || undefined, ftype: el.type } });
  }, { capture: true, passive: true });
  document.addEventListener("submit", (ev) => {
    const f = ev.target as HTMLFormElement | null;
    enqueue({ type: "form", name: "form_submit", props: { id: f?.id || undefined } });
  }, { capture: true, passive: true });

  // Engagement: al ocultar/cerrar la pestaña, registra tiempo + scroll máximo y vacía la cola.
  const onLeave = () => {
    enqueue({ type: "engagement", name: "leave", props: { seconds: Math.round((Date.now() - startedAt) / 1000), max_scroll: maxScroll } });
    flush(true);
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") onLeave(); });
  window.addEventListener("pagehide", onLeave);

  flushTimer = setInterval(() => flush(), 5000);
}

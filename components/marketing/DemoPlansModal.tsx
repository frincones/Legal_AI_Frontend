"use client";
/* Muro FUSIONADO en UNA página (mobile-first): hero objeción → prueba social animada → value-stack →
   planes (Pro anclado, precio en COP + anclaje) → bloque correo+tarjeta inline (gated) → garantía → FAQ.
   El sticky baja a la tarjeta. Tracking granular (scroll interno, paddle_*, email_started, data-track).
   AISLADO: reusa instant-access, billingCheckout(trial), StartTrial, consent, y los 6 eventos del embudo.
   El agente no se toca. Fail-open en todo. */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon, Logo } from "../juridica/icons";
import { api, type PlanCat } from "../juridica/mission/data";
import { loadPaddle, PLAN_COPY, JV_AURORA } from "../juridica/atoms";
import { VSLPlayer } from "./VSLPlayer";
import { createClient } from "@/lib/supabase/client";
import { track, getSessionId } from "@/lib/tracker";
import { metaEvent, fbCookies, metaViewOnce } from "@/lib/analytics";
import { CONSENT_VERSION } from "../company";

type PaddleNS = { Environment?: { set: (e: string) => void }; Initialize?: (o: unknown) => void; Checkout?: { open: (o: unknown) => void } };

const field: React.CSSProperties = {
  width: "100%", padding: "14px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)",
  background: "var(--bg-base)", fontSize: 16, color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none",
};
const GOLD = "#D4AF37";
// ─── Urgencia real + compra directa (F2). Flags reversibles; editar la fecha para renovar la cohorte. ───
const SHOW_URGENCY = true;                              // cuenta regresiva del precio fundador
const SHOW_BUYNOW = true;                               // "Actívalo ya" (compra directa) en el modo trial
const FOUNDER_DEADLINE = "2026-08-31T23:59:59-05:00";  // fecha fija global (COT). Al vencer → se oculta sola.
const FOUNDER_SPOTS = 23;                               // cupos de fundador (real; 0 o menos → no se muestran)
// Códigos de país para el WhatsApp (default Colombia). El backend normaliza a E.164.
const CC_OPTIONS: { code: string; flag: string }[] = [
  { code: "+57", flag: "🇨🇴" }, { code: "+52", flag: "🇲🇽" }, { code: "+51", flag: "🇵🇪" },
  { code: "+593", flag: "🇪🇨" }, { code: "+56", flag: "🇨🇱" }, { code: "+54", flag: "🇦🇷" },
  { code: "+58", flag: "🇻🇪" }, { code: "+591", flag: "🇧🇴" }, { code: "+507", flag: "🇵🇦" },
  { code: "+506", flag: "🇨🇷" }, { code: "+502", flag: "🇬🇹" }, { code: "+1", flag: "🇺🇸" },
  { code: "+34", flag: "🇪🇸" },
];
const ORDER: Record<string, number> = { pro: 0, estandar: 1, firma: 2 };
const HERO_TITLE = ["No te falta tiempo.", "Te falta un copiloto."];
const COST_LINE: Record<string, string> = { pro: "Menos que una hora facturable", firma: "Menos que un término vencido" };
const VALUE_STACK: [string, string][] = [
  ["Verifica cada fuente contra las cortes", "≈ 2 h por caso"],
  ["Redacta escritos en Word con fuentes", "de días a minutos"],
  ["Autopilot que vigila tus procesos", "0 términos perdidos"],
  ["Analiza documentos (PDF, audio, Excel)", "lectura al instante"],
  ["Plantillas listas (tutela, petición, cobro)", "empieza en segundos"],
];
// FAQ del muro — derriba TODAS las objeciones (incl. el precio en pesos y la tarjeta).
const FAQ_MURO: [string, string][] = [
  ["¿Se me cobra algo hoy?", "No. Empiezas gratis: 3 usos por día durante 7 días, sin tarjeta. Solo pagas si decides suscribirte a un plan."],
  ["¿Por qué el precio en pesos?", "Para que veas claro lo que pagas en tu moneda. El cobro lo hace el procesador en USD; el valor en COP es referencial a la tasa del día."],
  ["¿Necesito tarjeta para probar?", "No. La prueba no pide tarjeta: solo la ingresas cuando decidas suscribirte a un plan de pago."],
  ["¿Puedo cancelar cuando quiera?", "Sí. La prueba no tiene compromiso. Y si te suscribes, cancelas en 1 clic desde tu cuenta, cuando quieras."],
  ["¿Es seguro pagar aquí?", "Totalmente. El pago lo procesa Paddle, procesador global certificado (PCI-DSS nivel 1). Jurovia nunca ve ni almacena el número de tu tarjeta."],
  ["¿Sirve de verdad para el derecho colombiano?", "Sí. Verifica contra Corte Constitucional, Corte Suprema, Consejo de Estado y la normativa vigente, y te avisa si una norma fue derogada. Todo con la fuente citada."],
  ["¿Mis datos y los de mis clientes están protegidos?", "Sí. Tus consultas y documentos son privados y cifrados, con aislamiento por despacho. No se comparten ni se usan para entrenar modelos de terceros."],
  ["¿Y si no me convence?", "Sin problema. Empiezas gratis y sin tarjeta; solo pagas si decides suscribirte a un plan."],
  ["¿Es difícil de usar?", "Para nada. Le escribes como en un chat, en lenguaje natural. Nada que instalar y resultados en minutos."],
  ["¿Puedo cambiar de plan después?", "Sí, subes o bajas de plan cuando quieras desde tu cuenta, sin penalidad."],
];
const daily = (m: number | null) => (m != null ? (m / 30).toFixed(2) : "—");
// Precio en COP para MOSTRAR (redondeado a mil) + $/día (redondeado a cien). rate<=0 → null (solo USD).
const copFmt = (usd: number | null | undefined, rate: number) => (usd != null && rate > 0 ? "$" + (Math.round(usd * rate / 1000) * 1000).toLocaleString("es-CO") : null);
const copDay = (usd: number | null | undefined, rate: number) => (usd != null && rate > 0 ? "$" + (Math.round(usd * rate / 30 / 100) * 100).toLocaleString("es-CO") : null);

// Count-up animado. requestAnimationFrame + easeOut cúbico.
function CountUp({ to, prefix = "", suffix = "", dur = 1200 }: { to: number; prefix?: string; suffix?: string; dur?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return <>{prefix}{n.toLocaleString("es-CO")}{suffix}</>;
}

// Cuenta regresiva a una fecha (dd hh mm ss). Tabular para que no "salte".
function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const upd = () => setLeft(Math.max(0, new Date(to).getTime() - Date.now()));
    upd(); const id = setInterval(upd, 1000); return () => clearInterval(id);
  }, [to]);
  const d = Math.floor(left / 86400000), h = Math.floor((left % 86400000) / 3600000),
    m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, color: "#D6336C" }}>{d}d {p(h)}h {p(m)}m {p(s)}s</span>;
}

// Barra de URGENCIA REAL: cuenta regresiva al fin del precio fundador (+ cupos). Se oculta sola al vencer.
// Empieza oculta (expired=true) para no romper la hidratación SSR; el efecto calcula el estado real. Fail-open.
function UrgencyBar() {
  const [expired, setExpired] = useState(true);
  useEffect(() => {
    const upd = () => setExpired(new Date(FOUNDER_DEADLINE).getTime() <= Date.now());
    upd(); const id = setInterval(upd, 1000); return () => clearInterval(id);
  }, []);
  if (!SHOW_URGENCY || expired) return null;
  return (
    <div className="dp-up" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "11px 14px", borderRadius: 13, background: "linear-gradient(120deg,#FFF4F7,#F1ECFD)", border: "1px solid #F3C9DA" }}>
      <span style={{ fontSize: 17 }}>⏳</span>
      <div style={{ flex: 1, lineHeight: 1.3 }}>
        <div style={{ fontSize: 12.5, color: "var(--text)" }}><b>Precio fundador</b> termina en <Countdown to={FOUNDER_DEADLINE} /></div>
        {FOUNDER_SPOTS > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Después sube a precio normal · quedan <b>{FOUNDER_SPOTS}</b> cupos de fundador</div>}
      </div>
    </div>
  );
}

// Métricas reales, centradas, animadas (número en gradiente + fondo tintado + pop + float + hover-glow).
const METRIC_META: { node: (S: { lawyers: number; verifications: number; positive: number }) => React.ReactNode; label: string; grad: string; soft: string; glow: string }[] = [
  { node: (S) => <CountUp prefix="+" to={S.lawyers} />, label: "abogados", grad: "linear-gradient(135deg,#7C3AED,#EC4899)", soft: "linear-gradient(160deg,rgba(124,58,237,.12),rgba(236,72,153,.08))", glow: "rgba(124,58,237,.4)" },
  { node: (S) => <CountUp to={S.verifications} />, label: "fuentes verificadas", grad: "linear-gradient(135deg,#B8860B,#F0C75E)", soft: "linear-gradient(160deg,rgba(212,175,55,.16),rgba(240,199,94,.08))", glow: "rgba(212,175,55,.45)" },
  { node: (S) => <CountUp to={S.positive} suffix="%" />, label: "positivas", grad: "linear-gradient(135deg,#16A34A,#2F6BFF)", soft: "linear-gradient(160deg,rgba(22,163,74,.12),rgba(47,107,255,.08))", glow: "rgba(47,107,255,.4)" },
];
function Metrics({ S, compact = false }: { S: { lawyers: number; verifications: number; positive: number }; compact?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: compact ? 8 : 10, flexWrap: "wrap", marginTop: compact ? 12 : 16 }}>
      {METRIC_META.map((m, i) => (
        <div key={i} className="dp-pop dp-metric" style={{ ["--g" as string]: m.glow, animationDelay: `${120 + i * 130}ms`, flex: compact ? "0 1 auto" : "1 1 96px", minWidth: compact ? 0 : 92, textAlign: "center", padding: compact ? "9px 13px" : "13px 11px", borderRadius: 14, background: m.soft, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: compact ? 18 : 22, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1, background: m.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{m.node(S)}</div>
          <div style={{ fontSize: compact ? 10.5 : 11.5, color: "var(--text-muted)", marginTop: 4, fontWeight: 650 }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// FAQ acordeón animado. Derriba objeciones.
function FaqList({ items, title }: { items: [string, string][]; title?: string }) {
  const [open, setOpen] = useState(-1);
  return (
    <div>
      {title && <div style={{ textAlign: "center", fontSize: 15.5, fontWeight: 800, letterSpacing: "-.01em", marginBottom: 12 }}>{title}</div>}
      {items.map(([q, a], i) => {
        const on = open === i;
        return (
          <div key={i} className="dp-up" style={{ animationDelay: `${i * 35}ms`, borderRadius: 13, border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`, marginBottom: 9, overflow: "hidden", background: on ? "var(--primary-soft)" : "var(--bg-surface)", transition: "border-color .2s, background .2s" }}>
            <button className="dp-faq-q" data-track={`faq_${i}`} onClick={() => setOpen(on ? -1 : i)} style={{ width: "100%", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", padding: "13px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 750, color: "var(--text)", lineHeight: 1.35 }}>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? "var(--primary)" : GOLD, flexShrink: 0 }} />
                {q}
              </span>
              <Icon name="chevronDown" size={17} style={{ color: on ? "var(--primary)" : "var(--text-muted)", transform: on ? "rotate(180deg)" : "none", transition: "transform .25s", flexShrink: 0 }} />
            </button>
            <div style={{ maxHeight: on ? 340 : 0, transition: "max-height .32s cubic-bezier(.22,1,.36,1)" }}>
              <div style={{ padding: "0 14px 14px 31px", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DemoPlansModal({ backendUrl, context, onClose, initialTier, initialEmail, mode = "trial", vslUrlOverride, vslPitchOverride }: {
  backendUrl: string; context?: Record<string, unknown>; onClose: () => void; onFree?: (email?: string) => void;
  initialTier?: string; initialEmail?: string;
  // Opción B: 'trial' = "Activar trial" SIN tarjeta (crea cuenta → 3 turnos/día × 7d → /chat).
  //           'subscribe' = "Suscribirme" → checkout Paddle (compra directa, sin trial).
  mode?: "trial" | "subscribe";
  // Variante audiencias: reemplaza SOLO el video del hero por el de audiencias, dejando el muro igual
  // (planes, trial, Paddle, tracking intactos). Sin override → comportamiento idéntico al de hoy.
  vslUrlOverride?: string; vslPitchOverride?: number;
}) {
  const isSubscribe = mode === "subscribe";
  // Gate propio cuando hay override (para que el pitch/desbloqueo de audiencias no herede el del VSL principal).
  const gateKey = vslUrlOverride ? "jv_vsl_pitch_aud" : "jv_vsl_pitch";
  const [cfg, setCfg] = useState<{ enabled: boolean; environment: string; client_token: string; annual_enabled?: boolean } | null>(null);
  const [cycle, setCycle] = useState<"annual" | "monthly">("monthly");   // default MENSUAL (el usuario elige anual)
  const cycleRef = useRef<"annual" | "monthly">("monthly");
  const [plans, setPlans] = useState<PlanCat[]>([]);
  const [copRate, setCopRate] = useState(0);
  const [stats, setStats] = useState<{ lawyers?: number; verifications?: number; positive_pct?: number }>({});
  const [email, setEmail] = useState(initialEmail ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cc, setCc] = useState("+57");   // código de país del WhatsApp (default Colombia)
  const [consent, setConsent] = useState(false);
  const [loginPlan, setLoginPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selTier, setSelTier] = useState<string | null>(initialTier ?? "pro");
  const [vsl, setVsl] = useState<{ enabled?: boolean; full_url?: string; modal_url?: string; pitch_seconds?: number } | null>(null);
  const [passedPitch, setPassedPitch] = useState<boolean>(() => { try { return localStorage.getItem(gateKey) === "1"; } catch { return false; } });
  const videoSecRef = useRef(0);   // segundo actual del VSL (para "en qué momento convirtió")
  const [accountReady, setAccountReady] = useState(false);   // cuenta creada → se monta Paddle inline
  const [paddleReady, setPaddleReady] = useState(false);     // SDK precargado + Initialize hecho (al montar)
  const [done, setDone] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const initedRef = useRef(false);
  const paddleRef = useRef<PaddleNS | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const tierRef = useRef<string | null>(null);
  const priceRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const emailValRef = useRef("");         // correo más reciente (el eventCallback/ensureAccount lo leen sin stale)
  const prewarmRef = useRef(false);        // el pre-calentado del checkout ya se disparó
  const forceSubRef = useRef(false);       // compra directa (F2): fuerza el flujo subscribe aun en modo trial
  const [boughtDirect, setBoughtDirect] = useState(false);  // solo para copy reactivo (compra directa)
  const scrollHits = useRef<Set<number>>(new Set());
  const emailStarted = useRef(false);
  const router = useRouter();
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const validName = name.trim().length >= 2;
  const validPhone = phone.replace(/\D/g, "").length >= 7;   // móvil válido (código de país aparte)
  // Los 3 datos + consentimiento son obligatorios para avanzar (trial o suscripción).
  const canAdvance = validEmail && validName && validPhone && consent;
  const ordered = [...plans].sort((a, b) => (ORDER[a.tier] ?? 9) - (ORDER[b.tier] ?? 9));
  const sel = plans.find((p) => p.tier === selTier);
  const proPlan = plans.find((p) => p.tier === "pro");
  const showVsl = !!(vsl && vsl.enabled && vsl.full_url);         // hay hero VSL
  const gateActive = showVsl && !passedPitch;                     // planes ocultos hasta el pitch
  // AOV: el toggle anual solo aplica al COMPRAR (subscribe). En trial no hay cobro → siempre mensual.
  const annualOn = isSubscribe && !!cfg?.annual_enabled;
  const effCycle: "annual" | "monthly" = annualOn && cycle === "annual" ? "annual" : "monthly";
  useEffect(() => { cycleRef.current = effCycle; }, [effCycle]);
  const S = { lawyers: stats.lawyers ?? 170, verifications: stats.verifications ?? 893, positive: stats.positive_pct ?? 80 };
  function revealPitch() { setPassedPitch(true); try { localStorage.setItem(gateKey, "1"); } catch { /* noop */ } }

  useEffect(() => {
    metaViewOnce("jv_vc_planes", backendUrl, "planes");
    Promise.all([api.billingConfig(backendUrl, ""), api.plansCatalog(backendUrl, "")])
      .then(([c, p]) => {
        setCfg(c);
        setPlans((p.plans || []).filter((x) => x.tier !== "free" && x.price_usd != null));
        if (typeof p.cop_rate === "number") setCopRate(p.cop_rate);
      })
      .catch(() => { /* fail-open */ });
    api.socialStats(backendUrl).then(setStats).catch(() => { /* usa fallback real */ });
    // fail-open: sin config → muro normal. Con override (audiencias) → reemplaza SOLO el video del hero.
    api.vslConfig(backendUrl).then((c) => setVsl(
      vslUrlOverride ? { ...c, enabled: true, full_url: vslUrlOverride, pitch_seconds: vslPitchOverride ?? c.pitch_seconds } : c
    )).catch(() => setVsl({}));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [backendUrl, onClose, vslUrlOverride, vslPitchOverride]);

  useEffect(() => { emailValRef.current = email; }, [email]);

  // Selección de plan (resalta + eventos del embudo). Solo dispara subscribe_click al CAMBIAR de plan.
  function pickPlan(tier: string, price: number | null) {
    if (tier !== selTier) { track("subscribe_click", { tier, via: "demo", video_sec: Math.round(videoSecRef.current) }); metaEvent("AddToCart", backendUrl, { value: price ?? undefined, currency: "USD" }); }
    setSelTier(tier); priceRef.current = price; setErr(null); setLoginPlan(null);
  }
  function goToCard(focus = false) {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (focus) setTimeout(() => emailRef.current?.focus(), 320);
  }

  const leadIdRef = useRef<string>("");
  async function ensureAccount(): Promise<string | null> {
    const em = (emailValRef.current || email).trim().toLowerCase();
    // Lead (Meta): el correo entra al registrar el trial. Mismo eventID a Pixel + CAPI (dedup).
    if (!leadIdRef.current) { try { leadIdRef.current = crypto.randomUUID(); } catch { leadIdRef.current = String(Date.now()); } }
    await api.waitlistJoin(backendUrl, { email: em, name: name.trim(), phone: (cc + phone).replace(/\s+/g, ""), source: "demo_plans", context: { ...context, sid: getSessionId() }, final: true, consent: true, consent_version: CONSENT_VERSION, lead_event_id: leadIdRef.current });
    const ia = await api.instantAccess(backendUrl, em);
    if (ia?.instant && ia.token_hash) {
      const { data, error } = await createClient().auth.verifyOtp({ token_hash: ia.token_hash, type: "magiclink" });
      if (!error) { track("guest_instant_access", {}); return data.session?.access_token ?? null; }
    }
    return null;
  }

  // Crea la cuenta (instant-access). En 'trial' (Opción B) → NO Paddle: entra directo con 3 turnos/día × 7d.
  // En 'subscribe' → habilita el render de Paddle (compra directa) en el bloque tarjeta.
  async function startTrial() {
    if (busy || accountReady || !selTier) return;
    if (!canAdvance) { setErr("Completa nombre, correo y WhatsApp, y acepta la política para continuar."); return; }
    setErr(null); setBusy(true);
    try {
      const token = await ensureAccount();
      if (!token) { setErr("Ese correo ya tiene una cuenta."); setLoginPlan(selTier); setBusy(false); return; }
      authTokenRef.current = token;
      if (!isSubscribe && !forceSubRef.current) {
        // Trial SIN tarjeta activado: cuenta creada + sesión lista → a la app. StartTrial + Lead a Meta.
        // Lead (Pixel, mismo eventID que la CAPI del waitlistJoin → Meta deduplica) + StartTrial.
        try {
          const w = window as unknown as { fbq?: (...a: unknown[]) => void };
          if (w.fbq && leadIdRef.current) w.fbq("track", "Lead", { content_name: "Prueba Jurovia" }, { eventID: leadIdRef.current });
          metaEvent("StartTrial", backendUrl, {});
        } catch { /* noop */ }
        track("trial_activated", { tier: selTier, via: "demo" });
        setDone(true);
        setTimeout(() => { try { router.push("/chat"); } catch { /* noop */ } }, 900);
        return;
      }
      setAccountReady(true); setBusy(false);
    } catch { setErr("No se pudo continuar. Intenta de nuevo."); prewarmRef.current = false; setBusy(false); }
  }

  // Compra directa (F2): el lead que YA se decidió paga ahora (sin trial). Reusa el flujo subscribe existente
  // vía forceSubRef (marca ANTES de cualquier startTrial, incl. el pre-calentado). Fail-open.
  function activateNow(tier: string, price: number | null) {
    forceSubRef.current = true; setBoughtDirect(true);
    if (tier) pickPlan(tier, price);
    try { track("buy_now_click", { tier, via: "demo", video_sec: Math.round(videoSecRef.current) }); } catch { /* noop */ }
    if (accountReady || busy) { goToCard(); return; }
    if (!canAdvance) { setErr("Completa nombre, correo y WhatsApp, y acepta la política para activar tu plan."); goToCard(true); return; }
    prewarmRef.current = false; startTrial(); goToCard();
  }

  // Sticky: asegura plan → si ya hay cuenta/está cargando baja a la tarjeta; si el correo está listo, arranca; si no, baja y enfoca.
  function onCta() {
    if (!selTier && proPlan) pickPlan("pro", proPlan.price_usd ?? null);
    if (accountReady || busy) { goToCard(); return; }
    if (canAdvance) { prewarmRef.current = false; startTrial(); goToCard(); return; }
    goToCard(true);
  }

  // #1 PRECARGA: carga el SDK de Paddle + Initialize al ABRIR la modal (no al hacer clic) → checkout sin espera.
  useEffect(() => {
    if (!cfg?.enabled || !cfg.client_token || initedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const P = (await loadPaddle()) as PaddleNS;
        if (cancelled || initedRef.current) return;
        try { P.Environment?.set(cfg.environment === "sandbox" ? "sandbox" : "production"); } catch { /* noop */ }
        P.Initialize?.({
          token: cfg.client_token,
          checkout: { settings: { displayMode: "inline", frameTarget: "dp-paddle-frame", frameInitialHeight: 450, frameStyle: "width:100%; min-width:312px; background-color: transparent; border: none;" } },
          eventCallback: (ev: { name?: string }) => {
            const n = ev?.name; const em = (emailValRef.current || "").trim().toLowerCase();
            if (n) track(`paddle_${n.replace(/^checkout\./, "")}`, { tier: tierRef.current, billing_cycle: cycleRef.current });   // tracking granular: TODOS los eventos de Paddle
            if (n === "checkout.loaded") { track("checkout_started", { tier: tierRef.current, billing_cycle: cycleRef.current, via: "demo", email: em, video_sec: Math.round(videoSecRef.current) }); metaEvent("InitiateCheckout", backendUrl, { value: priceRef.current ?? undefined, currency: "USD" }); }
            else if (n === "checkout.completed") {
              completedRef.current = true; setDone(true);
              track("purchase_completed", { tier: tierRef.current, billing_cycle: cycleRef.current, via: "demo", email: em, video_sec: Math.round(videoSecRef.current) });
              // Compra directa (Opción B): el Purchase (Meta) lo dispara el webhook de Paddle con gross>0.
              try { (window as unknown as { Paddle?: { Checkout?: { close?: () => void } } }).Paddle?.Checkout?.close?.(); } catch { /* noop */ }
              setTimeout(() => { try { router.push("/chat"); } catch { /* noop */ } }, 1400);
            }
            else if (n === "checkout.closed") { if (!completedRef.current) track("checkout_abandoned", { tier: tierRef.current, billing_cycle: cycleRef.current, via: "demo", email: em, video_sec: Math.round(videoSecRef.current) }); }
          },
        });
        initedRef.current = true; paddleRef.current = P; setPaddleReady(true);
      } catch { /* fail-open: si Paddle no carga, la modal sigue funcionando */ }
    })();
    return () => { cancelled = true; };
  }, [cfg, backendUrl, router]);

  // #1 PRE-CALENTADO: apenas el correo es válido + hay consentimiento, crea la cuenta en background (debounce)
  // → cuando el usuario mira, el checkout ya está montado. Instant-access solo crea cuentas nuevas.
  useEffect(() => {
    if (!canAdvance || accountReady || busy || loginPlan || prewarmRef.current) return;
    prewarmRef.current = true;
    const t = setTimeout(() => { startTrial(); }, 400);
    return () => clearTimeout(t);
  }, [canAdvance, accountReady, busy, loginPlan]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Abre/renderiza el checkout inline cuando la cuenta está lista (Paddle ya precargado); re-abre al cambiar de plan.
  // Solo en modo 'subscribe' (compra directa). En 'trial' no hay Paddle (se entró directo a la app).
  useEffect(() => {
    if ((!isSubscribe && !forceSubRef.current) || !accountReady || !selTier || !authTokenRef.current || !paddleReady || !paddleRef.current) return;
    let cancelled = false;
    (async () => {
      setCheckoutLoading(true);
      try {
        completedRef.current = false; tierRef.current = selTier;
        const selP = plans.find((p) => p.tier === selTier);
        priceRef.current = (effCycle === "annual" && selP?.annual) ? selP.annual.usd : (selP?.price_usd ?? null);
        const r = await api.billingCheckout(backendUrl, authTokenRef.current!, selTier, fbCookies(), false, effCycle);   // Opción B: compra directa (sin trial), ciclo elegido
        if (!r?.transaction_id) throw new Error("no txn");
        if (cancelled) return;
        const successUrl = (typeof window !== "undefined" ? window.location.origin : "https://juroviapp.com") + "/chat?purchased=1";
        paddleRef.current!.Checkout?.open({ transactionId: r.transaction_id, settings: { theme: "light", locale: "es", showAddDiscounts: false, showAddTaxId: false, allowLogout: false, successUrl } });
      } catch { if (!cancelled) setErr("No se pudo iniciar el pago. Intenta de nuevo."); }
      finally { if (!cancelled) setCheckoutLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [accountReady, selTier, paddleReady, backendUrl, plans, effCycle]);

  // Scroll interno del muro → hitos 25/50/75/100 (el tracker global mide el documento, no este contenedor).
  function onScroll() {
    const el = scrollRef.current; if (!el) return;
    const total = el.scrollHeight - el.clientHeight; if (total <= 0) return;
    const depth = Math.min(100, Math.round((el.scrollTop / total) * 100));
    [25, 50, 75, 100].forEach((m) => { if (depth >= m && !scrollHits.current.has(m)) { scrollHits.current.add(m); track(`modal_scroll_${m}`, { depth: m }); } });
  }

  const guarantee = (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 15px", borderRadius: 12, background: "var(--success-soft)", border: "1px solid var(--success)", color: "var(--success)", fontSize: 13.5, fontWeight: 750, lineHeight: 1.35 }}>
      <Icon name="shieldCheck" size={18} stroke={2.2} style={{ flexShrink: 0 }} /> {(isSubscribe || boughtDirect) ? "Pago cifrado · activa tu plan al instante · cancela cuando quieras" : "Sin tarjeta · pruébalo gratis 7 días · cancela cuando quieras"}
    </div>
  );

  const CSS = `
    @keyframes dpUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:none;} }
    @keyframes dpPop { 0% { opacity:0; transform:scale(.7);} 60% { transform:scale(1.06);} 100% { opacity:1; transform:scale(1);} }
    @keyframes dpGlow { 0%,100% { box-shadow:0 6px 18px -10px rgba(124,58,237,.45);} 50% { box-shadow:0 16px 42px -10px rgba(236,72,153,.55);} }
    @keyframes dpShimmer { 0% { background-position:200% 0;} 100% { background-position:-200% 0;} }
    @keyframes dpFloat { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-3px);} }
    @keyframes dpShake { 0%,74%,100% { transform:translateX(0) rotate(0);} 78% { transform:translateX(-4px) rotate(-.8deg);} 82% { transform:translateX(4px) rotate(.8deg);} 86% { transform:translateX(-3px) rotate(-.5deg);} 90% { transform:translateX(3px) rotate(.5deg);} 94% { transform:translateX(0);} }
    @keyframes dpCtaGlow { 0%,100% { box-shadow:0 8px 22px -8px rgba(124,58,237,.55);} 50% { box-shadow:0 14px 34px -6px rgba(236,72,153,.7);} }
    .dp-cta { animation:dpShake 3.6s ease-in-out infinite, dpCtaGlow 2.4s ease-in-out infinite; }
    .dp-cta:active { transform:scale(.98); }
    @media (prefers-reduced-motion: reduce) { .dp-cta { animation:dpCtaGlow 2.4s ease-in-out infinite; } .dp-metric, .dp-pro-card { animation:none; } }
    .dp-up { animation:dpUp .5s cubic-bezier(.22,1,.36,1) both; }
    .dp-pop { animation:dpPop .55s cubic-bezier(.22,1,.36,1) both; }
    .dp-metric { transition:transform .2s ease, box-shadow .2s ease; animation:dpFloat 4s ease-in-out infinite; box-shadow:0 6px 18px -14px var(--g, rgba(124,58,237,.4)); }
    .dp-metric:hover { transform:translateY(-4px) scale(1.04); box-shadow:0 12px 26px -10px var(--g, rgba(124,58,237,.4)); }
    .dp-pro-card { animation:dpGlow 2.6s ease-in-out infinite; }
    .dp-btn { transition:transform .12s ease, box-shadow .2s ease; } .dp-btn:hover { transform:translateY(-2px); }
    .dp-shimmer { background:linear-gradient(100deg,transparent 25%,rgba(255,255,255,.55) 50%,transparent 75%); background-size:200% 100%; animation:dpShimmer 2.8s linear infinite; pointer-events:none; }
    .dp-faq-q:hover { background:var(--bg-elevated); }
    @keyframes dpSpin { to { transform:rotate(360deg); } }
    .dp-spin { animation:dpSpin .7s linear infinite; }
    .dp-scroll::-webkit-scrollbar { width:8px; } .dp-scroll::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:8px; }
  `;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(10,13,20,0.58)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: "10px 10px calc(10px + env(safe-area-inset-bottom))" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 480, maxWidth: "96vw", height: "min(92dvh, 900px)", maxHeight: "100%", background: "var(--bg-surface)", borderRadius: 22, border: "1px solid var(--border)", boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <style>{CSS}</style>
        <div style={{ height: 4, background: JV_AURORA, flexShrink: 0 }} />

        {/* Header fijo — logo centrado */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0, position: "relative", minHeight: 52 }}>
          <div style={{ position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}><Logo size={26} withText /></div>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} aria-label="Cerrar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", zIndex: 1 }}><Icon name="x" size={19} /></button>
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="dp-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 20px 22px" }}>
          {vsl === null ? (
            <div style={{ padding: "56px 0", display: "flex", justifyContent: "center" }}><span className="dp-spin" style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--primary-soft)", borderTopColor: "var(--primary)", display: "inline-block" }} /></div>
          ) : (<>
          {/* Hero VSL (si está activo) */}
          {showVsl && <div style={{ marginBottom: 16 }}><VSLPlayer src={vsl.full_url!} poster={vsl.full_url!.replace(/\.mp4$/, "_poster.jpg")} pitchSeconds={vsl.pitch_seconds} lock secRef={videoSecRef} onEvent={(n, p) => track(n, p)} onPitch={revealPitch} onError={revealPitch} maxHeightVh={62} /></div>}

          {gateActive ? (
            <div className="dp-up" style={{ textAlign: "center", paddingBottom: 6 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 750, color: "var(--primary)", background: "var(--primary-soft)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px" }}>🔒 Sigue viendo — tus planes se activan en un momento</div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, filter: "blur(6px)", opacity: .5, pointerEvents: "none" }}>
                <div style={{ height: 120, borderRadius: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)" }} />
                <div style={{ height: 78, borderRadius: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)" }} />
              </div>
            </div>
          ) : (<>
          {/* Hero de texto (solo si NO hay VSL) */}
          {!showVsl && (<>
          <h1 className="dp-up" style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.16, letterSpacing: "-.02em", margin: 0, textAlign: "center" }}>
            {HERO_TITLE.map((t, i) => <div key={i}>{t}</div>)}
          </h1>
          <p className="dp-up" style={{ animationDelay: "60ms", fontSize: 14, color: "var(--text-muted)", margin: "9px 0 0", textAlign: "center" }}>El copiloto legal para abogados en Colombia.</p>
          </>)}
          {showVsl && <div className="dp-up unlockbadge" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12.5, fontWeight: 800, color: "var(--success)", marginBottom: 4 }}>✓ ¡Desbloqueado! Elige tu plan · 7 días gratis</div>}

          <Metrics S={S} />

          {/* Value-stack — gradiente + shimmer + filas escalonadas */}
          <div className="dp-up" style={{ animationDelay: "200ms", marginTop: 18, padding: "16px 16px 15px", borderRadius: 18, position: "relative", background: "linear-gradient(150deg, rgba(124,58,237,.10), rgba(236,72,153,.10) 55%, rgba(47,107,255,.08))", border: "1px solid var(--border)", boxShadow: "0 10px 30px -18px rgba(124,58,237,.5)" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 15px", borderRadius: 999, background: JV_AURORA, color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", boxShadow: "0 6px 16px -8px rgba(236,72,153,.6)" }}>
                <span style={{ position: "relative", zIndex: 1 }}>{isSubscribe ? "⚡ Desbloquéalo todo" : "⚡ Todo esto, gratis 7 días"}</span>
                <span className="dp-shimmer" style={{ position: "absolute", inset: 0 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
              {VALUE_STACK.map(([it, save], i) => (
                <div key={i} className="dp-up" style={{ animationDelay: `${260 + i * 70}ms`, display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 7, background: "var(--bg-surface)", border: `1.5px solid ${GOLD}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name="check" size={12} stroke={3} style={{ color: GOLD }} />
                  </span>
                  <span style={{ flex: 1, color: "var(--text)", fontWeight: 600 }}>{it}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--primary)", background: "var(--primary-soft)", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{save}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px dashed var(--border-strong)", marginTop: 13, paddingTop: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13.5, fontWeight: 750 }}>Recupera tu tiempo</span>
              <span style={{ fontSize: 15, fontWeight: 800, background: JV_AURORA, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>≈ +10 h / semana</span>
            </div>
          </div>

          {/* Toggle Mensual / Anual (AOV) — solo al comprar y si hay precios anuales */}
          {annualOn && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 999, padding: 4 }}>
                {(["monthly", "annual"] as const).map((cy) => (
                  <button key={cy} onClick={() => setCycle(cy)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 7, background: cycle === cy ? "var(--bg-surface)" : "transparent", color: cycle === cy ? "var(--text)" : "var(--text-muted)", boxShadow: cycle === cy ? "0 1px 4px -1px rgba(0,0,0,.15)" : "none" }}>
                    {cy === "monthly" ? "Mensual" : "Anual"}
                    {cy === "annual" && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: JV_AURORA, borderRadius: 999, padding: "2px 7px" }}>−20%</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Urgencia real (F2) — cuenta regresiva del precio fundador (ambos modos; se oculta al vencer) */}
          <UrgencyBar />
          {/* Planes — Pro anclado, precio en COP + anclaje */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
            {ordered.map((p, idx) => {
              const c = PLAN_COPY[p.tier] || { icon: "•", tagline: p.blurb, persona: "", usage: [] };
              const pro = p.tier === "pro";
              const on = p.tier === selTier;
              const cop = copFmt(p.price_usd, copRate);
              const cd = copDay(p.price_usd, copRate);
              const reg = p.regular_usd && p.price_usd && p.regular_usd > p.price_usd ? p.regular_usd : null;
              const regCop = copFmt(reg, copRate);
              const cost = COST_LINE[p.tier];
              return (
                <div key={p.tier} onClick={() => pickPlan(p.tier, p.price_usd)} className={`dp-up ${pro ? "dp-pro-card" : ""}`} style={{ animationDelay: `${560 + idx * 80}ms`, borderRadius: 16, padding: pro ? "18px 18px" : "15px 16px", position: "relative", cursor: "pointer", border: pro ? "2px solid transparent" : `1px solid ${on ? "var(--primary)" : "var(--border)"}`, boxShadow: on && !pro ? "0 0 0 3px var(--primary-soft)" : undefined, background: pro ? "linear-gradient(var(--bg-surface),var(--bg-surface)) padding-box, " + JV_AURORA + " border-box" : "var(--bg-surface)" }}>
                  {pro && <span style={{ position: "absolute", top: -11, left: 18, fontSize: 10.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", background: JV_AURORA, color: "#fff", borderRadius: 999, padding: "4px 12px", boxShadow: "0 4px 12px -4px rgba(236,72,153,.6)" }}>🚀 Más popular</span>}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: pro ? 19 : 16, fontWeight: 800 }}>{c.icon} {p.name}</span>
                    {!isSubscribe && <span style={{ fontSize: 13, fontWeight: 800, color: "var(--success)" }}>7 días gratis</span>}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const ann = effCycle === "annual" ? p.annual : null;   // muro de compra + anual
                      if (ann) {
                        const cm = copFmt(ann.month_usd, copRate);
                        return (
                          <>
                            <span style={{ fontSize: pro ? 22 : 17, fontWeight: 800, letterSpacing: "-.02em", color: "var(--text)" }}>{cm || `$${ann.month_usd}`}<span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginLeft: 6 }}>{cm ? "COP/mes" : "USD/mes"} · ≈ ${ann.month_usd} USD</span></span>
                            {p.tier === "firma" && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}> · hasta 5 abogados</span>}
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>antes <s style={{ opacity: .8 }}>{cop || `$${p.price_usd}`}/mes</s> · <span style={{ color: "var(--success)", fontWeight: 800 }}>ahorra {ann.save_pct}%</span> · facturado anual <b style={{ color: "var(--text)" }}>{copFmt(ann.usd, copRate) || `$${ann.usd} USD`}</b> ≈ 2 meses gratis</div>
                          </>
                        );
                      }
                      return (
                        <>
                          {cop
                            ? <span style={{ fontSize: pro ? 22 : 17, fontWeight: 800, letterSpacing: "-.02em", color: "var(--text)" }}>{cop}<span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginLeft: 6 }}>COP/mes · ≈ ${p.price_usd} USD{cd ? ` · ${cd} COP/día` : ""}</span></span>
                            : <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{isSubscribe ? "" : "luego "}<b style={{ color: "var(--text)" }}>${p.price_usd} USD/mes</b> · = ${daily(p.price_usd)}/día</span>}
                          {p.tier === "firma" && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}> · hasta 5 abogados</span>}
                        </>
                      );
                    })()}
                  </div>
                  {reg && effCycle !== "annual" && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Precio normal <s style={{ opacity: .75 }}>{regCop || `$${reg} USD`}</s> · <span style={{ color: GOLD, fontWeight: 800 }}>lanzamiento</span></div>}
                  {cost && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 9, fontSize: 12, fontWeight: 750, color: "var(--primary)", background: "var(--primary-soft)", borderRadius: 8, padding: "5px 9px" }}><Icon name="clock" size={13} /> {cost}</div>}
                  {pro && (
                    <div style={{ margin: "11px 0 4px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {(c.usage.length ? c.usage : [c.tagline]).map((u, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-secondary)" }}>
                          <Icon name="check" size={13} stroke={2.4} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />{u}
                        </div>
                      ))}
                    </div>
                  )}
                  <button data-track={`plan_${p.tier}`} onClick={(e) => { e.stopPropagation(); pickPlan(p.tier, p.price_usd); goToCard(!accountReady); }} className={`${pro ? "btn btn-primary" : "btn btn-secondary"} dp-btn`} style={{ width: "100%", fontWeight: 800, marginTop: 12, height: pro ? 50 : 46 }}>
                    {isSubscribe ? "Suscribirme" : "Activar prueba gratis"} <Icon name="arrowRight" size={17} stroke={2.4} />
                  </button>
                  {/* Compra directa (F2): "Actívalo ya" — solo en modo trial (en subscribe el CTA ya compra) */}
                  {!isSubscribe && SHOW_BUYNOW && (
                    <button data-track={`buynow_${p.tier}`} onClick={(e) => { e.stopPropagation(); activateNow(p.tier, p.price_usd); }}
                      className="dp-btn" style={{ width: "100%", height: 44, marginTop: 9, fontWeight: 800, fontSize: 13.5, cursor: "pointer", color: "#8A6D12", border: `1.5px solid ${GOLD}`, borderRadius: "var(--r-md)", background: "linear-gradient(120deg,#FBF3DF,#FFF7E8)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "var(--font-ui)" }}>
                      ⚡ Actívalo ya · sin esperar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Firma enterprise (>5 abogados) → cierre humano / lead a ventas */}
          <a href="mailto:soporte@juroviapp.com?subject=Despacho%20con%20m%C3%A1s%20de%205%20abogados&body=Hola%2C%20somos%20un%20despacho%20con%20m%C3%A1s%20de%205%20abogados%20y%20queremos%20conocer%20un%20plan%20para%20la%20firma."
            onClick={() => { try { track("enterprise_lead_click", { where: "demo_plans" }); } catch { /* noop */ } }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, padding: "11px 14px", borderRadius: 14, border: "1px dashed var(--border-strong, var(--border))", textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>
            👥 ¿Despacho con +5 abogados? Habla con nosotros <Icon name="arrowRight" size={15} />
          </a>

          {/* Bloque correo + tarjeta FUSIONADO (misma página, gated hasta crear cuenta) */}
          <div ref={cardRef} style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 16, padding: 16, background: "var(--bg-elevated)" }}>
            {done ? (
              <div style={{ textAlign: "center", padding: "22px 6px" }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 750 }}>{(isSubscribe || boughtDirect) ? "¡Suscripción activada!" : "¡Prueba activada!"}</div>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.55 }}>Tu plan <b>{sel?.name}</b> está listo. {(isSubscribe || boughtDirect) ? "Ya puedes seguir usando Jurovia sin límites." : "Entra y empieza a usar Jurovia."}</div>
                <button className="btn btn-primary dp-btn" style={{ marginTop: 18, fontWeight: 700 }} onClick={() => router.push("/chat")}>Entrar a Jurovia</button>
              </div>
            ) : accountReady ? (
              <>
                <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 4 }}>Completa tu suscripción</div>
                {checkoutLoading && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Cargando pago seguro…</div>}
                <div className="dp-paddle-frame" style={{ minHeight: 420 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  <Icon name="lock" size={13} /> Pago cifrado · Paddle · datos protegidos
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--primary)" }}>Plan {sel?.name} · {isSubscribe ? "suscripción mensual" : "prueba gratis de 7 días"}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", margin: "6px 0 3px" }}>{isSubscribe ? "Casi listo — suscríbete" : "Casi listo — activa tu prueba"}</h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px" }}>{isSubscribe ? "Creamos tu cuenta y activas tu plan al instante." : "Creamos tu cuenta al instante y empiezas gratis — 3 usos por día durante 7 días, sin tarjeta."}</p>
                </div>
                <input style={field} type="text" placeholder="Nombre completo" value={name} autoComplete="name"
                  onChange={(e) => { setName(e.target.value); prewarmRef.current = false; if (err) setErr(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && canAdvance) startTrial(); }} />
                <input ref={emailRef} style={{ ...field, marginTop: 10 }} type="email" placeholder="tu@correo.com" value={email} inputMode="email" autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); if (!emailStarted.current && e.target.value.length > 2) { emailStarted.current = true; track("email_started", {}); } if (loginPlan) setLoginPlan(null); prewarmRef.current = false; if (err) setErr(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && canAdvance) startTrial(); }} />
                <div style={{ display: "flex", alignItems: "center", marginTop: 10, borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--bg-base)", overflow: "hidden" }}>
                  <select value={cc} aria-label="Código de país" onChange={(e) => { setCc(e.target.value); prewarmRef.current = false; }}
                    style={{ border: "none", background: "transparent", padding: "14px 6px 14px 12px", fontSize: 15, color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none", cursor: "pointer" }}>
                    {CC_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.flag} {o.code}</option>)}
                  </select>
                  <input inputMode="tel" placeholder="WhatsApp" value={phone} autoComplete="tel-national"
                    onChange={(e) => { setPhone(e.target.value); prewarmRef.current = false; if (err) setErr(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && canAdvance) startTrial(); }}
                    style={{ flex: 1, minWidth: 0, padding: "14px 14px 14px 4px", border: "none", background: "transparent", fontSize: 16, color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none" }} />
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.45, cursor: "pointer", margin: "12px 0 4px" }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, width: 17, height: 17 }} />
                  <span>Acepto los <a href="/terminos" target="_blank" rel="noopener" style={{ color: "var(--primary)" }}>Términos</a> y la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "var(--primary)" }}>Política de Privacidad</a>.</span>
                </label>
                {err && <div style={{ margin: "8px 0 0", padding: "9px 12px", borderRadius: 10, background: "rgba(220,38,38,.1)", color: "var(--danger, #DC2626)", fontSize: 13 }}>{err}</div>}
                {loginPlan ? (
                  <button onClick={() => router.push(`/login?next=upgrade&plan=${loginPlan}&e=${encodeURIComponent(email.trim().toLowerCase())}`)} className="btn btn-primary dp-btn" style={{ width: "100%", marginTop: 14, fontWeight: 800, height: 50 }}>
                    Iniciar sesión para continuar <Icon name="arrowRight" size={16} stroke={2.2} />
                  </button>
                ) : busy ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 16, fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                    <span className="dp-spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--primary-soft)", borderTopColor: "var(--primary)", display: "inline-block" }} /> Activando tu prueba…
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 16, fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4 }}>
                    <Icon name="lock" size={13} style={{ flexShrink: 0 }} /> {isSubscribe ? "Completa nombre, correo y WhatsApp + acepta la política — el pago seguro se activa al instante" : "Completa nombre, correo y WhatsApp + acepta la política — entras gratis al instante, sin tarjeta"}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Garantía + urgencia real (refuerzo cerca del cierre) */}
          <div className="dp-up" style={{ marginTop: 18 }}>{guarantee}</div>
          <UrgencyBar />

          {/* Video corto FIJO, justo antes del FAQ. En la variante audiencias se oculta (un solo video: el de audiencias). */}
          {vsl && vsl.enabled && vsl.modal_url && !vslUrlOverride && <div style={{ marginTop: 22 }}><VSLPlayer src={vsl.modal_url} poster={vsl.modal_url.replace(/\.mp4$/, "_poster.jpg")} lock autoPlay={false} preload="none" onEvent={(n, p) => track(n, { ...p, place: "modal" })} maxHeightVh={56} /></div>}

          {/* FAQ que derriba objeciones */}
          <div style={{ marginTop: 24 }}>
            <FaqList items={FAQ_MURO} title="Resolvemos todas tus dudas" />
          </div>
          <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.5 }}>
            {isSubscribe ? "Pago cifrado procesado por Paddle · cancela cuando quieras" : "Empieza gratis, sin tarjeta · suscríbete solo cuando lo decidas"}
          </p>
          </>)}
          </>)}
        </div>

        {/* Sticky CTA — siempre disponible; baja a la tarjeta (oculto durante el gate del VSL) */}
        {!done && proPlan && !gateActive && (
          <div style={{ flexShrink: 0, padding: "12px 16px calc(14px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", boxShadow: "0 -8px 24px -12px rgba(0,0,0,.25)" }}>
            <button data-track="cta_sticky" onClick={onCta} className="dp-cta" style={{ width: "100%", height: 54, fontSize: 15.5, fontWeight: 800, color: "#fff", border: "none", borderRadius: "var(--r-md)", background: JV_AURORA, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-ui)" }}>
              {isSubscribe ? (accountReady ? "Ir al pago" : `Suscribirme · ${sel?.name || "Pro"}`) : `Activar prueba gratis · ${sel?.name || "Pro"}`} <Icon name="arrowRight" size={18} stroke={2.4} />
            </button>
            {/* Compra directa (F2) — link discreto para quien ya se decidió (solo modo trial) */}
            {!isSubscribe && SHOW_BUYNOW && !accountReady && (
              <div style={{ textAlign: "center", marginTop: 9, fontSize: 12.5, fontWeight: 750 }}>
                <span style={{ color: "var(--text-muted)" }}>¿Ya te decidiste?</span>{" "}
                <a data-track="buynow_sticky" onClick={() => activateNow(selTier || "pro", sel?.price_usd ?? null)} style={{ color: "var(--primary)", textDecoration: "none", cursor: "pointer" }}>Actívalo ahora sin esperar →</a>
              </div>
            )}
            <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", marginTop: 8, fontWeight: 600 }}>
              {isSubscribe ? "Pago cifrado · cancela cuando quieras" : "Sin tarjeta · 3 turnos/día gratis por 7 días"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

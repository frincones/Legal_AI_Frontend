"use client";
/* Landing de Jurovia — nav + hero con composer central + secciones de marketing.
   Fase 2: el composer y los CTAs llevan a /login (registro). El modo invitado (cero fricción)
   se conecta en Fase 3 reemplazando `onTry`. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Logo } from "../juridica/icons";
import {
  TrustBar, CapabilitiesSection, ProblemSection, PillarsSection, HowItWorks, DiffTable, Pricing, FAQ, AppDisclaimer, FinalCTA, Footer, HeroPreview,
  type Plan,
} from "./sections";
import { GuestChat } from "./GuestChat";
import { DemoPlansModal } from "./DemoPlansModal";
import { api } from "../juridica/mission/data";
import { createClient } from "@/lib/supabase/client";
import { initTracker, track } from "@/lib/tracker";

const NAV_LINKS: [string, string][] = [
  ["Producto", "solucion"],
  ["Cómo funciona", "como-funciona"],
  ["Precios", "precios"],
  ["Preguntas", "preguntas"],
];

// Deep-link del ad: /?demo=<key> auto-siembra esta consulta en el chat invitado (turno 0 = demo en vivo).
// La cita debe estar warm en fuente_cache. Aditivo: sin `?demo=`, nada de esto se activa.
const DEMO_SEEDS: Record<string, string> = {
  citas:   "¿Sigue vigente la Ley 2101 de 2021?",                                   // warm (validada)
  norma:   "¿Está vigente el artículo 90 del Código General del Proceso?",          // recalentar antes de usar
  laboral: "¿Sigue vigente el artículo 65 del Código Sustantivo del Trabajo?",      // recalentar antes de usar
  // ── Demos por funcionalidad (para contenido/ads). Interactivas: verificar + documento (turno real).
  //    Guiadas (el flujo real usa carga de archivo dentro de la app): vigilancia + audiencia.
  caso:       "Te comparto un caso: mi cliente Juan Pérez fue despedido sin justa causa; llevaba 3 años con contrato a término indefinido y salario de $2.500.000. Quiero reclamar la indemnización del artículo 64 del Código Sustantivo del Trabajo. Organízame el caso: verifica que esa norma siga vigente con la fuente oficial, dime los riesgos clave y cuál es el siguiente paso.",
  verificar:  "Verifica si la Ley 2101 de 2021 sigue vigente y dime exactamente qué cambió, con la fuente oficial.",
  documento:  "Redáctame un derecho de petición dirigido a Colpensiones para solicitar el reconocimiento de una pensión de vejez, con los fundamentos de derecho.",
  vigilancia: "Si te doy el radicado de un proceso judicial, ¿cómo lo vigilas y me avisas de nuevas actuaciones y de los términos que están por vencer? Explícamelo con un ejemplo concreto.",
  audiencia:  "Si subo la grabación de una audiencia, ¿qué me entregas exactamente? Explícame cómo generas el acta con los compromisos, las decisiones y los términos.",
};

const FALLBACK_PLANS: Plan[] = [
  { tier: "free", name: "Free", active: true, price_usd: 0, credits: 10, trial_days: 7, blurb: "Prueba Jurovia con 10 usos durante 7 días." },
  { tier: "estandar", name: "Estándar", active: false, price_usd: 9, credits: null, trial_days: null, blurb: "Para el abogado independiente." },
  { tier: "pro", name: "Pro", active: false, price_usd: 18, credits: null, trial_days: null, blurb: "Para el abogado que no para." },
  { tier: "firma", name: "Firma", active: false, price_usd: 45, credits: null, trial_days: null, blurb: "Toda tu firma, en sintonía." },
];

// VSL de audiencias (R2, egress $0). Se inyecta al muro vía vslUrlOverride cuando se entra por ?f=audiencias.
const AUD_VSL_URL = (process.env.NEXT_PUBLIC_VSL_AUDIENCIAS_URL || "").trim();

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 76, behavior: "smooth" });
}

/* ---------- Top nav ---------- */
function LandingNav({ authed, onStart, onLogin, onNav, onPanel }: {
  authed: boolean; onStart: () => void; onLogin: () => void; onNav: (id: string) => void; onPanel: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.pageYOffset > 8);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <nav className={`land-nav${scrolled ? " scrolled" : ""}`}>
      <div className="land-container" style={{ display: "flex", alignItems: "center", gap: 18, height: 64 }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}><Logo size={30} withText /></button>
        <div className="land-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 14 }}>
          {NAV_LINKS.map(([l, id]) => <button key={id} className="land-navlink" style={{ border: "none", background: "none", cursor: "pointer" }} onClick={() => onNav(id)}>{l}</button>)}
        </div>
        <span style={{ flex: 1 }} />
        {authed ? (
          <button className="btn btn-primary btn-sm" onClick={onPanel}>Ir al panel<Icon name="arrowRight" size={15} /></button>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm land-hide-mobile" onClick={onLogin}>Iniciar sesión</button>
            <button className="btn btn-primary btn-sm" onClick={onStart}>Empieza gratis</button>
          </>
        )}
        <button className="btn-ghost focus-ring" onClick={() => setMenu(!menu)} style={{ border: "none", width: 38, height: 38, borderRadius: 9, display: "none", placeItems: "center", color: "var(--text-secondary)" }} data-mobile-menu><Icon name="sliders" size={19} /></button>
      </div>
      {menu && (
        <div className="fade-in land-hide-desktop" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)", padding: "10px 18px 16px" }}>
          {NAV_LINKS.map(([l, id]) => <button key={id} onClick={() => { onNav(id); setMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 8px", border: "none", borderBottom: "1px solid var(--border)", background: "none", fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{l}</button>)}
          <button className="btn btn-secondary" style={{ width: "100%", marginTop: 12 }} onClick={() => { (authed ? onPanel : onLogin)(); setMenu(false); }}>{authed ? "Ir al panel" : "Iniciar sesión"}</button>
        </div>
      )}
    </nav>
  );
}

/* ---------- Hero (product-led, framing de software B2B — sin chat público) ---------- */
function Hero({ onCreate, onNav, onBeta, inviteOnly }: {
  onCreate: () => void; onNav: (id: string) => void; onBeta: () => void; inviteOnly: boolean;
}) {
  const createLabel = inviteOnly ? "Únete a la beta" : "Crea el espacio de tu firma";
  return (
    <header style={{ position: "relative", overflow: "hidden" }}>
      <div className="hero-bg" style={{ position: "absolute", inset: 0, background: "var(--grad-mesh)", opacity: 0.9 }} />
      <div className="hero-bg" style={{ position: "absolute", inset: 0, background: "radial-gradient(100% 70% at 50% 0%, transparent 50%, var(--bg-base) 92%)" }} />

      <div className="land-container" style={{ position: "relative", paddingTop: 76, paddingBottom: 64, textAlign: "center" }}>
        {/* ---- Desktop / tablet ---- */}
        <div className="land-hide-mobile">
        <div className="eyebrow" style={{ justifyContent: "center" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={12} style={{ color: "#fff" }} /></span>Software para firmas y abogados de Colombia</div>

        <h1 style={{ fontSize: "clamp(32px, 5.2vw, 54px)", lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.03em", margin: "20px auto 0", maxWidth: 900, textWrap: "balance" }}>
          El software que ayuda a tu firma a <span className="gradient-text">redactar y organizar</span> sus casos.
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", margin: "18px auto 0", maxWidth: 640, lineHeight: 1.55 }}>
          Herramienta de software para profesionales del derecho: genera borradores en Word, organiza tus expedientes y contrasta tus citas con las fuentes oficiales — para que el abogado revise y decida más rápido.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "12px auto 0", maxWidth: 560, lineHeight: 1.5 }}>
          Software para abogados con tarjeta profesional. No es un bufete y no presta asesoría legal.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={onCreate}>{createLabel}<Icon name="arrowRight" size={17} stroke={2.2} /></button>
          <button className="btn btn-secondary btn-lg" onClick={() => onNav("como-funciona")}><Icon name="target" size={16} />Ver cómo funciona</button>
        </div>

        <HeroPreview />
        </div>{/* /desktop */}

        {/* ---- Móvil ---- */}
        <div className="land-hide-desktop" style={{ minHeight: "calc(100svh - 280px)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(28px, 8.5vw, 36px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, textWrap: "balance" }}>
            El software de tu firma para redactar y gestionar casos.
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "14px 0 0", lineHeight: 1.5, maxWidth: 420 }}>
            Genera borradores, verifica tus citas y organiza tus casos. <span className="gradient-text">Tú revisas y decides.</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 30, width: "100%", maxWidth: 360 }}>
            <button className="btn btn-lg cta-beta" style={{ width: "100%" }} onClick={onBeta}>
              {createLabel}<Icon name="arrowRight" size={17} stroke={2.2} />
            </button>
            <button className="btn btn-lg cta-chat" style={{ width: "100%" }} onClick={() => onNav("como-funciona")}>
              <Icon name="target" size={16} />Ver cómo funciona
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "18px 0 0" }}>Software para abogados · sin tarjeta.</p>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero VARIANTE AUDIENCIAS (deep-link ?f=audiencias, solo guest) ----------
   Mismo design system + misma maquinaria de conversión: copy + CTA → muro/trial. El VSL de audiencias NO
   va aquí — vive DENTRO del muro (DemoPlansModal recibe vslUrlOverride) para que sea el mismo muro de hoy
   con el único cambio del video. Aditivo: sin ?f=audiencias, no existe. */
function AudienciasHero({ onCta }: { onCta: () => void }) {
  return (
    <header style={{ position: "relative", overflow: "hidden" }}>
      <div className="hero-bg" style={{ position: "absolute", inset: 0, background: "var(--grad-mesh)", opacity: 0.9 }} />
      <div className="hero-bg" style={{ position: "absolute", inset: 0, background: "radial-gradient(100% 70% at 50% 0%, transparent 50%, var(--bg-base) 92%)" }} />
      <div className="land-container" style={{ position: "relative", paddingTop: 84, paddingBottom: 56, textAlign: "center" }}>
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="play" size={11} style={{ color: "#fff" }} /></span>
          Análisis de audiencias con IA
        </div>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.09, fontWeight: 700, letterSpacing: "-0.03em", margin: "18px auto 0", maxWidth: 860, textWrap: "balance" }}>
          Convierte tus audiencias en un <span className="gradient-text">acta lista para revisar</span>, en minutos.
        </h1>
        <p style={{ fontSize: 17.5, color: "var(--text-secondary)", margin: "16px auto 0", maxWidth: 600, lineHeight: 1.55 }}>
          Sube la grabación o pega el enlace (YouTube, Rama Judicial). Jurovia transcribe, identifica lo decidido y te entrega un acta estructurada — tú revisas y decides.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={onCta}>Probar Análisis de Audiencias<Icon name="arrowRight" size={17} stroke={2.2} /></button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "16px auto 0", maxWidth: 520 }}>
          Software para abogados con tarjeta profesional. No es un bufete y no presta asesoría legal.
        </p>
      </div>
    </header>
  );
}

/* ---------- Landing root ---------- */
export default function Landing({ authed, backendUrl }: { authed: boolean; backendUrl: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [trial, setTrial] = useState<{ daily_turns: number; days: number }>({ daily_turns: 3, days: 7 });
  const [view, setView] = useState<"landing" | "guest">("landing");
  const [seed, setSeed] = useState("");
  const [register, setRegister] = useState<false | string>(false);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [demoKey, setDemoKey] = useState<string | null>(null);                                   // ad deep-link demo
  const [regCtx, setRegCtx] = useState<Record<string, unknown> | undefined>(undefined);          // "qué probó" → waitlist
  const [initialEmail, setInitialEmail] = useState("");        // email traído de la modal de planes
  const [directPlans, setDirectPlans] = useState<{ tier?: string; email?: string } | null>(null);   // deep-link BOFU: ?checkout/?planes → modal de planes directo
  const [audienciasVariant, setAudienciasVariant] = useState(false);   // deep-link ?f=audiencias (guest) → hero variante audiencias

  useEffect(() => {
    if (!backendUrl) return;
    initTracker(backendUrl);  // analytics first-party (autocapture landing + guest)
    fetch(`${backendUrl}/api/plans`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.plans?.length) setPlans(d.plans); if (d?.trial) setTrial({ daily_turns: d.trial.daily_turns ?? 3, days: d.trial.days ?? 7 }); })
      .catch(() => { /* usa fallback */ });
    // Modo invitación: si está activo, los CTA de "empezar" abren la waitlist en vez del registro.
    api.checkAccess(backendUrl, "").then((a) => setInviteOnly(!!a.invite_only)).catch(() => {});
  }, [backendUrl]);

  useEffect(() => { document.body.style.overflow = view === "guest" ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [view]);

  // Ad deep-link: /?demo=<key> (solo invitado) → abre el chat con la consulta de la demo auto-sembrada.
  // Una sola vez. Si no hay `?demo=` válido o hay sesión, no hace nada → comportamiento idéntico al de hoy.
  useEffect(() => {
    if (authed) return;
    try {
      const k = new URLSearchParams(window.location.search).get("demo");
      if (k && DEMO_SEEDS[k]) { setDemoKey(k); setSeed(DEMO_SEEDS[k]); setView("guest"); track("demo_opened", { key: k }); }
    } catch { /* noop */ }
  }, [authed]);

  // Deep-link BOFU: /?checkout=<tier> o /?planes (+ opcional &e=<email>) → abre la modal de planes DIRECTO
  // (salta el demo). Registrados: si ya hay sesión, deja el plan pendiente y entra a la app → UpgradeModal.
  // Una sola vez. Sin params, nada cambia. Aditivo, fail-open.
  const checkoutDoneRef = useRef(false);
  useEffect(() => {
    if (checkoutDoneRef.current) return;
    let tier = "", planes = false, em = "";
    try {
      const q = new URLSearchParams(window.location.search);
      tier = q.get("checkout") || ""; planes = q.has("planes"); em = q.get("e") || "";
    } catch { return; }
    if (!tier && !planes) return;
    checkoutDoneRef.current = true;
    const VALID = ["estandar", "pro", "firma"];
    const validTier = VALID.includes(tier) ? tier : undefined;
    track("checkout_link_opened", { tier: validTier ?? null, via: "ad", has_email: !!em });
    if (authed) {   // ya logueado → entra a la app y abre el upgrade in-app (pieza App.tsx)
      // Con tier → pre-selecciona; sin tier (?planes) → "select" = abre el modal en la selección de planes.
      try { localStorage.setItem("jurovia_pending_upgrade", validTier || "select"); } catch { /* noop */ }
      router.push("/chat"); return;
    }
    setDirectPlans({ tier: validTier, email: em || undefined });
  }, [authed, router]);

  // Deep-link de campaña por correo: /?ask=<pregunta>&e=<email>&t=<firma>. El backend decide el destino:
  //  - guest  → abre el chat invitado con la pregunta sembrada (flujo actual, sin login).
  //  - login  → auto-login (magic-link firmado) y aterriza en su cuenta con la pregunta pendiente.
  // Una sola vez. Sin `?ask=`, no se activa nada → comportamiento idéntico al de hoy. Fail-open.
  const askDoneRef = useRef(false);
  useEffect(() => {
    if (askDoneRef.current) return;
    let ask = "", em = "", sig = "";
    try {
      const q = new URLSearchParams(window.location.search);
      ask = q.get("ask") || ""; em = q.get("e") || ""; sig = q.get("t") || "";
    } catch { return; }
    if (!ask.trim()) return;
    askDoneRef.current = true;
    track("email_ask_opened", { has_email: !!em });
    // Ya con sesión → directo a su cuenta con la pregunta pendiente.
    if (authed) {
      try { localStorage.setItem("jurovia_pending_ask", ask); } catch { /* noop */ }
      router.push("/chat"); return;
    }
    if (!em) { setSeed(ask); setView("guest"); return; }   // sin email firmado → guest con prefill
    (async () => {
      try {
        const r = await api.resolveIdea(backendUrl, { email: em, sig, ask });
        if (r.mode === "login" && r.token_hash) {
          try { localStorage.setItem("jurovia_pending_ask", ask); } catch { /* noop */ }
          const { error } = await createClient().auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
          if (!error) { track("email_ask_login", {}); router.push("/chat"); return; }
        }
      } catch { /* fail-open → guest */ }
      setSeed(ask); setView("guest");   // cualquier otro caso → flujo invitado con la pregunta
    })();
  }, [authed, backendUrl, router]);

  // Deep-link de campaña de AUDIENCIAS: /?f=audiencias. Un solo link, comportamiento por estado de sesión:
  //  - guest    → variante audiencias del hero (VSL de audiencias + muro/planes por CTA). Marca la sesión.
  //  - logueado → entra a la app con la intención pendiente; la app decide paid (abre ▶) vs trial (UpgradeModal).
  // Una sola vez. Sin `?f=audiencias`, no se activa nada → landing idéntica a hoy. Aditivo, fail-open.
  const audDoneRef = useRef(false);
  useEffect(() => {
    if (audDoneRef.current) return;
    let f = "";
    try { f = new URLSearchParams(window.location.search).get("f") || ""; } catch { return; }
    if (f !== "audiencias") return;
    audDoneRef.current = true;
    if (authed) {   // ya logueado → la ramificación paid/trial se hace en App.tsx
      try { localStorage.setItem("jurovia_intent", "audiencias"); } catch { /* noop */ }
      router.push("/chat"); return;
    }
    setAudienciasVariant(true);
    track("audiencias_landing_view", {});   // marca la sesión para segmentar la analítica del VSL
  }, [authed, router]);

  // Deep-link al CASO: /?caso=<JUR-XXXX> → guarda el código y, tras autenticar, la app abre ese expediente
  // (motor de retención Día 1-3). Una sola vez. Sin `?caso=`, nada cambia. Aditivo, fail-open.
  const casoDoneRef = useRef(false);
  useEffect(() => {
    if (casoDoneRef.current) return;
    let caso = "";
    try { caso = new URLSearchParams(window.location.search).get("caso") || ""; } catch { return; }
    if (!caso.trim()) return;
    casoDoneRef.current = true;
    try { localStorage.setItem("jurovia_pending_case", caso.trim()); } catch { /* noop */ }
    track("case_deeplink", {});
    router.push(authed ? "/chat" : "/login");
  }, [authed, router]);

  // Afiliados: captura ?ref=<code> (durable en jurovia_aff, ventana 60 días) + registra el clic, para
  // atribuir la comisión cuando el lead compre. Coexiste con el referido de turnos (jurovia_ref). Fail-open.
  const affDoneRef = useRef(false);
  useEffect(() => {
    if (affDoneRef.current) return;
    let code = ""; let content = "";
    try {
      const sp = new URLSearchParams(window.location.search);
      code = sp.get("ref") || ""; content = (sp.get("c") || "").trim().slice(0, 80);   // ?c=<pieza> → atribución por contenido
    } catch { return; }
    if (!code.trim()) return;
    affDoneRef.current = true;
    let sid: string | undefined;
    try { sid = localStorage.getItem("juridica_guest_id") || undefined; } catch { /* noop */ }
    try { localStorage.setItem("jurovia_aff", JSON.stringify({ code: code.trim(), ts: Date.now(), c: content || undefined })); } catch { /* noop */ }
    try {
      fetch(`${backendUrl}/api/affiliates/click`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), landing: window.location.pathname, content: content || undefined, session_id: sid }), keepalive: true,
      }).catch(() => {});
    } catch { /* noop */ }
  }, [backendUrl]);

  const goLogin = () => router.push("/login");
  const goPanel = () => router.push("/chat");
  // Abre el registro conservando el contexto de "qué probó" (para el waitlist). Los CTAs normales no lo pasan.
  const openRegister = (source: string, context?: Record<string, unknown>) => { setRegCtx(context); setRegister(source); };
  const readGuestId = (): string | undefined => { try { return localStorage.getItem("juridica_guest_id") || undefined; } catch { return undefined; } };
  // En modo invitación abre la waitlist; si no, va al registro normal. `source` alimenta el embudo.
  const startWaitlist = (source: string) => setRegister(source);       // TODOS los CTA → muro de planes (trial 7 días)
  const onStart = () => startWaitlist("register_cta");
  // CTA de la variante audiencias: abre el muro (mismo trial) + deja la intención para retomarla logueado.
  const startAudiencias = () => { try { localStorage.setItem("jurovia_intent", "audiencias"); } catch { /* noop */ } startWaitlist("audiencias"); };
  // Nota: el home ya NO expone un chat público (blindaje para revisión de MoR). El demo en vivo sigue
  // disponible solo por deep-link de campaña: /?demo=<key> y /?ask=<pregunta> (más abajo).

  // Embudo: registra cuándo se abre la waitlist (CTA / límite guest).
  useEffect(() => { if (register) track("waitlist_opened", { source: register }); }, [register]);

  return (
    <>
      <div className="land-root-pad" style={{ minHeight: "100%", background: "var(--bg-base)" }}>
        <LandingNav authed={authed} onStart={audienciasVariant ? startAudiencias : onStart} onLogin={goLogin} onNav={scrollToId} onPanel={goPanel} />
        {audienciasVariant
          ? <AudienciasHero onCta={startAudiencias} />
          : <Hero onCreate={() => startWaitlist("hero")} onNav={scrollToId} onBeta={() => startWaitlist("hero_mobile")} inviteOnly={inviteOnly} />}
        <TrustBar />
        <CapabilitiesSection />
        <ProblemSection />
        <PillarsSection />
        <HowItWorks />
        <DiffTable />
        <Pricing plans={plans} trial={trial} onStart={onStart} />
        <FAQ />
        <AppDisclaimer />
        <FinalCTA onStart={onStart} />
        <Footer onStart={onStart} onNav={scrollToId} />
      </div>

      {/* Sticky CTA móvil — solo landing (no guest), no sobre el modal, oculto en desktop */}
      {!authed && inviteOnly && view === "landing" && !register && (
        <div className="land-hide-desktop land-sticky-cta">
          <button className="btn btn-lg cta-beta" style={{ width: "100%" }} onClick={() => startWaitlist("sticky_mobile")}>
            Únete a la beta<Icon name="arrowRight" size={17} stroke={2.2} />
          </button>
        </div>
      )}

      {view === "guest" && (
        <GuestChat
          seed={seed}
          demoKey={demoKey ?? undefined}
          backendUrl={backendUrl}
          onBack={() => { setView("landing"); setDemoKey(null); }}
          onRegister={(ctx) => openRegister(demoKey ? `demo_${demoKey}` : "guest_limit", ctx?.context)}
        />
      )}
      {register && (
        // Opción B: muro de PRUEBA (trial sin tarjeta) para TODOS los orígenes. Ya no hay waitlist.
        // Variante audiencias: mismo muro, único cambio = el VSL del hero (vslUrlOverride). Sin override = hoy.
        <DemoPlansModal
          backendUrl={backendUrl}
          context={regCtx}
          mode="trial"
          initialEmail={initialEmail}
          vslUrlOverride={register === "audiencias" ? (AUD_VSL_URL || undefined) : undefined}
          onClose={() => { setRegister(false); setRegCtx(undefined); setInitialEmail(""); }}
        />
      )}
      {directPlans && !register && (
        // Deep-link BOFU (?checkout=<tier>): compra directa (suscripción, sin trial).
        <DemoPlansModal
          backendUrl={backendUrl}
          initialTier={directPlans.tier}
          initialEmail={directPlans.email}
          mode="subscribe"
          onClose={() => setDirectPlans(null)}
        />
      )}
    </>
  );
}

"use client";
/* Landing de Juridica — nav + hero con composer central + secciones de marketing.
   Fase 2: el composer y los CTAs llevan a /login (registro). El modo invitado (cero fricción)
   se conecta en Fase 3 reemplazando `onTry`. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Logo } from "../juridica/icons";
import {
  TrustBar, ProblemSection, PillarsSection, HowItWorks, DiffTable, Pricing, FAQ, FinalCTA, Footer,
  type Plan,
} from "./sections";
import { GuestChat, RegisterModal } from "./GuestChat";

const NAV_LINKS: [string, string][] = [
  ["Producto", "solucion"],
  ["Cómo funciona", "como-funciona"],
  ["Precios", "precios"],
  ["Preguntas", "preguntas"],
];

const HERO_CHIPS = [
  "¿Está vigente este artículo?",
  "Resume esta sentencia con su fuente",
  "Requisitos de una acción de tutela",
  "¿Qué jurisprudencia aplica a un despido sin justa causa?",
];

const FALLBACK_PLANS: Plan[] = [
  { tier: "free", name: "Free", active: true, price_usd: 0, credits: 10, trial_days: 7, blurb: "Prueba Juridica con 10 créditos durante 7 días." },
  { tier: "pro", name: "Pro", active: false, price_usd: null, credits: null, trial_days: null, blurb: "Para el abogado independiente." },
  { tier: "team", name: "Equipo / Firma", active: false, price_usd: null, credits: null, trial_days: null, blurb: "Para firmas y equipos." },
];

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

/* ---------- Hero with central composer ---------- */
function Hero({ onTry }: { onTry: (text: string) => void }) {
  const [val, setVal] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [focus, setFocus] = useState(false);
  useEffect(() => { const el = taRef.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; } }, [val]);
  const canSend = val.trim().length > 0;

  return (
    <header style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--grad-mesh)", opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(100% 70% at 50% 0%, transparent 50%, var(--bg-base) 92%)" }} />

      <div className="land-container" style={{ position: "relative", paddingTop: 76, paddingBottom: 64, textAlign: "center" }}>
        <div className="eyebrow" style={{ justifyContent: "center" }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={12} style={{ color: "#fff" }} /></span>Copiloto jurídico verificable</div>

        <h1 style={{ fontSize: "clamp(32px, 5.2vw, 54px)", lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.03em", margin: "20px auto 0", maxWidth: 880, textWrap: "balance" }}>
          Pregúntale al derecho colombiano.<br />Con fuentes que <span className="gradient-text">puedes citar</span>.
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", margin: "18px auto 0", maxWidth: 580, lineHeight: 1.55 }}>
          Escribe tu consulta y recibe una respuesta verificada contra las fuentes oficiales — con el enlace de cada norma. Pruébalo ahora, sin registrarte.
        </p>

        <div style={{ maxWidth: 720, margin: "36px auto 0" }}>
          <div style={{ position: "relative", borderRadius: 26, padding: 1.5, background: focus ? "var(--aurora)" : "var(--border-strong)", transition: "background .2s", boxShadow: focus ? "0 18px 50px -16px rgba(91,77,227,0.45)" : "var(--sh-3)" }}>
            <div style={{ background: "var(--bg-surface)", borderRadius: 24.5, padding: "8px 8px 8px 22px" }}>
              <textarea ref={taRef} value={val} rows={1}
                onChange={(e) => setVal(e.target.value)}
                onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) onTry(val); } }}
                placeholder="Escribe tu consulta jurídica… (ej. ¿Sigue vigente el artículo 64 del CST?)"
                style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 16.5, lineHeight: 1.5, color: "var(--text)", fontFamily: "var(--font-ui)", padding: "14px 0 4px", display: "block", maxHeight: 200 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="shieldCheck" size={14} style={{ color: "var(--gold)" }} />Respuesta con fuentes verificadas</span>
                <span style={{ flex: 1 }} />
                <button title="Dictado por voz" className="btn-ghost focus-ring" style={{ border: "none", width: 42, height: 42, borderRadius: 11, display: "grid", placeItems: "center", color: "var(--text-muted)" }}><Icon name="mic" size={20} /></button>
                <button onClick={() => canSend && onTry(val)} disabled={!canSend} style={{ width: 44, height: 44, borderRadius: 13, border: "none", background: canSend ? "var(--aurora)" : "var(--bg-elevated-2)", color: canSend ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: canSend ? "var(--glow-primary)" : "none", transition: "all .15s" }}><Icon name="arrowUp" size={21} stroke={2.4} /></button>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "14px 0 0" }}>Pruébalo sin registrarte · gratis.</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center", marginTop: 20 }}>
            {HERO_CHIPS.map((c, i) => (
              <button key={i} className="chip" onClick={() => onTry(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Landing root ---------- */
export default function Landing({ authed, backendUrl }: { authed: boolean; backendUrl: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [view, setView] = useState<"landing" | "guest">("landing");
  const [seed, setSeed] = useState("");
  const [register, setRegister] = useState(false);

  useEffect(() => {
    if (!backendUrl) return;
    fetch(`${backendUrl}/api/plans`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.plans?.length) setPlans(d.plans); })
      .catch(() => { /* usa fallback */ });
  }, [backendUrl]);

  useEffect(() => { document.body.style.overflow = view === "guest" ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [view]);

  const goLogin = () => router.push("/login");
  const goPanel = () => router.push("/chat");
  // Cero fricción: escribir en el hero abre el chat de invitado (sin login) con el seed.
  // Si ya hay sesión, va directo al panel.
  const onTry = (text: string) => {
    if (authed) { goPanel(); return; }
    setSeed(text); setView("guest"); window.scrollTo(0, 0);
  };

  return (
    <>
      <div style={{ minHeight: "100%", background: "var(--bg-base)" }}>
        <LandingNav authed={authed} onStart={goLogin} onLogin={goLogin} onNav={scrollToId} onPanel={goPanel} />
        <Hero onTry={onTry} />
        <TrustBar />
        <ProblemSection />
        <PillarsSection />
        <HowItWorks />
        <DiffTable />
        <Pricing plans={plans} onStart={goLogin} />
        <FAQ />
        <FinalCTA onStart={goLogin} />
        <Footer onStart={goLogin} onNav={scrollToId} />
      </div>

      {view === "guest" && <GuestChat seed={seed} backendUrl={backendUrl} onBack={() => setView("landing")} onRegister={() => setRegister(true)} />}
      {register && <RegisterModal onClose={() => setRegister(false)} onGo={goLogin} />}
    </>
  );
}

"use client";
/* Secciones de marketing de la landing. Reusa el design system de components/juridica. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, Logo } from "../juridica/icons";
import { AgentAvatar, VerifiedChip, PLAN_COPY, JV_INCLUDED, JV_AURORA } from "../juridica/atoms";
import type { Citation } from "../juridica/data";
import { COMPANY } from "../company";
import { FAQS } from "../faq";

export type Plan = {
  tier: string; name: string; active: boolean; price_usd: number | null;
  credits: number | null; trial_days: number | null; blurb: string;
};

/* Reveal-on-scroll (IntersectionObserver + fallback) */
export function Reveal({ children, delay = 0, style = {} }: { children: ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("in");
    if (!("IntersectionObserver" in window)) { show(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setTimeout(show, delay); io.unobserve(el); } }), { threshold: 0.12 });
    io.observe(el);
    const fb = setTimeout(show, 1400 + delay);
    return () => { io.disconnect(); clearTimeout(fb); };
  }, [delay]);
  return <div ref={ref} className="reveal" style={style}>{children}</div>;
}

/* ---------- Hero product preview (mockup estático — no es un chat público) ---------- */
export function HeroPreview() {
  return (
    <div style={{ maxWidth: 640, margin: "40px auto 0" }}>
      <div className="mock" style={{ boxShadow: "var(--sh-3)" }}>
        <div className="mock-bar">
          <span className="mock-dot" style={{ background: "#FF5F57" }} />
          <span className="mock-dot" style={{ background: "#FEBC2E" }} />
          <span className="mock-dot" style={{ background: "#28C840" }} />
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Jurovia · redacción con fuentes verificadas</span>
        </div>
        <div style={{ padding: 20, display: "grid", gap: 14, textAlign: "left" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", background: "var(--gold-soft)" }}>
              <Icon name="badgeCheck" size={13} stroke={2.2} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--gold-text)" }}>Fuente verificada</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", color: "var(--text)" }}>
              <Icon name="scale" size={15} style={{ color: "var(--primary)" }} />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>Art. 64 — Código Sustantivo del Trabajo · vigente</span>
              <Icon name="link" size={14} style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="fileText" size={21} style={{ color: "var(--primary)" }} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Borrador · Demanda ejecutiva</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Generado con 3 fuentes contrastadas · el abogado revisa y firma</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="btn btn-primary btn-sm"><Icon name="download" size={14} />Word (.docx)</span>
            <span className="btn btn-secondary btn-sm"><Icon name="download" size={14} />PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Trust bar ---------- */
export function TrustBar() {
  const items: [string, string][] = [
    ["badgeCheck", "Citas contrastadas con su enlace oficial"],
    ["fileText", "Documentos en Word (.docx) editables"],
    ["radar", "Alertas de cambios en leyes y en tus casos"],
    ["lock", "Cifrado · tus datos no entrenan modelos de IA"],
  ];
  return (
    <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
      <div className="land-container" style={{ padding: "22px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", textAlign: "center" }}>
          <span style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text)" }}>Software hecho para firmas de abogados de Colombia.</span>
          <span className="land-hide-mobile" style={{ width: 1, height: 18, background: "var(--border-strong)" }} />
          {items.map(([ic, t], i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)" }}>
              <Icon name={ic} size={15} style={{ color: "var(--gold)" }} />{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Capabilities (overview escaneable) ---------- */
export function CapabilitiesSection() {
  const caps: [string, string, string][] = [
    ["shieldCheck", "Verifica tus fuentes", "Contrasta cada ley y sentencia con el portal oficial — con su enlace, para que tú lo confirmes."],
    ["fileText", "Redacta en Word", "Genera borradores de demandas, tutelas, derechos de petición y contratos, en .docx editable."],
    ["paperclip", "Analiza documentos", "Sube PDF, Word, imágenes o audio y el software los lee y organiza."],
    ["radar", "Alertas de cambios", "Te avisa si una norma que usaste cambió o si hay novedades en tus casos."],
    ["calendarClock", "Calcula plazos y liquidaciones", "Términos procesales y liquidaciones laborales, exactos y reproducibles."],
    ["folder", "Gestiona tus casos", "Cada caso en un expediente: cronología, partes, documentos y avance."],
  ];
  return (
    <section className="land-section anchor">
      <div className="land-container">
        <Reveal style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 52px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="sparkles" size={15} />Todo en un solo lugar</span>
          <h2 className="land-h2">Todo lo que tu firma hace con Jurovia.</h2>
          <p className="land-lead" style={{ margin: "16px auto 0" }}>El software cubre el día a día de la firma — de la investigación al documento editable.</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="prob-grid">
          {caps.map(([ic, t, d], i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="card" style={{ padding: 24, height: "100%" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--grad-aurora-soft)", border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
                  <Icon name={ic} size={22} style={{ color: "var(--primary)" }} />
                </span>
                <div style={{ fontSize: 17, fontWeight: 650, margin: "16px 0 6px", letterSpacing: "-0.01em" }}>{t}</div>
                <div style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Problem ---------- */
export function ProblemSection() {
  const cards = [
    { q: "“Eso ya está derogado.”", t: "Citaste una norma que cambió y no te diste cuenta.", icon: "alert", tone: "var(--danger)", bg: "var(--danger-soft)" },
    { q: "“No me puedo confiar de la IA.”", t: "Te toca validar a mano, en libros, contra reloj.", icon: "book", tone: "var(--warning)", bg: "var(--warning-soft)" },
    { q: "“Se me pasó la notificación.”", t: "Entre lo administrativo, perdiste un cambio de tu caso.", icon: "bell", tone: "var(--primary)", bg: "var(--primary-soft)" },
  ];
  return (
    <section id="problema" className="land-section anchor">
      <div className="land-container">
        <Reveal style={{ maxWidth: 720 }}>
          <span className="eyebrow"><Icon name="alert" size={15} />El problema</span>
          <h2 className="land-h2">Ya usas IA. Pero no para lo que de verdad importa.</h2>
          <p className="land-lead">
            Recolectas información rápido, sí. Pero cuando toca fundamentar, terminas volviendo al libro físico —porque <span className="land-quote">“uno no se debe confiar completamente”</span> y <span className="land-quote">“eso ya puede estar derogado”</span>. Un solo artículo mal citado y tu estrategia queda expuesta: <span className="land-quote">“si no, entras en indefensión”</span>.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 44 }} className="prob-grid">
          {cards.map((c, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="card" style={{ padding: 24, height: "100%" }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: "grid", placeItems: "center" }}><Icon name={c.icon} size={22} style={{ color: c.tone }} /></span>
                <div className="land-quote" style={{ fontSize: 19, fontWeight: 600, margin: "18px 0 8px", color: "var(--text)" }}>{c.q}</div>
                <div style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{c.t}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pillar mockups ---------- */
const CITE_CST64: Citation = {
  label: "Art. 64 CST", status: "vigente", tier: 0,
  title: "Art. 64 — Código Sustantivo del Trabajo",
  source: "SUIN-Juriscol", consulted: "2026-06-14",
  note: "Indemnización por despido sin justa causa. Vigente.", url: "suin-juriscol.gov.co",
};

function MockVerified() {
  return (
    <div className="mock">
      <div className="mock-bar"><span className="mock-dot" style={{ background: "#FF5F57" }} /><span className="mock-dot" style={{ background: "#FEBC2E" }} /><span className="mock-dot" style={{ background: "#28C840" }} /></div>
      <div style={{ padding: 20, display: "flex", gap: 12 }}>
        <AgentAvatar size={28} />
        <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.6 }}>
          <p style={{ margin: "2px 0 10px" }}>El artículo 64 del CST se encuentra <VerifiedChip citation={CITE_CST64} variant="pill" /> y regula la indemnización por despido sin justa causa.</p>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", background: "var(--gold-soft)" }}><Icon name="badgeCheck" size={13} stroke={2.2} style={{ color: "var(--gold)" }} /><span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--gold-text)" }}>Fuente verificada</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", color: "var(--text)" }}>
              <Icon name="scale" size={15} style={{ color: "var(--primary)" }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Art. 64 — Código Sustantivo del Trabajo</span>
              <Icon name="link" size={14} style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function MockVigilancia() {
  const rows: [string, string, string, string, string][] = [
    ["circleCheck", "var(--success)", "var(--success-soft)", "Art. 64 CST sigue vigente", "Re-verificado contra fuente oficial"],
    ["alert", "var(--danger)", "var(--danger-soft)", "Nueva jurisprudencia detectada", "Afecta un caso laboral activo"],
    ["bell", "var(--gold)", "var(--gold-soft)", "Notificación nueva en tu correo", "Juzgado 15 Civil · término en curso"],
  ];
  return (
    <div className="mock">
      <div className="mock-bar"><Icon name="radar" size={15} style={{ color: "var(--primary)" }} /><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Alertas · resumen del día</span></div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 11 }}>
        {rows.map(([ic, color, bg, t, s], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--bg-surface)" }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={ic} size={16} style={{ color }} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{s}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MockWord() {
  return (
    <div className="mock">
      <div className="mock-bar"><span className="mock-dot" style={{ background: "#FF5F57" }} /><span className="mock-dot" style={{ background: "#FEBC2E" }} /><span className="mock-dot" style={{ background: "#28C840" }} /></div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
          <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="fileText" size={21} style={{ color: "var(--primary)" }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Demanda Ejecutiva</span><span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--grad-gold)", boxShadow: "0 0 0 3px var(--gold-soft)" }} /></div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Verificada · 3 fuentes oficiales</div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: "14px 16px", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 10, fontFamily: "var(--font-doc)", fontSize: 12.5, lineHeight: 1.6, color: "#15110B" }}>
          <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>JUZGADO CIVIL DEL CIRCUITO</div>
          {[96, 88, 70].map((w, i) => <div key={i} style={{ height: 4, width: w + "%", background: "var(--border-strong)", borderRadius: 2, margin: "5px 0" }} />)}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-primary btn-sm"><Icon name="download" size={14} />Word (.docx)</button>
          <button className="btn btn-secondary btn-sm"><Icon name="download" size={14} />PDF</button>
        </div>
      </div>
    </div>
  );
}
function MockExpediente() {
  const rows: [string, string, string, string][] = [
    ["gavel", "var(--gold)", "Notificación por estado", "Inicia término de traslado"],
    ["fileText", "var(--text-secondary)", "Demanda ejecutiva v2", "Radicada · verificada"],
    ["paperclip", "var(--text-secondary)", "Pagaré $50.000.000", "Evidencia base"],
  ];
  return (
    <div className="mock">
      <div className="mock-bar"><Icon name="folder" size={15} style={{ color: "#7B3DF5" }} /><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Banco XYZ vs. Pérez · expediente</span></div>
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}><span style={{ color: "var(--text-muted)" }}>Avance del caso</span><strong>72%</strong></div>
        <div style={{ height: 6, background: "var(--bg-elevated-2)", borderRadius: 999, overflow: "hidden", marginBottom: 16 }}><div style={{ height: "100%", width: "72%", background: "var(--aurora)", borderRadius: 999 }} /></div>
        {rows.map(([ic, color, t, s], i, arr) => (
          <div key={i} style={{ display: "flex", gap: 11, position: "relative", paddingBottom: i === arr.length - 1 ? 0 : 16 }}>
            {i < arr.length - 1 && <span style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, background: "var(--border)" }} />}
            <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-surface)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0, zIndex: 1, color }}><Icon name={ic} size={15} /></span>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{s}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pillars ---------- */
export function PillarsSection() {
  const pillars = [
    { id: "producto", eyebrow: "Fundamentación", icon: "shieldCheck", title: "Cada cita, verificada contra la fuente oficial.", body: "Jurovia consulta en vivo los portales oficiales de leyes y jurisprudencia, cita solo lo verificado y te entrega el enlace oficial de cada norma o sentencia para que tú lo confirmes. Lo que no se puede verificar, queda marcado — no se cita en falso.", micro: "Adiós al “libro físico y estar leyendo”.", mock: <MockVerified />, flip: false },
    { id: "vigilancia", eyebrow: "Alertas", icon: "radar", title: "Te avisamos cuando algo cambia.", body: "Jurovia te avisa si una norma que usaste fue derogada o si hay novedades en tus procesos, y puede resumir tu correo al final del día. Tú decides qué hacer con cada aviso.", micro: "El dolor por el que los abogados dijeron que pagarían.", mock: <MockVigilancia />, flip: true },
    { id: "word", eyebrow: "Redacción", icon: "fileText", title: "De una semana a unos minutos — en tu formato.", body: "Genera contestaciones, demandas, derechos de petición y más, en Word (.docx), citando solo lo verificado. Guarda tus plantillas y reutilízalas para que cada escrito salga con tus formatos y tecnicismos.", micro: "Porque tu mejor amigo siempre fue Word. Aquí también.", mock: <MockWord />, flip: false },
    { id: "casos", eyebrow: "Control", icon: "folder", title: "Todo tu caso en un solo lugar.", body: "Cada caso es un expediente con cronología, partes, documentos, calendario y avance. Y para lo repetitivo, Jurovia calcula liquidaciones laborales y plazos/términos de forma exacta y reproducible.", micro: null, mock: <MockExpediente />, flip: true },
  ];
  return (
    <section id="solucion" className="land-section anchor" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="land-container">
        <Reveal style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 64px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="sparkles" size={15} />La solución</span>
          <h2 className="land-h2">Qué hace el software, en detalle.</h2>
          <p className="land-lead" style={{ margin: "16px auto 0" }}>Cada capacidad nace de un dolor real del ejercicio — y la cubre el software, hoy.</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 88 }}>
          {pillars.map((p) => (
            <Reveal key={p.id}>
              <div className={`pillar${p.flip ? " flip" : ""}`}>
                <div className="pillar-text">
                  <span className="eyebrow"><Icon name={p.icon} size={15} />{p.eyebrow}</span>
                  <h3 style={{ fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 660, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "12px 0 0" }}>{p.title}</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.62, color: "var(--text-secondary)", margin: "14px 0 0" }}>{p.body}</p>
                  {p.micro && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "8px 14px", borderRadius: "var(--r-pill)", background: "var(--grad-aurora-soft)", border: "1px solid var(--border)", fontSize: 13.5, fontWeight: 500, color: "var(--text-secondary)" }}><Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />{p.micro}</div>}
                </div>
                <div>{p.mock}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
export function HowItWorks() {
  const steps = [
    { n: "01", icon: "message", t: "Describe tu documento o caso.", d: "Escribe o háblale por voz; adjunta tus documentos." },
    { n: "02", icon: "shieldCheck", t: "Jurovia arma el borrador y contrasta las fuentes.", d: "Consulta los portales oficiales y enlaza cada cita para que tú la confirmes." },
    { n: "03", icon: "download", t: "Revisa, edita y descarga en Word.", d: "El abogado revisa y firma; Jurovia te avisa si algo cambia en tus casos." },
  ];
  return (
    <section id="como-funciona" className="land-section anchor">
      <div className="land-container">
        <Reveal style={{ maxWidth: 680 }}>
          <span className="eyebrow"><Icon name="target" size={15} />Cómo funciona</span>
          <h2 className="land-h2">Del caso al documento, en tres pasos.</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 48 }} className="prob-grid">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="card" style={{ padding: 26, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--aurora)", display: "grid", placeItems: "center", boxShadow: "0 6px 16px -6px rgba(123,61,245,0.5)" }}><Icon name={s.icon} size={22} style={{ color: "#fff" }} /></span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color: "var(--border-strong)" }}>{s.n}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 650, margin: "20px 0 8px" }}>{s.t}</div>
                <div style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Differentiator table ---------- */
export function DiffTable() {
  const rows: [string, boolean | "parcial", boolean][] = [
    ["Redacta un escrito", true, true],
    ["Cita con enlace a la fuente oficial", false, true],
    ["Te avisa si la norma está derogada o cambió", false, true],
    ["Vigila tus casos y notificaciones", false, true],
    ["Entrega en Word (.docx) con tus plantillas", "parcial", true],
    ["Pensado para el derecho colombiano", false, true],
  ];
  const Cell = ({ v }: { v: boolean | "parcial" }) => v === true
    ? <span style={{ display: "inline-grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", background: "var(--success-soft)" }}><Icon name="check" size={15} stroke={2.6} style={{ color: "var(--success)" }} /></span>
    : v === "parcial"
      ? <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>Parcial</span>
      : <span style={{ display: "inline-grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", background: "var(--bg-elevated-2)" }}><Icon name="x" size={14} stroke={2.4} style={{ color: "var(--text-muted)" }} /></span>;
  return (
    <section className="land-section anchor" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="land-container">
        <Reveal style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="gitCompare" size={15} />La diferencia</span>
          <h2 className="land-h2">ChatGPT redacta a ciegas. Jurovia contrasta cada cita con la fuente oficial para que tú la verifiques.</h2>
        </Reveal>
        <Reveal>
          <div className="card" style={{ overflow: "hidden", maxWidth: 860, margin: "0 auto" }}>
            <div className="table-wrap">
            <table className="diff-table" style={{ minWidth: 460 }}>
              <thead>
                <tr>
                  <th style={{ width: "52%" }}></th>
                  <th style={{ textAlign: "center" }}>ChatGPT / Claude</th>
                  <th className="col-jur" style={{ textAlign: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--primary)", fontWeight: 700 }}><Logo size={18} />Jurovia</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r[0]}</td>
                    <td style={{ textAlign: "center" }}><Cell v={r[1]} /></td>
                    <td className="col-jur" style={{ textAlign: "center" }}><Cell v={r[2]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
// Precios EXACTOS — deben coincidir con plans.py y con los objetos de precio de Paddle (checkout).
const PAID_ORDER = ["estandar", "pro", "firma"] as const;
const PRICE_USD: Record<string, number> = { estandar: 9, pro: 18, firma: 45 };
const PLAN_NAME: Record<string, string> = { estandar: "Estándar", pro: "Pro", firma: "Firma" };
const PLAN_DIFF: Record<string, string> = {
  estandar: "Para el abogado independiente · uso diario.",
  pro: "Uso amplio para el día a día · acceso prioritario a modelos y funciones nuevas.",
  firma: "Hasta 5 abogados · plantillas y membrete de la firma.",
};

export function Pricing({ plans, onStart, trial }: { plans: Plan[]; onStart: () => void; trial?: { daily_turns: number; days: number } }) {
  const free = plans.find((p) => p.tier === "free");
  const dailyTurns = trial?.daily_turns ?? 3;
  const freeDays = trial?.days ?? free?.trial_days ?? 7;
  const trialCopy = `${dailyTurns} usos por día durante ${freeDays} días · sin tarjeta.`;
  return (
    <section id="precios" className="land-section anchor">
      <div className="land-container">
        <Reveal style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="sparkles" size={15} />Precios</span>
          <h2 className="land-h2">Planes claros. Sin sorpresas.</h2>
          <p className="land-lead" style={{ margin: "14px auto 0" }}>Empieza gratis y elige un plan cuando lo necesites. Cancela cuando quieras.</p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(232px, 1fr))", gap: 18, maxWidth: 1040, margin: "0 auto", alignItems: "stretch" }}>
          {/* Free */}
          <Reveal>
            <div className="card" style={{ padding: 26, height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 15, fontWeight: 650 }}>Free</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "12px 0 2px" }}><span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>$0</span><span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>USD</span></div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", minHeight: 40 }}>{trialCopy}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
                {["Verificación de fuentes con enlace oficial", "Documentos en Word (.docx)", "Alertas básicas de cambios", "Expedientes y cálculos"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5 }}><Icon name="check" size={15} stroke={2.4} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />{t}</div>
                ))}
              </div>
              <button className="btn btn-secondary btn-lg" style={{ width: "100%", marginTop: "auto" }} onClick={onStart}>Empezar gratis</button>
            </div>
          </Reveal>
          {/* Planes de pago — precio exacto visible */}
          {PAID_ORDER.map((tier, i) => {
            const c = PLAN_COPY[tier];
            const featured = tier === "pro";
            return (
              <Reveal key={tier} delay={(i + 1) * 80}>
                <div className="card" style={{ padding: 26, height: "100%", display: "flex", flexDirection: "column", position: "relative", border: featured ? "2px solid transparent" : undefined, background: featured ? "linear-gradient(var(--bg-surface),var(--bg-surface)) padding-box, " + JV_AURORA + " border-box" : undefined, boxShadow: featured ? "var(--sh-2)" : undefined }}>
                  {featured && <span style={{ position: "absolute", top: -11, left: 22, fontSize: 10.5, fontWeight: 750, letterSpacing: ".04em", textTransform: "uppercase", background: JV_AURORA, color: "#fff", borderRadius: 999, padding: "4px 11px" }}>Más popular</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{c?.icon ?? "•"}</span>
                    <span style={{ fontSize: 15, fontWeight: 650 }}>{PLAN_NAME[tier]}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "12px 0 2px" }}>
                    <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>{`$${PRICE_USD[tier]}`}</span>
                    <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>USD / mes</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--text-secondary)", minHeight: 40 }}>{PLAN_DIFF[tier]}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
                    {JV_INCLUDED.map((f, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5 }}><Icon name="check" size={15} stroke={2.4} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />{f}</div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "auto" }} onClick={onStart}>Crea el espacio de tu firma</button>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Transparencia de precios (requisito de Paddle) */}
        <Reveal style={{ maxWidth: 760, margin: "26px auto 0", textAlign: "center" }}>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.65 }}>
            Precios en dólares estadounidenses (USD) por mes. <strong>Los impuestos aplicables (p. ej. IVA) se calculan y se muestran en el checkout.</strong> El plan Free incluye {dailyTurns} usos por día durante {freeDays} días, sin tarjeta ni cobro; al finalizar puedes elegir un plan de pago. Las suscripciones son mensuales, se renuevan automáticamente y puedes cancelarlas cuando quieras. Pagos procesados por Paddle.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function FAQ() {
  const faqs = FAQS;
  const [open, setOpen] = useState(0);
  return (
    <section id="preguntas" className="land-section anchor" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
      <div className="land-container" style={{ maxWidth: 820 }}>
        <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="message" size={15} />Preguntas frecuentes</span>
          <h2 className="land-h2">Lo que los abogados nos preguntan.</h2>
        </Reveal>
        <Reveal>
          <div>
            {faqs.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="faq-item">
                  <button className="faq-q" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                    <span style={{ flex: 1 }}>{q}</span>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: isOpen ? "var(--primary-soft)" : "var(--bg-elevated-2)", display: "grid", placeItems: "center", flexShrink: 0, transition: "background .15s" }}>
                      <Icon name="chevronDown" size={17} style={{ color: isOpen ? "var(--primary)" : "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                    </span>
                  </button>
                  <div className="faq-a" style={{ maxHeight: isOpen ? 240 : 0, paddingBottom: isOpen ? 20 : 0, transition: "max-height .3s ease, padding .3s ease" }}>
                    <div style={{ paddingRight: 44 }}>{a}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Aviso legal / naturaleza del producto (posicionamiento para AUP de MoR) ---------- */
export function AppDisclaimer() {
  return (
    <section className="land-section anchor" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="land-container" style={{ maxWidth: 860 }}>
        <div className="card" style={{ padding: "20px 24px", display: "flex", gap: 14, alignItems: "flex-start", background: "var(--bg-surface)" }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="shieldCheck" size={19} style={{ color: "var(--primary)" }} />
          </span>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text)" }}>Qué es Jurovia.</strong> Jurovia es una <strong>empresa de software (SaaS)</strong> de productividad para
            profesionales del derecho con tarjeta profesional. <strong style={{ color: "var(--text)" }}>No es un bufete de abogados y no presta asesoría legal</strong>, y su uso{" "}
            <strong style={{ color: "var(--text)" }}>no crea una relación abogado-cliente</strong>. Sus resultados son <strong>borradores</strong> que deben ser revisados
            por un profesional del derecho con tarjeta profesional vigente, quien decide y firma bajo su responsabilidad. La IA puede equivocarse; verifica siempre las fuentes.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA + Footer ---------- */
export function FinalCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="land-section anchor" style={{ paddingBottom: 0 }}>
      <div className="land-container">
        <Reveal>
          <div style={{ position: "relative", borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--aurora)", padding: "64px 40px", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 120% at 50% 0%, rgba(255,255,255,0.22), transparent 70%)" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff", margin: 0, textWrap: "balance" }}>El software que tu firma necesita para redactar con fuentes verificables.</h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.92)", margin: "16px auto 0", maxWidth: 520, lineHeight: 1.5 }}>Pruébalo gratis y agiliza la redacción de tu próximo documento. El abogado revisa, decide y firma.</p>
              <button onClick={onStart} className="btn btn-lg" style={{ marginTop: 28, background: "#fff", color: "var(--primary)", fontWeight: 650, height: 52, padding: "0 28px", boxShadow: "0 12px 30px -8px rgba(13,19,32,0.3)" }}>Crea el espacio de tu firma<Icon name="arrowRight" size={18} stroke={2.2} /></button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ onStart, onNav }: { onStart: () => void; onNav: (id: string) => void }) {
  const cols: [string, [string, string | null][]][] = [
    ["Producto", [["Cómo funciona", "como-funciona"], ["Precios", "precios"], ["Centro de ayuda", "/ayuda"], ["Iniciar sesión", "login"]]],
    ["Legal", [["Términos", "/terminos"], ["Privacidad", "/privacidad"], ["Cancelación", "/cancelacion"]]],
    ["Contacto", [[COMPANY.email, null], ["LinkedIn", null]]],
  ];
  return (
    <footer className="land-footer" style={{ marginTop: 96 }}>
      <div className="land-container" style={{ padding: "56px 28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Logo size={30} withText light />
            </div>
            <p style={{ fontSize: 14, color: "#8A93A6", margin: "14px 0 0", maxWidth: 280, lineHeight: 1.55 }}>Software de redacción y gestión para firmas de abogados de Colombia. No es un bufete ni presta asesoría legal.</p>
          </div>
          {cols.map(([title, links], i) => (
            <div key={i}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B7385", marginBottom: 14 }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([l, target], j) => <a key={j} href={target?.startsWith("/") ? target : "#"} onClick={(e) => { if (target?.startsWith("/")) return; e.preventDefault(); if (target === "login") onStart(); else if (target) onNav(target); }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 40, paddingTop: 22, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#6B7385" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span>© Jurovia 2026 · Hecho para abogados de Colombia.</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="globe" size={14} />Español (Colombia)</span>
          </div>
          {/* Identidad del prestador (Estatuto del Consumidor) */}
          <div style={{ fontSize: 12, color: "#5A6273" }}>
            {COMPANY.brand} es un servicio de <strong style={{ color: "#8A93A6", fontWeight: 600 }}>{COMPANY.legalName}</strong> · NIT {COMPANY.nit} · {COMPANY.address} · <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";
/* Secciones de marketing de la landing. Reusa el design system de components/juridica. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, Logo } from "../juridica/icons";
import { AgentAvatar, VerifiedChip } from "../juridica/atoms";
import type { Citation } from "../juridica/data";

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

/* ---------- Trust bar ---------- */
export function TrustBar() {
  const items: [string, string][] = [
    ["badgeCheck", "Citas verificadas con enlace oficial"],
    ["fileText", "Escritos en Word (.docx) listos para presentar"],
    ["radar", "Vigilancia de cambios en leyes y tus casos"],
  ];
  return (
    <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
      <div className="land-container" style={{ padding: "22px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", textAlign: "center" }}>
          <span style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text)" }}>Hecho para abogados de Colombia.</span>
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
      <div className="mock-bar"><Icon name="radar" size={15} style={{ color: "var(--primary)" }} /><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Autopilot · resumen del día</span></div>
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
    { id: "vigilancia", eyebrow: "Vigilancia", icon: "radar", title: "Te avisamos cuando algo cambia.", body: "Pídele a Jurovia que vigile tus casos: te avisa si una norma que usaste fue derogada o si hay novedades en tus procesos. Puede revisar tu correo y dejarte un resumen al final del día.", micro: "El dolor por el que los abogados dijeron que pagarían.", mock: <MockVigilancia />, flip: true },
    { id: "word", eyebrow: "Redacción", icon: "fileText", title: "De una semana a unos minutos — en tu formato.", body: "Genera contestaciones, demandas, derechos de petición y más, en Word (.docx), citando solo lo verificado. Guarda tus plantillas y reutilízalas para que cada escrito salga con tus formatos y tecnicismos.", micro: "Porque tu mejor amigo siempre fue Word. Aquí también.", mock: <MockWord />, flip: false },
    { id: "casos", eyebrow: "Control", icon: "folder", title: "Todo tu caso en un solo lugar.", body: "Cada caso es un expediente con cronología, partes, documentos, calendario y avance. Y para lo repetitivo, Jurovia calcula liquidaciones laborales y plazos/términos de forma exacta y reproducible.", micro: null, mock: <MockExpediente />, flip: true },
  ];
  return (
    <section id="solucion" className="land-section anchor" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="land-container">
        <Reveal style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 64px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="sparkles" size={15} />La solución</span>
          <h2 className="land-h2">Cuatro formas en que Jurovia te respalda.</h2>
          <p className="land-lead" style={{ margin: "16px auto 0" }}>Cada una nace de un dolor real del ejercicio — y la cubre el producto, hoy.</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 88 }}>
          {pillars.map((p) => (
            <Reveal key={p.id}>
              <div className={`pillar${p.flip ? " flip" : ""}`}>
                <div className="pillar-text">
                  <span className="eyebrow"><Icon name={p.icon} size={15} />{p.eyebrow}</span>
                  <h3 style={{ fontSize: 26, fontWeight: 660, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "12px 0 0" }}>{p.title}</h3>
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
    { n: "01", icon: "message", t: "Cuéntale tu caso.", d: "Escribe o háblale por voz; adjunta tus documentos." },
    { n: "02", icon: "shieldCheck", t: "Jurovia investiga y verifica.", d: "Consulta las fuentes oficiales y arma la fundamentación con citas enlazadas." },
    { n: "03", icon: "download", t: "Recibe tu escrito — y quédate tranquilo.", d: "Descárgalo en Word y deja que Jurovia vigile tus casos por cambios." },
  ];
  return (
    <section id="como-funciona" className="land-section anchor">
      <div className="land-container">
        <Reveal style={{ maxWidth: 680 }}>
          <span className="eyebrow"><Icon name="target" size={15} />Cómo funciona</span>
          <h2 className="land-h2">De la consulta al escrito, en tres pasos.</h2>
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
          <h2 className="land-h2">ChatGPT te da el escrito. Jurovia te da la fundamentación que puedes defender.</h2>
        </Reveal>
        <Reveal>
          <div className="card" style={{ overflow: "hidden", maxWidth: 860, margin: "0 auto" }}>
            <table className="diff-table">
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
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
export function Pricing({ plans, onStart }: { plans: Plan[]; onStart: () => void }) {
  const free = plans.find((p) => p.tier === "free");
  const soon = plans.filter((p) => !p.active);
  const freeCredits = free?.credits ?? 10;
  const freeDays = free?.trial_days ?? 7;
  return (
    <section id="precios" className="land-section anchor">
      <div className="land-container">
        <Reveal style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 48px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}><Icon name="sparkles" size={15} />Precios</span>
          <h2 className="land-h2">Empieza gratis. Sin tarjeta.</h2>
        </Reveal>
        <div className="price-grid">
          <Reveal>
            <div className="card" style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", border: "2px solid var(--primary)", boxShadow: "var(--sh-2)", position: "relative" }}>
              <span style={{ position: "absolute", top: -12, left: 28, background: "var(--aurora)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 12px", borderRadius: 999, letterSpacing: "0.03em" }}>DISPONIBLE HOY</span>
              <div style={{ fontSize: 16, fontWeight: 650 }}>{free?.name ?? "Free"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0 4px" }}><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>$0</span></div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Prueba Jurovia con <strong>{freeCredits} créditos</strong> durante <strong>{freeDays} días</strong>.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
                {["Agente con fundamentación verificada", "Escritos en Word (.docx)", "Vigilancia básica de cambios", "Expedientes y cálculos"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}><Icon name="check" size={16} stroke={2.4} style={{ color: "var(--success)" }} />{t}</div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 18, padding: "11px 13px", background: "var(--bg-base)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                Cuando se agoten tus créditos o terminen los {freeDays} días, el asistente y la vigilancia automática se pausan, pero <strong>sigues usando el resto de la app</strong> — tus casos, documentos y plantillas siguen ahí.
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "auto" }} onClick={onStart}>Empezar gratis<Icon name="arrowRight" size={17} stroke={2.2} /></button>
            </div>
          </Reveal>
          {soon.map((p, i) => (
            <Reveal key={p.tier} delay={(i + 1) * 90}>
              <div className="card" style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-elevated-2)", display: "grid", placeItems: "center" }}><Icon name={p.tier === "team" ? "building" : "user"} size={17} style={{ color: "var(--text-secondary)" }} /></span>
                  <span style={{ fontSize: 16, fontWeight: 650 }}>{p.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-elevated-2)", padding: "3px 10px", borderRadius: 999 }}>PRÓXIMAMENTE</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-muted)", margin: "18px 0 4px", letterSpacing: "-0.02em" }}>Pronto</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{p.blurb}</div>
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: "auto" }}><Icon name="bell" size={15} />Avísame cuando salga</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function FAQ() {
  const faqs: [string, string][] = [
    ["¿En qué se diferencia de ChatGPT o Claude?", "Jurovia verifica las citas contra las fuentes oficiales y te da el enlace; además vigila cambios y entrega en Word. La IA genérica redacta, pero no fundamenta de forma verificable."],
    ["¿De dónde saca la información?", "De portales oficiales de leyes y jurisprudencia. Cada cita incluye su enlace para que tú la valides."],
    ["¿Reemplaza al abogado?", "No. Es tu copiloto: tú decides y firmas. Jurovia te ahorra la parte de buscar, verificar y redactar."],
    ["¿Entrega en Word?", "Sí, en .docx (y PDF), listo para editar y presentar."],
    ["¿Mis datos están seguros?", "Cada cuenta y caso está aislado por organización."],
    ["¿Necesito tarjeta para la prueba?", "No. El plan Free no requiere tarjeta."],
    ["¿Funciona para mi área?", "Está enfocado en derecho colombiano y mejora con cada caso; ideal para litigio, laboral y trámites con fundamentación."],
    ["¿Qué pasa cuando se acaban mis créditos del plan Free?", "El asistente y la vigilancia automática se pausan; el resto de la app sigue disponible."],
  ];
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

/* ---------- Final CTA + Footer ---------- */
export function FinalCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="land-section anchor" style={{ paddingBottom: 0 }}>
      <div className="land-container">
        <Reveal>
          <div style={{ position: "relative", borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--aurora)", padding: "64px 40px", textAlign: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 120% at 50% 0%, rgba(255,255,255,0.22), transparent 70%)" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff", margin: 0, textWrap: "balance" }}>Deja de citar normas derogadas.</h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.92)", margin: "16px auto 0", maxWidth: 520, lineHeight: 1.5 }}>Empieza gratis hoy y fundamenta tu próximo escrito con citas que puedes defender.</p>
              <button onClick={onStart} className="btn btn-lg" style={{ marginTop: 28, background: "#fff", color: "var(--primary)", fontWeight: 650, height: 52, padding: "0 28px", boxShadow: "0 12px 30px -8px rgba(13,19,32,0.3)" }}>Empieza gratis<Icon name="arrowRight" size={18} stroke={2.2} /></button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ onStart, onNav }: { onStart: () => void; onNav: (id: string) => void }) {
  const cols: [string, [string, string | null][]][] = [
    ["Producto", [["Cómo funciona", "como-funciona"], ["Precios", "precios"], ["Iniciar sesión", "login"]]],
    ["Legal", [["Términos", null], ["Privacidad", null]]],
    ["Contacto", [["hola@juroviapp.com", null], ["LinkedIn", null]]],
  ];
  return (
    <footer className="land-footer" style={{ marginTop: 96 }}>
      <div className="land-container" style={{ padding: "56px 28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Logo size={30} withText light />
            </div>
            <p style={{ fontSize: 14, color: "#8A93A6", margin: "14px 0 0", maxWidth: 260, lineHeight: 1.55 }}>Tu copiloto jurídico verificable. Hecho para abogados de Colombia.</p>
          </div>
          {cols.map(([title, links], i) => (
            <div key={i}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6B7385", marginBottom: 14 }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([l, target], j) => <a key={j} href="#" onClick={(e) => { e.preventDefault(); if (target === "login") onStart(); else if (target) onNav(target); }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 40, paddingTop: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 13, color: "#6B7385" }}>
          <span>© Jurovia 2026 · Hecho para abogados de Colombia.</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="globe" size={14} />Español (Colombia)</span>
        </div>
      </div>
    </footer>
  );
}

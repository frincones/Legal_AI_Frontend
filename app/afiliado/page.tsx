"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const money = (n?: number) => `$${Number(n || 0).toFixed(2)}`;

type Funnel = {
  stages: { clicks: number; registrations: number; trials: number; purchases: number };
  rates: { click_to_reg: number; reg_to_trial: number; trial_to_buy: number; click_to_buy: number };
  trend: { clicks_7d: number; clicks_30d: number };
  projection: { open_trials: number; avg_commission_usd: number; projected_usd: number };
  events: { kind: string; at: string; who: string; content?: string | null }[];
  by_content: { content: string; clicks: number; purchases: number }[];
};
type Me = {
  enrolled: boolean; code?: string; name?: string; link?: string; commission_pct?: number; commission_type?: string;
  min_payout_usd?: number; clicks?: number;
  summary?: { pending: number; approved: number; paid: number; balance: number; count_sales: number };
  recent?: any[]; funnel?: Funnel;
};

const hace = (iso?: string) => {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso.replace(" ", "T")).getTime()) / 1000;
  if (isNaN(d)) return "";
  if (d < 3600) return `hace ${Math.max(1, Math.round(d / 60))} min`;
  if (d < 86400) return `hace ${Math.round(d / 3600)} h`;
  return `hace ${Math.round(d / 86400)} d`;
};
const EVENT_LABEL: Record<string, { e: string; t: string }> = {
  purchased: { e: "💳", t: "compró una suscripción" },
  trial: { e: "🚀", t: "activó la prueba" },
  registered: { e: "📝", t: "creó su cuenta" },
};

export default function AfiliadoPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [aid, setAid] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let a: string | null = null;
    try { a = localStorage.getItem("jurovia_aff_id"); } catch { /* ignore */ }
    if (a) {
      setAid(a);
      fetch(`${BACKEND}/api/affiliates/panel?aid=${encodeURIComponent(a)}`)
        .then((r) => (r.ok ? r.json() : { enrolled: false }))
        .then((d) => { setMe(d); setLoading(false); })
        .catch(() => { setMe({ enrolled: false }); setLoading(false); });
    } else {
      (async () => {
        try {
          const { data } = await createClient().auth.getSession();
          const tk = data.session?.access_token ?? null;
          setToken(tk);
          if (!tk) { setNeedLogin(true); setLoading(false); return; }
          const r = await fetch(`${BACKEND}/api/affiliates/me`, { headers: { Authorization: `Bearer ${tk}` } });
          setMe(r.ok ? await r.json() : { enrolled: false });
        } catch { setMe({ enrolled: false }); }
        setLoading(false);
      })();
    }
  }, []);

  async function requestPayout() {
    setMsg(null);
    try {
      const r = aid
        ? await fetch(`${BACKEND}/api/affiliates/panel/payout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aid }) })
        : await fetch(`${BACKEND}/api/affiliates/payout-request`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (r.ok) setMsg(`✅ Solicitud enviada por ${money(j.amount_usd)}. Te contactamos para el pago.`);
      else setMsg(`⚠️ ${j.detail || "No se pudo solicitar el pago."}`);
    } catch { setMsg("⚠️ Error de red."); }
  }
  const copy = (s: string) => { try { navigator.clipboard.writeText(s); setMsg("Link copiado ✓"); } catch { /* ignore */ } };

  const wrap: React.CSSProperties = { fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", maxWidth: 620, margin: "0 auto", padding: "32px 18px 60px", color: "#1a1626", background: "#faf7fc", minHeight: "100vh", lineHeight: 1.55 };
  const brand = <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", background: "linear-gradient(100deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Jurov·ia</div>;
  const sectionLabel: React.CSSProperties = { fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#7c3aed", margin: "18px 0 8px" };

  if (loading) return <main style={wrap}>{brand}<p style={{ marginTop: 20, color: "#6b5d78" }}>Cargando tu panel de afiliado…</p></main>;

  if (needLogin && !me?.enrolled) return (
    <main style={wrap}>{brand}
      <h1 style={{ fontSize: "1.4rem", marginTop: 18 }}>Panel de afiliado</h1>
      <p style={{ color: "#6b5d78" }}>Si acabas de registrarte, abre el panel desde el mismo dispositivo/navegador donde te registraste. ¿Aún no eres afiliado?</p>
      <a href="/afiliados" style={{ display: "inline-block", marginTop: 14, background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Registrarme como afiliado →</a>
    </main>
  );

  if (!me?.enrolled) return (
    <main style={wrap}>{brand}
      <h1 style={{ fontSize: "1.4rem", marginTop: 18 }}>Aún no eres afiliado</h1>
      <p style={{ color: "#6b5d78" }}>Regístrate para promocionar Jurovia y ganar comisión por cada suscripción.</p>
      <a href="/afiliados" style={{ display: "inline-block", marginTop: 14, background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Quiero ser afiliado →</a>
    </main>
  );

  const s = me.summary || { pending: 0, approved: 0, paid: 0, balance: 0, count_sales: 0 };
  const f = me.funnel;
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #eadff5", borderRadius: 14, padding: 16, textAlign: "center" };
  const funnelCell: React.CSSProperties = { background: "#fff", border: "1px solid #eadff5", borderRadius: 12, padding: "12px 6px", textAlign: "center" };
  const rateCell: React.CSSProperties = { background: "#f7f2fd", border: "1px solid #eadff5", borderRadius: 10, padding: "8px 6px", textAlign: "center", fontSize: ".72rem", color: "#6b5d78", display: "flex", flexDirection: "column", gap: 2 };
  const showContent = (f?.by_content || []).some((c) => c.content !== "(sin etiqueta)");

  return (
    <main style={wrap}>
      {brand}
      <h1 style={{ fontSize: "1.4rem", margin: "16px 0 2px" }}>{me.name ? `Hola, ${me.name}` : "Tu panel de afiliado"}</h1>
      <p style={{ color: "#6b5d78", margin: 0 }}>Comisión {Math.round((me.commission_pct || 0) * 100)}% {me.commission_type === "recurring" ? "(recurrente)" : "(única, por venta)"}.</p>

      <div style={{ background: "#f1ecfd", border: "1px solid #e0d4f7", borderRadius: 14, padding: 16, margin: "18px 0" }}>
        <div style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#7c3aed" }}>Tu link</div>
        <div style={{ fontFamily: "ui-monospace,monospace", fontSize: ".9rem", wordBreak: "break-all", margin: "6px 0 10px" }}>{me.link}</div>
        <button onClick={() => copy(me.link || "")} style={{ background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 700, border: "none", padding: "9px 16px", borderRadius: 999, cursor: "pointer" }}>Copiar link</button>
      </div>

      {/* ─── Embudo: cómo avanza tu audiencia ─── */}
      {f && (
        <>
          <div style={sectionLabel}>📊 Tu embudo — cómo avanza tu audiencia</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { e: "👁️", n: f.stages.clicks, l: "clics" },
              { e: "📝", n: f.stages.registrations, l: "registros" },
              { e: "🚀", n: f.stages.trials, l: "probaron" },
              { e: "💳", n: f.stages.purchases, l: "compraron" },
            ].map((x) => (
              <div key={x.l} style={funnelCell}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{x.n}</div>
                <div style={{ fontSize: ".72rem", color: "#6b5d78" }}>{x.e} {x.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 8 }}>
            {[
              { l: "clic→registro", v: f.rates.click_to_reg },
              { l: "registro→prueba", v: f.rates.reg_to_trial },
              { l: "prueba→compra", v: f.rates.trial_to_buy },
            ].map((r) => (
              <div key={r.l} style={rateCell}><b style={{ fontSize: "1rem", color: "#1a1626" }}>{r.v}%</b><span>{r.l}</span></div>
            ))}
          </div>

          {/* Proyección de ganancia */}
          <div style={{ background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", borderRadius: 14, padding: "14px 16px", marginTop: 12 }}>
            <div style={{ fontWeight: 800, fontSize: "1rem" }}>💰 Ganancia en camino: ~{money(f.projection.projected_usd)}</div>
            <div style={{ fontSize: ".84rem", opacity: 0.95, marginTop: 2 }}>
              Tienes <b>{f.projection.open_trials}</b> {f.projection.open_trials === 1 ? "persona probando" : "personas probando"}. Cuando compran, ganas ~{money(f.projection.avg_commission_usd)} por cada una. ¡Sigue publicando! 🚀
            </div>
          </div>

          {/* Tendencia de clics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 10 }}>
            <div style={card}><div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{f.trend.clicks_7d}</div><div style={{ fontSize: ".8rem", color: "#6b5d78" }}>clics · 7 días</div></div>
            <div style={card}><div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{f.trend.clicks_30d}</div><div style={{ fontSize: ".8rem", color: "#6b5d78" }}>clics · 30 días</div></div>
          </div>

          {/* Rendimiento por publicación (?c=) */}
          {showContent && (
            <>
              <div style={sectionLabel}>🏷️ Rendimiento por publicación</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {f.by_content.filter((c) => c.content !== "(sin etiqueta)").map((c) => (
                  <div key={c.content} style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", background: "#fff", border: "1px solid #eadff5", borderRadius: 10, padding: "8px 12px" }}>
                    <span style={{ fontWeight: 600 }}>{c.content}</span>
                    <span style={{ color: "#6b5d78" }}>{c.clicks} clics · <b style={{ color: "#16A34A" }}>{c.purchases} ventas</b></span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: ".76rem", color: "#9a8fac", marginTop: 6 }}>Tip: agrega <code>?c=nombre</code> a tu link (ej. <code>?ref={me.code}&c=reel-demanda</code>) para saber qué contenido convierte mejor.</p>
            </>
          )}

          {/* Feed en vivo */}
          {(f.events || []).length > 0 && (
            <>
              <div style={sectionLabel}>⚡ Actividad reciente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {f.events.map((ev, i) => {
                  const lb = EVENT_LABEL[ev.kind] || { e: "•", t: ev.kind };
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".85rem", background: "#fff", border: "1px solid #eadff5", borderRadius: 10, padding: "8px 12px" }}>
                      <span>{lb.e} <b>{ev.who}</b> {lb.t}</span>
                      <span style={{ color: "#9a8fac", fontSize: ".78rem" }}>{hace(ev.at)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Ganancias ─── */}
      <div style={sectionLabel}>💵 Tus ganancias</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <div style={card}><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{s.count_sales}</div><div style={{ fontSize: ".82rem", color: "#6b5d78" }}>ventas</div></div>
        <div style={card}><div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16A34A" }}>{money(s.approved)}</div><div style={{ fontSize: ".82rem", color: "#6b5d78" }}>por pagar</div></div>
        <div style={card}><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{money(s.pending)}</div><div style={{ fontSize: ".82rem", color: "#6b5d78" }}>pendiente</div></div>
        <div style={card}><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{money(s.paid)}</div><div style={{ fontSize: ".82rem", color: "#6b5d78" }}>pagado</div></div>
      </div>

      <div style={{ margin: "16px 0" }}>
        <button onClick={requestPayout} disabled={(s.approved || 0) < (me.min_payout_usd || 0)}
          style={{ width: "100%", background: (s.approved || 0) >= (me.min_payout_usd || 0) ? "#1a1626" : "#cdbfe0", color: "#fff", fontWeight: 700, border: "none", padding: "14px", borderRadius: 12, cursor: (s.approved || 0) >= (me.min_payout_usd || 0) ? "pointer" : "default" }}>
          Solicitar pago ({money(s.approved)})
        </button>
        <p style={{ fontSize: ".78rem", color: "#9a8fac", textAlign: "center", marginTop: 6 }}>Mínimo para retirar: {money(me.min_payout_usd)}. Las comisiones se aprueban tras la ventana de reembolso.</p>
      </div>
      {msg && <div style={{ background: "#fff", border: "1px solid #eadff5", borderRadius: 12, padding: "10px 14px", fontSize: ".9rem", marginBottom: 14 }}>{msg}</div>}

      <div style={sectionLabel}>Últimas comisiones</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(me.recent || []).slice(0, 20).map((c: any) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", background: "#fff", border: "1px solid #eadff5", borderRadius: 10, padding: "8px 12px" }}>
            <span>{(c.occurred_at || c.created_at || "").slice(0, 10)} · venta</span>
            <span style={{ fontWeight: 700 }}>{money(c.amount_usd)} · {c.status}</span>
          </div>
        ))}
        {(!me.recent || me.recent.length === 0) && <div style={{ color: "#9a8fac", fontSize: ".88rem" }}>Aún no tienes comisiones. Comparte tu link 🚀</div>}
      </div>
    </main>
  );
}

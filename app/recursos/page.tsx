import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recursos gratis para abogados · Jurovia",
  description: "Descarga gratis: normas derogadas 2026, plantilla de derecho de petición, acta de audiencia y checklist de términos. Y prueba Jurovia en vivo.",
};

const LM = "https://tfhhcokgrpagwwlctjtz.supabase.co/storage/v1/object/public/ugc/lead_magnets";
const WA = "https://wa.me/573123626283?text=" + encodeURIComponent("Hola Camila, vengo de TikTok y quiero probar Jurovia.");
const IG = "https://instagram.com/juroviapp";

type Res = { icon: string; title: string; desc: string; href: string; cta: string; kw?: string };
const RESOURCES: Res[] = [
  { icon: "🔎", title: "Normas derogadas 2026", desc: "Las que muchos siguen citando… y ya no existen (con su reemplazo vigente).", href: `${LM}/Normas_derogadas_2026_Jurovia.pdf`, cta: "Descargar PDF", kw: "VERIFICAR" },
  { icon: "✍️", title: "Plantilla · Derecho de Petición", desc: "Lista para radicar, con fundamentos. Solo completa y firma.", href: `${LM}/Plantilla_Derecho_de_Peticion_Jurovia.pdf`, cta: "Descargar PDF", kw: "PETICION" },
  { icon: "🎧", title: "Plantilla · Acta de Audiencia", desc: "Estructura con decisiones, compromisos y términos.", href: `${LM}/Plantilla_Acta_de_Audiencia_Jurovia.pdf`, cta: "Descargar PDF", kw: "ACTA" },
  { icon: "🛡️", title: "Checklist de Términos", desc: "Para no dejar vencer un término nunca más.", href: `${LM}/Checklist_Terminos_Jurovia.pdf`, cta: "Descargar PDF", kw: "ESCUDO" },
];
const DEMOS: Res[] = [
  { icon: "🔎", title: "Verificar una cita en vivo", desc: "Comprueba si una ley sigue vigente contra la fuente oficial.", href: "/?demo=verificar", cta: "Probar ahora" },
  { icon: "✍️", title: "Redactar un documento", desc: "Un derecho de petición listo en 2 minutos.", href: "/?demo=documento", cta: "Probar ahora" },
];

export default function RecursosPage({ searchParams }: { searchParams?: { k?: string } }) {
  const k = (searchParams?.k || "").toUpperCase();
  const highlight = RESOURCES.find((r) => r.kw === k);
  return (
    <main style={{
      fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", lineHeight: 1.55,
      maxWidth: 560, margin: "0 auto", padding: "28px 18px 56px", color: "#1a1626",
      background: "#faf7fc", minHeight: "100vh",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-.02em",
          background: "linear-gradient(100deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent" }}>Jurov·ia</div>
        <p style={{ fontSize: ".95rem", color: "#5b4d68", margin: "6px 0 0" }}>
          IA legal para abogados de Colombia 🇨🇴 · verifica, redacta y vigila con fuentes reales.
        </p>
      </div>

      {highlight && (
        <div style={{ background: "#f1ecfd", border: "1px solid #e0d4f7", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: ".9rem" }}>
          👇 Aquí está lo que pediste: <b>{highlight.title}</b>
        </div>
      )}

      {/* Recursos gratis */}
      <h2 style={{ fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".08em", color: "#7c3aed", fontWeight: 800, margin: "0 0 10px" }}>Descargas gratis</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        {RESOURCES.map((r) => (
          <a key={r.title} href={r.href} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: 13, textDecoration: "none",
            background: "#fff", border: "1px solid " + (r.kw === k ? "#7c3aed" : "#eadff5"),
            borderRadius: 14, padding: "13px 15px", boxShadow: "0 1px 2px rgba(28,20,36,.05)",
          }}>
            <span style={{ fontSize: "1.5rem", flex: "none" }}>{r.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 700, color: "#1a1626", fontSize: ".98rem" }}>{r.title}</span>
              <span style={{ display: "block", fontSize: ".82rem", color: "#6b5d78" }}>{r.desc}</span>
            </span>
            <span style={{ flex: "none", fontSize: ".8rem", fontWeight: 700, color: "#fff",
              background: "linear-gradient(100deg,#7c3aed,#ec4899)", borderRadius: 999, padding: "7px 13px" }}>{r.cta}</span>
          </a>
        ))}
      </div>

      {/* Pruébalo en vivo */}
      <h2 style={{ fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".08em", color: "#7c3aed", fontWeight: 800, margin: "0 0 10px" }}>Pruébalo en vivo</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        {DEMOS.map((r) => (
          <a key={r.title} href={r.href} style={{
            display: "flex", alignItems: "center", gap: 13, textDecoration: "none",
            background: "#fff", border: "1px solid #eadff5", borderRadius: 14, padding: "13px 15px",
          }}>
            <span style={{ fontSize: "1.5rem", flex: "none" }}>{r.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 700, color: "#1a1626", fontSize: ".98rem" }}>{r.title}</span>
              <span style={{ display: "block", fontSize: ".82rem", color: "#6b5d78" }}>{r.desc}</span>
            </span>
            <span style={{ flex: "none", fontSize: ".8rem", fontWeight: 700, color: "#7c3aed", border: "1px solid #7c3aed", borderRadius: 999, padding: "6px 12px" }}>{r.cta}</span>
          </a>
        ))}
      </div>

      {/* CTA principal */}
      <a href="/?demo=citas" style={{
        display: "block", textAlign: "center", background: "linear-gradient(100deg,#7c3aed,#ec4899)",
        color: "#fff", fontWeight: 800, fontSize: "1.05rem", padding: "16px", borderRadius: 14,
        textDecoration: "none", marginBottom: 12,
      }}>Probar Jurovia gratis 7 días →</a>

      {/* Contacto */}
      <div style={{ display: "flex", gap: 10 }}>
        <a href={WA} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", background: "#25D366", color: "#fff", fontWeight: 700, padding: "12px", borderRadius: 12, textDecoration: "none", fontSize: ".92rem" }}>💬 WhatsApp</a>
        <a href={IG} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", background: "#1a1626", color: "#fff", fontWeight: 700, padding: "12px", borderRadius: 12, textDecoration: "none", fontSize: ".92rem" }}>📸 Instagram</a>
      </div>

      <p style={{ textAlign: "center", fontSize: ".78rem", color: "#9a8fac", marginTop: 26 }}>
        Hecho en Colombia para abogados de Colombia · <a href="https://juroviapp.com" style={{ color: "#7c3aed", textDecoration: "none" }}>juroviapp.com</a>
      </p>
    </main>
  );
}

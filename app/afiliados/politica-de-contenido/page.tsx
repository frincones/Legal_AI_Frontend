import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Contenido para Afiliados · Jurovia",
  description: "Reglas de contenido que los afiliados e influencers deben seguir al promocionar Jurovia, para proteger la marca legal y reputacionalmente.",
};

type Rule = { t: "ok" | "no" | "info"; x: string };
type Section = { h: string; intro?: string; rules: Rule[] };

const SECTIONS: Section[] = [
  {
    h: "1. Principios generales",
    intro: "Al promocionar Jurovia representas nuestra marca ante tu audiencia. Tu contenido debe ser honesto, respetuoso y conforme a la ley colombiana. Esta Política forma parte de las Condiciones del Programa de Afiliados; su incumplimiento puede terminar tu afiliación y anular comisiones.",
    rules: [
      { t: "ok", x: "Comunica con transparencia, en tus propias palabras y desde tu experiencia real usando Jurovia." },
      { t: "no", x: "No publiques nada que puedas razonablemente prever que dañe legal o reputacionalmente a Jurovia." },
      { t: "info", x: "Ante la duda sobre si algo es permitido, escríbenos antes de publicar. Jurovia puede revisar tu contenido y pedir ajustes o su retiro." },
    ],
  },
  {
    h: "2. Veracidad y expectativas realistas",
    intro: "La confianza es nuestro activo. Nunca exageres ni prometas lo que el producto no garantiza.",
    rules: [
      { t: "no", x: "No prometas 'ganar casos', 'ganar demandas', resultados judiciales, ni desenlaces legales garantizados por usar Jurovia." },
      { t: "no", x: "No prometas ingresos o ahorros garantizados ('gana X pesos', 'ahorra Y horas seguro'). Puedes compartir tu experiencia como opinión, sin presentarla como resultado garantizado para todos." },
      { t: "no", x: "No inventes funcionalidades, cifras, premios, certificaciones, clientes ni alianzas que Jurovia no tenga." },
      { t: "no", x: "No uses testimonios falsos, reseñas compradas, capturas manipuladas ni 'antes/después' engañosos." },
      { t: "ok", x: "Sé específico y honesto: muestra lo que realmente hiciste y su resultado real, aclarando que los resultados varían según el caso." },
    ],
  },
  {
    h: "3. Naturaleza de Jurovia: asistente, no abogado",
    intro: "Jurovia es una herramienta de inteligencia artificial de apoyo al trabajo jurídico. NO es un abogado, no ejerce el derecho y no sustituye el criterio profesional. Esto debe quedar claro en tu contenido.",
    rules: [
      { t: "no", x: "No presentes a Jurovia como un abogado, como 'tu abogado con IA', ni como reemplazo de la asesoría de un profesional del derecho." },
      { t: "no", x: "No des a entender que Jurovia brinda asesoría legal vinculante o definitiva, ni que sus resultados pueden usarse sin revisión de un abogado." },
      { t: "ok", x: "Preséntala como lo que es: una herramienta que ayuda a redactar, investigar y organizar más rápido, cuyos resultados siempre debe revisar y validar un profesional." },
      { t: "ok", x: "Si tu audiencia son personas del común (no abogados), aclara que para su caso concreto deben consultar con un abogado." },
    ],
  },
  {
    h: "4. Nada de asesoría legal ni responsabilidad indebida",
    rules: [
      { t: "no", x: "No uses Jurovia (ni su contenido) para dar asesoría legal pública sobre casos reales de terceros como si fuera consejo profesional." },
      { t: "no", x: "No sugieras que Jurovia se responsabiliza por decisiones legales, plazos, términos o consecuencias derivadas del uso de sus resultados." },
      { t: "info", x: "Incluye, cuando corresponda, un aviso del tipo: 'Contenido informativo; no constituye asesoría legal. Verifica siempre con un profesional.'" },
    ],
  },
  {
    h: "5. Uso correcto de la marca Jurovia",
    intro: "Puedes nombrar y mostrar Jurovia para promocionarla, pero sin confundir a tu audiencia sobre tu relación con nosotros.",
    rules: [
      { t: "ok", x: "Usa el nombre 'Jurovia' y capturas reales del producto para mostrar su funcionamiento." },
      { t: "no", x: "No te presentes como empleado, vocero oficial, socio o representante legal de Jurovia. Eres un afiliado independiente." },
      { t: "no", x: "No crees cuentas, perfiles, dominios, páginas o nombres de usuario que se hagan pasar por Jurovia o por un canal oficial de la marca." },
      { t: "no", x: "No alteres el logo ni los colores de la marca de forma que degrade o distorsione su identidad, ni la asocies a otras marcas sin autorización." },
      { t: "no", x: "No hagas publicidad pagada pujando por la marca 'Jurovia' o variantes en buscadores/redes (brand bidding)." },
    ],
  },
  {
    h: "6. Divulgación del vínculo de afiliado (obligatoria)",
    intro: "La ley de protección al consumidor y las normas de publicidad (SIC) exigen transparencia cuando hay un beneficio económico de por medio.",
    rules: [
      { t: "ok", x: "Revela de forma clara y visible que es contenido con enlace de afiliado / recomendación por la que puedes recibir una comisión (p. ej. 'Contenido en colaboración · enlace de afiliado')." },
      { t: "no", x: "No ocultes el carácter publicitario del contenido ni disfraces la recomendación como si fuera contenido puramente editorial e imparcial." },
    ],
  },
  {
    h: "7. Datos personales y confidencialidad",
    intro: "Colombia protege los datos personales (Ley 1581 de 2012 · Habeas Data). Al mostrar Jurovia podrías exponer información sensible: cuídalo.",
    rules: [
      { t: "no", x: "No muestres en tu contenido datos reales de clientes, expedientes, cédulas, nombres, direcciones ni información confidencial de terceros." },
      { t: "ok", x: "Usa datos ficticios o anonimizados (ej. 'Juan Pérez', 'caso de ejemplo') en tus demostraciones." },
      { t: "no", x: "No captures ni uses datos de las personas que llegan por tu enlace para fines distintos, ni los compartas o vendas." },
    ],
  },
  {
    h: "8. Ética profesional (si eres abogado/a)",
    intro: "Si promocionas Jurovia siendo abogado/a, además te obligan las normas sobre publicidad de servicios jurídicos y la ética profesional.",
    rules: [
      { t: "no", x: "No hagas publicidad engañosa de servicios legales ni ofrezcas resultados asegurados al amparo de la herramienta." },
      { t: "ok", x: "Mantén el decoro profesional y respeta las normas del ejercicio del derecho aplicables a tu comunicación." },
    ],
  },
  {
    h: "9. Contenido prohibido",
    intro: "Nada de lo siguiente puede asociarse a la marca Jurovia bajo ninguna circunstancia:",
    rules: [
      { t: "no", x: "Contenido ilegal, que incite a delinquir, a evadir la ley, a defraudar autoridades o a 'hacer trampa' en procesos judiciales." },
      { t: "no", x: "Difamación, denigración o comparaciones engañosas contra competidores, jueces, autoridades o terceros." },
      { t: "no", x: "Discriminación o discurso de odio por raza, género, religión, orientación, discapacidad, origen o afiliación política." },
      { t: "no", x: "Contenido sexual explícito, violento, morboso, o que involucre menores de edad." },
      { t: "no", x: "Desinformación, teorías falsas sobre la ley, o afirmaciones jurídicas incorrectas presentadas como ciertas." },
      { t: "no", x: "Asociar la marca a política partidista, campañas electorales, apuestas, sustancias ilícitas o esquemas de dinero fácil/pirámides." },
      { t: "no", x: "Lenguaje soez excesivo o cualquier tono que deteriore la seriedad y confianza que exige un producto legal." },
    ],
  },
  {
    h: "10. Prácticas de tráfico prohibidas",
    rules: [
      { t: "no", x: "Spam en comentarios, mensajes masivos no solicitados, grupos o correos comprados." },
      { t: "no", x: "Tráfico falso: bots, clics o registros incentivados, cuentas falsas, cookie stuffing o cualquier manipulación de la atribución." },
      { t: "no", x: "Autocompras o registros con tus propios datos o de cuentas asociadas para generar comisiones (auto-referido)." },
      { t: "no", x: "Uso de malware, ventanas emergentes engañosas, redirecciones ocultas o typosquatting del dominio." },
    ],
  },
  {
    h: "11. Revisión, retiro y colaboración",
    rules: [
      { t: "info", x: "Jurovia puede solicitar en cualquier momento que ajustes, aclares o retires un contenido; deberás atender la solicitud en un plazo razonable." },
      { t: "info", x: "Podemos pedirte acceso a las publicaciones donde uses tu enlace para verificar el cumplimiento de esta Política." },
      { t: "ok", x: "Si te contacta un usuario con una duda legal delicada, remítelo a un profesional; no improvises asesoría en nombre de Jurovia." },
    ],
  },
  {
    h: "12. Consecuencias del incumplimiento",
    intro: "Jurovia se reserva el derecho, a su entera discreción, de decidir con qué afiliados continúa y de terminar cualquier afiliación en cualquier momento.",
    rules: [
      { t: "no", x: "El incumplimiento de esta Política puede conllevar la suspensión o terminación inmediata de tu afiliación." },
      { t: "no", x: "Podrán retenerse o anularse las comisiones —pendientes y futuras— asociadas a la conducta infractora, y descontarse las ya pagadas por ventas afectadas." },
      { t: "info", x: "En casos de fraude, uso indebido de la marca o daño reputacional, Jurovia podrá ejercer las acciones legales que correspondan." },
    ],
  },
  {
    h: "13. Buenas prácticas (cómo hacerlo bien)",
    rules: [
      { t: "ok", x: "Muestra un caso de uso real y concreto (redactar un derecho de petición, analizar un contrato) y tu resultado honesto." },
      { t: "ok", x: "Explica el 'antes y después' de tu flujo de trabajo con datos ficticios, aclarando que revisas todo como profesional." },
      { t: "ok", x: "Invita a probar con un llamado claro y honesto, revelando el enlace de afiliado." },
      { t: "ok", x: "Etiqueta tu enlace por pieza (?c=nombre) para saber qué contenido funciona mejor y crear más de eso." },
    ],
  },
];

const ICON: Record<Rule["t"], { e: string; c: string }> = {
  ok: { e: "✅", c: "#16A34A" },
  no: { e: "🚫", c: "#c23b52" },
  info: { e: "ℹ️", c: "#7c3aed" },
};

export default function AfiliadosContentPolicyPage() {
  return (
    <main style={{ fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", maxWidth: 680, margin: "0 auto", padding: "32px 18px 64px", color: "#1a1626", background: "#faf7fc", minHeight: "100vh", lineHeight: 1.6 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", background: "linear-gradient(100deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>Jurov·ia</div>
      <h1 style={{ fontSize: "1.5rem", margin: "18px 0 6px" }}>Política de Contenido para Afiliados</h1>
      <p style={{ color: "#6b5d78", fontSize: ".9rem", margin: "0 0 8px" }}>Última actualización: agosto de 2026. Esta Política forma parte de las <a href="/afiliados/terminos" style={{ color: "#7c3aed" }}>Condiciones del Programa de Afiliados</a>. Al participar, aceptas cumplirla.</p>
      <div style={{ background: "#fff", border: "1px solid #eadff5", borderRadius: 12, padding: "12px 16px", margin: "0 0 20px", fontSize: ".9rem", color: "#4a4458" }}>
        Resumen: sé honesto, no prometas resultados legales ni ingresos garantizados, deja claro que Jurovia es una herramienta de IA que apoya (no reemplaza) a un abogado, protege los datos personales, revela tu enlace de afiliado y cuida la reputación de la marca. Jurovia decide con qué afiliados continúa.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SECTIONS.map((s) => (
          <section key={s.h} style={{ background: "#fff", border: "1px solid #eadff5", borderRadius: 12, padding: "14px 16px" }}>
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 6px", color: "#1a1626" }}>{s.h}</h2>
            {s.intro && <p style={{ fontSize: ".9rem", color: "#6b5d78", margin: "0 0 10px" }}>{s.intro}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {s.rules.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: ".92rem" }}>
                  <span style={{ flexShrink: 0 }}>{ICON[r.t].e}</span>
                  <span style={{ color: "#3a3448" }}>{r.x}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href="/afiliados" style={{ background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Volver al registro →</a>
        <a href="/afiliados/terminos" style={{ background: "#fff", border: "1px solid #eadff5", color: "#7c3aed", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Condiciones del programa</a>
      </div>
      <p style={{ textAlign: "center", fontSize: ".78rem", color: "#9a8fac", marginTop: 26 }}>Jurovia · IA legal para abogados de Colombia · <a href="https://juroviapp.com" style={{ color: "#7c3aed", textDecoration: "none" }}>juroviapp.com</a></p>
    </main>
  );
}

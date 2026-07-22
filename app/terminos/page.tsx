import type { Metadata } from "next";
import { COMPANY } from "@/components/company";

export const metadata: Metadata = {
  title: "Términos y Condiciones · Jurovia",
  description: "Términos y Condiciones de uso de Jurovia.",
};

const h2: React.CSSProperties = { fontSize: "1.2rem", marginTop: "2rem" };
const link: React.CSSProperties = { color: "#6d28d9" };

export default function TerminosPage() {
  return (
    <main style={{
      fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", lineHeight: 1.6,
      maxWidth: 780, margin: "0 auto", padding: "40px 20px", color: "#1a1a2e", background: "#fff",
    }}>
      <a href="/" style={{ color: "#6d28d9", fontSize: "0.9rem", textDecoration: "none" }}>← Volver a Jurovia</a>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem", marginTop: "1rem" }}>Términos y Condiciones</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>Última actualización: 10 de julio de 2026 · <em>Borrador — pendiente de validación por un abogado.</em></p>

      <p>Estos Términos regulan el uso de <strong>Jurovia</strong>, un asistente de inteligencia artificial
      para profesionales del derecho en Colombia, operado por <strong>{COMPANY.legalName}</strong> (NIT
      {" "}{COMPANY.nit}). Al crear una cuenta o usar el servicio, aceptas estos Términos.</p>

      <h2 style={h2}>1. Descripción del servicio</h2>
      <p>Jurovia asiste en la investigación, verificación de fuentes y redacción de documentos jurídicos.
      Es una <strong>herramienta de apoyo profesional</strong>: no sustituye el criterio, la
      responsabilidad ni el juicio del abogado.</p>

      <h2 style={h2}>2. No es asesoría legal</h2>
      <p>El contenido generado por Jurovia es un <strong>insumo</strong> que siempre debe ser revisado y
      validado por un profesional del derecho antes de su uso. <strong>Jurovia no presta asesoría legal</strong>
      y no garantiza resultados. La IA puede cometer errores; verifica las fuentes antes de radicar o
      presentar cualquier documento.</p>

      <h2 style={h2}>3. Cuenta y elegibilidad</h2>
      <p>Debes ser mayor de edad y proporcionar información veraz. Eres responsable de la actividad de tu
      cuenta y de mantener la confidencialidad de tu acceso.</p>

      <h2 style={h2}>4. Suscripciones y pagos</h2>
      <p>Los planes de pago son suscripciones de cobro recurrente procesadas por <strong>Paddle</strong>
      (Merchant of Record). La cancelación, el derecho de retracto y los reembolsos se rigen por nuestra{" "}
      <a href="/cancelacion" style={link}>Política de Cancelación y Reembolsos</a>.</p>

      <h2 style={h2}>5. Uso aceptable</h2>
      <p>No puedes usar Jurovia para fines ilícitos, para vulnerar derechos de terceros, ni para eludir
      medidas de seguridad. Nos reservamos el derecho de suspender cuentas que incumplan estos Términos.</p>

      <h2 style={h2}>6. Propiedad intelectual</h2>
      <p>Los documentos y contenidos que generas con Jurovia son <strong>tuyos</strong>. El software, la
      marca y la tecnología de Jurovia son propiedad de {COMPANY.legalName} y se te licencian para su uso
      conforme a estos Términos.</p>

      <h2 style={h2}>7. Datos personales</h2>
      <p>El tratamiento de tus datos se rige por nuestra <a href="/privacidad" style={link}>Política de
      Privacidad</a>, conforme a la Ley 1581 de 2012. Tus conversaciones y documentos no se usan para
      entrenar modelos de IA.</p>

      <h2 style={h2}>8. Limitación de responsabilidad</h2>
      <p>Jurovia se ofrece "tal cual". En la máxima medida permitida por la ley, {COMPANY.legalName} no será
      responsable por daños indirectos o derivados del uso del servicio, ni por decisiones tomadas con base
      en el contenido generado sin la debida revisión profesional.</p>

      <h2 style={h2}>9. Cambios</h2>
      <p>Podemos actualizar estos Términos. Publicaremos la versión vigente en esta página con su fecha.</p>

      <h2 style={h2}>10. Ley aplicable y contacto</h2>
      <p>Estos Términos se rigen por las leyes de la República de Colombia. Para cualquier asunto:{" "}
      <a href={`mailto:${COMPANY.email}`} style={link}>{COMPANY.email}</a> · {COMPANY.legalName} · NIT {COMPANY.nit}.</p>
    </main>
  );
}

import type { Metadata } from "next";
import { COMPANY } from "@/components/company";

export const metadata: Metadata = {
  title: "Política de Cancelación y Reembolsos · Jurovia",
  description: "Cómo cancelar tu suscripción, derecho de retracto y reembolsos en Jurovia.",
};

const h2: React.CSSProperties = { fontSize: "1.2rem", marginTop: "2rem" };
const link: React.CSSProperties = { color: "#6d28d9" };

export default function CancelacionPage() {
  return (
    <main style={{
      fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", lineHeight: 1.6,
      maxWidth: 780, margin: "0 auto", padding: "40px 20px", color: "#1a1a2e", background: "#fff",
    }}>
      <a href="/" style={{ color: "#6d28d9", fontSize: "0.9rem", textDecoration: "none" }}>← Volver a Jurovia</a>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem", marginTop: "1rem" }}>Política de Cancelación y Reembolsos</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>Última actualización: 10 de julio de 2026 · <em>Borrador — pendiente de validación por un abogado.</em></p>

      <h2 style={h2}>1. Suscripciones y renovación</h2>
      <p>Los planes de pago de <strong>Jurovia</strong> son suscripciones de cobro recurrente (mensual)
      procesadas por <strong>Paddle</strong> (Paddle.com Market Ltd.), nuestro comerciante registrado
      (<em>Merchant of Record</em>). Al suscribirte autorizas el cobro automático de la tarifa de tu plan
      al inicio de cada período, hasta que canceles.</p>

      <h2 style={h2}>2. Cómo cancelar</h2>
      <p>Puedes cancelar en cualquier momento desde <strong>Ajustes → Gestionar suscripción</strong>, que abre
      el portal de Paddle. La cancelación detiene la renovación automática, <strong>mantiene tu acceso hasta
      el final del período ya pagado</strong> y no genera cargos futuros. No hay permanencia ni penalización.</p>

      <h2 style={h2}>3. Derecho de retracto (Ley 1480 de 2011, art. 47)</h2>
      <p>Tienes derecho a retractarte dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la
      celebración del contrato, <strong>salvo que la prestación del servicio ya haya comenzado con tu
      acuerdo</strong>. Como Jurovia es un servicio digital de prestación inmediata, si comienzas a usarlo
      (enviar consultas, generar documentos) se entiende iniciada la prestación y el derecho de retracto no
      aplica, conforme a la excepción del artículo 47. Para que puedas evaluar el servicio sin costo,
      ofrecemos un <strong>plan de prueba gratuito</strong> antes de cualquier cobro.</p>

      <h2 style={h2}>4. Reembolsos</h2>
      <p>Si consideras que tienes derecho a un reembolso (retracto aplicable, cobro duplicado o error),
      escríbenos a <a href={`mailto:${COMPANY.email}`} style={link}>{COMPANY.email}</a> dentro de los plazos
      legales. Cuando corresponda, procesaremos la devolución a tu método de pago original a través de Paddle,
      sin deducciones, dentro del plazo legal (hasta 30 días calendario; 15 días calendario en comercio
      electrónico, conforme a la Ley 2439 de 2024). Fuera de los casos legales, los reembolsos son
      discrecionales y no obligatorios para períodos ya consumidos.</p>

      <h2 style={h2}>5. Impuestos y facturas</h2>
      <p>Paddle emite las facturas con los impuestos aplicables. Puedes verlas y descargarlas desde el portal
      (Ajustes → Gestionar suscripción).</p>

      <h2 style={h2}>6. Cambios de plan</h2>
      <p>Puedes subir o bajar de plan desde la aplicación; los ajustes de cobro aplican según las reglas de
      prorrateo de Paddle.</p>

      <h2 style={h2}>7. Contacto</h2>
      <p>Para solicitudes de cancelación o reembolso: <a href={`mailto:${COMPANY.email}`} style={link}>{COMPANY.email}</a>{" "}
      · {COMPANY.legalName} · NIT {COMPANY.nit}.</p>
    </main>
  );
}

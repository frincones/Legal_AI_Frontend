import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Condiciones del Programa de Afiliados · Jurovia",
  description: "Términos y condiciones del programa de afiliados de Jurovia: comisiones, pagos, y reglas de participación.",
};

const CLAUSES: { h: string; p: string }[] = [
  { h: "1. Qué es", p: "El Programa de Afiliados de Jurovia permite que promociones Jurovia con un link único (?ref=) y ganes una comisión por cada cliente que contrate una suscripción de pago usando tu link. Participar es gratuito y no crea una relación laboral ni de exclusividad." },
  { h: "2. Comisión", p: "Ganas una comisión ÚNICA del 30% sobre el PRIMER pago de cada cliente nuevo que contrate una suscripción de pago usando tu link. Se calcula sobre el valor neto recibido por Jurovia (después de impuestos y comisiones de la pasarela de pago). No es recurrente: se paga una sola vez por cliente. Jurovia podrá ajustar el porcentaje para ventas futuras notificándolo con antelación." },
  { h: "3. Atribución", p: "Una venta se te atribuye si el cliente llega mediante tu link y completa la compra dentro de una ventana de 60 días desde el clic (último clic). No se atribuyen compras propias ni de cuentas asociadas al afiliado (auto-referido)." },
  { h: "4. Aprobación y pago", p: "Las comisiones quedan 'pendientes' hasta superar la ventana de reembolso; luego pasan a 'aprobadas'. El pago se realiza por transferencia a la cuenta que registres, sujeto a un mínimo de retiro. Tú eres responsable de los impuestos y retenciones que apliquen según la ley colombiana (incluida la información tributaria que se te solicite)." },
  { h: "5. Reembolsos y reversos", p: "Si una compra atribuida se reembolsa o revierte, la comisión correspondiente se anula (clawback). Las comisiones ya pagadas por ventas posteriormente reembolsadas podrán descontarse de pagos futuros." },
  { h: "6. Reglas de promoción", p: "No prometas resultados, ingresos garantizados ni condiciones que Jurovia no ofrece. No uses spam, publicidad engañosa, marcas de terceros indebidamente, ni pujas por la marca 'Jurovia' en buscadores. Debes revelar que se trata de una recomendación con enlace de afiliado cuando la ley lo exija." },
  { h: "7. Suspensión", p: "Jurovia puede suspender o terminar tu participación (y retener comisiones asociadas) ante fraude, incumplimiento de estas condiciones o uso indebido de la marca. Tú puedes retirarte cuando quieras." },
  { h: "8. Datos personales", p: "Tratamos tus datos conforme a la Ley 1581 de 2012 (Habeas Data) y nuestra política de privacidad, con la finalidad de gestionar el programa y realizar los pagos." },
  { h: "9. Cambios", p: "Jurovia puede actualizar estas condiciones; la versión vigente se publica en esta página. El uso continuado del programa implica su aceptación." },
];

export default function AfiliadosTerminosPage() {
  return (
    <main style={{ fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", maxWidth: 640, margin: "0 auto", padding: "32px 18px 64px", color: "#1a1626", background: "#faf7fc", minHeight: "100vh", lineHeight: 1.6 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", background: "linear-gradient(100deg,#7c3aed,#ec4899)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>Jurov·ia</div>
      <h1 style={{ fontSize: "1.5rem", margin: "18px 0 6px" }}>Condiciones del Programa de Afiliados</h1>
      <p style={{ color: "#6b5d78", fontSize: ".9rem", margin: "0 0 20px" }}>Última actualización: agosto de 2026. Al registrarte en el programa aceptas estas condiciones.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CLAUSES.map((c) => (
          <section key={c.h} style={{ background: "#fff", border: "1px solid #eadff5", borderRadius: 12, padding: "14px 16px" }}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 6px", color: "#1a1626" }}>{c.h}</h2>
            <p style={{ fontSize: ".92rem", color: "#4a4458", margin: 0 }}>{c.p}</p>
          </section>
        ))}
      </div>
      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href="/afiliados" style={{ background: "linear-gradient(100deg,#7c3aed,#ec4899)", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Volver al registro →</a>
        <a href="/privacidad" style={{ background: "#fff", border: "1px solid #eadff5", color: "#7c3aed", fontWeight: 700, padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>Política de privacidad</a>
      </div>
      <p style={{ textAlign: "center", fontSize: ".78rem", color: "#9a8fac", marginTop: 26 }}>Jurovia · IA legal para abogados de Colombia · <a href="https://juroviapp.com" style={{ color: "#7c3aed", textDecoration: "none" }}>juroviapp.com</a></p>
    </main>
  );
}

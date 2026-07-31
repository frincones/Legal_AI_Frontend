import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Consumo y Uso Justo · Jurovia",
  description: "Cómo funciona la capacidad de uso de tu plan en Jurovia: ventanas de sesión y semanal, qué consume capacidad y uso justo.",
};

const h2: React.CSSProperties = { fontSize: "1.2rem", marginTop: "2rem" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".03em", color: "#666", borderBottom: "2px solid #eee" };
const td: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: ".95rem" };
const note: React.CSSProperties = { fontSize: ".85rem", color: "#777", fontStyle: "italic" };

export default function PoliticaConsumoPage() {
  return (
    <main style={{
      fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", lineHeight: 1.6,
      maxWidth: 780, margin: "0 auto", padding: "40px 20px", color: "#1a1a2e", background: "#fff",
    }}>
      <a href="/" style={{ color: "#6d28d9", fontSize: "0.9rem", textDecoration: "none" }}>← Volver a Jurovia</a>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem", marginTop: "1rem" }}>Política de Consumo y Uso Justo</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>Cómo funciona la capacidad de uso de tu plan, con transparencia.</p>

      <h2 style={h2}>1. Lo esencial</h2>
      <p>Tu plan de <strong>Jurovia</strong> incluye <strong>uso amplio pensado para el trabajo diario de un
      abogado</strong>: investigar, verificar fuentes, redactar documentos y vigilar procesos. Para mantener el
      servicio <strong>rápido y estable para todos</strong>, la capacidad se organiza en dos ventanas de uso que
      <strong> se renuevan solas</strong>. La gran mayoría de nuestros usuarios nunca las alcanza.</p>

      <h2 style={h2}>2. Cómo funciona la capacidad</h2>
      <p>Tu plan tiene <strong>dos límites de uso</strong> que corren en paralelo, igual que en otras herramientas
      de IA (como Claude o ChatGPT):</p>
      <p><strong>⏱️ Ventana por sesión (cada ~5 horas).</strong> Un cupo para ráfagas de trabajo intenso. El reloj
      empieza con tu primera consulta y se <strong>libera solo unas horas después</strong>.</p>
      <p><strong>📅 Ventana semanal (7 días).</strong> El cupo total sobre una <strong>ventana móvil de 7 días</strong>.
      A medida que el uso más antiguo sale de la ventana, tu capacidad se <strong>recupera automáticamente</strong>.</p>

      <h2 style={h2}>3. Qué consume capacidad (y qué no)</h2>
      <p>No todo pesa igual. El consumo depende de lo que pidas:</p>
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
        <thead><tr><th style={th}>Acción</th><th style={th}>Consumo relativo</th></tr></thead>
        <tbody>
          <tr><td style={td}>Una <strong>consulta</strong> o pregunta al agente</td><td style={td}><strong>1×</strong> (base)</td></tr>
          <tr><td style={td}><strong>Generar un documento</strong> (tutela, contestación, contrato…)</td><td style={td}><strong>~5×</strong> (es mucho más trabajo)</td></tr>
          <tr><td style={td}>Un paso de <strong>flujo/misión</strong> automatizado</td><td style={td}>~2×</td></tr>
          <tr><td style={td}>Adjuntos grandes o conversaciones muy largas</td><td style={td}>algo más</td></tr>
        </tbody>
      </table>
      <p style={note}>No consume tu cupo: navegar la app, ver tus casos y documentos, recibir alertas del Autopilot,
      ni revisar o editar lo que ya se generó.</p>

      <h2 style={h2}>4. Capacidad por plan</h2>
      <p>Cada plan incluye más capacidad y más usuarios. Estas son cifras de referencia por semana —
      <strong> uso holgado</strong>, para que trabajes tranquilo:</p>
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
        <thead><tr><th style={th}>Plan</th><th style={th}>Consultas / semana*</th><th style={th}>o Documentos / semana*</th><th style={th}>Usuarios</th></tr></thead>
        <tbody>
          <tr><td style={td}><strong>Estándar</strong></td><td style={td}>~36</td><td style={td}>~7</td><td style={td}>1</td></tr>
          <tr><td style={td}><strong>Pro</strong></td><td style={td}>~85</td><td style={td}>~17</td><td style={td}>1</td></tr>
          <tr><td style={td}><strong>Firma</strong></td><td style={td}>~212</td><td style={td}>~42</td><td style={td}>hasta 5</td></tr>
        </tbody>
      </table>
      <p style={note}>*Aproximado y combinable: puedes mezclar consultas y documentos (un documento equivale a
      ~5 consultas). Corresponde a la ventana semanal móvil; además existe la ventana de 5 h para ráfagas.</p>

      <h2 style={h2}>5. Si alcanzas un límite</h2>
      <p>No pierdes nada: tus casos, documentos y datos siguen intactos. La ventana de <strong>5 horas</strong> se
      libera sola en un rato y la <strong>semanal</strong> se va recuperando día a día. Si necesitas más volumen de
      forma constante, puedes <strong>subir de plan</strong> en cualquier momento (Estándar → Pro → Firma) y la
      capacidad aumenta al instante. ¿Un pico puntual? Escríbenos a <a style={{ color: "#6d28d9" }} href="mailto:soporte@juroviapp.com">soporte@juroviapp.com</a>.</p>

      <h2 style={h2}>6. Uso justo</h2>
      <p>Estos límites <strong>no son para frenarte</strong>. Existen para proteger la calidad y velocidad del
      servicio para toda la comunidad, y para sostener un precio justo. Están calibrados muy por encima del uso
      profesional normal: solo un uso extremo (muy por encima de lo habitual, o automatizado/masivo) podría
      alcanzarlos. Nunca los usamos para "cortar" a un cliente activo.</p>

      <h2 style={h2}>7. Prueba gratuita</h2>
      <p>La prueba (sin tarjeta) incluye <strong>3 consultas por día durante 7 días</strong>, para que evalúes
      Jurovia con calma. Al terminar, eliges un plan para continuar.</p>

      <h2 style={h2}>8. Cambios en esta política</h2>
      <p>Podemos ajustar estas capacidades para mejorar el servicio. Si un cambio te afecta, te avisaremos con
      anticipación. La versión vigente siempre estará en esta página.</p>

      <p style={{ marginTop: "2.5rem", fontSize: ".9rem", color: "#666" }}>
        ¿Dudas? Escríbenos a <a style={{ color: "#6d28d9" }} href="mailto:soporte@juroviapp.com">soporte@juroviapp.com</a>.
        Ver también <a style={{ color: "#6d28d9" }} href="/terminos">Términos</a> y
        {" "}<a style={{ color: "#6d28d9" }} href="/privacidad">Política de Privacidad</a>.
      </p>
    </main>
  );
}

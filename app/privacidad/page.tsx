import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad · Jurovia",
  description: "Política de Privacidad de Jurovia conforme a la Ley 1581 de 2012 (Colombia).",
};

const h2: React.CSSProperties = { fontSize: "1.2rem", marginTop: "2rem" };
const link: React.CSSProperties = { color: "#6d28d9" };

export default function PrivacidadPage() {
  return (
    <main style={{
      fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", lineHeight: 1.6,
      maxWidth: 780, margin: "0 auto", padding: "40px 20px", color: "#1a1a2e", background: "#fff",
    }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>Política de Privacidad</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>Última actualización: 10 de julio de 2026</p>

      <p>En <strong>Jurovia</strong> (&quot;nosotros&quot;) nos tomamos en serio la protección de
      tus datos personales. Esta Política explica qué información recopilamos, cómo la
      usamos y cuáles son tus derechos, conforme a la <strong>Ley 1581 de 2012</strong> (Régimen
      General de Protección de Datos Personales de Colombia), el Decreto 1377 de 2013 y demás
      normas aplicables.</p>

      <h2 style={h2}>1. Responsable del tratamiento</h2>
      <p><strong>TDX TRANSFORMACION DIGITAL SAS</strong>, NIT 901650655-0, con dirección en Calle 61
      #56-51 (Colombia), operador de la marca <strong>Jurovia</strong>. Para cualquier asunto
      relacionado con tus datos personales o para ejercer tus derechos, escríbenos a{" "}
        <a href="mailto:info@juroviapp.com" style={link}>info@juroviapp.com</a>.</p>

      <h2 style={h2}>2. Qué datos recopilamos</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y datos de registro.</li>
        <li><strong>Contenido que ingresas:</strong> consultas, documentos y archivos que subes o
          generas para usar el asistente jurídico.</li>
        <li><strong>Datos de uso:</strong> interacciones con la plataforma, páginas visitadas y
          métricas de rendimiento.</li>
        <li><strong>Datos de pago:</strong> procesados por proveedores de pago seguros (no
          almacenamos los datos completos de tu tarjeta).</li>
        <li><strong>Cookies y tecnologías similares:</strong> incluido el píxel de Meta para medir
          y mejorar nuestras campañas.</li>
      </ul>

      <h2 style={h2}>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Prestar y mejorar el servicio de asistencia jurídica con IA.</li>
        <li>Procesar tus consultas y generar documentos con fuentes verificables.</li>
        <li>Gestionar tu cuenta, pagos y soporte.</li>
        <li>Medir y optimizar nuestra publicidad y comunicación.</li>
        <li>Cumplir obligaciones legales.</li>
      </ul>

      <h2 style={h2}>4. Tratamiento por inteligencia artificial</h2>
      <p>Jurovia utiliza modelos de IA para procesar consultas y generar respuestas y documentos.
      Para ello, el contenido que ingresas es procesado por nuestros proveedores de IA:{" "}
      <strong>Anthropic</strong> (modelo Claude, para el asistente y la redacción) y{" "}
      <strong>Groq</strong> (para la transcripción del dictado por voz).</p>
      <p><strong>No usamos tus conversaciones ni tus documentos para entrenar modelos de IA</strong>, y
      nuestros proveedores tampoco los usan para entrenar sus modelos cuando los procesamos a través
      de su API. Estos proveedores pueden conservar los datos por un período breve únicamente para
      monitoreo de seguridad y prevención de abuso.</p>
      <p>Jurovia es una herramienta de apoyo profesional y no sustituye el criterio ni la
      responsabilidad del abogado.</p>

      <h2 style={h2}>5. Con quién compartimos datos</h2>
      <p>Compartimos datos únicamente con proveedores que nos ayudan a operar, bajo acuerdos de
      confidencialidad y solo para las finalidades aquí descritas: <strong>Anthropic</strong> y{" "}
      <strong>Groq</strong> (procesamiento de IA), <strong>Supabase</strong> (base de datos y
      almacenamiento), <strong>Vercel</strong> y <strong>Railway</strong> (alojamiento en la nube),{" "}
      <strong>Paddle</strong> (pasarela de pago), <strong>Resend</strong> (envío de correos) y{" "}
      <strong>Meta</strong> (medición de publicidad). No vendemos tus datos personales.</p>

      <h2 style={h2}>6. Cookies y píxel de Meta</h2>
      <p>Usamos cookies y el píxel de Meta (Facebook/Instagram) para medir el rendimiento de
      nuestros anuncios y mejorar la experiencia. Puedes gestionar las cookies desde la
      configuración de tu navegador.</p>
      <p>Para entender el uso de nuestro sitio realizamos analítica propia (eventos de navegación
      como visitas y clics, de forma agregada y sin datos sensibles) e inferimos ubicación
      aproximada (país/ciudad) a partir de tu dirección IP. Esta geolocalización utiliza la base de
      datos <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer">IP Geolocation by DB-IP</a> (CC BY 4.0).</p>
      <p><strong>Planes gratuitos y de prueba:</strong> las conversaciones realizadas en los planes
      gratuito o de prueba pueden ser revisadas por nuestro equipo con fines de calidad, seguridad y
      mejora del producto. En los <strong>planes de pago, tus conversaciones son privadas</strong> y no
      se revisan para estos fines. En todos los casos aplicamos confidencialidad y minimización de datos.</p>

      <h2 style={h2}>7. Conservación</h2>
      <p>Conservamos tus datos mientras tu cuenta esté activa o mientras sea necesario para las
      finalidades descritas y para cumplir obligaciones legales.</p>

      <h2 style={h2}>8. Seguridad</h2>
      <p>Ciframos tu información <strong>en tránsito</strong> (TLS/HTTPS en todos los endpoints) y{" "}
      <strong>en reposo</strong> (cifrado AES-256 en la base de datos, índices, respaldos y archivos,
      a través de <strong>Supabase</strong>, que cumple con la certificación <strong>SOC 2</strong>).
      Además, cada cuenta y caso está <strong>aislado por organización</strong>. Aplicamos medidas
      técnicas y organizativas razonables para proteger tu información frente a accesos no
      autorizados, pérdida o alteración.</p>

      <h2 style={h2}>9. Tus derechos (Habeas Data)</h2>
      <p>Como titular tienes derecho a <strong>conocer, actualizar, rectificar y suprimir</strong> tus
      datos, así como a <strong>revocar la autorización</strong> otorgada, conforme a la Ley 1581 de 2012.</p>
      <p>Para ejercerlos, usa el formulario <a href="/ayuda#derechos" style={link}>Ejercer mis derechos</a> de
      nuestro Centro de ayuda, o escríbenos a <a href="mailto:soporte@juroviapp.com" style={link}>soporte@juroviapp.com</a>.
      Atenderemos tus <strong>consultas en un máximo de 10 días hábiles</strong> y tus <strong>reclamos en
      15 días hábiles</strong>, plazos prorrogables conforme al Decreto 1377 de 2013.</p>

      <h2 style={h2}>10. Cambios a esta política</h2>
      <p>Podemos actualizar esta Política. Publicaremos la versión vigente en esta página con su
      fecha de actualización.</p>

      <h2 style={h2}>11. Contacto</h2>
      <p>¿Dudas sobre tus datos? Escríbenos a{" "}
        <a href="mailto:contacto@juroviapp.com" style={link}>contacto@juroviapp.com</a>.</p>
    </main>
  );
}

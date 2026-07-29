import type { Metadata } from "next";
import { COMPANY } from "@/components/company";

/**
 * Página pública de solicitud de eliminación de cuenta.
 *
 * REQUISITO DE GOOGLE PLAY (User Data policy, vigente desde abril de 2024):
 * una app que permite crear cuenta debe ofrecer el borrado **dentro de la app**
 * Y una **URL web accesible sin reinstalar la app**. Esta URL se carga en el
 * formulario Data safety de Play Console.
 *
 * Apple exige el borrado dentro de la app (guideline 5.1.1(v)); esta página
 * cubre el requisito adicional de Google.
 *
 * No requiere iniciar sesión para leerse: ese es justamente el punto.
 */
export const metadata: Metadata = {
  title: "Eliminar tu cuenta · Jurovia",
  description:
    "Cómo eliminar tu cuenta de Jurovia y todos tus datos, desde la app o solicitándolo por correo.",
  robots: { index: true, follow: true },
};

const h2: React.CSSProperties = { fontSize: "1.2rem", marginTop: "2rem" };
const link: React.CSSProperties = { color: "#6d28d9" };
const li: React.CSSProperties = { marginBottom: "0.4rem" };

export default function EliminarCuentaPage() {
  return (
    <main
      style={{
        fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
        lineHeight: 1.6,
        maxWidth: 780,
        margin: "0 auto",
        padding: "40px 20px",
        color: "#1a1a2e",
        background: "#fff",
      }}
    >
      <a href="/" style={{ color: "#6d28d9", fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver a Jurovia
      </a>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem", marginTop: "1rem" }}>
        Eliminar tu cuenta
      </h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Última actualización: 28 de julio de 2026
      </p>

      <p>
        Puedes eliminar tu cuenta de <strong>Jurovia</strong> y todos tus datos en
        cualquier momento. La eliminación es <strong>irreversible</strong>: no
        podemos recuperar la información después.
      </p>

      <h2 style={h2}>1. Desde la aplicación (recomendado)</h2>
      <p>Es la vía más rápida y no requiere esperar:</p>
      <ol>
        <li style={li}>Inicia sesión en Jurovia (app móvil o web).</li>
        <li style={li}>
          Entra en <strong>Perfil → Privacidad y datos → Eliminar mi cuenta</strong>.
        </li>
        <li style={li}>
          Escribe <strong>ELIMINAR</strong> para confirmar.
        </li>
      </ol>
      <p>
        La cuenta y los datos se borran de inmediato y la sesión se cierra en
        todos tus dispositivos.
      </p>

      <h2 style={h2}>2. Solicitarlo por correo</h2>
      <p>
        Si no puedes acceder a tu cuenta, escríbenos a{" "}
        <a href={`mailto:${COMPANY.email}?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta`} style={link}>
          {COMPANY.email}
        </a>{" "}
        desde el correo con el que te registraste, indicando que deseas eliminar
        tu cuenta. Verificaremos tu identidad y procesaremos la solicitud en un
        plazo máximo de <strong>15 días hábiles</strong>.
      </p>

      <h2 style={h2}>3. Qué se elimina</h2>
      <ul>
        <li style={li}>Tus conversaciones con el asistente y su historial.</li>
        <li style={li}>Tus casos, actuaciones, documentos generados y adjuntos.</li>
        <li style={li}>Tus audiencias, transcripciones y actas.</li>
        <li style={li}>Tu perfil, los datos de tu despacho y tus integraciones.</li>
        <li style={li}>
          Tu suscripción, que se <strong>cancela automáticamente</strong> para que
          no se generen cobros futuros.
        </li>
      </ul>

      <h2 style={h2}>4. Qué se conserva y por qué</h2>
      <p>
        Conservamos los <strong>registros de facturación de forma anónima</strong>{" "}
        durante el tiempo que exige la normativa contable y tributaria colombiana.
        Estos registros <strong>quedan desvinculados de tu identidad</strong>: no
        contienen tu nombre, tu correo ni el contenido de tus casos.
      </p>
      <p>
        También podemos conservar registros mínimos de seguridad cuando la ley lo
        exija o para prevenir fraude, igualmente desvinculados de tu cuenta.
      </p>

      <h2 style={h2}>5. Plazos</h2>
      <ul>
        <li style={li}>
          <strong>Desde la app:</strong> inmediato.
        </li>
        <li style={li}>
          <strong>Por correo:</strong> hasta 15 días hábiles desde que verificamos
          tu identidad.
        </li>
        <li style={li}>
          <strong>Copias de seguridad:</strong> los respaldos cifrados rotan y se
          eliminan por completo en un plazo máximo de 30 días.
        </li>
      </ul>

      <h2 style={h2}>6. Tus derechos (Ley 1581 de 2012)</h2>
      <p>
        Como titular de datos personales tienes derecho a conocer, actualizar,
        rectificar y suprimir tu información, y a revocar la autorización otorgada
        para su tratamiento. Puedes ejercer estos derechos escribiendo a{" "}
        <a href={`mailto:${COMPANY.email}`} style={link}>
          {COMPANY.email}
        </a>
        .
      </p>

      <p style={{ marginTop: "2.5rem", fontSize: "0.9rem", color: "#666" }}>
        Ver también{" "}
        <a href="/privacidad" style={link}>
          Política de privacidad
        </a>{" "}
        ·{" "}
        <a href="/terminos" style={link}>
          Términos y condiciones
        </a>{" "}
        ·{" "}
        <a href="/cancelacion" style={link}>
          Política de cancelación
        </a>
      </p>
    </main>
  );
}

// Identidad legal del prestador (Estatuto del Consumidor, Ley 1480). Dato único y compartido para
// no divergir entre footer, checkout y páginas legales.
export const COMPANY = {
  brand: "Jurovia",
  legalName: "TDX TRANSFORMACION DIGITAL SAS",
  nit: "901650655-0",
  address: "Calle 61 #56-51",
  email: "info@juroviapp.com",
};

// Cadena compacta para líneas de una sola fila.
export const COMPANY_LINE = `${COMPANY.legalName} · NIT ${COMPANY.nit} · ${COMPANY.address} · ${COMPANY.email}`;

// Aviso de IA / no-asesoría-legal (L4 + L13) — SOLO presentación en la UI. Nunca se envía al agente.
export const AI_DISCLAIMER = "Jurovia es un asistente de IA y puede equivocarse. No es asesoría legal; verifica las fuentes antes de radicar.";
// Nota al pie de un documento generado.
export const AI_DOC_NOTE = "Borrador generado por IA. Revísalo y verifica antes de usar o radicar.";

// Versión del consentimiento de tratamiento (L3). DEBE coincidir con settings.consent_version (backend).
export const CONSENT_VERSION = "2026-07-10";

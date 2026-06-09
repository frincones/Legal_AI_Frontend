/* Tipos compartidos + registro de citas de referencia + sugerencias de UI.
   La data de negocio (documentos, recientes, misiones, términos…) viene SOLO del backend (real). */

export type Citation = {
  label: string;
  status: "vigente" | "exequible" | "verificar" | "derogada";
  tier: number;
  title: string;
  source: string;
  consulted: string;
  note: string;
  url: string;
};

/* Verified citation registry (tier 0 = official primary source) */
export const CITATIONS: Record<string, Citation> = {
  cgp422: {
    label: "Art. 422 CGP",
    status: "vigente",
    tier: 0,
    title: "Artículo 422 — Código General del Proceso",
    source: "Función Pública · Gestor Normativo",
    consulted: "2026-06-03",
    note: "Títulos ejecutivos. Vigente.",
    url: "funcionpublica.gov.co",
  },
  cgp431: {
    label: "Art. 431 CGP",
    status: "vigente",
    tier: 0,
    title: "Artículo 431 — Código General del Proceso",
    source: "Función Pública · Gestor Normativo",
    consulted: "2026-06-03",
    note: "Mandamiento de pago. Vigente.",
    url: "funcionpublica.gov.co",
  },
  cco619: {
    label: "Art. 619 C.Co",
    status: "vigente",
    tier: 0,
    title: "Artículo 619 — Código de Comercio",
    source: "SUIN-Juriscol",
    consulted: "2026-06-03",
    note: "Títulos valores: el pagaré. Vigente.",
    url: "suin-juriscol.gov.co",
  },
  c662: {
    label: "C-662/2004",
    status: "vigente",
    tier: 1,
    title: "Sentencia C-662 de 2004 — Corte Constitucional",
    source: "Corte Constitucional · Relatoría",
    consulted: "2026-06-03",
    note: "Exequible. Indexación de obligaciones dinerarias.",
    url: "corteconstitucional.gov.co",
  },
  ley820: {
    label: "Ley 820/2003",
    status: "verificar",
    tier: 3,
    title: "Ley 820 de 2003 — Régimen de arrendamiento de vivienda urbana",
    source: "Fuente secundaria (blog jurídico)",
    consulted: "2026-06-03",
    note: "No confirmado contra fuente oficial. Requiere verificación.",
    url: "—",
  },
};

export type Suggestion = { icon: string; label: string; mode: string };

/* Suggestion chips on Home */
export const SUGGESTIONS: Suggestion[] = [
  { icon: "gavel", label: "Demanda ejecutiva por pagaré", mode: "Documento" },
  { icon: "shieldCheck", label: "¿La Ley 820 de 2003 sigue vigente?", mode: "Pregunta" },
  { icon: "fileText", label: "Contrato de arrendamiento comercial", mode: "Documento" },
  { icon: "scale", label: "Poder general para actuaciones judiciales", mode: "Documento" },
];

export type LibraryItem = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  version: number;
  used: number;
  verified: boolean;
  accent: string;
  shared?: boolean;
  patronId?: string;   // F4: si viene de la biblioteca de patrones, habilita reuse real (reuse_patron_id)
};
// Nota: la Biblioteca y los Recientes usan SOLO data real del backend (/api/artifacts, /api/patrones,
// /api/sessions). No hay arreglos mock; si no hay datos, la UI muestra su estado vacío.

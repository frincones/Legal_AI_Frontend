/* Mock data for the Juridica UI (Fase 0/1). */

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

export type Recent = { id: string; title: string; when: string; active?: boolean };

/* Recent conversations (sidebar) */
export const RECENTS: Recent[] = [
  { id: "r1", title: "Demanda ejecutiva — Pagaré $50M", when: "Hace 5 min", active: true },
  { id: "r2", title: "Tutela por derecho de petición", when: "Hoy" },
  { id: "r3", title: "Concepto: prescripción cambiaria", when: "Ayer" },
  { id: "r4", title: "Contrato de arrendamiento — local 304", when: "2 jun" },
  { id: "r5", title: "¿Vigencia Decreto 1074 de 2015?", when: "31 may" },
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

/* Library documents */
export const LIBRARY: LibraryItem[] = [
  { id: "l1", title: "Demanda Ejecutiva", subtitle: "Pagaré / título valor", type: "Demanda", version: 3, used: 14, verified: true, accent: "#5B4DE3" },
  { id: "l2", title: "Poder General", subtitle: "Actuaciones judiciales", type: "Poder", version: 1, used: 9, verified: true, accent: "#21A8C7" },
  { id: "l3", title: "Contrato de Arrendamiento", subtitle: "Local comercial", type: "Contrato", version: 2, used: 21, verified: true, accent: "#C98A14" },
  { id: "l4", title: "Acción de Tutela", subtitle: "Derecho de petición", type: "Tutela", version: 1, used: 6, verified: false, accent: "#16A34A" },
  { id: "l5", title: "Concepto Jurídico", subtitle: "Prescripción cambiaria", type: "Concepto", version: 2, used: 4, verified: true, accent: "#DC2626" },
  { id: "l6", title: "Derecho de Petición", subtitle: "Entidad pública", type: "Petición", version: 1, used: 11, verified: true, accent: "#2563EB" },
];

export const TEMPLATES: LibraryItem[] = [
  { id: "t1", title: "Demanda Ejecutiva Singular", subtitle: "Plantilla de la firma", type: "Demanda", version: 4, used: 38, verified: true, accent: "#5B4DE3", shared: true },
  { id: "t2", title: "Contrato de Prestación de Servicios", subtitle: "Plantilla de la firma", type: "Contrato", version: 2, used: 27, verified: true, accent: "#C98A14", shared: true },
  { id: "t3", title: "Pagaré con Carta de Instrucciones", subtitle: "Plantilla de la firma", type: "Título valor", version: 1, used: 16, verified: true, accent: "#21A8C7", shared: true },
];

/* Atribución first-party ("Hyros-lite"): al aterrizar desde un anuncio, captura los click-IDs
   (fbclid/gclid/ttclid/msclkid) + los UTMs + referrer, y persiste el FIRST-touch (set-once) y el
   LAST-touch en localStorage — INDEPENDIENTE del pixel (lee el fbclid crudo de la URL, así sobrevive
   al navegador in-app de Facebook). Se adjunta al ctx del tracker y al registro. Aislado y fail-open. */

export type Attrib = {
  source?: string; medium?: string; campaign?: string; content?: string; term?: string;
  fbclid?: string; gclid?: string; ttclid?: string; msclkid?: string;
  referrer?: string; landing?: string; at?: number;
};

const FIRST = "jv_attrib_first";
const LAST = "jv_attrib_last";
let _cache: { first?: Attrib; last?: Attrib } | null = null;

function readUrl(): Attrib {
  try {
    const p = new URLSearchParams(window.location.search);
    const g = (k: string) => { const v = p.get(k); return v ? v.slice(0, 200) : undefined; };
    return {
      source: g("utm_source"), medium: g("utm_medium"), campaign: g("utm_campaign"),
      content: g("utm_content"), term: g("utm_term"),
      fbclid: g("fbclid"), gclid: g("gclid"), ttclid: g("ttclid"), msclkid: g("msclkid"),
      referrer: document.referrer ? document.referrer.slice(0, 200) : undefined,
      landing: (window.location.pathname + window.location.search).slice(0, 300),
      at: Date.now(),
    };
  } catch { return {}; }
}

function hasSignal(a: Attrib): boolean {
  return !!(a.fbclid || a.gclid || a.ttclid || a.msclkid || a.source || a.campaign);
}

/** Llamar 1 vez al cargar. Persiste first-touch (set-once) y last-touch si hay señal de anuncio. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const cur = readUrl();
    if (hasSignal(cur)) {
      if (!localStorage.getItem(FIRST)) localStorage.setItem(FIRST, JSON.stringify(cur));
      localStorage.setItem(LAST, JSON.stringify(cur));
      _cache = null;
    }
  } catch { /* modo privado: no romper */ }
}

/** Devuelve {first,last} guardados (o {}). Lo usa el tracker (ctx) y el registro. */
export function getAttribution(): { first?: Attrib; last?: Attrib } {
  if (typeof window === "undefined") return {};
  if (_cache) return _cache;
  try {
    const f = localStorage.getItem(FIRST);
    const l = localStorage.getItem(LAST);
    _cache = { first: f ? JSON.parse(f) : undefined, last: l ? JSON.parse(l) : undefined };
    return _cache;
  } catch { return {}; }
}

/* Meta Pixel — eventos personalizados. NO toca PageView ni Lead (van en layout/WaitlistModal). */

type WithFbq = { fbq?: (...args: unknown[]) => void };

/**
 * Evento personalizado "Uso del chat" — mide ACTIVACIÓN real: se dispara UNA sola vez por sesión,
 * cuando el visitante (invitado o registrado) envía su primer mensaje. Usa `trackCustom` (no es
 * evento estándar de Meta). El parámetro `modo` permite segmentar después.
 */
export function trackChatUsage(modo: "invitado" | "registrado" = "invitado") {
  if (typeof window === "undefined" || !(window as WithFbq).fbq) return;
  try {
    if (sessionStorage.getItem("jurovia_chat_tracked")) return; // solo una vez por sesión
    (window as WithFbq).fbq!("trackCustom", "Uso del chat", { modo });
    sessionStorage.setItem("jurovia_chat_tracked", "1");
  } catch {
    /* sessionStorage puede no estar disponible (modo privado) → no romper el flujo */
  }
}

// ───────────────────────── Embudo del demo · pixel + CAPI deduplicado ─────────────────────────
function metaId(): string {
  try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch { /* WebView viejo */ }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

/** Lee _fbp/_fbc de las cookies first-party del pixel (el backend está en otro dominio → van en el body). */
export function fbCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const get = (n: string) => document.cookie.match("(?:^|; )" + n + "=([^;]+)")?.[1];
  return { fbp: get("_fbp"), fbc: get("_fbc") };
}

/**
 * Dispara un evento del embudo del demo en el pixel Y en CAPI con el MISMO event_id (Meta deduplica).
 * `ViewContent` es estándar (track); `Uso del chat` es custom (trackCustom). Fail-open.
 */
export async function metaEvent(
  name: "ViewContent" | "Uso del chat" | "AddToCart" | "InitiateCheckout" | "Purchase" | "StartTrial", backendUrl: string,
  opts: { email?: string; contentName?: string; value?: number; currency?: string } = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  const id = metaId();
  const standard = name !== "Uso del chat";   // "Uso del chat" es custom; el resto son estándar de Meta
  try {
    const w = window as WithFbq;
    if (w.fbq) {
      const cd: Record<string, unknown> = {};
      if (opts.contentName) cd.content_name = opts.contentName;
      if (opts.value != null) { cd.value = opts.value; cd.currency = opts.currency || "USD"; }
      w.fbq(standard ? "track" : "trackCustom", name, cd, { eventID: id });
    }
  } catch { /* pixel no disponible → no romper */ }
  try {
    const { fbp, fbc } = fbCookies();
    await fetch(`${backendUrl}/api/meta/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_name: name, event_id: id, email: opts.email,
        content_name: opts.contentName, value: opts.value, currency: opts.currency,
        source_url: location.href, fbp, fbc,
      }),
    });
  } catch { /* CAPI fail-open → no afecta al usuario */ }
}

/** Dispara `ViewContent` UNA vez por sesión y por `sessionKey` (evita spam, sí llena el pool de retargeting). */
export function metaViewOnce(sessionKey: string, backendUrl: string, contentName: string): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
  } catch { /* modo privado: si falla, igual dispara (mejor de más que de menos) */ }
  metaEvent("ViewContent", backendUrl, { contentName });
}

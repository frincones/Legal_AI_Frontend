"use client";
/* Modal de lista de espera — reemplaza al RegisterModal cuando la app está en modo invitación.
   Paso 1: email (fricción mínima) → Paso 2: segmentación (perfilado progresivo) → Confirmación. */
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon, Logo } from "../juridica/icons";
import { api } from "../juridica/mission/data";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/tracker";
import { CONSENT_VERSION } from "../company";

const USER_TYPES = ["Abogado independiente", "Firma de abogados", "Empresa (in-house)", "Estudiante de derecho", "Otro"];
const AREAS = ["Laboral", "Civil", "Penal", "Comercial / Societario", "Administrativo", "Familia", "Tributario", "Otra"];

const field: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)",
  background: "var(--bg-base)", fontSize: 14.5, color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none",
};

export function WaitlistModal({ backendUrl, onClose, source = "register_cta", guestId, context, initialEmail = "" }: {
  backendUrl: string; onClose: () => void; source?: string; guestId?: string; context?: Record<string, unknown>; initialEmail?: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);     // L3: aceptación de tratamiento de datos (Ley 1581)
  const [approved, setApproved] = useState(false);   // auto-aprobación: acceso concedido al registrarse
  const [entering, setEntering] = useState(false);   // auto-login sin OTP en curso (continuidad del chat)
  const router = useRouter();
  const eventIdRef = useRef("");        // id compartido entre el pixel y la CAPI (dedup)
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function save(advanceTo: 2 | 3, final: boolean) {
    if (busy) return;
    setBusy(true);
    const isLead = advanceTo === 2;  // paso 1 (envío del correo) = momento del Lead
    if (isLead && !eventIdRef.current) {
      eventIdRef.current = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID() : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    }
    const r = await api.waitlistJoin(backendUrl, {
      email: email.trim().toLowerCase(), name: name || undefined, user_type: userType || undefined,
      practice_area: area || undefined, city: city || undefined, phone: phone || undefined,
      source, guest_id: guestId, context, final,
      lead_event_id: isLead ? eventIdRef.current : undefined,  // → CAPI server-side con el MISMO id
      consent: true, consent_version: CONSENT_VERSION,          // L3: el gate del paso 1 exige el checkbox
    });
    // Meta Pixel · Lead UNA vez (paso 1), con el MISMO eventID que la CAPI → Meta deduplica.
    if (isLead && r.ok && typeof window !== "undefined" && (window as { fbq?: (...a: unknown[]) => void }).fbq) {
      (window as { fbq?: (...a: unknown[]) => void }).fbq!(
        "track", "Lead", { content_name: "Waitlist Jurovia" }, { eventID: eventIdRef.current });
    }
    if (r.ok) track("waitlist_submitted", { step: isLead ? 1 : 2, final });  // analytics first-party · embudo
    if (r.ok && final && r.authorized) {
      setApproved(true);
      // Continuidad "mismo chat": si el registro viene del chat invitado (hay conversación pendiente),
      // auto-login SIN OTP y entra directo → la app importa la conversación. Fail-open: si falla, cae al
      // paso 3 normal ("entra ahora → /login"). Solo aplica cuando hay pending flag (no en CTAs de landing).
      let pending: string | null = null;
      try { pending = localStorage.getItem("jurovia_pending_guest_chat"); } catch { /* noop */ }
      if (pending) {
        setEntering(true);
        try {
          const ia = await api.instantAccess(backendUrl, email.trim().toLowerCase());
          if (ia?.instant && ia.token_hash) {
            const { error } = await createClient().auth.verifyOtp({ token_hash: ia.token_hash, type: "magiclink" });
            if (!error) { track("guest_instant_access", {}); router.push("/chat"); return; }  // navega → App hace el claim
          }
        } catch { /* fail-open */ }
        setEntering(false);
      }
    }
    setBusy(false);
    setStep(advanceTo);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 460, maxWidth: "94vw", background: "var(--bg-surface)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-3)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ position: "relative", padding: "26px 28px 20px", background: "var(--grad-aurora-soft)", borderBottom: "1px solid var(--border)" }}>
          <button onClick={onClose} className="focus-ring" style={{ position: "absolute", top: 16, right: 16, border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.5)" }}><Icon name="x" size={17} /></button>
          <Logo size={34} />
          {step === 1 && <>
            <h2 style={{ fontSize: 21, fontWeight: 680, letterSpacing: "-0.02em", margin: "14px 0 6px" }}>Únete a la lista de espera</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>Estamos habilitando acceso por oleadas. Déjanos tu correo y te avisamos en cuanto te toque.</p>
          </>}
          {step === 2 && <>
            <h2 style={{ fontSize: 21, fontWeight: 680, letterSpacing: "-0.02em", margin: "14px 0 6px" }}>¡Estás en la lista! 🎉</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>Cuéntanos un poco para darte <b>acceso prioritario</b> (opcional).</p>
          </>}
          {step === 3 && (approved ? <>
            <h2 style={{ fontSize: 21, fontWeight: 680, letterSpacing: "-0.02em", margin: "14px 0 6px" }}>¡Listo! Ya tienes acceso 🎉</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>Te enviamos un correo a <b>{email.trim().toLowerCase()}</b>. Entra ahora: pon tu correo, te llega un código de 6 dígitos y listo.</p>
          </> : <>
            <h2 style={{ fontSize: 21, fontWeight: 680, letterSpacing: "-0.02em", margin: "14px 0 6px" }}>Listo, te avisaremos ✅</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>Te escribiremos a <b>{email.trim().toLowerCase()}</b> cuando habilitemos tu acceso.</p>
          </>)}
        </div>

        <div style={{ padding: 24 }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={field} type="email" placeholder="tu@correo.com" value={email} autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && validEmail && consent) save(2, false); }} />
              <input style={field} placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.45, cursor: "pointer" }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Acepto los <a href="/terminos" target="_blank" rel="noopener" style={{ color: "var(--primary)" }}>Términos</a> y la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: "var(--primary)" }}>Política de Privacidad</a>.</span>
              </label>
              <button className="btn btn-primary btn-lg" style={{ width: "100%", opacity: validEmail && consent && !busy ? 1 : 0.6 }} disabled={!validEmail || !consent || busy} onClick={() => save(2, false)}>
                {busy ? "Enviando…" : "Unirme a la lista"}<Icon name="arrowRight" size={17} stroke={2.2} />
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Sin tarjeta. Te avisamos por correo.</p>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <select style={field} value={userType} onChange={(e) => setUserType(e.target.value)}>
                <option value="">¿Quién eres? (tipo)</option>
                {USER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select style={field} value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Área principal de práctica</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <input style={field} placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
                <div style={{ display: "flex", alignItems: "center", flex: 1, borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--bg-base)", overflow: "hidden" }}>
                  <span style={{ padding: "0 6px 0 12px", fontSize: 14.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>🇨🇴 +57</span>
                  <input inputMode="tel" placeholder="WhatsApp (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: "11px 13px 11px 4px", border: "none", background: "transparent", fontSize: 14.5, color: "var(--text)", fontFamily: "var(--font-ui)", outline: "none" }} />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy} onClick={() => save(3, true)}>
                {entering ? "Entrando a tu chat…" : busy ? "Guardando…" : "Confirmar"}<Icon name="check" size={17} stroke={2.4} />
              </button>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} disabled={busy} onClick={() => save(3, true)}>Omitir por ahora</button>
            </div>
          )}

          {step === 3 && (approved ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a className="btn btn-primary btn-lg" href="/login" style={{ width: "100%", textDecoration: "none" }}>
                Entrar a Jurovia<Icon name="arrowRight" size={17} stroke={2.2} />
              </a>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={onClose}>Cerrar</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-lg" style={{ width: "100%" }} onClick={onClose}>Cerrar</button>
          ))}
        </div>
      </div>
    </div>
  );
}

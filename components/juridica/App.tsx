"use client";

import { useState, useEffect, useRef } from "react";
import { Icon, Logo } from "./icons";
import { Toasts, CommandPalette, EmptyState, FeedbackModal, ReferralModal, OutOfCreditsPopup, UpgradeModal, type Toast } from "./atoms";
import { Sidebar } from "./shell";
import { Home, Library, Settings } from "./screens";
import { ChatView } from "./ChatView";
import { Canvas, type Artifact } from "./Canvas";
import { Wizard } from "./Wizard";
import type { LibraryItem } from "./data";
import { createClient } from "@/lib/supabase/client";
import { initTracker, track } from "@/lib/tracker";
// Mission Control (F2) — pantallas nuevas; se activan SOLO con el flag por org.
import { MissionControl } from "./mission/MissionControl";
import { Misiones } from "./mission/Misiones";
import { MissionDetail } from "./mission/MissionDetail";
import { NuevaMision } from "./mission/NuevaMision";
import { Terminos } from "./mission/Terminos";
import { Autopilot } from "./mission/Autopilot";
import { Inbox } from "./mission/Inbox";
import { ApprovalModal } from "./mission/ApprovalModal";
import { AdminPanel } from "./mission/AdminPanel";
import { api as missionApi, type AudienciaJob } from "./mission/data";

// Admins con créditos ilimitados (debe coincidir con ADMIN_EMAILS del backend).
const ADMIN_EMAILS = ["freddy.rincones@gmail.com", "freddyrincones@gmail.com"];

// F4 · mapeo de datos reales del backend → LibraryItem (modelo del diseño).
const ACCENTS = ["#7B3DF5", "#2F6BFF", "#C98A14", "#16A34A", "#DC2626", "#2563EB"];
const KIND_LABEL: Record<string, string> = { document: "Documento", memo: "Memo", letter: "Carta", table: "Tabla" };
function artifactToItem(a: any, i: number): LibraryItem {
  return {
    id: a.id,
    title: a.title || "Documento",
    subtitle: KIND_LABEL[a.kind] || "Documento",
    type: KIND_LABEL[a.kind] || "Documento",
    version: a.version || 1,
    used: 0,
    verified: true,
    accent: ACCENTS[i % ACCENTS.length],
  };
}
function patronToItem(p: any, i: number): LibraryItem {
  return {
    id: p.id,
    title: p.title || "Plantilla",
    subtitle: "Plantilla de la firma",
    type: KIND_LABEL[p.kind] || "Documento",
    version: 1,
    used: p.used_count || 0,
    verified: true,
    accent: ACCENTS[i % ACCENTS.length],
    shared: true,
    patronId: p.id,
  };
}

function useWidth() {
  const [w, setW] = useState(1200);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

export default function JuridicaApp({
  backendUrl,
  accessToken: accessTokenProp,
  email,
  initialMissionMode = false,
}: {
  backendUrl: string;
  accessToken: string;
  email: string | null;
  initialMissionMode?: boolean;   // resuelto en el server → sin flash al refrescar
}) {
  // Token VIVO: el del SSR es fijo y vence (~1h). Usamos el del cliente Supabase, que se
  // auto-refresca, para que las llamadas al API no fallen con 401 al dejar la pestaña abierta.
  const [accessToken, setAccessToken] = useState(accessTokenProp);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) setAccessToken(session.access_token);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const [route, setRoute] = useState<string>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("Documento");
  const [jurisdiction, setJurisdiction] = useState("Colombia · Nacional");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>(undefined);
  const [chatSeedDocs, setChatSeedDocs] = useState<string[] | undefined>(undefined);  // adjuntos del primer mensaje
  const [chatKey, setChatKey] = useState(0);
  const [recents, setRecents] = useState<{ id: string; title: string }[]>([]);
  const [libDocs, setLibDocs] = useState<LibraryItem[]>([]);
  const [libTemplates, setLibTemplates] = useState<LibraryItem[]>([]);
  const [reusePatronId, setReusePatronId] = useState<string | undefined>(undefined);
  const [reuseTitle, setReuseTitle] = useState<string | undefined>(undefined);
  // Documento ya generado (p.ej. dentro de una misión) que se abre en el Canvas para editar.
  const [openArtifact, setOpenArtifact] = useState<Artifact | undefined>(undefined);
  const [showWizard, setShowWizard] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | undefined>(undefined);
  // Mission Control (F2): flag por org + estado de misión/aprobación.
  // Arranca con el valor resuelto en el server (sin flash); el useEffect lo reconcilia.
  const [missionMode, setMissionMode] = useState(initialMissionMode);
  // Créditos: saldo del pool de la org. Admins = ilimitado (nunca se bloquean).
  const isAdmin = ADMIN_EMAILS.includes((email || "").toLowerCase());
  const [credits, setCreditsState] = useState<{ balance: number | null; cap: number | null; plan?: string | null; trial_ends_at?: string | null }>({ balance: null, cap: null, plan: null, trial_ends_at: null });
  // Modelo de acceso (Opción B): 'credits' (legacy free) bloquea por saldo; 'trial_daily'/'paid' bloquean
  // por el evento SSE del agente (turnos/día o límites), NO por el pill de saldo.
  const [accessModel, setAccessModel] = useState<string>("credits");
  const [sseBlocked, setSseBlocked] = useState(false);
  const creditsBlocked = !isAdmin && (sseBlocked || (accessModel === "credits" && credits.balance != null && credits.balance <= 0));
  // Plan pagado vigente → el muro marca "Plan actual" y solo ofrece mejoras. Deriva de credits.plan
  // (misma fuente que Settings, siempre presente) y solo cuenta si el plan está ACTIVO (no trial).
  const currentTier = accessModel === "paid" ? (credits.plan ?? null) : null;
  const [currentMissionId, setCurrentMissionId] = useState<string | undefined>(undefined);
  const [chatMatterId, setChatMatterId] = useState<string | undefined>(undefined);
  const [approvalOpen, setApprovalOpen] = useState(false);
  // Feedback (BETA): modal global + banner dismissible persistido.
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // Referidos (growth loop): modal "Invitar y ganar créditos".
  const [referralOpen, setReferralOpen] = useState(false);
  // Popup animado al agotar créditos (invita y gana). Anti-fatiga: 1 vez por sesión.
  const [creditsPopup, setCreditsPopup] = useState(false);
  const creditsPopupShown = useRef(false);
  const [betaDismissed, setBetaDismissed] = useState(true);
  useEffect(() => {
    try { setBetaDismissed(localStorage.getItem("jurovia_beta_banner_dismissed") === "1"); } catch { /* ignore */ }
  }, []);
  function dismissBeta() {
    try { localStorage.setItem("jurovia_beta_banner_dismissed", "1"); } catch { /* ignore */ }
    setBetaDismissed(true);
  }

  // F3 — Atribución de referidos: captura el ?ref= al montar y lo guarda para reclamarlo post-login.
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("ref");
      if (code) {
        localStorage.setItem("jurovia_ref", code);                       // referido (turnos) — se reclama y borra
        localStorage.setItem("jurovia_aff", JSON.stringify({ code, ts: Date.now() }));  // afiliado (comisión) — durable hasta la compra
      }
    } catch { /* ignore */ }
  }, []);

  // F3 — Reclama el código guardado en cuanto haya sesión; borra el código tras cualquier resultado.
  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    let code: string | null = null;
    try { code = localStorage.getItem("jurovia_ref"); } catch { /* ignore */ }
    if (!code) return;
    (async () => {
      try { await missionApi.referralClaim(backendUrl, accessToken, code as string); } catch { /* ignore */ }
      finally { try { localStorage.removeItem("jurovia_ref"); } catch { /* ignore */ } }
    })();
  }, [backendUrl, accessToken]);
  const toastId = useRef(0);

  // Lee el flag mission_control de la org (aditivo). Si está off, el UI clásico queda idéntico.
  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    missionApi.me(backendUrl, accessToken).then((m: any) => {
      setMissionMode(!!m?.features?.mission_control);
      if (m?.access?.model) setAccessModel(m.access.model);
      setMeLoaded(true);   // el modelo de acceso ya es confiable → habilita ramificaciones por plan (intención audiencias)
      // Onboarding: se muestra si el backend dice que el usuario aún no lo completó (flag en DB),
      // nunca dentro del popup OAuth, y respetando un skip de sesión en localStorage.
      const isPopup = typeof window !== "undefined" && !!window.opener && !!new URLSearchParams(window.location.search).get("connected");
      if (!isPopup && m && m.onboarded === false && !localStorage.getItem("juridica_onboarded")) setShowWizard(true);
    }).catch(() => { setMeLoaded(true); });   // fail-open: aun si /api/me falla, no dejar la intención colgada
    missionApi.credits(backendUrl, accessToken).then((c: any) => setCreditsState({ balance: c.balance, cap: c.cap, plan: c.plan ?? null, trial_ends_at: c.trial_ends_at ?? null })).catch(() => {});
  }, [backendUrl, accessToken]);

  // El runner emite el nuevo saldo tras cada acción del agente → actualiza el pill + toast al 10%.
  function onCredits(info: { balance?: number | null; cap?: number | null; low?: boolean }) {
    if (info.balance == null) return;
    // El saldo se mantiene internamente (gate), pero NO se muestra la cantidad al usuario (100% interno).
    setCreditsState((c) => ({ ...c, balance: info.balance ?? c.balance, cap: info.cap ?? c.cap }));
  }
  function onBlocked() {
    // El agente emitió `blocked` (sin turnos/créditos): marca el bloqueo real (independiente del saldo,
    // para que trial_daily/paid también bloqueen y muestren el muro de suscripción).
    setSseBlocked(true);
    setCreditsState((c) => ({ ...c, balance: 0 }));
  }

  // Al agotar créditos → popup animado "invita y gana" (1 vez por sesión). Dispara tanto cuando el saldo
  // llega a 0 tras una acción como cuando el agente emite `blocked`. No aplica a admins (nunca se bloquean).
  useEffect(() => {
    if (!creditsBlocked || creditsPopupShown.current) return;
    try { if (sessionStorage.getItem("jv_credits_popup")) { creditsPopupShown.current = true; return; } } catch { /* modo privado */ }
    creditsPopupShown.current = true;
    try { sessionStorage.setItem("jv_credits_popup", "1"); } catch { /* noop */ }
    setCreditsPopup(true);
  }, [creditsBlocked]);

  function closeWizard() {
    try {
      localStorage.setItem("juridica_onboarded", "1");
    } catch {
      /* ignore */
    }
    setShowWizard(false);
  }

  // Continuidad guest → registrado: si viene del chat invitado (flag pendiente), importa esa conversación
  // a una sesión real y ábrela ("sigue en el mismo chat"). Una sola vez. Fail-open: si falla, arranca normal.
  const claimedRef = useRef(false);
  useEffect(() => {
    if (!backendUrl || !accessToken || claimedRef.current) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem("jurovia_pending_guest_chat"); } catch { return; }
    if (!raw) return;
    claimedRef.current = true;
    // Continuidad sin fricción: suprime el onboarding y aterriza directo en el chat (venían del agente).
    try { localStorage.removeItem("jurovia_pending_guest_chat"); localStorage.setItem("juridica_onboarded", "1"); } catch { /* noop */ }
    setShowWizard(false);
    try {
      const { sid, gid } = JSON.parse(raw);
      if (sid) missionApi.claimGuest(backendUrl, accessToken, sid, gid).then((d: { session_id: string | null }) => {
        if (d?.session_id) { setChatKey((k) => k + 1); openConversation(d.session_id); }
      }).catch(() => {});
    } catch { /* noop */ }
  }, [backendUrl, accessToken]);

  const [upgradeTier, setUpgradeTier] = useState<string | null>(null);   // deep-link BOFU → UpgradeModal in-app pre-seleccionado
  const [meLoaded, setMeLoaded] = useState(false);                       // /api/me resuelto → accessModel confiable
  const [audienciaAutoOpen, setAudienciaAutoOpen] = useState(false);     // deep-link ?f=audiencias (paid) → abre el ▶ al montar

  // Deep-link de campaña de AUDIENCIAS (localStorage `jurovia_intent`="audiencias", desde la Landing).
  // Ramifica por plan cuando el modelo de acceso ya es confiable (meLoaded): paid → abre el modal ▶ de
  // audiencia directo; free/trial → abre el UpgradeModal (las horas de audiencia van por plan). Una sola
  // vez y se borra. Fail-open: sin flag no pasa nada; si algo falla, no rompe el arranque.
  const audIntentRef = useRef(false);
  useEffect(() => {
    if (!backendUrl || !accessToken || !meLoaded || audIntentRef.current) return;
    let intent: string | null = null;
    try { intent = localStorage.getItem("jurovia_intent"); } catch { return; }
    if (intent !== "audiencias") return;
    audIntentRef.current = true;
    try { localStorage.removeItem("jurovia_intent"); localStorage.setItem("juridica_onboarded", "1"); } catch { /* noop */ }
    setShowWizard(false);
    if (accessModel === "paid") { go("home"); setAudienciaAutoOpen(true); }   // cliente de pago → abre el ▶
    else setUpgradeTier("");                                                  // free/trial → muro de planes
  }, [backendUrl, accessToken, meLoaded, accessModel]);

  // Deep-link de correo (?ask=…) para usuario logueado/auto-logueado: siembra la pregunta de la campaña
  // en un chat nuevo (usa sus créditos, flujo normal). Una sola vez. Fail-open: si no hay flag, nada cambia.
  const askedRef = useRef(false);
  useEffect(() => {
    if (!backendUrl || !accessToken || askedRef.current) return;
    let ask: string | null = null;
    try { ask = localStorage.getItem("jurovia_pending_ask"); } catch { return; }
    if (!ask || !ask.trim()) return;
    askedRef.current = true;
    try { localStorage.removeItem("jurovia_pending_ask"); localStorage.setItem("juridica_onboarded", "1"); } catch { /* noop */ }
    setShowWizard(false);
    submitToChat(ask, "Pregunta");
  }, [backendUrl, accessToken]);

  // Tracker first-party en la app (instrumentación de activación). initTracker es idempotente (guard interno).
  useEffect(() => {
    if (backendUrl) { try { initTracker(backendUrl); } catch { /* fail-open */ } }
  }, [backendUrl]);

  // Deep-link al CASO (?caso=<JUR-XXXX>) → resuelve el código a un expediente y lo abre (motor de retención).
  // Una sola vez. Fail-open: si no resuelve, no pasa nada. Reusa /api/missions?q= (busca por código).
  const caseRef = useRef(false);
  useEffect(() => {
    if (!backendUrl || !accessToken || caseRef.current) return;
    let code: string | null = null;
    try { code = localStorage.getItem("jurovia_pending_case"); } catch { return; }
    if (!code || !code.trim()) return;
    caseRef.current = true;
    try { localStorage.removeItem("jurovia_pending_case"); localStorage.setItem("juridica_onboarded", "1"); } catch { /* noop */ }
    setShowWizard(false);
    (async () => {
      try {
        const r = await fetch(`${backendUrl}/api/missions?q=${encodeURIComponent(code!.trim())}&limit=1`,
          { headers: { Authorization: `Bearer ${accessToken}` } });
        const arr = r.ok ? await r.json() : [];
        if (Array.isArray(arr) && arr[0]?.id) openMission(arr[0].id);
      } catch { /* fail-open */ }
    })();
  }, [backendUrl, accessToken]);

  // Deep-link BOFU (/login?next=upgrade&plan=…) → abre el UpgradeModal in-app pre-seleccionado. Una sola
  // vez. Fail-open: sin flag, nada cambia. Aditivo — no toca el flujo de créditos ni el chat.
  const upgradeRef = useRef(false);
  useEffect(() => {
    if (!backendUrl || !accessToken || upgradeRef.current) return;
    let plan: string | null = null;
    try { plan = localStorage.getItem("jurovia_pending_upgrade"); } catch { return; }
    if (!plan) return;
    upgradeRef.current = true;
    try { localStorage.removeItem("jurovia_pending_upgrade"); } catch { /* noop */ }
    setUpgradeTier(plan === "select" ? "" : plan);   // "" = abre el modal en la selección de planes (sin pre-seleccionar)
  }, [backendUrl, accessToken]);

  // F1.3 — recientes reales desde el backend (/api/sessions). Si no hay, el sidebar muestra estado vacío (sin mock).
  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    let cancel = false;
    fetch(`${backendUrl}/api/sessions?limit=20`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancel || !Array.isArray(rows)) return;
        setRecents(rows.map((s: any) => ({ id: s.id, title: s.title || "Conversación" })));
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [backendUrl, accessToken, chatKey]);

  // F4 — Biblioteca real: documentos del org (/api/artifacts) + patrones (/api/patrones).
  // Solo data real; si está vacío, Library muestra su estado vacío (sin mock).
  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    let cancel = false;
    const auth = { Authorization: `Bearer ${accessToken}` };
    fetch(`${backendUrl}/api/artifacts?limit=60`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!cancel && Array.isArray(rows)) setLibDocs(rows.map(artifactToItem));
      })
      .catch(() => {});
    fetch(`${backendUrl}/api/patrones?limit=60`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!cancel && Array.isArray(rows)) setLibTemplates(rows.map(patronToItem));
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [backendUrl, accessToken, chatKey]);

  const width = useWidth();
  const narrow = width < 900;
  const mobile = width < 640;
  // F2 — drawer "Más" (accesos que no caben en la bottom-nav móvil).
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { if (!mobile) setMoreOpen(false); }, [mobile]);
  useEffect(() => {
    if (!moreOpen) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [moreOpen]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  useEffect(() => {
    if (narrow) setCollapsed(true);
  }, [narrow]);

  // F6.4 — Si esta ventana es el popup de OAuth de una integración (Composio redirige a
  // /chat?connected=1), ciérrala: el Settings padre detecta el cierre y sincroniza.
  useEffect(() => {
    if (typeof window !== "undefined" && window.opener && new URLSearchParams(window.location.search).get("connected")) {
      window.close();
    }
  }, []);

  function pushToast(text: string, kind = "info") {
    const id = ++toastId.current;
    setToasts((ts) => [...ts, { id, text, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3600);
  }

  function go(r: string) {
    setRoute(r);
  }

  function submitToChat(text: string, modeOverride?: string, documentIds?: string[]) {
    if ((!text || !text.trim()) && !(documentIds && documentIds.length)) return;
    const effectiveMode = modeOverride ?? mode;
    if (modeOverride) setMode(modeOverride);
    setReusePatronId(undefined);
    setReuseTitle(undefined);
    setOpenArtifact(undefined);
    setOpenSessionId(undefined);
    setChatMatterId(undefined);
    setChatSeed(text.trim());
    setChatSeedDocs(documentIds);
    setChatKey((k) => k + 1);
    setDraft("");
    // Modo "Documento" → Canvas (se vuelve split solo si se genera un documento).
    // Modo "Pregunta" → ChatView.
    setRoute(effectiveMode === "Documento" ? "canvas" : "chat");
  }

  // F4 — Reusar un patrón de la biblioteca: arma reuse_patron_id y abre el Canvas SIN ejecutar;
  // el usuario describe su caso y el agente parte del docx-js validado (solo cambia los datos).
  function reusePatron(it: LibraryItem) {
    setReusePatronId(it.patronId);
    setReuseTitle(it.title);
    setOpenArtifact(undefined);
    setChatSeed(undefined);
    setMode("Documento");
    setChatKey((k) => k + 1);
    setRoute("canvas");
    pushToast(`Plantilla «${it.title}» cargada · describe tu caso`, "primary");
  }

  // Abre un documento ya generado (desde el chat de una misión, p.ej.) en el Canvas editable.
  // El Canvas lo muestra y deja edit_artifact_id listo: las ediciones crean versiones nuevas.
  function openArtifactInCanvas(a: Artifact) {
    setOpenArtifact(a);
    setReusePatronId(undefined);
    setReuseTitle(undefined);
    setChatSeed(undefined);
    setChatSeedDocs(undefined);
    setOpenSessionId(undefined);
    setMode("Documento");
    setChatKey((k) => k + 1);
    setRoute("canvas");
  }

  // Abre una conversación existente desde 'Recientes' (carga su historial en ChatView).
  function openConversation(id: string) {
    setOpenSessionId(id);
    setChatSeed(undefined);
    setChatSeedDocs(undefined);
    setReusePatronId(undefined);
    setReuseTitle(undefined);
    setOpenArtifact(undefined);
    setChatMatterId(undefined);
    setChatKey((k) => k + 1);
    setRoute("chat");
  }

  function newDoc() {
    setDraft("");
    setChatSeed(undefined);
    setReusePatronId(undefined);
    setReuseTitle(undefined);
    setOpenSessionId(undefined);
    setRoute("home");
  }

  // Mission Control (F2)
  function openMission(id: string) {
    setCurrentMissionId(id);
    setRoute("expediente");
    try { track("case_opened", { id }); } catch { /* fail-open */ }
  }
  function newMission() {
    if (missionMode) setRoute("mission");
    else newDoc();
  }
  function openMissionChat(id: string, seed?: string, documentIds?: string[]) {
    setCurrentMissionId(id);
    setChatMatterId(id);
    setChatSeed(seed);
    setChatSeedDocs(documentIds);
    setOpenSessionId(undefined);
    setReusePatronId(undefined);
    setOpenArtifact(undefined);
    setMode("Documento");
    setChatKey((k) => k + 1);
    setRoute("chat");
  }

  // "Ver acta" desde la Bandeja: si el acta ya se generó (conversación persistida), abre ESA conversación
  // (muestra el acta como documento → Canvas, y queda en el historial). Si no, la genera al vuelo con la
  // transcripción pineada. Funciona con o sin misión.
  function openAudienciaActa(a: AudienciaJob) {
    if (a.acta_session_id) {
      openConversation(a.acta_session_id);   // conversación real con el acta ya lista
      return;
    }
    const title = a.title || "";
    const seed = `Genera el Acta Inteligente completa de la audiencia${title ? ` «${title}»` : ""} como documento: datos del proceso, participantes, línea de tiempo con los minutos exactos, decisiones y órdenes del juez, términos con sus fechas calculadas, verificación de las fuentes citadas y análisis estratégico.`;
    setCurrentMissionId(a.matter_id || undefined);
    setChatMatterId(a.matter_id || undefined);
    setChatSeed(seed);
    setChatSeedDocs(a.transcript_document_id ? [a.transcript_document_id] : undefined);
    setOpenSessionId(undefined);
    setReusePatronId(undefined);
    setOpenArtifact(undefined);
    setMode("Documento");
    setChatKey((k) => k + 1);
    setRoute("chat");
  }

  async function logout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }

  let main: React.ReactNode = null;
  if (missionMode && route === "home")
    main = <MissionControl backendUrl={backendUrl} accessToken={accessToken} email={email} onOpenMission={openMission} onNavigate={go} onNewMission={newMission} />;
  else if (missionMode && route === "expedientes")
    main = <Misiones backendUrl={backendUrl} accessToken={accessToken} onOpen={openMission} onNavigate={go} onNewMission={newMission} />;
  else if (missionMode && route === "expediente" && currentMissionId)
    main = <MissionDetail backendUrl={backendUrl} accessToken={accessToken} missionId={currentMissionId} onBack={() => go("expedientes")} onOpenChat={openMissionChat} onApprove={() => setApprovalOpen(true)} pushToast={pushToast} onOpenArtifact={openArtifactInCanvas} />;
  else if (missionMode && route === "mission")
    main = <NuevaMision backendUrl={backendUrl} accessToken={accessToken} onCreated={(id, prompt, docs) => { openMissionChat(id, prompt, docs); }} pushToast={pushToast} blocked={creditsBlocked} />;
  else if (route === "admin" && isAdmin)
    main = <AdminPanel backendUrl={backendUrl} accessToken={accessToken} pushToast={pushToast} />;
  else if (missionMode && route === "terminos")
    main = <Terminos backendUrl={backendUrl} accessToken={accessToken} onOpenMission={openMission} />;
  else if (missionMode && route === "autopilot")
    main = <Autopilot backendUrl={backendUrl} accessToken={accessToken} onOpenMission={openMission} onNavigate={go} pushToast={pushToast} />;
  else if (missionMode && route === "inbox")
    main = <Inbox backendUrl={backendUrl} accessToken={accessToken} onOpenMission={openMission} onOpenAudiencia={openAudienciaActa} pushToast={pushToast} />;
  else if (route === "home")
    main = (
      <Home
        onSubmit={submitToChat}
        onNavigate={go}
        draft={draft}
        setDraft={setDraft}
        mode={mode}
        setMode={setMode}
        jurisdiction={jurisdiction}
        setJurisdiction={setJurisdiction}
        backendUrl={backendUrl}
        accessToken={accessToken}
        blocked={creditsBlocked}
        audienciaOpen={audienciaAutoOpen}
        onAudienciaOpenChange={setAudienciaAutoOpen}
      />
    );
  else if (route === "chat")
    main = (
      <ChatView
        key={chatKey}
        backendUrl={backendUrl}
        accessToken={accessToken}
        initialMessage={chatSeed}
        initialDocumentIds={chatSeedDocs}
        loadSessionId={openSessionId}
        mode={mode}
        setMode={setMode}
        jurisdiction={jurisdiction}
        setJurisdiction={setJurisdiction}
        matterId={chatMatterId}
        blocked={creditsBlocked}
        onCredits={onCredits}
        onBlocked={onBlocked}
        onOpenArtifact={openArtifactInCanvas}
        onOpenActa={openConversation}
      />
    );
  else if (route === "canvas")
    main = (
      <Canvas
        key={chatKey}
        backendUrl={backendUrl}
        accessToken={accessToken}
        initialMessage={chatSeed}
        initialDocumentIds={chatSeedDocs}
        reusePatronId={reusePatronId}
        reuseTitle={reuseTitle}
        openArtifact={openArtifact}
        narrow={narrow}
        pushToast={pushToast}
        blocked={creditsBlocked}
        onCredits={onCredits}
        onBlocked={onBlocked}
      />
    );
  else if (route === "library")
    main = (
      <Library
        initialTab="library"
        docs={libDocs}
        templates={libTemplates}
        onNavigate={go}
        backendUrl={backendUrl}
        accessToken={accessToken}
        onReuse={(it: LibraryItem) => {
          // Patrón real → reuse_patron_id (flywheel). Documento sin patrón → prompt normal.
          if (it.patronId) reusePatron(it);
          else submitToChat("Genera un nuevo documento partiendo de «" + it.title + "» con los datos de mi caso.");
        }}
      />
    );
  else if (route === "templates")
    main = (
      <Library
        initialTab="templates"
        docs={libDocs}
        templates={libTemplates}
        onNavigate={go}
        onReuse={(it: LibraryItem) => {
          if (it.patronId) reusePatron(it);
          else submitToChat("Reusar plantilla de la firma: " + it.title);
        }}
      />
    );
  else if (route === "cases")
    main = (
      <EmptyState
        icon="folder"
        title="Casos / Matters"
        desc="Agrupa documentos, verificaciones y conversaciones por caso para mantener todo defendible ante el cliente."
        cta="Crear primer caso"
        onCta={() => pushToast("Función de Casos próximamente", "info")}
      />
    );
  else if (route === "settings") main = <Settings pushToast={pushToast} onLogout={logout} backendUrl={backendUrl} accessToken={accessToken} email={email} credits={credits} isAdmin={isAdmin} accessModel={accessModel} />;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {!mobile && <Sidebar route={route} onNavigate={go} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onNew={missionMode ? newMission : newDoc} onOpenCommand={() => setCmdOpen(true)} email={email} recents={recents} onOpenRecent={openConversation} missionMode={missionMode} credits={credits} creditsBlocked={creditsBlocked} isAdmin={isAdmin} onFeedback={() => setFeedbackOpen(true)} onInvite={() => setReferralOpen(true)} onUpgrade={isAdmin ? undefined : () => setUpgradeTier("")} />}
      <main style={{ flex: 1, minWidth: 0, height: "100dvh", position: "relative", display: "flex", flexDirection: "column" }}>
        {!betaDismissed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 16px", background: "var(--primary-soft)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <Icon name="sparkles" size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 500, flex: 1, minWidth: 0 }}>
              Estás en la <strong style={{ color: "var(--primary)" }}>BETA</strong> — tu feedback la mejora.
            </span>
            <button onClick={() => setFeedbackOpen(true)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Enviar feedback</button>
            <button onClick={dismissBeta} title="Cerrar" style={{ border: "none", background: "transparent", color: "var(--text-muted)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        {mobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <button onClick={() => go("home")} style={{ background: "none", border: "none", padding: 0 }}>
              <Logo size={28} withText />
            </button>
            <span style={{ flex: 1 }} />
            <button onClick={() => setCmdOpen(true)} className="btn-ghost" style={{ border: "none", width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-secondary)" }}>
              <Icon name="search" size={19} />
            </button>
            <button onClick={newDoc} className="btn-primary" style={{ border: "none", width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center" }}>
              <Icon name="plus" size={19} stroke={2.2} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, maxHeight: "100dvh", overflow: "auto" }}>{main}</div>
        {mobile && (
          <nav className="safe-bottom" style={{ display: "flex", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            {(
              missionMode
                ? [
                    ["home", "Inicio", "target", () => go("home")],
                    ["expedientes", "Misiones", "folder", () => go("expedientes")],
                    ["terminos", "Términos", "calendarClock", () => go("terminos")],
                    ["inbox", "Bandeja", "bell", () => go("inbox")],
                    ["__more", "Más", "menu", () => setMoreOpen(true)],
                  ]
                : [
                    ["home", "Inicio", "message", () => go("home")],
                    ["library", "Biblioteca", "book", () => go("library")],
                    ["templates", "Plantillas", "template", () => go("templates")],
                    ["cases", "Casos", "folder", () => go("cases")],
                    ["__more", "Más", "menu", () => setMoreOpen(true)],
                  ]
            ).map(([id, label, ic, onClick]) => {
              const active = id === "__more" ? moreOpen : (id === "expedientes" ? route === "expedientes" || route === "expediente" : route === id);
              return (
                <button key={id as string} onClick={onClick as () => void} style={{ flex: 1, minHeight: 44, border: "none", background: "transparent", padding: "8px 0 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "var(--primary)" : "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>
                  <Icon name={ic as string} size={20} stroke={1.7} />
                  {label as string}
                </button>
              );
            })}
          </nav>
        )}
      </main>

      {/* F2 — Drawer "Más" (móvil): accesos que no caben en la bottom-nav. */}
      {mobile && moreOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80 }}>
          <div onClick={() => setMoreOpen(false)} className="fade-in" style={{ position: "absolute", inset: 0, background: "rgba(13,19,32,0.42)" }} />
          <div className="fade-up safe-bottom" style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "var(--bg-surface)", borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: "var(--sh-3)", padding: "10px 14px 16px", maxHeight: "80dvh", overflow: "auto" }}>
            <div style={{ width: 38, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "4px auto 12px" }} />
            <div style={{ display: "flex", alignItems: "center", padding: "0 4px 8px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", flex: 1 }}>Más</span>
              <button onClick={() => setMoreOpen(false)} className="tap44" style={{ border: "none", background: "transparent", color: "var(--text-muted)", display: "grid", placeItems: "center", borderRadius: 9 }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            {/* Historial de chats accesible en móvil (antes solo estaba en el Sidebar de desktop). */}
            {recents.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "0 4px 6px" }}>Chats recientes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {recents.slice(0, 6).map((r) => (
                    <button key={r.id} onClick={() => { openConversation(r.id); setMoreOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", minHeight: 46, padding: "0 12px", borderRadius: "var(--r-md)", border: "none", background: "transparent", textAlign: "left", color: "var(--text)", fontSize: 14.5, fontWeight: 500 }}>
                      <Icon name="message" size={19} stroke={1.7} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
                      <Icon name="chevronRight" size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  ))}
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "12px 4px 4px" }} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(
                [
                  ...(missionMode
                    ? ([
                        ["autopilot", "Autopilot", "radar", () => go("autopilot")],
                        ["library", "Biblioteca", "book", () => go("library")],
                      ] as [string, string, string, () => void][])
                    : []),
                  ...(isAdmin ? [] : ([["__upgrade", "Mejora tu plan", "sparkles", () => setUpgradeTier("")]] as [string, string, string, () => void][])),
                  ["settings", "Ajustes", "settings", () => go("settings")],
                  ...(isAdmin ? ([["admin", "Admin", "shieldCheck", () => go("admin")]] as [string, string, string, () => void][]) : []),
                  ["__feedback", "Enviar feedback", "message", () => setFeedbackOpen(true)],
                  ["__invite", "Invitar y ganar", "gift", () => setReferralOpen(true)],
                ] as [string, string, string, () => void][]
              ).map(([id, label, ic, action]) => (
                <button
                  key={id}
                  onClick={() => { action(); setMoreOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", minHeight: 48, padding: "0 12px", borderRadius: "var(--r-md)", border: "none", background: "transparent", textAlign: "left", color: "var(--text)", fontSize: 15, fontWeight: 550 }}
                >
                  <Icon name={ic} size={20} stroke={1.7} style={{ color: "var(--text-secondary)" }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <Icon name="chevronRight" size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={go}
        onNew={newDoc}
        recents={recents}
        onOpenRecent={openConversation}
        onStart={(prompt, m) => {
          // Funciona en ambos modos (clásico y Mission Control): abre un chat/canvas.
          const p = (prompt || "").trim();
          if (p) {
            // Con instrucción → siembra el chat (el agente arranca el borrador/intake).
            submitToChat(prompt, m);
            return;
          }
          // Sin instrucción → abre un chat en blanco para que el usuario escriba.
          if (m) setMode(m);
          setChatSeed(undefined);
          setChatSeedDocs(undefined);
          setReusePatronId(undefined);
          setReuseTitle(undefined);
          setOpenArtifact(undefined);
          setOpenSessionId(undefined);
          setChatMatterId(undefined);
          setChatKey((k) => k + 1);
          setRoute("chat");
        }}
      />
      {showWizard && <Wizard backendUrl={backendUrl} accessToken={accessToken} onClose={closeWizard} />}
      {approvalOpen && <ApprovalModal backendUrl={backendUrl} accessToken={accessToken} onClose={() => setApprovalOpen(false)} pushToast={pushToast} />}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={(comment, kind) => missionApi.submitFeedback(backendUrl, accessToken, { kind: kind || "general", comment, context: { where: "sidebar" } })}
      />
      <ReferralModal open={referralOpen} onClose={() => setReferralOpen(false)} backendUrl={backendUrl} accessToken={accessToken} />
      {creditsPopup && (
        <OutOfCreditsPopup
          backendUrl={backendUrl}
          accessToken={accessToken}
          accessModel={accessModel}
          onClose={() => setCreditsPopup(false)}
        />
      )}
      <UpgradeModal
        open={upgradeTier !== null}
        initialTier={upgradeTier || undefined}
        currentTier={currentTier}
        onClose={() => setUpgradeTier(null)}
        backendUrl={backendUrl}
        accessToken={accessToken}
      />
      <Toasts items={toasts} />
    </div>
  );
}

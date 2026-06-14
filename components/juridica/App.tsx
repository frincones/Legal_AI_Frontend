"use client";

import { useState, useEffect, useRef } from "react";
import { Icon, Logo } from "./icons";
import { Toasts, CommandPalette, EmptyState, type Toast } from "./atoms";
import { Sidebar } from "./shell";
import { Home, Library, Settings } from "./screens";
import { ChatView } from "./ChatView";
import { Canvas, type Artifact } from "./Canvas";
import { Wizard } from "./Wizard";
import type { LibraryItem } from "./data";
import { createClient } from "@/lib/supabase/client";
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
import { api as missionApi } from "./mission/data";

// Admins con créditos ilimitados (debe coincidir con ADMIN_EMAILS del backend).
const ADMIN_EMAILS = ["freddy.rincones@gmail.com", "freddyrincones@gmail.com"];

// F4 · mapeo de datos reales del backend → LibraryItem (modelo del diseño).
const ACCENTS = ["#5B4DE3", "#21A8C7", "#C98A14", "#16A34A", "#DC2626", "#2563EB"];
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
  const [credits, setCreditsState] = useState<{ balance: number | null; cap: number | null }>({ balance: null, cap: null });
  const creditsBlocked = !isAdmin && credits.balance != null && credits.balance <= 0;
  const [currentMissionId, setCurrentMissionId] = useState<string | undefined>(undefined);
  const [chatMatterId, setChatMatterId] = useState<string | undefined>(undefined);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const toastId = useRef(0);

  // Lee el flag mission_control de la org (aditivo). Si está off, el UI clásico queda idéntico.
  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    missionApi.me(backendUrl, accessToken).then((m) => setMissionMode(!!m?.features?.mission_control)).catch(() => {});
    missionApi.credits(backendUrl, accessToken).then((c) => setCreditsState({ balance: c.balance, cap: c.cap })).catch(() => {});
  }, [backendUrl, accessToken]);

  // El runner emite el nuevo saldo tras cada acción del agente → actualiza el pill + toast al 10%.
  function onCredits(info: { balance?: number | null; cap?: number | null; low?: boolean }) {
    if (info.balance == null) return;
    setCreditsState((c) => ({ balance: info.balance ?? c.balance, cap: info.cap ?? c.cap }));
    if (info.low && !isAdmin) pushToast(`Te quedan ${info.balance} créditos. Se renuevan el día 1.`, "warning");
  }
  function onBlocked() {
    setCreditsState((c) => ({ balance: 0, cap: c.cap }));
    pushToast("Sin créditos: el agente quedó bloqueado. Recarga o espera la renovación.", "warning");
  }

  // F6.3 — Wizard de onboarding: solo la primera vez (flag en localStorage) y nunca en el popup OAuth.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPopup = !!window.opener && !!new URLSearchParams(window.location.search).get("connected");
    if (!isPopup && backendUrl && accessToken && !localStorage.getItem("juridica_onboarded")) {
      setShowWizard(true);
    }
  }, [backendUrl, accessToken]);

  function closeWizard() {
    try {
      localStorage.setItem("juridica_onboarded", "1");
    } catch {
      /* ignore */
    }
    setShowWizard(false);
  }

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
  const mobile = width < 720;

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
    main = <Inbox backendUrl={backendUrl} accessToken={accessToken} onOpenMission={openMission} pushToast={pushToast} />;
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
  else if (route === "settings") main = <Settings pushToast={pushToast} onLogout={logout} backendUrl={backendUrl} accessToken={accessToken} email={email} credits={credits} isAdmin={isAdmin} />;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {!mobile && <Sidebar route={route} onNavigate={go} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onNew={missionMode ? newMission : newDoc} email={email} recents={recents} onOpenRecent={openConversation} missionMode={missionMode} credits={credits} creditsBlocked={creditsBlocked} isAdmin={isAdmin} />}
      <main style={{ flex: 1, minWidth: 0, height: "100dvh", position: "relative", display: "flex", flexDirection: "column" }}>
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
          <nav style={{ display: "flex", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            {(
              [
                ["home", "Inicio", "message"],
                ["library", "Biblioteca", "book"],
                ["templates", "Plantillas", "template"],
                ["settings", "Ajustes", "settings"],
              ] as [string, string, string][]
            ).map(([id, label, ic]) => (
              <button key={id} onClick={() => go(id)} style={{ flex: 1, border: "none", background: "transparent", padding: "9px 0 11px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: route === id ? "var(--primary)" : "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>
                <Icon name={ic} size={20} stroke={1.7} />
                {label}
              </button>
            ))}
          </nav>
        )}
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={go} onNew={newDoc} />
      {showWizard && <Wizard backendUrl={backendUrl} accessToken={accessToken} onClose={closeWizard} />}
      {approvalOpen && <ApprovalModal backendUrl={backendUrl} accessToken={accessToken} onClose={() => setApprovalOpen(false)} pushToast={pushToast} />}
      <Toasts items={toasts} />
    </div>
  );
}

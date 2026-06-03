"use client";

import { useState, useEffect, useRef } from "react";
import { Icon, Logo } from "./icons";
import { Toasts, CommandPalette, EmptyState, type Toast } from "./atoms";
import { Sidebar } from "./shell";
import { Home, Library, Settings } from "./screens";
import { ChatView } from "./ChatView";
import { Canvas } from "./Canvas";
import type { LibraryItem } from "./data";
import { createClient } from "@/lib/supabase/client";

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
  accessToken,
  email,
}: {
  backendUrl: string;
  accessToken: string;
  email: string | null;
}) {
  const [route, setRoute] = useState<string>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("Documento");
  const [jurisdiction, setJurisdiction] = useState("Colombia · Nacional");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);
  const [recents, setRecents] = useState<{ id: string; title: string }[]>([]);
  const [libDocs, setLibDocs] = useState<LibraryItem[]>([]);
  const [libTemplates, setLibTemplates] = useState<LibraryItem[]>([]);
  const [reusePatronId, setReusePatronId] = useState<string | undefined>(undefined);
  const toastId = useRef(0);

  // F1.3 — recientes reales desde el backend (/api/sessions). Aditivo; si falla, el sidebar usa el mock.
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
  // Aditivo; si falla o está vacío, Library cae al mock del diseño.
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

  function pushToast(text: string, kind = "info") {
    const id = ++toastId.current;
    setToasts((ts) => [...ts, { id, text, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3600);
  }

  function go(r: string) {
    setRoute(r);
  }

  function submitToChat(text: string, modeOverride?: string) {
    if (!text || !text.trim()) return;
    const effectiveMode = modeOverride ?? mode;
    if (modeOverride) setMode(modeOverride);
    setReusePatronId(undefined);
    setChatSeed(text.trim());
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
    setChatSeed(undefined);
    setMode("Documento");
    setChatKey((k) => k + 1);
    setRoute("canvas");
    pushToast(`Plantilla «${it.title}» cargada · describe tu caso`, "primary");
  }

  function newDoc() {
    setDraft("");
    setChatSeed(undefined);
    setReusePatronId(undefined);
    setRoute("home");
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
  if (route === "home")
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
      />
    );
  else if (route === "chat")
    main = (
      <ChatView
        key={chatKey}
        backendUrl={backendUrl}
        accessToken={accessToken}
        initialMessage={chatSeed}
        mode={mode}
        setMode={setMode}
        jurisdiction={jurisdiction}
        setJurisdiction={setJurisdiction}
      />
    );
  else if (route === "canvas")
    main = (
      <Canvas
        key={chatKey}
        backendUrl={backendUrl}
        accessToken={accessToken}
        initialMessage={chatSeed}
        reusePatronId={reusePatronId}
        narrow={narrow}
        pushToast={pushToast}
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
  else if (route === "settings") main = <Settings pushToast={pushToast} onLogout={logout} backendUrl={backendUrl} accessToken={accessToken} />;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {!mobile && <Sidebar route={route} onNavigate={go} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onNew={newDoc} email={email} recents={recents} />}
      <main style={{ flex: 1, minWidth: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
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
        <div style={{ flex: 1, minHeight: 0 }}>{main}</div>
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
      <Toasts items={toasts} />
    </div>
  );
}

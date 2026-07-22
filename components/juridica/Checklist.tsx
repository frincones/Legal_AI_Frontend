"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icons";

const DISMISS_KEY = "jurovia_checklist_dismissed";

type Step = {
  id: number;
  label: string;
  desc: string;
  done: boolean;
  onClick: () => void;
};

/* Checklist de activación discreto y colapsable. Lee endpoints existentes (read-only) para
   calcular el progreso. Se oculta si los 4 pasos están completos o si el usuario lo descarta. */
export function Checklist({
  backendUrl,
  accessToken,
  onNavigate,
  onStart,
}: {
  backendUrl?: string;
  accessToken?: string;
  onNavigate: (r: string) => void;
  onStart?: (prompt: string, mode?: string) => void;
}) {
  const [dismissed, setDismissed] = useState(true); // arranca oculto hasta comprobar localStorage
  const [open, setOpen] = useState(true);
  const [progress, setProgress] = useState<{ chat: boolean; doc: boolean; caso: boolean; correo: boolean }>({
    chat: false,
    doc: false,
    caso: false,
    correo: false,
  });

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!backendUrl || !accessToken) return;
    let cancel = false;
    const auth = { Authorization: `Bearer ${accessToken}` };

    async function readBool(url: string, check: (data: any) => boolean): Promise<boolean> {
      try {
        const r = await fetch(`${backendUrl}${url}`, { headers: auth });
        if (!r.ok) return false;
        const d = await r.json();
        return check(d);
      } catch {
        return false;
      }
    }

    (async () => {
      const [chat, doc, caso, correo] = await Promise.all([
        readBool("/api/sessions?limit=1", (d) => Array.isArray(d) && d.length > 0),
        readBool("/api/artifacts?limit=1", (d) => Array.isArray(d) && d.length > 0),
        readBool("/api/missions", (d) => Array.isArray(d) && d.length > 0),
        readBool("/api/integrations", (d) => Array.isArray(d?.available) && d.available.some((i: any) => i?.connected)),
      ]);
      if (!cancel) setProgress({ chat, doc, caso, correo });
    })();

    return () => {
      cancel = true;
    };
  }, [backendUrl, accessToken]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  const steps: Step[] = [
    {
      id: 1,
      label: "Haz tu primera consulta",
      desc: "Pregúntale algo legal a Jurovia.",
      done: progress.chat,
      onClick: () => {
        onStart?.("", "Pregunta");
      },
    },
    {
      id: 2,
      label: "Genera tu primer documento",
      desc: "Redacta una tutela, demanda o contrato.",
      done: progress.doc,
      onClick: () => {
        onStart?.("Redacta ", "Documento");
      },
    },
    {
      id: 3,
      label: "Crea o sube un caso",
      desc: "Un expediente con cronología y documentos.",
      done: progress.caso,
      onClick: () => onNavigate("expedientes"),
    },
    {
      id: 4,
      label: "Conecta tu correo",
      desc: "Para que Jurovia vigile tus juzgados.",
      done: progress.correo,
      onClick: () => onNavigate("settings"),
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;

  // Oculto si descartado o si los 4 pasos están completos.
  if (dismissed || completed >= total) return null;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 24 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="sparkles" size={17} style={{ color: "var(--primary)" }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 650, color: "var(--text)" }}>
            Primeros pasos ({completed}/{total})
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Pon en marcha tu firma con Jurovia.</div>
        </div>
        <Icon name="chevronDown" size={17} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          {/* Barra de progreso */}
          <div style={{ height: 6, borderRadius: 999, background: "var(--bg-elevated-2)", overflow: "hidden", margin: "0 4px 12px" }}>
            <div style={{ height: "100%", width: `${(completed / total) * 100}%`, background: "var(--aurora)", borderRadius: 999, transition: "width .3s" }} />
          </div>
          {steps.map((s) => (
            <button
              key={s.id}
              onClick={s.onClick}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 10px", border: "none", borderRadius: "var(--r-sm)", background: "transparent", textAlign: "left", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  background: s.done ? "var(--success-soft)" : "transparent",
                  border: s.done ? "none" : "1.5px solid var(--border-strong)",
                  color: "var(--success)",
                }}
              >
                {s.done && <Icon name="check" size={13} stroke={2.6} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: s.done ? "var(--text-muted)" : "var(--text)", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.desc}</div>
              </div>
              {!s.done && <Icon name="arrowRight" size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
            </button>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={dismiss} style={{ color: "var(--text-muted)" }}>
              Ocultar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

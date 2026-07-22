"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icons";

/* Hook: devuelve [shouldShow, dismiss] para mostrar algo solo la primera vez.
   Persiste en localStorage con la key `jurovia_coach_<key>`. Backward-compatible:
   si localStorage no está disponible, simplemente no muestra (fail-safe). */
export function useFirstVisit(key: string): [boolean, () => void] {
  const storageKey = `jurovia_coach_${key}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setShow(true);
    } catch {
      /* sin localStorage → no mostrar */
    }
  }, [storageKey]);

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return [show, dismiss];
}

/* Banner discreto, no bloqueante, descartable. Se coloca arriba del contenido del módulo. */
export function Coachmark({
  show,
  title,
  body,
  icon = "sparkles",
  onDismiss,
}: {
  show: boolean;
  title: string;
  body: string;
  icon?: string;
  onDismiss: () => void;
}) {
  if (!show) return null;
  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 14px",
        marginBottom: 18,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border)",
        background: "var(--grad-aurora-soft)",
        boxShadow: "var(--sh-1)",
      }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--aurora)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} style={{ color: "#fff" }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{body}</div>
      </div>
      <button
        className="btn btn-ghost btn-sm"
        onClick={onDismiss}
        style={{ flexShrink: 0, color: "var(--text-secondary)" }}
      >
        Entendido
      </button>
    </div>
  );
}

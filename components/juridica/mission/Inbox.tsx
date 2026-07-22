/* Inbox Jurídico — feed de lo que Autopilot detectó/preparó (notificaciones reales). */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api } from "./data";
import { EmptyState } from "../atoms";
import { Coachmark, useFirstVisit } from "../Coachmark";

type Notif = { id: string; title: string; body: string; campaign_type: string; related_matter_id: string | null; read_at: string | null; created_at: string };

const META: Record<string, { icon: string; color: string; bg: string }> = {
  actuacion: { icon: "gavel", color: "var(--gold)", bg: "var(--gold-soft)" },
  draft_ready: { icon: "fileText", color: "var(--primary)", bg: "var(--primary-soft)" },
  missing_doc: { icon: "paperclip", color: "var(--gold-text)", bg: "var(--gold-soft)" },
  deadline: { icon: "calendarClock", color: "var(--danger)", bg: "var(--danger-soft)" },
};

export function Inbox({
  backendUrl, accessToken, onOpenMission, pushToast,
}: {
  backendUrl: string; accessToken: string; onOpenMission: (id: string) => void; pushToast: (t: string, k?: string) => void;
}) {
  const [items, setItems] = useState<Notif[]>([]);
  const load = useCallback(() => { if (backendUrl && accessToken) api.notifications(backendUrl, accessToken).then(setItems); }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);
  const unread = items.filter((i) => !i.read_at).length;
  const [coachShow, coachDismiss] = useFirstVisit("inbox");

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div className="app-pad" style={{ maxWidth: 820, margin: "0 auto" }}>
        <Coachmark
          show={coachShow}
          onDismiss={coachDismiss}
          icon="bell"
          title="Tu bandeja jurídica"
          body="Aquí llegan tus alertas y borradores listos para aprobar."
        />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="bell" size={24} style={{ color: "var(--primary)" }} /></span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 className="h2-fluid" style={{ fontWeight: 650, margin: 0 }}>Bandeja jurídica</h1>
            <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: 14.5 }}>Todo lo que Autopilot detectó, preparó o necesita de ti — en un solo lugar.</p>
          </div>
          {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={async () => { await api.markAllRead(backendUrl, accessToken); load(); pushToast("Marcadas como leídas", "info"); }}><Icon name="check" size={14} />Marcar leídas ({unread})</button>}
        </div>

        {items.length > 0 ? (
          <div className="card" style={{ overflow: "hidden" }}>
            {items.map((n, i) => {
              const m = META[n.campaign_type] || { icon: "info", color: "var(--primary)", bg: "var(--primary-soft)" };
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: i === items.length - 1 ? "none" : "1px solid var(--border)", background: n.read_at ? "transparent" : "var(--primary-soft-2)" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={m.icon} size={18} style={{ color: m.color }} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.body}</div>
                  </div>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0 }}>{(n.created_at || "").slice(5, 10)}</span>
                  {n.related_matter_id && <button className="btn btn-secondary btn-sm" onClick={() => onOpenMission(n.related_matter_id!)}>Ver<Icon name="arrowRight" size={14} /></button>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ minHeight: 320 }}>
            <EmptyState
              icon="bell"
              title="Bandeja al día"
              desc="Aquí llegarán tus alertas y borradores listos para aprobar: un correo del juzgado, un borrador preparado o algo que falte del cliente."
            />
          </div>
        )}
      </div>
    </div>
  );
}

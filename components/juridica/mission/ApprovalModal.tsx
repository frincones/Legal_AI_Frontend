/* Centro de aprobación (F3): revisa un borrador y decide. */
"use client";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type ApprovalItem } from "./data";
import { ConfirmNote } from "./atoms";

export function ApprovalModal({
  backendUrl, accessToken, onClose, pushToast, onDecided,
}: {
  backendUrl: string; accessToken: string;
  onClose: () => void; pushToast: (t: string, k?: string) => void; onDecided?: () => void;
}) {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (backendUrl && accessToken) api.approvals(backendUrl, accessToken).then((rows) => { setItems(rows); setIdx(0); });
  }, [backendUrl, accessToken]);

  const cur = items[idx];

  async function decide(decision: string, label: string, kind = "info") {
    if (!cur) return;
    const res = await api.decide(backendUrl, accessToken, cur.id, decision);
    const warnings = res?.source_warnings || [];
    if (decision === "approve" && warnings.length > 0) {
      const w = warnings[0];
      pushToast(`⚠️ Aprobado, pero ${w.consulta} cambió a "${w.nuevo}". Revísala antes de radicar.`, "warning");
    } else {
      pushToast(label, kind);
    }
    const rest = items.filter((_, i) => i !== idx);
    setItems(rest);
    setIdx(0);
    onDecided?.();
    if (rest.length === 0) onClose();
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 280, background: "rgba(10,13,20,0.5)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: 640, maxWidth: "94vw", maxHeight: "90vh", background: "var(--bg-surface)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-3)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={18} style={{ color: "var(--primary)" }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 650, fontSize: 15 }}>{cur ? "Juridica preparó un borrador" : "Sin borradores pendientes"}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{cur ? cur.title || cur.kind : "Todo aprobado"}{items.length > 1 ? ` · ${idx + 1}/${items.length}` : ""}</div>
          </div>
          <button onClick={onClose} className="btn-ghost focus-ring" style={{ border: "none", width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-muted)" }}><Icon name="x" size={17} /></button>
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", background: "var(--bg-elevated-2)", padding: "22px 24px", minHeight: 200 }}>
          {cur ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "var(--sh-2)", padding: "30px 34px", fontFamily: "var(--font-doc)", color: "#15110B", fontSize: 14.5, lineHeight: 1.7 }}>
              <p style={{ textAlign: "center", fontWeight: 700, margin: "0 0 6px" }}>{cur.title || "Documento"}</p>
              <p style={{ color: "#6B5E4A", margin: "0 0 16px", fontSize: 13, textAlign: "center" }}>Borrador preparado por Juridica · pendiente de tu aprobación</p>
              <p style={{ margin: 0, textAlign: "justify", color: "#55493a" }}>
                {String((cur.payload && (cur.payload.summary as string)) || "El documento está listo en el expediente. Ábrelo en el editor para revisarlo en detalle, o apruébalo para continuar.")}
              </p>
            </div>
          ) : (
            <div style={{ height: 160, display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 14 }}>No hay nada pendiente de aprobar.</div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ConfirmNote>Tú confirmas siempre. Nada se radica sin tu visto bueno.</ConfirmNote>
          <span style={{ flex: 1 }} />
          {cur && <>
            <button className="btn btn-secondary btn-sm" onClick={() => decide("rework", "Mejora solicitada", "primary")}><Icon name="sparkles" size={15} />Pedir mejora</button>
            <button className="btn btn-secondary btn-sm" onClick={() => decide("reject", "Borrador rechazado")}><Icon name="x" size={15} />Rechazar</button>
            <button className="btn btn-primary btn-sm" onClick={() => decide("approve", "Aprobado", "success")}><Icon name="check" size={15} stroke={2.4} />Aprobar</button>
          </>}
        </div>
      </div>
    </div>
  );
}

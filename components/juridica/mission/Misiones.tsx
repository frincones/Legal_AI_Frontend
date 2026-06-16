/* Lista de misiones. */
"use client";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type Mission } from "./data";
import { DeadlineChip, ProgressBar } from "./atoms";

export function Misiones({
  backendUrl, accessToken, onOpen, onNavigate, onNewMission,
}: {
  backendUrl: string; accessToken: string;
  onOpen: (id: string) => void; onNavigate: (r: string) => void; onNewMission: () => void;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  useEffect(() => {
    if (backendUrl && accessToken) api.missions(backendUrl, accessToken).then(setMissions);
  }, [backendUrl, accessToken]);

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "34px 36px 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 650, letterSpacing: "-0.02em", margin: 0 }}>Misiones</h1>
            <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: 14.5 }}>Cada objetivo, con su avance y próxima acción.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("terminos")}><Icon name="calendarClock" size={15} />Ver vencimientos</button>
            <button className="btn btn-primary btn-sm" onClick={onNewMission}><Icon name="plus" size={15} stroke={2.2} />Nueva misión</button>
          </div>
        </div>

        {missions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {missions.map((e) => (
              <button key={e.id} onClick={() => onOpen(e.id)} className="card" style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 20px", textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: `${e.accent}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="folder" size={22} style={{ color: e.accent }} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 650, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 8px", flexShrink: 0 }}>{e.area}</span>
                  </div>
                  <div style={{ maxWidth: 360 }}><ProgressBar value={e.progress} accent={e.accent} height={5} /></div>
                  {e.nextBestAction?.label && <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}><Icon name="arrowRight" size={13} style={{ color: "var(--primary)" }} />{e.nextBestAction.label}</div>}
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{e.progress}%</div>
                  {e.nextTerm?.due && <DeadlineChip sev={e.nextTerm.severity}>{e.nextTerm.due}</DeadlineChip>}
                </div>
                <span className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>Continuar<Icon name="arrowRight" size={15} /></span>
              </button>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: "44px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Icon name="target" size={28} style={{ color: "var(--primary)" }} /></div>
            <div style={{ fontWeight: 650, fontSize: 16 }}>Aún no tienes misiones</div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4, marginBottom: 16 }}>Crea tu primera misión y Jurovia arma el expediente por ti.</div>
            <button className="btn btn-primary" onClick={onNewMission}><Icon name="plus" size={16} stroke={2.2} />Nueva misión</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Términos y vencimientos. */
"use client";
import { useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type Deadline } from "./data";
import { DeadlineChip, SEVERITY } from "./atoms";
import { EmptyState } from "../atoms";
import { Coachmark, useFirstVisit } from "../Coachmark";

export function Terminos({
  backendUrl, accessToken, onOpenMission,
}: {
  backendUrl: string; accessToken: string; onOpenMission: (id: string) => void;
}) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [range, setRange] = useState<"7" | "30">("30");
  const [coachShow, coachDismiss] = useFirstVisit("terminos");
  useEffect(() => {
    if (backendUrl && accessToken) api.deadlines(backendUrl, accessToken).then(setDeadlines);
  }, [backendUrl, accessToken]);

  const list = range === "7" ? deadlines.filter((d) => d.daysLeft !== null && d.daysLeft <= 7) : deadlines;

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div className="app-pad" style={{ maxWidth: 880, margin: "0 auto" }}>
        <Coachmark
          show={coachShow}
          onDismiss={coachDismiss}
          icon="calendarClock"
          title="Tus plazos, en un solo lugar"
          body="Tus plazos y vencimientos procesales, en un calendario. Cada término muestra su fundamento legal."
        />
        <div style={{ marginBottom: 22 }}>
          <h1 className="h2-fluid" style={{ fontWeight: 650, letterSpacing: "-0.02em", margin: 0 }}>Términos y vencimientos</h1>
          <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: 14.5 }}>Nunca pierdas un término. Cada uno muestra su fundamento legal.</p>
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated-2)", padding: 4, borderRadius: "var(--r-pill)", marginBottom: 22, width: "fit-content" }}>
          {([["7", "Esta semana"], ["30", "Próximos 30 días"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setRange(id)} style={{ border: "none", height: 34, padding: "0 16px", borderRadius: "var(--r-pill)", fontSize: 13.5, fontWeight: 600, background: range === id ? "var(--bg-surface)" : "transparent", color: range === id ? "var(--primary)" : "var(--text-secondary)", boxShadow: range === id ? "var(--sh-1)" : "none" }}>{label}</button>
          ))}
        </div>

        {list.length > 0 ? (
          <div className="card" style={{ overflow: "hidden" }}>
            {list.map((d, i) => {
              const m = SEVERITY[d.severity];
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderBottom: i === list.length - 1 ? "none" : "1px solid var(--border)" }}>
                  <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: m.dot, flexShrink: 0 }} />
                  <div style={{ width: 88, flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{d.when}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 3 }}>{d.title}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--primary)" }}><Icon name="scale" size={13} />{d.fundamento}</div>
                  </div>
                  <DeadlineChip sev={d.severity}>{d.confidence}</DeadlineChip>
                  <button className={`btn btn-sm ${d.severity === "critico" ? "btn-primary" : "btn-secondary"}`} onClick={() => d.expId && onOpenMission(d.expId)} style={{ flexShrink: 0 }}>{d.action}<Icon name="arrowRight" size={14} /></button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ minHeight: 300 }}>
            <EmptyState
              icon="calendarClock"
              title="Sin términos pendientes"
              desc="Tus plazos y vencimientos procesales aparecerán aquí, en un calendario. Cada uno mostrará su fundamento legal y tú confirmas siempre antes de actuar."
            />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 18, padding: "13px 16px", borderRadius: "var(--r-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <Icon name="info" size={16} style={{ color: "var(--primary)", marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>El cómputo es en <strong>días hábiles</strong> (CGP art. 118). Cada término muestra su fundamento legal y <strong>tú confirmas siempre</strong> antes de actuar.</span>
        </div>
      </div>
    </div>
  );
}

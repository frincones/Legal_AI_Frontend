"use client";
/* Motor de campañas — Admin: Contacto 360° · Segmentos · Journeys. Solo lectura + control de estado.
   Reusa el patrón de UI del admin (.card / .table-wrap / Kpi). Aditivo, aislado. */
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../icons";
import { api, type EngineContact, type EngineEnrollment, type EngineSegment, type EngineJourney, type EngineSend } from "./data";

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" }) : "—");
const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const LC_LABEL: Record<string, string> = { lead: "Lead", trial: "En prueba", customer: "Cliente", churned: "Se fue" };
const LC_COLOR: Record<string, string> = { lead: "var(--text-muted)", trial: "var(--primary)", customer: "var(--success, #16A34A)", churned: "var(--danger, #DC2626)" };
const TEMP: Record<string, { text: string; color: string; bg: string }> = {
  hot: { text: "🔴 Caliente", color: "#DC2626", bg: "rgba(220,38,38,.08)" },
  warm: { text: "🟡 Tibio", color: "#B45309", bg: "rgba(217,119,6,.10)" },
  cold: { text: "🔵 Frío", color: "#2563EB", bg: "rgba(37,99,235,.09)" },
};

function Chip({ text, color, bg }: { text: string; color: string; bg?: string }) {
  return <span style={{ fontSize: 11.5, fontWeight: 700, color, background: bg || "transparent", borderRadius: 999, padding: bg ? "3px 9px" : 0, whiteSpace: "nowrap" }}>{text}</span>;
}

/* ─────────────────────────── Contacto 360° ─────────────────────────── */
export function EngineContactsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [rows, setRows] = useState<EngineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [lc, setLc] = useState("");
  const [temp, setTemp] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ contact: EngineContact | null; enrollments: EngineEnrollment[]; sends: EngineSend[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.adminContacts(backendUrl, accessToken, q, lc, temp, 200).then((d) => { setRows(d.contacts); setLoading(false); });
  }, [backendUrl, accessToken, q, lc, temp]);
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);
  useEffect(() => {
    if (!sel) { setDetail(null); return; }
    api.adminContact360(backendUrl, accessToken, sel).then(setDetail);
  }, [sel, backendUrl, accessToken]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input className="input" placeholder="Buscar correo o nombre…" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: "7px 12px", fontSize: 13, minWidth: 220 }} />
        <select className="input" value={lc} onChange={(e) => setLc(e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }}>
          <option value="">Todo el ciclo</option><option value="lead">Lead</option><option value="trial">En prueba</option><option value="customer">Cliente</option><option value="churned">Se fue</option>
        </select>
        <select className="input" value={temp} onChange={(e) => setTemp(e.target.value)} style={{ padding: "7px 10px", fontSize: 13 }}>
          <option value="">Toda temperatura</option><option value="hot">🔴 Caliente</option><option value="warm">🟡 Tibio</option><option value="cold">🔵 Frío</option>
        </select>
        <span style={{ flex: 1 }} />
        <button onClick={load} className="btn btn-primary btn-sm"><Icon name="refresh" size={14} /> Actualizar</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ background: "var(--bg-elevated-2)" }}>
              {["Contacto", "Ciclo", "Temperatura", "Fuente", "Últ. actividad", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "9px 13px", fontWeight: 650, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>))}
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.email} style={{ cursor: "pointer" }} onClick={() => setSel(c.email)}>
                  <td style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600 }}>{c.full_name || c.email.split("@")[0]}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{c.email}{c.opted_out ? " · baja" : ""}</div>
                  </td>
                  <td style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)" }}><Chip text={LC_LABEL[c.lifecycle] || c.lifecycle} color={LC_COLOR[c.lifecycle] || "var(--text)"} /></td>
                  <td style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)" }}>{TEMP[c.temperature] ? <Chip {...TEMP[c.temperature]} /> : c.temperature}</td>
                  <td style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{c.source || "—"}</td>
                  <td style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{fmtDate(c.last_activity_at)}</td>
                  <td style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)", color: "var(--primary)", fontSize: 12 }}>Ver 360°</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin contactos. (Corre el job contacts_sync o enciende el motor.)</td></tr>}
              {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer 360° */}
      {sel && (
        <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,8,20,.42)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ width: "min(520px, 96vw)", height: "100%", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", overflowY: "auto", padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{detail?.contact?.full_name || sel.split("@")[0]}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{sel}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}><Icon name="x" size={16} /></button>
            </div>
            {detail?.contact && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <Chip text={LC_LABEL[detail.contact.lifecycle] || detail.contact.lifecycle} color={LC_COLOR[detail.contact.lifecycle] || "var(--text)"} bg="var(--bg-elevated)" />
                {TEMP[detail.contact.temperature] && <Chip {...TEMP[detail.contact.temperature]} />}
                {detail.contact.opted_out && <Chip text="Dado de baja" color="#DC2626" bg="rgba(220,38,38,.08)" />}
                {detail.contact.email_status && detail.contact.email_status !== "ok" && <Chip text={detail.contact.email_status} color="#B45309" bg="rgba(217,119,6,.10)" />}
              </div>
            )}
            <Section title="En qué campañas va">
              {(detail?.enrollments || []).length === 0 ? <Empty text="No está inscrito en ningún journey." /> : detail!.enrollments.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.journey_key}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Paso {e.current_step}{e.next_send_at ? ` · próximo ${fmtDT(e.next_send_at)}` : ""}{e.exit_reason ? ` · ${e.exit_reason}` : ""}</div>
                  </div>
                  <Chip text={e.status} color={e.status === "active" ? "var(--primary)" : e.status === "completed" ? "var(--success,#16A34A)" : "var(--text-muted)"} bg="var(--bg-elevated)" />
                </div>
              ))}
            </Section>
            <Section title="Historial de envíos">
              {(detail?.sends || []).length === 0 ? <Empty text="Aún no ha recibido correos." /> : detail!.sends.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.campaign_key}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDT(s.sent_at)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {s.opened_at && <Chip text="abrió" color="var(--success,#16A34A)" bg="rgba(22,163,74,.08)" />}
                    {s.clicked_at && <Chip text="clic" color="var(--primary)" bg="var(--primary-soft)" />}
                    {s.bounced_at && <Chip text="rebote" color="#DC2626" bg="rgba(220,38,38,.08)" />}
                    {s.entered_at && <Chip text="entró" color="#B7791F" bg="rgba(212,175,55,.12)" />}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 18 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>{title}</div>{children}</div>;
}
function Empty({ text }: { text: string }) { return <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 0" }}>{text}</div>; }

/* ─────────────────────────── Segmentos ─────────────────────────── */
export function EngineSegmentsTab({ backendUrl, accessToken }: { backendUrl: string; accessToken: string }) {
  const [segs, setSegs] = useState<EngineSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ count: number; sample: { email: string; lifecycle: string; temperature: string }[] } | null>(null);
  const load = useCallback(() => { setLoading(true); api.adminSegments(backendUrl, accessToken).then((d) => { setSegs(d.segments); setLoading(false); }); }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Segmentos dinámicos: la regla se evalúa contra los contactos en vivo.</div>
        <span style={{ flex: 1 }} />
        <button onClick={load} className="btn btn-primary btn-sm"><Icon name="refresh" size={14} /> Actualizar</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {segs.map((s) => (
          <div key={s.key} className="card" style={{ padding: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{s.name}</div>
              {s.kind === "system" && <Chip text="sistema" color="var(--text-muted)" bg="var(--bg-elevated)" />}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, minHeight: 32 }}>{s.description}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{s.count ?? "—"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>contactos</div>
              <span style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" style={{ fontSize: 11.5 }} onClick={() => api.adminSegmentPreview(backendUrl, accessToken, s.rule).then(setPreview)}>Ver muestra</button>
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando…</div>}
      </div>
      {preview && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Muestra · {preview.count} contactos</div>
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => setPreview(null)}><Icon name="x" size={15} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {preview.sample.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, alignItems: "center" }}>
                <span style={{ flex: 1 }}>{c.email}</span>
                <Chip text={LC_LABEL[c.lifecycle] || c.lifecycle} color={LC_COLOR[c.lifecycle] || "var(--text)"} />
                {TEMP[c.temperature] && <Chip {...TEMP[c.temperature]} />}
              </div>
            ))}
            {preview.sample.length === 0 && <Empty text="Ningún contacto cumple esta regla ahora." />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Journeys ─────────────────────────── */
export function EngineJourneysTab({ backendUrl, accessToken, pushToast }: { backendUrl: string; accessToken: string; pushToast?: (t: string, k?: string) => void }) {
  const [journeys, setJourneys] = useState<EngineJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); api.adminJourneys(backendUrl, accessToken).then((d) => { setJourneys(d.journeys); setLoading(false); }); }, [backendUrl, accessToken]);
  useEffect(() => { load(); }, [load]);

  const setStatus = (key: string, status: string) => {
    api.adminSetJourneyStatus(backendUrl, accessToken, key, status).then(() => { pushToast?.(`Journey ${status === "active" ? "activado" : status === "paused" ? "pausado" : "en borrador"}`, "success"); load(); });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Secuencias automáticas. Borrador/pausado = no envían. Activo = el motor los ejecuta.</div>
        <span style={{ flex: 1 }} />
        <button onClick={load} className="btn btn-primary btn-sm"><Icon name="refresh" size={14} /> Actualizar</button>
      </div>
      {journeys.map((j) => {
        const st = j.stats || {};
        const active = j.status === "active";
        return (
          <div key={j.key} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{j.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Entra: {j.entry_segment || "—"} · Sale: {j.exit_rule || "—"} · Prioridad {j.priority}</div>
              </div>
              <Chip text={active ? "● Activo" : j.status === "paused" ? "❙❙ Pausado" : "◦ Borrador"} color={active ? "var(--success,#16A34A)" : j.status === "paused" ? "#B45309" : "var(--text-muted)"} bg="var(--bg-elevated)" />
              {!active ? <button className="btn btn-primary btn-sm" onClick={() => setStatus(j.key, "active")}>Activar</button>
                : <button className="btn btn-secondary btn-sm" onClick={() => setStatus(j.key, "paused")}>Pausar</button>}
            </div>
            <div style={{ display: "flex", gap: 16, margin: "12px 0", flexWrap: "wrap" }}>
              {[["Activos", st.active || 0], ["Completados", st.completed || 0], ["Salieron", st.exited || 0], ["Total", j.total || 0]].map(([l, v], i) => (
                <div key={i}><div style={{ fontSize: 19, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{l}</div></div>
              ))}
            </div>
            {/* pasos + inscritos por paso */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {(j.steps || []).map((s) => (
                <div key={s.step_no} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, padding: "5px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--bg-elevated)", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{s.step_no}</span>
                  <span style={{ color: "var(--text-muted)", width: 48, fontSize: 11 }}>+{s.offset_days}d</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{(j.by_step || {})[s.step_no] || 0} aquí</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!loading && journeys.length === 0 && <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Sin journeys.</div>}
      {loading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando…</div>}
    </div>
  );
}

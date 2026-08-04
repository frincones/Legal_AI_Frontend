/* Detalle de la misión: header + tabs (Resumen / Actividad / Documentos) + acceso al chat. */
"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { ChatView } from "../ChatView";
import type { Artifact } from "../Canvas";
import { api, type Mission, type TimelineEvent, type TaskItem } from "./data";
import { ConfirmNote, ProgressBar, SectionLabel, SEVERITY } from "./atoms";

const TABS: [string, string, string][] = [
  ["resumen", "Resumen", "target"],
  ["actividad", "Actividad", "history"],
  ["documentos", "Documentos", "fileText"],
  ["config", "Configuración", "settings"],
];

type DocItem = { id: string; title: string; mime_type: string; ingest_status: string; created_at: string };

export function MissionDetail({
  backendUrl, accessToken, missionId, onBack, onOpenChat, onApprove, pushToast, onOpenArtifact,
}: {
  backendUrl: string; accessToken: string; missionId: string;
  onBack: () => void; onOpenChat: (id: string, seed?: string) => void; onApprove: () => void; pushToast: (t: string, k?: string) => void;
  onOpenArtifact?: (a: Artifact) => void;
}) {
  const [m, setM] = useState<Mission | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tab, setTab] = useState("resumen");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [outputs, setOutputs] = useState<{ id: string; title: string; kind: string; version_id?: string | null; date: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [radicado, setRadicadoInput] = useState("");
  const [form, setForm] = useState({ name: "", client: "", counterparty: "", jurisdiction: "", matter_type: "" });
  const [savingDatos, setSavingDatos] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const clean = (v?: string) => (v && v !== "—" ? v : "");

  useEffect(() => {
    if (!backendUrl || !accessToken || !missionId) return;
    api.mission(backendUrl, accessToken, missionId).then((mm) => {
      setM(mm); setRadicadoInput(mm?.radicado && mm.radicado !== "—" ? mm.radicado : "");
      setForm({ name: clean(mm?.title), client: clean(mm?.demandante), counterparty: clean(mm?.demandado), jurisdiction: clean(mm?.juzgado), matter_type: clean(mm?.area) });
    });
    api.timeline(backendUrl, accessToken, missionId).then(setTimeline);
    api.missionDocuments(backendUrl, accessToken, missionId).then(setDocs);
    api.missionOutputs(backendUrl, accessToken, missionId).then(setOutputs);
    api.tasks(backendUrl, accessToken, missionId).then((ts) => setTasks(ts.filter((t) => t.status !== "done" && t.status !== "cancelled")));
  }, [backendUrl, accessToken, missionId]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    pushToast(`Subiendo «${file.name}» e indexándolo…`, "primary");
    const r = await api.uploadDocument(backendUrl, accessToken, missionId, file);
    setUploading(false);
    if (e.target) e.target.value = "";
    if (r.document_id && r.ingest_status === "unreadable") {
      pushToast(`No pude leer «${file.name}». Súbelo en PDF o DOCX.`, "warning");
      api.missionDocuments(backendUrl, accessToken, missionId).then(setDocs);
    } else if (r.document_id && r.ingest_status === "converting") {
      pushToast(`Convirtiendo «${file.name}»… en unos segundos podrás preguntarle a tu caso`, "primary");
      api.missionDocuments(backendUrl, accessToken, missionId).then(setDocs);
    } else if (r.document_id) {
      pushToast(`«${file.name}» indexado (${r.chunks || 0} fragmentos) · ya puedes preguntarle a tu caso`, "success");
      api.missionDocuments(backendUrl, accessToken, missionId).then(setDocs);
    } else {
      pushToast(`No se pudo subir «${file.name}»${r.error ? ` (${r.error})` : ""}`, "warning");
    }
  }

  async function saveRadicado() {
    const v = radicado.trim().replace(/\D/g, "");
    if (!v) return;
    await api.updateMission(backendUrl, accessToken, missionId, { radicado: v, autopilot_on: true });
    pushToast("Radicado guardado · Autopilot vigilará este proceso", "success");
    api.mission(backendUrl, accessToken, missionId).then(setM);
  }

  async function toggleVigilancia(on: boolean) {
    await api.updateMission(backendUrl, accessToken, missionId, { autopilot_on: on });
    pushToast(on ? "Vigilancia reactivada · revisaremos el proceso a diario" : "Vigilancia pausada", on ? "success" : "info");
    api.mission(backendUrl, accessToken, missionId).then(setM);
  }

  async function saveDatos() {
    setSavingDatos(true);
    await api.updateMission(backendUrl, accessToken, missionId, {
      name: form.name, client: form.client, counterparty: form.counterparty,
      jurisdiction: form.jurisdiction, matter_type: form.matter_type });
    setSavingDatos(false);
    pushToast("Datos del caso actualizados", "success");
    api.mission(backendUrl, accessToken, missionId).then(setM);
  }

  async function doDelete() {
    if (!window.confirm("¿Eliminar este caso y TODOS sus datos (documentos, términos, tareas)? No se puede deshacer.")) return;
    const r = await api.deleteMission(backendUrl, accessToken, missionId);
    if (r.ok) { pushToast("Caso eliminado", "success"); onBack(); }
    else pushToast(`No se pudo eliminar${r.error ? ` (${r.error})` : ""}`, "warning");
  }

  if (!m || !m.id) return <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>Cargando misión…</div>;
  const nt = m.nextTerm;
  const falta = m.requirementsMap?.falta || [];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 22px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} className="btn-ghost focus-ring" style={{ border: "none", width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", color: "var(--text-secondary)" }}><Icon name="arrowLeft" size={18} /></button>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: `${m.accent}1a`, display: "grid", placeItems: "center" }}><Icon name="folder" size={19} style={{ color: m.accent }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 650, fontSize: 17 }}>{m.display || m.title}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 8px" }}>{m.area}</span>
              {m.code && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>{m.code}</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{m.juzgado}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onOpenChat(m.id)}><Icon name="message" size={15} />Trabajar en el chat</button>
        </div>
        {nt?.due && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14, padding: "10px 14px", borderRadius: "var(--r-md)", background: SEVERITY[nt.severity].bg, border: `1px solid ${SEVERITY[nt.severity].color}33` }}>
            <Icon name="calendarClock" size={18} style={{ color: SEVERITY[nt.severity].color }} />
            <span style={{ fontSize: 13.5 }}><strong>Próximo término:</strong> {nt.label} · vence {nt.due} <strong style={{ color: SEVERITY[nt.severity].color }}>({nt.daysLeft} días)</strong></span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "0 22px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        {TABS.map(([id, label, ic]) => (
          <button key={id} onClick={() => setTab(id)} style={{ position: "relative", height: 46, padding: "0 14px", border: "none", background: "transparent", color: tab === id ? "var(--primary)" : "var(--text-secondary)", fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name={ic} size={15} />{label}
            {tab === id && <span style={{ position: "absolute", left: 8, right: 8, bottom: 0, height: 2.5, background: "var(--aurora)", borderRadius: 3 }} />}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div className="no-scrollbar" style={{ flex: 1, minWidth: 0, overflow: "auto", background: "var(--bg-base)", padding: "22px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {tab === "resumen" && <>
            {m.nextBestAction?.label && (
              <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, borderColor: "var(--primary)", background: "var(--primary-soft-2)" }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={20} style={{ color: "#fff" }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--primary)" }}>Próxima acción</div>
                  <div style={{ fontWeight: 650, fontSize: 15.5 }}>{m.nextBestAction.label}</div>
                  {m.nextBestAction.hint && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{m.nextBestAction.hint}</div>}
                </div>
                <button className="btn btn-primary btn-sm" onClick={onApprove}>Revisar<Icon name="arrowRight" size={15} /></button>
              </div>
            )}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontWeight: 650, fontSize: 14.5, flex: 1 }}>Estado de la misión</span>
                {m.health && (
                  <span title={m.health.reason || ""} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)" }}>
                    <span style={{ width: 9, height: 9, borderRadius: 999, background: m.health.color === "rojo" ? "#DC2626" : m.health.color === "amarillo" ? "#C98A14" : "#16A34A" }} />
                    {m.health.reason}
                  </span>
                )}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--success)", background: "var(--success-soft)", borderRadius: 999, padding: "2px 10px" }}>{m.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 7 }}><span style={{ color: "var(--text-muted)" }}>Progreso</span><strong>{m.progress}%</strong></div>
              <ProgressBar value={m.progress} accent={m.accent} height={7} />
            </div>
            <div style={{ borderRadius: "var(--r-lg)", padding: 1.5, background: "var(--grad-aurora-soft)" }}>
              <div style={{ borderRadius: "calc(var(--r-lg) - 1.5px)", background: "var(--bg-surface)", padding: 18, display: "flex", gap: 13 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={17} style={{ color: "var(--primary)" }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>Recomendación de Jurovia</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                    {m.keyFacts || `El caso avanza (${m.progress}%). ${m.nextBestAction?.label ? `La siguiente acción es: ${m.nextBestAction.label.toLowerCase()}.` : "Revisa los datos faltantes para poder avanzar."} ${falta.length > 0 ? "Solicita lo que falta al cliente para evitar demoras." : "Las normas están verificadas."}`}
                  </div>
                  {m.nextBestAction?.label && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-sm btn-primary" onClick={onApprove}><Icon name="check" size={14} />{m.nextBestAction.kind === "approval" ? "Revisar borrador" : "Continuar"}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {falta.length > 0 && (
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Icon name="square" size={16} style={{ color: "var(--gold)" }} /><span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--gold-text)" }}>Datos faltantes</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {falta.map((mm, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={{ width: 17, height: 17, borderRadius: 5, border: "2px solid var(--gold)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5 }}>{mm.label}</span>
                      <button className="btn btn-sm btn-secondary" onClick={async () => { await api.requestClient(backendUrl, accessToken, m.id, mm.label); pushToast("Solicitud registrada: tarea + recordatorio creados", "success"); api.timeline(backendUrl, accessToken, m.id).then(setTimeline); }}><Icon name="message" size={14} />Solicitar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tasks.length > 0 && (
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Icon name="check" size={16} style={{ color: "var(--primary)" }} /><span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)" }}>Pendientes de este caso ({tasks.length})</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {tasks.slice(0, 8).map((t) => {
                    const dl = t.due_date ? Math.round((new Date(t.due_date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
                    const tone = dl === null ? "var(--text-muted)" : dl < 0 ? "var(--danger)" : dl <= 3 ? "var(--gold-text)" : "var(--text-secondary)";
                    const when = dl === null ? "" : dl < 0 ? `vencido hace ${-dl}d` : dl === 0 ? "vence hoy" : dl === 1 ? "vence mañana" : `en ${dl} días`;
                    return (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13.5 }}>{t.title}{t.created_by_ai && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>· IA</span>}</span>
                        {when && <span style={{ fontSize: 12.5, fontWeight: 600, color: tone, whiteSpace: "nowrap" }}>{when}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="card" style={{ padding: "6px 18px 14px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", margin: "14px 0 4px" }}>Contexto</div>
              {[["Demandante", m.demandante], ["Demandado", m.demandado], ["Radicado", m.radicado], ["Juzgado", m.juzgado]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)", width: 96, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </>}

          {tab === "actividad" && <>
            <SectionLabel icon="history">Línea de tiempo</SectionLabel>
            {timeline.length === 0 && <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Sin eventos todavía.</div>}
            {timeline.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 14, position: "relative", paddingBottom: 18 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0, color: ev.type === "actuacion" ? "var(--gold)" : "var(--primary)" }}><Icon name={ev.type === "actuacion" ? "gavel" : ev.type === "tarea" ? "check" : "fileText"} size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)" }}>{ev.date}</span>
                    {ev.verified && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "var(--gold-text)", background: "var(--gold-soft)", borderRadius: 999, padding: "1px 7px" }}><Icon name="badgeCheck" size={11} stroke={2.4} style={{ color: "var(--gold)" }} />Verificado</span>}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{ev.meta}</div>
                </div>
              </div>
            ))}
          </>}

          {tab === "documentos" && <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <SectionLabel icon="fileText">Documentos del expediente</SectionLabel>
              <span style={{ flex: 1 }} />
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={onUpload}
                accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.webm,.aac,.flac,.mp4,image/*,audio/*" />
              <button className="btn btn-primary btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Icon name={uploading ? "refresh" : "upload"} size={14} style={uploading ? { animation: "spin 1s linear infinite" } : {}} />{uploading ? "Subiendo…" : "Subir documento"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {docs.map((d) => (
                <div key={d.id} className="card" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="fileText" size={18} style={{ color: "var(--primary)" }} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{(d.created_at || "").slice(0, 10)} · {d.ingest_status === "unreadable" ? "no legible" : (d.ingest_status === "converting" || d.ingest_status === "ocr_processing") ? "procesando" : "indexado"}</div>
                  </div>
                  {d.ingest_status === "unreadable" ? (
                    <span title="No pude leer este archivo. Súbelo en PDF o DOCX." style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--danger, #DC2626)", background: "rgba(220,38,38,.10)", borderRadius: 999, padding: "3px 9px" }}><Icon name="alert" size={12} stroke={2.4} />No legible</span>
                  ) : (d.ingest_status === "converting" || d.ingest_status === "ocr_processing") ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-elevated-2)", borderRadius: 999, padding: "3px 9px" }}><Icon name="refresh" size={12} stroke={2.4} style={{ animation: "spin 1s linear infinite" }} />Procesando</span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--success)", background: "var(--success-soft)", borderRadius: 999, padding: "3px 9px" }}><Icon name="check" size={12} stroke={2.4} />En memoria</span>
                  )}
                </div>
              ))}
              {docs.length === 0 && (
                <div className="card" style={{ padding: "26px 22px", textAlign: "center" }}>
                  <Icon name="upload" size={26} style={{ color: "var(--text-muted)" }} />
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 10 }}>Sube los documentos del caso</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Se indexan en la memoria del expediente; luego puedes <strong>preguntarle a tu caso</strong> en el chat.</div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 4 }}><button className="btn btn-secondary btn-sm" onClick={() => onOpenChat(m.id, "¿Qué dicen los documentos de este caso?")}><Icon name="message" size={14} />Preguntarle al expediente</button></div>
            {outputs.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <SectionLabel icon="sparkles">Documentos generados por Jurovia</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {outputs.map((o) => (
                    <div key={o.id} className="card" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px" }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={18} style={{ color: "var(--primary)" }} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{o.date} · generado por el agente</div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--gold-text)", background: "rgba(201,138,20,.12)", borderRadius: 999, padding: "3px 9px" }}><Icon name="check" size={12} stroke={2.4} />Verificado</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>}

          {tab === "config" && <>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 650, fontSize: 14.5, marginBottom: 4 }}>Vigilancia judicial</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Ingresa el número de radicación (23 dígitos) y Autopilot revisará las actuaciones del proceso en la Rama Judicial.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={radicado} onChange={(e) => setRadicadoInput(e.target.value)} placeholder="11001310300120200012300"
                  style={{ flex: 1, height: 40, padding: "0 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-base)", fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--text)", outline: "none" }} />
                <button className="btn btn-primary btn-sm" disabled={radicado.replace(/\D/g, "").length !== 23} onClick={saveRadicado}><Icon name="radar" size={14} />Activar vigilancia</button>
              </div>
              {m.radicado && m.radicado !== "—" && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {m.autopilot_on
                    ? <span style={{ fontSize: 12.5, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 650 }}><Icon name="circleCheck" size={14} />Vigilando <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{m.radicado}</span></span>
                    : <span style={{ fontSize: 12.5, color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 650 }}>❙❙ Vigilancia pausada</span>}
                  {m.last_check && <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>· última revisión {new Date(m.last_check).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                  <span style={{ flex: 1 }} />
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleVigilancia(!m.autopilot_on)}>{m.autopilot_on ? "Pausar" : "Reactivar"}</button>
                </div>
              )}
            </div>

            {/* Datos del caso (editable) */}
            <div className="card" style={{ padding: 18, marginTop: 14 }}>
              <div style={{ fontWeight: 650, fontSize: 14.5, marginBottom: 12 }}>Datos del caso</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([["name", "Nombre / carátula"], ["matter_type", "Materia"], ["client", "Cliente / demandante"], ["counterparty", "Contraparte / demandado"], ["jurisdiction", "Juzgado / entidad"]] as [keyof typeof form, string][]).map(([k, label]) => (
                  <label key={k} style={{ fontSize: 12.5, color: "var(--text-secondary)", gridColumn: k === "name" ? "1 / -1" : "auto" }}>
                    {label}
                    <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      style={{ width: "100%", marginTop: 4, height: 38, padding: "0 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-base)", fontSize: 13.5, color: "var(--text)", outline: "none" }} />
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={saveDatos} disabled={savingDatos}>
                  <Icon name={savingDatos ? "refresh" : "check"} size={14} style={savingDatos ? { animation: "spin 1s linear infinite" } : {}} />Guardar cambios
                </button>
              </div>
            </div>

            <ConfirmNote icon="shieldCheck">Autopilot detecta y prepara. Nunca radica ni envía sin tu aprobación.</ConfirmNote>

            {/* Zona de peligro: eliminar caso */}
            <div className="card" style={{ padding: 18, marginTop: 14, border: "1px solid var(--danger, #DC2626)" }}>
              <div style={{ fontWeight: 650, fontSize: 14.5, color: "var(--danger, #DC2626)", marginBottom: 4 }}>Eliminar caso</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Borra el expediente y todos sus datos (documentos, términos, tareas, historial). No se puede deshacer.</div>
              <button className="btn btn-secondary btn-sm" onClick={doDelete} style={{ color: "var(--danger, #DC2626)", borderColor: "var(--danger, #DC2626)" }}><Icon name="x" size={14} />Eliminar este caso</button>
            </div>
          </>}

          {tab !== "config" && <ConfirmNote icon="shieldCheck">Los borradores quedan pendientes hasta tu aprobación.</ConfirmNote>}
        </div>
        </div>
        <MissionChatPanel backendUrl={backendUrl} accessToken={accessToken} matterId={m.id} title={m.title} onOpenArtifact={onOpenArtifact} />
      </div>
    </div>
  );
}

/* Panel lateral "Asistente de la misión" — CHAT REAL embebido (mismo agente, ligado al matter).
   Se queda DENTRO de la misión: los documentos/verificaciones se adjuntan al expediente. */
function MissionChatPanel({ backendUrl, accessToken, matterId, title, onOpenArtifact }: { backendUrl: string; accessToken: string; matterId: string; title: string; onOpenArtifact?: (a: Artifact) => void }) {
  const [mode, setMode] = useState("Documento");
  const [jurisdiction, setJurisdiction] = useState("Colombia · Nacional");
  return (
    <div className="mission-chat-panel" style={{ width: 400, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--grad-aurora-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={15} style={{ color: "var(--primary)" }} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>Asistente de la misión</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sobre: {title}</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatView key={matterId} backendUrl={backendUrl} accessToken={accessToken} matterId={matterId}
          mode={mode} setMode={setMode} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} compact onOpenArtifact={onOpenArtifact} />
      </div>
    </div>
  );
}

/* Lista de misiones con buscador inteligente + filtros + importar procesos desde Excel. */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { api, type Mission } from "./data";
import { DeadlineChip, ProgressBar } from "./atoms";

const MATERIAS = ["Contractual", "Procesal", "Societario", "Civil", "Laboral", "Penal", "Familia", "Administrativo"];

export function Misiones({
  backendUrl, accessToken, onOpen, onNavigate, onNewMission,
}: {
  backendUrl: string; accessToken: string;
  onOpen: (id: string) => void; onNavigate: (r: string) => void; onNewMission: () => void;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [q, setQ] = useState("");
  const [materia, setMateria] = useState<string | undefined>(undefined);
  const [vigilancia, setVigilancia] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [imp, setImp] = useState<null | { docId: string; columns: string[]; mapping: Record<string, string | null>; detected: number; sample: Record<string, unknown>[] }>(null);
  const [impBusy, setImpBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    if (!backendUrl || !accessToken) return;
    setLoading(true);
    api.missions(backendUrl, accessToken, { q: q.trim() || undefined, materia, vigilancia, limit: 100 })
      .then((m) => { setMissions(m); setLoading(false); });
  }, [backendUrl, accessToken, q, materia, vigilancia]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);  // debounce del texto
    return () => clearTimeout(id);
  }, [load, q]);

  // ── Importar Excel: subir → preview del mapeo → confirmar ──
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setImpBusy(true); setBanner("Leyendo el Excel y detectando columnas…");
    try {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch(`${backendUrl}/api/documents`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: fd });
      const upj = up.ok ? await up.json() : null;
      if (!upj?.document_id) { setBanner("No pude subir el archivo."); setImpBusy(false); return; }
      const prev = await api.importProcesosPreview(backendUrl, accessToken, upj.document_id);
      if (prev.error || !prev.detected) { setBanner(prev.error || "No detecté procesos en el archivo."); setImpBusy(false); return; }
      setImp({ docId: upj.document_id, columns: prev.columns || [], mapping: prev.mapping || {}, detected: prev.detected || 0, sample: prev.sample || [] });
      setBanner(null);
    } catch {
      setBanner("Error al leer el archivo.");
    }
    setImpBusy(false);
  }

  async function confirmImport() {
    if (!imp) return;
    setImpBusy(true);
    const res = await api.importProcesosCommit(backendUrl, accessToken, imp.docId, imp.mapping);
    setImpBusy(false); setImp(null);
    if (res.error) { setBanner(`Error: ${res.error}`); return; }
    setBanner(`✅ Importé ${res.created} procesos (${res.with_vigilance} con vigilancia diaria).`);
    load();
  }

  const chip = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, background: active ? "var(--primary-soft)" : "transparent",
    color: active ? "var(--primary)" : "var(--text-secondary)", padding: "5px 12px", fontSize: 12.5, fontWeight: 600,
    cursor: "pointer", borderRadius: "var(--r-pill)",
  });

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div className="app-pad" style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
          <div>
            <h1 className="h2-fluid" style={{ fontWeight: 650, letterSpacing: "-0.02em", margin: 0 }}>Misiones</h1>
            <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: 14.5 }}>Cada objetivo, con su avance y próxima acción.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={impBusy}>
              <Icon name={impBusy ? "refresh" : "upload"} size={15} style={impBusy ? { animation: "spin 1s linear infinite" } : {}} />Importar Excel
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onPickFile} style={{ display: "none" }} />
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("terminos")}><Icon name="calendarClock" size={15} />Ver vencimientos</button>
            <button className="btn btn-primary btn-sm" onClick={onNewMission}><Icon name="plus" size={15} stroke={2.2} />Nueva misión</button>
          </div>
        </div>

        {/* Buscador + filtros */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 320px", minWidth: 240 }}>
            <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, radicado, parte, juzgado o contenido de documentos…"
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--bg-elevated-2)", fontSize: 14, color: "var(--text)", outline: "none" }} />
          </div>
          <button style={chip(vigilancia === true)} onClick={() => setVigilancia(vigilancia === true ? undefined : true)}>Con vigilancia</button>
          <select value={materia || ""} onChange={(e) => setMateria(e.target.value || undefined)} className="input" style={{ width: "auto", padding: "7px 10px", fontSize: 13, borderRadius: "var(--r-pill)" }}>
            <option value="">Toda materia</option>
            {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {(q || materia || vigilancia !== undefined) && (
            <button style={chip(false)} onClick={() => { setQ(""); setMateria(undefined); setVigilancia(undefined); }}>Limpiar</button>
          )}
        </div>

        {banner && <div className="card" style={{ padding: "10px 14px", marginBottom: 12, fontSize: 13.5, borderColor: "var(--primary)" }}>{banner}</div>}

        {missions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {missions.map((e) => (
              <button key={e.id} onClick={() => onOpen(e.id)} className="card" style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 20px", textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: `${e.accent}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="folder" size={22} style={{ color: e.accent }} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 650, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.display || e.title}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 8px", flexShrink: 0 }}>{e.area}</span>
                    {e.code && <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em", flexShrink: 0 }}>{e.code}</span>}
                  </div>
                  <div style={{ maxWidth: 360 }}><ProgressBar value={e.progress} accent={e.accent} height={5} /></div>
                  {e.radicado && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)", fontWeight: 700 }}><Icon name="radar" size={12} />Vigilando</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>Rad. {e.radicado}</span>
                  </div>}
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
            <div style={{ fontWeight: 650, fontSize: 16 }}>{loading ? "Cargando…" : (q || materia || vigilancia !== undefined) ? "Sin resultados" : "Aún no tienes misiones"}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4, marginBottom: 16 }}>{(q || materia || vigilancia !== undefined) ? "Prueba con otra palabra o quita los filtros." : "Crea tu primera misión o importa tus procesos desde un Excel."}</div>
            {!(q || materia || vigilancia !== undefined) && <button className="btn btn-primary" onClick={onNewMission}><Icon name="plus" size={16} stroke={2.2} />Nueva misión</button>}
          </div>
        )}
      </div>

      {/* Modal de preview del import */}
      {imp && (
        <div onClick={() => !impBusy && setImp(null)} style={{ position: "fixed", inset: 0, background: "rgba(13,19,32,.45)", display: "grid", placeItems: "center", zIndex: 300, padding: 20 }}>
          <div onClick={(ev) => ev.stopPropagation()} className="card" style={{ maxWidth: 640, width: "100%", padding: 24, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Importar {imp.detected} procesos</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Detecté las columnas así. Revisa el mapeo y confirma para crear los casos (con vigilancia diaria en los que tengan radicado válido).</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[["radicado", "Radicado"], ["nombre", "Nombre/carátula"], ["cliente", "Cliente/demandante"], ["contraparte", "Contraparte/demandado"], ["juzgado", "Juzgado/entidad"], ["materia", "Materia"]].map(([k, label]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span style={{ width: 170, color: "var(--text-secondary)" }}>{label}</span>
                  <select value={imp.mapping[k] || ""} onChange={(ev) => setImp({ ...imp, mapping: { ...imp.mapping, [k]: ev.target.value || null } })}
                    className="input" style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}>
                    <option value="">— (ninguna) —</option>
                    {imp.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setImp(null)} disabled={impBusy}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={confirmImport} disabled={impBusy}>
                <Icon name={impBusy ? "refresh" : "check"} size={15} style={impBusy ? { animation: "spin 1s linear infinite" } : {}} />Crear {imp.detected} casos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

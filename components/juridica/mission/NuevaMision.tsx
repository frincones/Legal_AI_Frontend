/* Nueva misión — describe el objetivo → crea el expediente → el AGENTE REAL lo trabaja en el chat.
   Sin animaciones ni datos simulados: el trabajo lo hace el agente (se ve su stream en el chat). */
"use client";
import { useState } from "react";
import { Icon } from "../icons";
import { Composer } from "../shell";
import { api } from "./data";
import { ConfirmNote } from "./atoms";
import { AI_DISCLAIMER } from "../../company";

const SUGGESTIONS = ["Cobrar una deuda con un pagaré", "Demanda laboral por despido", "Tutela de salud contra la EPS", "Contrato de arrendamiento"];

function detectPlugin(v: string): { plugin: string; matter_type: string } {
  const l = v.toLowerCase();
  if (l.includes("tutela") || l.includes("eps") || l.includes("salud") || l.includes("petición") || l.includes("peticion")) return { plugin: "tutela-co", matter_type: "Constitucional · Tutela" };
  if (l.includes("labor") || l.includes("despido") || l.includes("prestacion")) return { plugin: "laboral-co", matter_type: "Laboral · Ordinario" };
  if (l.includes("cobr") || l.includes("pagar") || l.includes("deuda") || l.includes("cartera") || l.includes("ejecutiv")) return { plugin: "cobranza-co", matter_type: "Civil · Ejecutivo" };
  if (l.includes("contrato") || l.includes("arrend")) return { plugin: "contractual-co", matter_type: "Contractual" };
  if (l.includes("sas") || l.includes("sociedad") || l.includes("acta") || l.includes("estatuto")) return { plugin: "societario-co", matter_type: "Societario" };
  if (l.includes("aliment") || l.includes("sucesi") || l.includes("familia")) return { plugin: "civil-familia-co", matter_type: "Civil y Familia" };
  return { plugin: "procesal-co", matter_type: "Procesal" };
}

export function NuevaMision({
  backendUrl, accessToken, onCreated, pushToast, blocked,
}: {
  backendUrl: string; accessToken: string;
  onCreated: (missionId: string, prompt: string, documentIds?: string[]) => void; pushToast: (t: string, k?: string) => void;
  blocked?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(text?: string, documentIds?: string[]) {
    const v = (text ?? draft).trim();
    if ((!v && !(documentIds && documentIds.length)) || busy) return;
    setBusy(true);
    pushToast("Creando el expediente y poniendo a trabajar al agente…", "primary");
    const goal = v || "Trabaja el documento que adjunté.";
    const { plugin, matter_type } = detectPlugin(goal);
    // Crea la misión (expediente real). El agente la trabaja en el chat (no hay datos simulados).
    const m = await api.createMission(backendUrl, accessToken, { name: goal.slice(0, 80), plugin_key: plugin, matter_type, workflow_type: plugin });
    setBusy(false);
    if (m && m.id) {
      // Abre el chat de la misión con el objetivo → el AGENTE REAL lo procesa (stream con sus tools).
      onCreated(m.id, goal, documentIds);
    } else {
      pushToast("No se pudo crear la misión", "info");
    }
  }

  return (
    <div className="no-scrollbar" style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 8px", borderRadius: "var(--r-pill)", background: "var(--grad-aurora-soft)", border: "1px solid var(--border)", marginBottom: 18 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--aurora)", display: "grid", placeItems: "center" }}><Icon name="target" size={12} style={{ color: "#fff" }} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Nueva misión</span>
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.12, fontWeight: 650, letterSpacing: "-0.025em", margin: 0 }}>¿Qué quieres <span className="gradient-text">lograr</span>?</h1>
          <p style={{ fontSize: 15.5, color: "var(--text-secondary)", margin: "10px 0 0" }}>Describe tu objetivo. Creo el expediente y el agente empieza a trabajarlo: verifica las normas, redacta y te dice qué falta.</p>
        </div>

        <Composer
          value={draft}
          onChange={setDraft}
          onSend={(docIds) => submit(undefined, docIds)}
          disabled={busy}
          autoFocus
          backendUrl={backendUrl}
          accessToken={accessToken}
          blocked={blocked}
          placeholder="Ej. Quiero cobrar una deuda de $50M con un pagaré vencido contra Jorge Molina…"
        />
        <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.45 }}>{AI_DISCLAIMER}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
          {SUGGESTIONS.map((s) => <button key={s} className="chip" disabled={busy} onClick={() => submit(s)}><Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />{s}</button>)}
        </div>
        <div style={{ marginTop: 18 }}><ConfirmNote>El agente prepara todo. Tú revisas y confirmas antes de cualquier actuación.</ConfirmNote></div>
      </div>
    </div>
  );
}

/* Nueva misión: intención → crea matter → abre el chat para que el agente la trabaje. */
"use client";
import { useState } from "react";
import { Icon } from "../icons";
import { api } from "./data";
import { ConfirmNote } from "./atoms";

const SUGGESTIONS = ["Cobrar una deuda con un pagaré", "Demanda laboral por despido", "Tutela de salud contra la EPS", "Contrato de arrendamiento"];

export function NuevaMision({
  backendUrl, accessToken, onCreated, pushToast,
}: {
  backendUrl: string; accessToken: string;
  onCreated: (missionId: string, prompt: string) => void; pushToast: (t: string, k?: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(text?: string) {
    const v = (text ?? draft).trim();
    if (!v || busy) return;
    setBusy(true);
    pushToast("Creando la misión…", "primary");
    // Heurística simple de pack por intención (el agente refina luego).
    const lower = v.toLowerCase();
    const plugin = lower.includes("tutela") ? "tutela-co" : lower.includes("labor") || lower.includes("despido") ? "laboral-co" : lower.includes("cobr") || lower.includes("pagar") || lower.includes("deuda") || lower.includes("cartera") ? "cobranza-co" : "procesal-co";
    const m = await api.createMission(backendUrl, accessToken, { name: v.slice(0, 80), plugin_key: plugin });
    setBusy(false);
    if (m && m.id) {
      pushToast("Misión creada · el agente la está armando", "primary");
      onCreated(m.id, v);
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
          <p style={{ fontSize: 15.5, color: "var(--text-secondary)", margin: "10px 0 0" }}>Dime tu objetivo en tus palabras. Yo armo la misión y te digo qué falta.</p>
        </div>

        <div className="composer-shell" style={{ borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--sh-3)" }}>
          <textarea
            value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ej. Quiero cobrar una deuda de $50M con un pagaré vencido…"
            style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", padding: "20px 22px 6px", fontSize: 16, lineHeight: 1.55, color: "var(--text)", fontFamily: "var(--font-ui)" }}
          />
          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px 12px 14px" }}>
            <span style={{ flex: 1 }} />
            <button onClick={() => submit()} disabled={!draft.trim() || busy} style={{ width: 42, height: 42, borderRadius: "var(--r-md)", border: "none", background: draft.trim() && !busy ? "var(--aurora)" : "var(--bg-elevated-2)", color: draft.trim() && !busy ? "#fff" : "var(--text-muted)", display: "grid", placeItems: "center" }}>
              <Icon name={busy ? "refresh" : "arrowUp"} size={20} stroke={2.4} style={busy ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => submit(s)}><Icon name="sparkles" size={14} style={{ color: "var(--primary)" }} />{s}</button>
          ))}
        </div>
        <div style={{ marginTop: 18 }}><ConfirmNote>Tú revisas y confirmas antes de cualquier actuación.</ConfirmNote></div>
      </div>
    </div>
  );
}

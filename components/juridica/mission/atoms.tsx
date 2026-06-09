/* Átomos compartidos de Mission Control (F2). Reusan tokens e Icon existentes. */
import type { ReactNode } from "react";
import { Icon } from "../icons";
import type { Severity } from "./data";

export const SEVERITY: Record<Severity, { color: string; bg: string; dot: string; label: string }> = {
  critico: { color: "var(--danger)", bg: "var(--danger-soft)", dot: "#DC2626", label: "Crítico" },
  pronto: { color: "var(--gold)", bg: "var(--gold-soft)", dot: "#C98A14", label: "Pronto" },
  ok: { color: "var(--success)", bg: "var(--success-soft)", dot: "#16A34A", label: "A tiempo" },
};

export function SevDot({ sev, size = 9 }: { sev: Severity; size?: number }) {
  const m = SEVERITY[sev] || SEVERITY.ok;
  return <span style={{ width: size, height: size, borderRadius: "50%", background: m.dot, flexShrink: 0, boxShadow: `0 0 0 3px ${m.bg}` }} />;
}

export function ProgressBar({ value, accent = "var(--aurora)", height = 6 }: { value: number; accent?: string; height?: number }) {
  return (
    <div style={{ height, background: "var(--bg-elevated-2)", borderRadius: 999, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: accent, borderRadius: 999, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

export function DeadlineChip({ sev, children }: { sev: Severity; children: ReactNode }) {
  const m = SEVERITY[sev] || SEVERITY.ok;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 10px 0 8px", borderRadius: "var(--r-pill)", background: m.bg, color: m.color, fontSize: 12.5, fontWeight: 650, whiteSpace: "nowrap" }}>
      <SevDot sev={sev} size={7} />
      {children}
    </span>
  );
}

export function ConfirmNote({ children, icon = "shieldCheck" }: { children?: ReactNode; icon?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-muted)" }}>
      <Icon name={icon} size={13} style={{ color: "var(--gold)" }} />
      {children || "Tú confirmas siempre."}
    </div>
  );
}

export function SectionLabel({ icon, tone, children }: { icon: string; tone?: "danger" | "default"; children: ReactNode }) {
  const color = tone === "danger" ? "var(--danger)" : "var(--text-secondary)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
      <Icon name={icon} size={16} style={{ color }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color }}>{children}</span>
    </div>
  );
}

export function pageWrap(children: ReactNode, maxWidth = 1080) {
  return (
    <div className="no-scrollbar" style={{ height: "100%", overflow: "auto" }}>
      <div style={{ maxWidth, margin: "0 auto", padding: "34px 36px 56px" }}>{children}</div>
    </div>
  );
}

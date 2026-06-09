/* Mission Control (F2) — tipos + fetchers del backend. Aditivo; si algo falla, devuelve vacío
   y la UI degrada a su estado vacío. No toca ChatView/Canvas/Library. */

export type Severity = "critico" | "pronto" | "ok";

export interface NextTerm {
  label: string;
  due: string | null;
  daysLeft: number | null;
  severity: Severity;
}

export interface Mission {
  id: string;
  title: string;
  area: string;
  status: string;
  radicado: string;
  juzgado: string;
  demandante: string;
  demandado: string;
  progress: number;
  accent: string;
  workflow_type?: string | null;
  nextBestAction?: { label?: string; hint?: string; kind?: string } | null;
  requirementsMap?: { tengo?: { label: string; value?: string }[]; falta?: { label: string; channel?: string }[] } | null;
  nextTerm?: NextTerm | null;
  keyFacts?: string | null;
}

export interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  meta: string;
  verified: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  caso: string | null;
  expId: string | null;
  deadline_at: string | null;
  daysLeft: number | null;
  when: string;
  severity: Severity;
  fundamento: string;
  confidence: string;
  action: string;
}

export interface AttentionData {
  criticos: number;
  terminos: number;
  actuaciones: number;
  items: { id: string; severity: Severity; title: string; sub: string; action: string; kind: string; expId: string | null }[];
}

export interface AutopilotSummary {
  status: string;
  lastRun: string | null;
  reviewed: { icon: string; label: string; n: number }[];
  found: { id: string; icon: string; severity: Severity; label: string; detail: string; action: string; to: string | null }[];
}

export interface ApprovalItem {
  id: string;
  matter_id: string | null;
  kind: string;
  title: string | null;
  payload: Record<string, unknown> | null;
  artifact_version_id: string | null;
  status: string;
  created_at: string;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function jget<T>(backendUrl: string, token: string, path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${backendUrl}${path}`, { headers: headers(token) });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

async function jpost<T>(backendUrl: string, token: string, path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${backendUrl}${path}`, { method: "POST", headers: headers(token), body: JSON.stringify(body ?? {}) });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  me: (b: string, t: string) => jget<{ features?: Record<string, boolean> }>(b, t, "/api/me", {}),
  missions: (b: string, t: string) => jget<Mission[]>(b, t, "/api/missions", []),
  mission: (b: string, t: string, id: string) => jget<Mission>(b, t, `/api/missions/${id}`, {} as Mission),
  timeline: (b: string, t: string, id: string) => jget<TimelineEvent[]>(b, t, `/api/missions/${id}/timeline`, []),
  attention: (b: string, t: string) => jget<AttentionData>(b, t, "/api/missions/attention", { criticos: 0, terminos: 0, actuaciones: 0, items: [] }),
  createMission: (b: string, t: string, body: Record<string, unknown>) => jpost<Mission>(b, t, "/api/missions", body, {} as Mission),
  deadlines: (b: string, t: string) => jget<Deadline[]>(b, t, "/api/deadlines", []),
  autopilot: (b: string, t: string) => jget<AutopilotSummary>(b, t, "/api/autopilot", { status: "Activo", lastRun: null, reviewed: [], found: [] }),
  runAutopilot: (b: string, t: string) => jpost(b, t, "/api/autopilot/run-now", {}, {}),
  pauseAutopilot: (b: string, t: string) => jpost<{ paused?: boolean }>(b, t, "/api/autopilot/pause", {}, {}),
  approvals: (b: string, t: string) => jget<ApprovalItem[]>(b, t, "/api/approvals", []),
  decide: (b: string, t: string, id: string, decision: string, note?: string) => jpost(b, t, `/api/approvals/${id}/${decision}`, { note }, {}),
};

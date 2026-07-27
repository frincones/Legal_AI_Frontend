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

// Tareas / recordatorios (QW1)
export interface TaskItem {
  id: string;
  title: string;
  status?: string;
  priority?: string | null;
  due_date?: string | null;
  matter_id?: string | null;
  created_by_ai?: boolean;
}

// ── Audiencias ──
export type AudienciaBody = {
  source: "url" | "upload";
  url?: string;
  storage_path?: string;
  matter_id?: string;
  session_id?: string;
  duration_min?: number;
  numero_proceso?: string;
  title?: string;
  confirm_overage?: boolean;
};
export type AudienciaJob = {
  // respuesta de crear
  ok?: boolean;
  job_id?: string;
  // límite de plan (crear devuelve ok:false + estos)
  over_plan?: boolean;
  used_hours?: number;
  plan_hours?: number;
  audiencia_hours?: number;
  // estado/progreso
  id?: string;
  status?: string; // pending|claimed|downloading|transcribing|analyzing|done|error
  progress_pct?: number;
  title?: string;
  duration_min?: number | null;
  segments_total?: number | null;
  segments_done?: number | null;
  transcript_document_id?: string | null;
  acta_artifact_id?: string | null;
  acta_session_id?: string | null;
  matter_id?: string | null;
  error?: string | null;
  created_at?: string;
};

export interface AttentionData {
  criticos: number;
  terminos: number;
  actuaciones: number;
  items: { id: string; severity: Severity; title: string; sub: string; action: string; kind: string; expId: string | null }[];
  pendientes?: number;
  pendientesItems?: TaskItem[];
}

export interface AutopilotSummary {
  status: string;
  lastRun: string | null;
  watching?: number;
  hint?: string;
  reviewed: { icon: string; label: string; n: number }[];
  found: { id: string; icon: string; severity: Severity; label: string; detail: string; action: string; to: string | null }[];
}

export interface SourceWarning {
  consulta: string;
  anterior: string | null;
  nuevo: string;
  fuente: string | null;
  clase?: string | null;
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

export interface FeedbackPayload {
  kind: "response" | "document" | "micro" | "general" | string;
  verdict?: "up" | "down";
  reason?: string;
  comment?: string;
  session_id?: string;
  message_id?: string;
  run_id?: string;
  artifact_id?: string;
  context?: Record<string, unknown>;
}

export interface AdminFeedbackItem {
  id: string;
  kind: string;
  verdict: "up" | "down" | null;
  reason: string | null;
  comment: string | null;
  context: Record<string, unknown> | null;
  session_id: string | null;
  artifact_id: string | null;
  created_at: string;
}

export interface AdminFeedback {
  items: AdminFeedbackItem[];
  summary: { total: number; up: number; down: number; by_reason: Record<string, number>; by_kind: Record<string, number> };
}

/* Referidos (growth loop) */
export interface ReferralMe {
  code: string | null;
  invited: number;
  rewarded: number;
  turns_earned: number;
  bonus_available: number;
  reward_referrer: number;
  reward_referee: number;
  reward_share: number;
}

export interface ReferralClaim {
  ok: boolean;
  status: string;
}

export interface AdminReferralItem {
  id: string;
  code: string;
  referrer_user_id: string;
  referee_user_id: string;
  status: string;
  reward_credits: number;
  created_at: string;
  rewarded_at: string | null;
}

export interface AdminReferrals {
  items: AdminReferralItem[];
  summary: { total: number; pending: number; rewarded: number; capped: number; turns_granted: number };
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

async function jsend<T>(method: string, backendUrl: string, token: string, path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const r = await fetch(`${backendUrl}${path}`, { method, headers: headers(token), body: body === undefined ? undefined : JSON.stringify(body ?? {}) });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export type WaitlistItem = {
  id: string; email: string; name: string | null; user_type: string | null;
  practice_area: string | null; city: string | null; phone: string | null; note: string | null;
  source: string | null; status: "pending" | "authorized" | "registered"; created_at: string;
};

// Analytics first-party (F2)
export type AnalyticsFunnel = {
  visitas?: number; interactuaron?: number; scroll_50?: number; chat_guest?: number;
  abrio_waitlist?: number; registrados?: number; sesiones?: number; eventos?: number;
};
export type AnalyticsTop = { ev: string; event_type: string; n: number; sesiones: number };
export type AnalyticsSession = {
  session_id: string; eventos: number; inicio: string; fin: string; duracion_s: number;
  uso_chat: boolean; registrado: boolean; referrer: string | null; device: { ua?: string; w?: number; h?: number } | null;
};
export type AnalyticsKN = { k: string; n: number };
export type AnalyticsDemographics = {
  paises?: AnalyticsKN[]; ciudades?: AnalyticsKN[]; idiomas?: AnalyticsKN[]; zonas?: AnalyticsKN[];
  dispositivos?: AnalyticsKN[]; navegadores?: AnalyticsKN[]; sistemas?: AnalyticsKN[];
};
export type AnalyticsData = { funnel: AnalyticsFunnel; top: AnalyticsTop[]; sessions: AnalyticsSession[]; demographics?: AnalyticsDemographics };
export type AnalyticsEvent = { event_type: string; name: string | null; props: Record<string, unknown>; url: string | null; created_at: string };
export type GuestMessage = { seq: number; role: "user" | "assistant"; content: string; created_at: string };

// Auditoría de conversaciones (Admin, free/trial)
export type AuditOrg = { org_id: string; name: string | null; plan: string; emails: string[]; sessions: number; last_activity: string | null };
export type AuditSession = { id: string; email: string | null; title: string | null; model_tier: string | null; status: string | null; created_at: string; updated_at: string };
export type AuditPart = { idx: number; type: string; text: string | null; tool_name: string | null; tool_use_id: string | null; input: unknown; output: unknown; is_untrusted: boolean; citations: unknown };
export type AuditMessage = { seq: number; role: string; model: string | null; created_at: string; parts: AuditPart[] };

// WhatsApp feedback + conversaciones (Admin)
export type WAFeedbackItem = { id: string; verdict: "up" | "down" | null; comment: string | null; phone: string | null; user_name: string | null; wa_conversation_id: string | null; created_at: string };
export type WAConversation = { id: string; wa_phone: string; display_phone: string | null; name: string | null; email: string | null; reminders_opt_in: boolean; opt_out_source: string | null; reminders_sent: number; last_message_at: string | null };
export type WAMessage = { seq: number; direction: string; role: string; msg_type: string | null; content: string | null; status: string | null; created_at: string };

// Feedback por email (Admin) — campaña de correo paralela a WhatsApp
export type EmailFeedbackItem = { id: string; verdict: "up" | "down" | null; comment: string | null; user_name: string | null; context: { email?: string; waitlist_id?: string } | null; created_at: string };

// Retención de usuarios (Admin → pestaña Retención)
export type RetentionOverview = { dau: number; wau: number; mau: number; dau_prom: number; stickiness: number; activos_periodo: number; nuevos_periodo: number; recurrentes_periodo: number; registrados_total: number; con_actividad_total: number; serie: { d: string; activos: number }[] };
export type RetentionGrowth = { periodo: string; activos: number; nuevos: number; retenidos: number; resucitados: number; churned: number; quick_ratio: number | null };
export type RetentionCohort = { cohorte: string; tam: number; retencion: { k: number; activos: number; pct: number }[] };
export type RetentionUser = { email: string; user_id: string; org_id: string | null; plan: string; signup: string | null; last_login: string | null; ultima_actividad: string | null; dias_activos_periodo: number; dias_activos_total: number; semanas_activas: number; sesiones: number; mensajes_periodo: number; mensajes_total: number; documentos: number; creditos: number; costo_usd: number; recurrente: boolean; estado: "activo" | "en_riesgo" | "churned" | "sin_uso"; consultas: string[] | null };
export type RetentionIntent = { categoria: string; n: number };
export type RetentionHooks = { por_tipo: { tipo: string; shown: number; clicks: number; ctr: number }[]; total_shown: number; total_clicks: number };
export type RetentionData = { overview: Partial<RetentionOverview>; growth: RetentionGrowth[]; cohorts: RetentionCohort[]; users: RetentionUser[]; intents: RetentionIntent[]; hooks: Partial<RetentionHooks> };

// Campañas (Admin → pestaña Campañas) — email + WhatsApp, con indicadores por envío/destinatario
export type CampaignKPI = {
  key: string; name: string | null; channel: string | null; type: string | null; status: string | null;
  enviados: number; entregados: number; abiertos: number; clics: number; respondieron: number;
  entraron: number; bajas: number; rebotes: number; open_rate: number; click_rate: number;
  ultimo_envio: string | null;
};
export type CampaignRecipient = {
  recipient: string; status: string | null; sent_at: string | null; delivered_at: string | null;
  opened_at: string | null; opened_count: number; clicked_at: string | null; clicked_count: number;
  bounced_at: string | null; replied_at: string | null; entered_at: string | null;
  unsubscribed_at: string | null; meta: Record<string, unknown> | null;
};
// Motor de campañas (contactos · segmentos · journeys)
export type EngineContact = { email: string; full_name?: string | null; lifecycle: string; temperature: string; source?: string | null; email_status?: string; opted_out?: boolean; last_activity_at?: string | null };
export type EngineEnrollment = { journey_key: string; status: string; current_step: number; next_send_at?: string | null; enrolled_at?: string; last_sent_at?: string | null; exit_reason?: string | null };
export type EngineSend = { campaign_key: string; status: string | null; sent_at: string | null; opened_at: string | null; clicked_at: string | null; bounced_at: string | null; entered_at: string | null; meta: Record<string, unknown> | null };
export type EngineSegment = { key: string; name: string; description?: string | null; rule: Record<string, unknown>; kind: string; count?: number };
export type EngineJourneyStep = { step_no: number; offset_days: number; stage?: string | null; subject: string; cta_label?: string | null };
export type EngineJourney = { key: string; name: string; goal?: string | null; channel: string; status: string; entry_segment?: string | null; exit_rule?: string | null; priority: number; steps?: EngineJourneyStep[]; stats?: Record<string, number>; by_step?: Record<string, number>; total?: number };

// Back-office multitenant (Admin → Clientes/Ingresos/Planes) — Fase 1
export type Tenant = {
  id: string; name: string | null; plan: string; plan_name: string | null; price_usd: number; net_usd: number | null;
  suspended: boolean; sub_status: string | null; period_end: string | null; cancel_at_period_end: boolean | null;
  members: number; balance: number | null; cap: number | null; cost_usd: number; margin_usd: number | null;
  actions: number; last_activity: string | null; created_at: string | null;
};
export type TenantsResp = { tenants: Tenant[]; mrr_usd: number; mrr_gross_usd: number; total: number; paying: number };
export type Revenue = { source: string; gross_usd: number | null; tax_usd: number | null; fee_usd: number | null; net_usd: number | null; currency: string | null };
export type TenantDetail = {
  org: Record<string, unknown> & { id: string; name: string | null; plan: string; plan_name: string | null; suspended: boolean };
  subscription: Record<string, unknown> | null;
  revenue: Revenue | null;
  members: { user_id: string; role: string; status: string; email?: string | null; full_name?: string | null }[];
  entitlements: Record<string, unknown>;
  usage: { by_model: Record<string, { calls: number; cost_usd: number }>; total_cost_usd: number; margin_usd: number | null; session_5h: number; weekly_7d: number; limit_session: number | null; limit_weekly: number | null };
};
export type Subscription = {
  id: string; org_id: string; org_name?: string | null; plan: string; status: string;
  paddle_subscription_id: string | null; current_period_end: string | null; cancel_at_period_end: boolean; updated_at: string;
};
export type SubscriptionsResp = { subscriptions: Subscription[]; by_status: Record<string, number> };
export type UsageCosts = {
  total_cost_usd: number; by_model: Record<string, { calls: number; cost_usd: number }>;
  by_day: { day: string; cost_usd: number }[]; top_orgs: { org_id: string; name: string | null; cost_usd: number }[];
  mrr_usd: number; mrr_gross_usd: number; cogs_month_usd: number; gross_margin_usd: number; usd_cop: number;
};
export type CostsDashboard = {
  today_usd: number; mtd_usd: number; projection_usd: number;
  mrr_net_usd: number; margin_usd: number; margin_pct: number;
  breakdown: { usage: number; membership: number; free: number; api: number };
  free_providers: string[];
  unit_economics?: {
    active_users: number; paying_users: number; free_users: number;
    fixed_usd: number; variable_usd: number; variable_paid_usd: number; variable_free_usd: number;
    total_cost_usd: number; net_mrr_usd: number;
    cost_per_active: number; cost_per_paid: number; cost_per_free: number; net_per_paid: number;
    contribution_margin: number; overhead_usd: number;
    breakeven_paying: number | null; breakeven_fixed_only: number | null; gap: number | null; free_share_pct: number;
  };
  by_provider: { provider: string; usd: number; source: string; qty?: number; unit?: string; allowance?: number; allowance_unit?: string; util_pct?: number | null }[];
  by_model: { model: string; usd: number; quantity: number }[];
  trend: { day: string; usd: number }[];
  top_tenants: { org_id: string; name: string; plan: string | null; cost_usd: number }[];
  alerts: { id: string; name: string; provider: string | null; metric: string; threshold_usd: number; enabled: boolean; state: string; last_fired_at: string | null }[];
  source_note: string; updated_for: string;
};
export type PlanCat = { tier: string; name: string; active: boolean; price_usd: number | null; regular_usd?: number | null; credits: number | null; trial_days: number | null; blurb: string; entitlements: Record<string, unknown> };
export type PlansFunnelStep = { demo_opened: number; demo_opened_sess: number; plans_opened: number; plans_opened_sess: number; plan_selected: number; plan_selected_sess: number; checkout_started: number; checkout_started_sess: number; checkout_abandoned: number; checkout_abandoned_sess: number; purchased: number; purchased_sess: number };
export type PlansFunnelLead = { email: string; name: string | null; city: string | null; user_type: string | null; practice_area: string | null; phone: string | null; source: string | null; status: string | null; created_at: string; purchased: boolean; gross_usd: number | null; purchased_at: string | null; reached_checkout: boolean; abandoned: boolean };
export type PlansFunnelPurchase = { occurred_at: string; gross_usd: number | null; net_usd: number | null; status: string | null; email: string | null };
export type AttribRow = { campaign: string; content: string; source: string; visitantes: number; registros: number; demos: number; checkouts: number; trials: number; compradores: number; ingresos: number };
export type AttribData = { model?: string; rows?: AttribRow[]; totals?: { visitantes?: number; registros?: number; demos?: number; checkouts?: number; trials?: number; ingresos?: number } };
export type VslStats = {
  views?: number; plays?: number; play_rate?: number; engagement_pct?: number;
  avg_watch_s?: number; median_watch_s?: number; hook_rate?: number;
  pitch_reached?: number; pitch_rate?: number; completion_rate?: number; unmute_rate?: number;
  seek_blocks?: number; cta_clicks?: number; video_duration?: number;
  retention?: { sec: number; viewers: number; pct: number; drop: number }[];
  dropoffs?: { sec: number; drop_pct: number }[];
  conversions_by_sec?: { sec: number; n: number }[];
  funnel?: { step: string; n: number }[];
  sources?: { source: string; views: number; plays: number }[];
  devices?: { device: string; n: number }[];
  geos?: { country: string; n: number }[];
};
export type PlansFunnel = { funnel: Partial<PlansFunnelStep>; leads: PlansFunnelLead[]; purchases: PlansFunnelPurchase[]; generated_at?: string };
export type IgQueueItem = { id: string; media_type: string; media_urls: string[]; caption: string | null; story_link: string | null; track: string | null; reusable: boolean; status: string; priority: number; scheduled_at: string | null; published_at: string | null; ig_media_id: string | null; times_posted: number; attempts: number; insights: Record<string, number> | null; error: string | null; created_at: string };
export type IgQueueResp = { items: IgQueueItem[]; counts: Record<string, number>; total: number };
export type IgSettings = { id: number; posts_per_day_min: number; window_start_hour: number; window_end_hour: number; min_gap_minutes: number; timezone: string; reuse_cooldown_days: number; max_per_day: number; enabled: boolean };
// Soporte (L9) — tickets
export type SupportTicket = { id: string; email: string; name: string | null; category: string | null; subject: string | null; message: string; status: string; source: string | null; ip: string | null; admin_note: string | null; created_at: string; updated_at: string };
export type TicketsResp = { items: SupportTicket[]; by_status: Record<string, number> };
// Devoluciones (reembolsos)
export type Refund = { id: string; org_id: string | null; org_name?: string | null; paddle_transaction_id: string; paddle_adjustment_id: string | null; amount_usd: number | null; currency: string | null; reason: string | null; status: string; created_by: string | null; created_at: string };
export type Payment = { org_id: string | null; org_name?: string | null; paddle_transaction_id: string; gross_usd: number | null; net_usd: number | null; currency: string | null; status: string; occurred_at: string | null; refunded: boolean };
export type RefundsResp = { refunds: Refund[]; payments: Payment[] };

export const api = {
  me: (b: string, t: string) => jget<{ features?: Record<string, boolean> }>(b, t, "/api/me", {}),
  missions: (b: string, t: string, opts?: { q?: string; materia?: string; estado?: string; vigilancia?: boolean; limit?: number; offset?: number }) => {
    const p = new URLSearchParams();
    if (opts?.q) p.set("q", opts.q);
    if (opts?.materia) p.set("materia", opts.materia);
    if (opts?.estado) p.set("estado", opts.estado);
    if (opts?.vigilancia !== undefined) p.set("vigilancia", String(opts.vigilancia));
    if (opts?.limit) p.set("limit", String(opts.limit));
    if (opts?.offset) p.set("offset", String(opts.offset));
    const qs = p.toString();
    return jget<Mission[]>(b, t, `/api/missions${qs ? `?${qs}` : ""}`, []);
  },
  mission: (b: string, t: string, id: string) => jget<Mission>(b, t, `/api/missions/${id}`, {} as Mission),
  timeline: (b: string, t: string, id: string) => jget<TimelineEvent[]>(b, t, `/api/missions/${id}/timeline`, []),
  attention: (b: string, t: string) => jget<AttentionData>(b, t, "/api/missions/attention", { criticos: 0, terminos: 0, actuaciones: 0, items: [] }),
  tasks: (b: string, t: string, matterId?: string) => jget<TaskItem[]>(b, t, `/api/tasks${matterId ? `?matter_id=${encodeURIComponent(matterId)}` : ""}`, []),
  createMission: (b: string, t: string, body: Record<string, unknown>) => jpost<Mission>(b, t, "/api/missions", body, {} as Mission),
  // Importar procesos desde Excel/CSV → casos. preview (confirm=false) devuelve el mapeo detectado; commit crea.
  importProcesosPreview: (b: string, t: string, documentId: string) =>
    jpost<{ preview?: boolean; columns?: string[]; mapping?: Record<string, string | null>; detected?: number; sample?: Record<string, unknown>[]; total?: number; error?: string }>(b, t, "/api/missions/import", { document_id: documentId, confirm: false }, {}),
  importProcesosCommit: (b: string, t: string, documentId: string, mapping: Record<string, string | null>) =>
    jpost<{ committed?: boolean; created?: number; with_vigilance?: number; skipped?: number; error?: string }>(b, t, "/api/missions/import", { document_id: documentId, confirm: true, mapping }, {}),
  async deleteMission(b: string, t: string, id: string): Promise<{ ok?: boolean; error?: string }> {
    try {
      const r = await fetch(`${b}/api/missions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
      return r.ok ? await r.json() : { ok: false, error: `del ${r.status}` };
    } catch {
      return { ok: false, error: "delete failed" };
    }
  },
  deadlines: (b: string, t: string) => jget<Deadline[]>(b, t, "/api/deadlines", []),
  autopilot: (b: string, t: string) => jget<AutopilotSummary>(b, t, "/api/autopilot", { status: "Activo", lastRun: null, reviewed: [], found: [] }),
  runAutopilot: (b: string, t: string) => jpost(b, t, "/api/autopilot/run-now", {}, {}),
  pauseAutopilot: (b: string, t: string) => jpost<{ paused?: boolean }>(b, t, "/api/autopilot/pause", {}, {}),
  approvals: (b: string, t: string) => jget<ApprovalItem[]>(b, t, "/api/approvals", []),
  decide: (b: string, t: string, id: string, decision: string, note?: string) =>
    jpost<{ ok?: boolean; status?: string; source_warnings?: SourceWarning[] }>(b, t, `/api/approvals/${id}/${decision}`, { note }, {}),
  credits: (b: string, t: string) => jget<{ balance: number | null; cap: number | null; ledger: unknown[] }>(b, t, "/api/credits", { balance: null, cap: null, ledger: [] }),
  adminOrgs: (b: string, t: string) => jget<{ orgs: { id: string; name: string | null; balance: number | null; cap: number | null; members: number; cost_usd: number; actions: number; last_activity: string | null }[] }>(b, t, "/api/admin/orgs", { orgs: [] }),
  adminSetCredits: (b: string, t: string, orgId: string, action: string, amount?: number) => jpost<{ ok?: boolean; balance?: number }>(b, t, `/api/admin/orgs/${orgId}/credits`, { action, amount }, {}),
  submitFeedback: (b: string, t: string, payload: FeedbackPayload) => jpost<{ ok?: boolean }>(b, t, "/api/feedback", payload, {}),
  // Feedback del chat invitado (público, sin token). Reusa la tabla feedback (source='guest').
  guestFeedback: (b: string, payload: { guest_id?: string; session?: string; kind?: string; verdict?: "up" | "down" | null; reason?: string; comment?: string; context?: Record<string, unknown> }) =>
    jpost<{ ok?: boolean }>(b, "", "/api/feedback/guest", payload, {}),
  adminFeedback: (b: string, t: string) => jget<AdminFeedback>(b, t, "/api/admin/feedback", { items: [], summary: { total: 0, up: 0, down: 0, by_reason: {}, by_kind: {} } }),
  referralMe: (b: string, t: string) => jget<ReferralMe>(b, t, "/api/referral/me", { code: null, invited: 0, rewarded: 0, turns_earned: 0, bonus_available: 0, reward_referrer: 5, reward_referee: 3, reward_share: 2 }),
  referralClaim: (b: string, t: string, code: string) => jpost<ReferralClaim>(b, t, "/api/referral/claim", { code }, { ok: false, status: "error" }),
  referralInvite: (b: string, t: string, emails: string[]) => jpost<{ ok: boolean; sent: number; requested?: number; reason?: string; bonus_turns?: number }>(b, t, "/api/referral/invite", { emails }, { ok: false, sent: 0 }),
  adminReferrals: (b: string, t: string) => jget<AdminReferrals>(b, t, "/api/admin/referrals", { items: [], summary: { total: 0, pending: 0, rewarded: 0, capped: 0, turns_granted: 0 } }),
  // Acceso por invitación (waitlist). join/checkAccess son PÚBLICOS (sin token).
  waitlistJoin: (b: string, payload: { email: string; name?: string; user_type?: string; practice_area?: string; city?: string; phone?: string; note?: string; source?: string; guest_id?: string; context?: Record<string, unknown>; final?: boolean; lead_event_id?: string; consent?: boolean; consent_version?: string }) =>
    jpost<{ ok: boolean; error?: string; authorized?: boolean }>(b, "", "/api/waitlist", payload, { ok: false }),
  checkAccess: (b: string, email: string) =>
    jget<{ authorized: boolean; invite_only: boolean }>(b, "", `/api/access?email=${encodeURIComponent(email)}`, { authorized: false, invite_only: false }),
  // Instant-access (auto-login sin OTP en el primer registro) — público. Solo da token si la cuenta es NUEVA.
  instantAccess: (b: string, email: string) =>
    jpost<{ ok: boolean; instant: boolean; token_hash?: string }>(b, "", "/api/waitlist/instant-access", { email }, { ok: false, instant: false }),
  // Deep-link de correo (?ask=…&e=…&t=…) — público. Decide guest vs auto-login por estado del email.
  resolveIdea: (b: string, payload: { email: string; sig?: string; ask?: string }) =>
    jpost<{ mode: "guest" | "login"; token_hash?: string; email?: string; ask?: string | null }>(b, "", "/api/ideas/resolve", payload, { mode: "guest" }),
  // Importa la conversación de invitado a una sesión real (continuidad "mismo chat") — autenticado.
  claimGuest: (b: string, t: string, sid: string, gid?: string) =>
    jpost<{ session_id: string | null }>(b, t, "/api/guest/claim", { sid, gid }, { session_id: null }),
  adminWaitlist: (b: string, t: string) =>
    jget<{ items: WaitlistItem[]; counts: { total: number; pending: number; authorized: number; registered: number } }>(b, t, "/api/admin/waitlist", { items: [], counts: { total: 0, pending: 0, authorized: 0, registered: 0 } }),
  adminAuthorizeWaitlist: (b: string, t: string, emails: string[], invite = true) =>
    jpost<{ ok: boolean; authorized: number }>(b, t, "/api/admin/waitlist/authorize", { emails, invite }, { ok: false, authorized: 0 }),
  adminAnalytics: (b: string, t: string, days = 30, from?: string, to?: string) =>
    jget<AnalyticsData>(b, t,
      `/api/admin/analytics?days=${days}${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`,
      { funnel: {}, top: [], sessions: [], demographics: {} }),
  adminRetention: (b: string, t: string, days = 30, from?: string, to?: string) =>
    jget<RetentionData>(b, t,
      `/api/admin/retention?days=${days}${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`,
      { overview: {}, growth: [], cohorts: [], users: [], intents: [], hooks: {} }),
  adminVsl: (b: string, t: string, days = 30, from?: string, to?: string, variant?: string) =>
    jget<VslStats>(b, t,
      `/api/admin/analytics/vsl?days=${days}${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}${variant ? `&variant=${variant}` : ""}`, {}),
  adminAttribution: (b: string, t: string, days = 30, model = "first", from?: string, to?: string) =>
    jget<AttribData>(b, t,
      `/api/admin/attribution?days=${days}&model=${model}${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`, {}),
  // Métrica de clic de hooks (fire-and-forget, público). La impresión la registra el backend.
  hookClick: (b: string, payload: { tipo: string; label?: string; session_id?: string }) =>
    fetch(`${b}/api/hooks/click`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {}),
  adminAnalyticsSession: (b: string, t: string, sid: string) =>
    jget<{ events: AnalyticsEvent[] }>(b, t, `/api/admin/analytics/session?sid=${encodeURIComponent(sid)}`, { events: [] }),
  adminGuestConversation: (b: string, t: string, sid: string) =>
    jget<{ messages: GuestMessage[] }>(b, t, `/api/admin/analytics/guest?sid=${encodeURIComponent(sid)}`, { messages: [] }),
  adminAuditOrgs: (b: string, t: string) =>
    jget<{ orgs: AuditOrg[] }>(b, t, "/api/admin/conversations/orgs", { orgs: [] }),
  adminAuditSessions: (b: string, t: string, orgId: string) =>
    jget<{ blocked?: boolean; sessions: AuditSession[] }>(b, t, `/api/admin/conversations/sessions?org_id=${encodeURIComponent(orgId)}`, { sessions: [] }),
  adminAuditThread: (b: string, t: string, sid: string) =>
    jget<{ blocked?: boolean; reason?: string; title?: string | null; messages: AuditMessage[] }>(b, t, `/api/admin/conversations/thread?session_id=${encodeURIComponent(sid)}`, { messages: [] }),
  adminWAFeedback: (b: string, t: string) =>
    jget<{ items: WAFeedbackItem[]; summary: { total: number; up: number; down: number } }>(b, t, "/api/admin/whatsapp/feedback", { items: [], summary: { total: 0, up: 0, down: 0 } }),
  adminWAConversations: (b: string, t: string) =>
    jget<{ items: WAConversation[] }>(b, t, "/api/admin/whatsapp/conversations", { items: [] }),
  adminWAThread: (b: string, t: string, cid: string) =>
    jget<{ messages: WAMessage[] }>(b, t, `/api/admin/whatsapp/thread?conversation_id=${encodeURIComponent(cid)}`, { messages: [] }),
  adminEmailFeedback: (b: string, t: string) =>
    jget<{ items: EmailFeedbackItem[]; summary: { total: number; up: number; down: number } }>(b, t, "/api/admin/email/feedback", { items: [], summary: { total: 0, up: 0, down: 0 } }),
  adminCampaigns: (b: string, t: string, days = 30, from?: string, to?: string) =>
    jget<{ campaigns: CampaignKPI[] }>(b, t,
      `/api/admin/campaigns?days=${days}${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`,
      { campaigns: [] }),
  adminCampaignRecipients: (b: string, t: string, key: string, days = 90, from?: string, to?: string) =>
    jget<{ recipients: CampaignRecipient[] }>(b, t,
      `/api/admin/campaigns/${encodeURIComponent(key)}/recipients?days=${days}${from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : ""}`,
      { recipients: [] }),
  // Motor de campañas (contactos · segmentos · journeys) — admin, aditivo.
  adminContacts: (b: string, t: string, q = "", lifecycle = "", temperature = "", limit = 100) =>
    jget<{ contacts: EngineContact[] }>(b, t,
      `/api/admin/contacts?q=${encodeURIComponent(q)}&lifecycle=${lifecycle}&temperature=${temperature}&limit=${limit}`, { contacts: [] }),
  adminContact360: (b: string, t: string, email: string) =>
    jget<{ contact: EngineContact | null; enrollments: EngineEnrollment[]; sends: EngineSend[] }>(b, t,
      `/api/admin/contacts/${encodeURIComponent(email)}`, { contact: null, enrollments: [], sends: [] }),
  adminSegments: (b: string, t: string) =>
    jget<{ segments: EngineSegment[] }>(b, t, `/api/admin/segments`, { segments: [] }),
  adminSegmentPreview: (b: string, t: string, rule: Record<string, unknown>) =>
    jpost<{ count: number; sample: { email: string; lifecycle: string; temperature: string }[] }>(b, t,
      `/api/admin/segments/preview`, { rule }, { count: 0, sample: [] }),
  adminJourneys: (b: string, t: string) =>
    jget<{ journeys: EngineJourney[] }>(b, t, `/api/admin/journeys`, { journeys: [] }),
  adminSetJourneyStatus: (b: string, t: string, key: string, status: string) =>
    jpost<{ ok?: boolean; status?: string }>(b, t, `/api/admin/journeys/${encodeURIComponent(key)}/status`, { status }, {}),
  // Back-office multitenant (Fase 1)
  adminTenants: (b: string, t: string) => jget<TenantsResp>(b, t, "/api/admin/tenants", { tenants: [], mrr_usd: 0, mrr_gross_usd: 0, total: 0, paying: 0 }),
  adminTenantDetail: (b: string, t: string, orgId: string) => jget<TenantDetail>(b, t, `/api/admin/tenants/${orgId}`, {} as TenantDetail),
  adminSuspendTenant: (b: string, t: string, orgId: string, suspended: boolean) => jpost<{ ok?: boolean; suspended?: boolean }>(b, t, `/api/admin/tenants/${orgId}/suspend`, { suspended }, {}),
  adminSetTenantPlan: (b: string, t: string, orgId: string, plan: string) => jpost<{ ok?: boolean; plan?: string }>(b, t, `/api/admin/tenants/${orgId}/plan`, { plan }, {}),
  adminSubscriptions: (b: string, t: string) => jget<SubscriptionsResp>(b, t, "/api/admin/subscriptions", { subscriptions: [], by_status: {} }),
  adminUsageCosts: (b: string, t: string, days = 30) => jget<UsageCosts>(b, t, `/api/admin/usage-costs?days=${days}`, { total_cost_usd: 0, by_model: {}, by_day: [], top_orgs: [], mrr_usd: 0, mrr_gross_usd: 0, cogs_month_usd: 0, gross_margin_usd: 0, usd_cop: 4000 }),
  // FinOps — observabilidad de costos (metering interno casi en línea)
  adminCosts: (b: string, t: string, days = 30) => jget<CostsDashboard>(b, t, `/api/admin/costs?days=${days}`, { today_usd: 0, mtd_usd: 0, projection_usd: 0, mrr_net_usd: 0, margin_usd: 0, margin_pct: 0, breakdown: { usage: 0, membership: 0, free: 0, api: 0 }, free_providers: [], by_provider: [], by_model: [], trend: [], top_tenants: [], alerts: [], source_note: "estimate", updated_for: "" }),
  adminCostCollect: (b: string, t: string) => jpost<{ day?: string; total_usd?: number; error?: string }>(b, t, "/api/admin/costs/collect", {}, {}),
  adminSetCostAlert: (b: string, t: string, id: string, body: { enabled?: boolean; threshold_usd?: number }) => jpost<{ ok?: boolean }>(b, t, `/api/admin/costs/alerts/${id}`, body, {}),
  adminPlansFunnel: (b: string, t: string) => jget<PlansFunnel>(b, t, "/api/admin/plans-funnel", { funnel: {}, leads: [], purchases: [] }),
  adminIgQueue: (b: string, t: string, status?: string) => jget<IgQueueResp>(b, t, `/api/admin/ig/queue${status ? `?status=${status}` : ""}`, { items: [], counts: {}, total: 0 }),
  adminIgAdd: (b: string, t: string, item: Record<string, unknown>) => jpost<{ ok?: boolean; item?: IgQueueItem }>(b, t, "/api/admin/ig/queue", item, { ok: false }),
  adminIgEdit: (b: string, t: string, id: string, patch: Record<string, unknown>) => jsend<{ ok?: boolean }>("PATCH", b, t, `/api/admin/ig/queue/${id}`, patch, { ok: false }),
  adminIgDelete: (b: string, t: string, id: string) => jsend<{ ok?: boolean }>("DELETE", b, t, `/api/admin/ig/queue/${id}`, undefined, { ok: false }),
  adminIgSettings: (b: string, t: string) => jget<IgSettings>(b, t, "/api/admin/ig/settings", {} as IgSettings),
  adminIgSetSettings: (b: string, t: string, patch: Record<string, unknown>) => jsend<{ ok?: boolean }>("PATCH", b, t, "/api/admin/ig/settings", patch, { ok: false }),
  plansCatalog: (b: string, t: string) => jget<{ plans: PlanCat[]; cop_rate?: number }>(b, t, "/api/plans", { plans: [] }),
  // Billing (Paddle) de cara al usuario
  billingConfig: (b: string, t: string) => jget<{ enabled: boolean; environment: string; client_token: string; prices: Record<string, string> }>(b, t, "/api/billing/config", { enabled: false, environment: "production", client_token: "", prices: {} }),
  billingCheckout: (b: string, t: string, tier: string, fb?: { fbp?: string; fbc?: string }, trial?: boolean) => jpost<{ transaction_id?: string }>(b, t, "/api/billing/checkout", { tier, trial: !!trial, fbp: fb?.fbp, fbc: fb?.fbc }, {}),
  socialStats: (b: string) => jget<{ lawyers?: number; verifications?: number; responses?: number; orgs?: number; positive_pct?: number }>(b, "", "/api/stats/social", {}),
  vslConfig: (b: string) => jget<{ enabled?: boolean; full_url?: string; modal_url?: string; pitch_seconds?: number }>(b, "", "/api/vsl/config", {}),
  billingPortal: (b: string, t: string) => jpost<{ overview_url?: string; cancel_url?: string }>(b, t, "/api/billing/portal", {}, {}),
  // Soporte (L9): submit público del formulario de /ayuda + admin de tickets
  submitSupport: (b: string, payload: { email: string; name?: string; category?: string; subject?: string; message: string; source?: string }) => jpost<{ ok?: boolean; error?: string }>(b, "", "/api/support", payload, { ok: false }),
  adminTickets: (b: string, t: string, status = "") => jget<TicketsResp>(b, t, `/api/admin/tickets${status ? `?status=${status}` : ""}`, { items: [], by_status: {} }),
  adminUpdateTicket: (b: string, t: string, id: string, patch: { status?: string; admin_note?: string }) => jpost<{ ok?: boolean; status?: string }>(b, t, `/api/admin/tickets/${id}`, patch, {}),
  // Devoluciones (admin)
  adminRefunds: (b: string, t: string) => jget<RefundsResp>(b, t, "/api/admin/refunds", { refunds: [], payments: [] }),
  adminCreateRefund: (b: string, t: string, transaction_id: string, reason: string) => jpost<{ ok?: boolean; status?: string; amount_usd?: number }>(b, t, "/api/admin/refund", { transaction_id, reason }, {}),
  // Cuenta (L19) — exportar / eliminar
  exportMyData: (b: string, t: string) => jget<Record<string, unknown>>(b, t, "/api/me/export", {}),
  deleteMyAccount: (b: string, t: string) => jpost<{ ok?: boolean; scope?: string }>(b, t, "/api/me/delete", { confirm: "ELIMINAR" }, {}),
  notifications: (b: string, t: string) => jget<{ id: string; title: string; body: string; campaign_type: string; related_matter_id: string | null; read_at: string | null; created_at: string }[]>(b, t, "/api/notifications", []),
  unreadCount: (b: string, t: string) => jget<{ count: number }>(b, t, "/api/notifications/unread-count", { count: 0 }),
  markAllRead: (b: string, t: string) => jpost(b, t, "/api/notifications/read-all", {}, {}),
  requestClient: (b: string, t: string, matterId: string, item: string) => jpost<{ ok?: boolean }>(b, t, "/api/missions/request-client", { matter_id: matterId, item }, {}),
  missionDocuments: (b: string, t: string, id: string) => jget<{ id: string; title: string; mime_type: string; ingest_status: string; created_at: string }[]>(b, t, `/api/missions/${id}/documents`, []),
  async uploadDocument(b: string, t: string, matterId: string, file: File): Promise<{ document_id?: string; chunks?: number; ingest_status?: string; error?: string }> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("matter_id", matterId);
    try {
      const r = await fetch(`${b}/api/documents`, { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: fd });
      return r.ok ? await r.json() : { error: `upload ${r.status}` };
    } catch {
      return { error: "upload failed" };
    }
  },
  async updateMission(b: string, t: string, id: string, body: Record<string, unknown>): Promise<{ ok?: boolean; source_warnings?: SourceWarning[] }> {
    try {
      const r = await fetch(`${b}/api/missions/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return r.ok ? await r.json() : { ok: false };
    } catch {
      return { ok: false };
    }
  },
  // ── Audiencias (transcripción de grabaciones → documento RAG + Acta) ──
  // Encola una audiencia por link (source='url') o por archivo ya subido (source='upload').
  crearAudiencia: (b: string, t: string, body: AudienciaBody) =>
    jpost<AudienciaJob>(b, t, "/api/audiencias", body, {} as AudienciaJob),
  // Estado/progreso de un job (polling).
  audienciaEstado: (b: string, t: string, id: string) =>
    jget<AudienciaJob>(b, t, `/api/audiencias/${id}`, {} as AudienciaJob),
  // Lista de audiencias del despacho (para abrir el acta desde la Bandeja).
  audiencias: (b: string, t: string) =>
    jget<{ audiencias: AudienciaJob[] }>(b, t, "/api/audiencias", { audiencias: [] }),
  // URL firmada para subir el archivo directo al bucket temporal (audios/videos grandes).
  audienciaUploadUrl: (b: string, t: string, filename: string) =>
    jpost<{ upload_url?: string; storage_path?: string; token?: string; error?: string }>(b, t, "/api/audiencias/upload-url", { filename }, {}),
  // Sube el archivo a la URL firmada devuelta por audienciaUploadUrl.
  async audienciaUpload(b: string, t: string, file: File): Promise<{ storage_path?: string; error?: string }> {
    try {
      const su = await api.audienciaUploadUrl(b, t, file.name);
      if (!su.storage_path) return { error: su.error || "no_upload_url" };
      if (su.upload_url) {
        const r = await fetch(su.upload_url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream", ...(su.token ? { Authorization: `Bearer ${su.token}` } : {}) }, body: file });
        if (!r.ok) return { error: `upload ${r.status}` };
      }
      return { storage_path: su.storage_path };
    } catch {
      return { error: "upload_failed" };
    }
  },
};

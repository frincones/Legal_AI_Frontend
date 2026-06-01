# Legal AI — Frontend

UI del agente legal: **Next.js (App Router) + Supabase Auth**, desplegada en **Vercel**.
Consume el **bridge SSE** del backend (Railway).

> Arquitectura: `ARQUITECTURA_FINAL.md` · Plan: `PLAN_IMPLEMENTACION_v2.md` (repo `Legal_AI`).

## Estado: Fase 0 (cimientos)
- ✅ Auth Supabase (`@supabase/ssr`) + middleware que gatea `/chat`
- ✅ Chat que consume el bridge SSE del backend (parser `event:`/`data:`)
- ⏳ Fase 1: assistant-ui (Thread/Composer/Artifacts) + AssistantTransport state-converter

## Estructura
```
app/
  layout.tsx · globals.css
  page.tsx          # redirige a /chat o /login según sesión
  login/page.tsx    # email+password (Supabase)
  chat/page.tsx     # server: obtiene sesión → <Chat/>
components/Chat.tsx  # cliente: POST /api/chat + parser SSE
lib/supabase/        # client + server (ssr)
middleware.ts        # refresh sesión + gate /chat
```

## Local
```bash
npm install
cp .env.example .env.local   # rellena NEXT_PUBLIC_*
npm run dev
```

## Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL` (URL pública del backend en Railway)

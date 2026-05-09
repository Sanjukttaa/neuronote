## NeuroNote AI — TanStack Start rebuild

This is a large app. I'll build it inside this Lovable project using the supported stack, in phases. We'll see something working at the end of each phase before moving on.

### Stack mapping (original → here)
- Next.js 15 → **TanStack Start** (file routes in `src/routes/`)
- Clerk → **Lovable Cloud auth** (email/password + Google)
- Prisma + Postgres + pgvector → **Lovable Cloud Postgres + pgvector** (migrations)
- Supabase Storage → **Lovable Cloud Storage**
- OpenAI GPT-4o + embeddings → **Lovable AI Gateway** (`google/gemini-3-flash-preview` for chat/summaries; embeddings via Gemini embedding model)
- Resend → Resend connector (later, for welcome emails)
- pdf-parse / mammoth → run in TanStack server functions (Cloudflare Workers can't run mammoth/pdf-parse natively — I'll use **unpdf** for PDFs and accept TXT/MD reliably; DOCX support will be best-effort or deferred)
- Clerk webhook user sync → Cloud auth trigger creates `profiles` row
- React Query, Zustand, Framer Motion, shadcn, Recharts, react-hook-form, Zod, cmdk, react-markdown, react-dropzone → all kept

### Build phases

**Phase 1 — Foundation (this turn)**
- Enable Lovable Cloud
- Design system in `src/styles.css` (dark-first, Quizlet/Linear-inspired, indigo+mint accents, Space Grotesk + Inter)
- Landing page (`/`) with Navbar, Hero, How-it-works, Feature grid, FAQ, Footer + Framer Motion
- Auth pages: `/login`, `/signup` (email/password + Google), `/_authenticated` route guard
- DB schema: profiles, folders, files, embeddings(vector 1536→768 for Gemini), summaries, flashcards, quizzes, questions, quiz_attempts, chat_messages, study_sessions, bookmarks, notifications + RLS
- Storage bucket `uploads`
- Dashboard shell (`/_authenticated/dashboard`): sidebar (collapsible) + topbar + welcome card placeholder

**Phase 2 — Uploads + AI core**
- File upload (PDF/TXT/MD) → Storage → text extraction → chunk → embed → pgvector
- Summaries (5 types) with tabs UI
- Flashcards generator + flip UI + SM-2 scheduling
- Quizzes generator + quiz engine + results

**Phase 3 — Chat (RAG) + analytics + planner**
- RAG chat with streaming + citations
- Analytics page (Recharts: heatmap, line, radar)
- Planner: calendar + Pomodoro
- Global Cmd+K search
- Settings + notifications

**Phase 4 — Polish**
- Mobile bottom nav, animations, error boundaries, toasts everywhere
- Resend welcome email
- Seed script equivalent (a "Load demo data" button in settings)

### Things I'll deviate from the original spec on
- **No Clerk** — Cloud auth is functionally equivalent and removes the keys-and-webhook setup.
- **No Prisma** — using Cloud's Postgres directly via the generated client + RLS. Schema is identical in shape.
- **Embeddings dim 768** (Gemini `text-embedding-004`) instead of 1536 (OpenAI). Same RAG pattern.
- **DOCX/PPTX**: not natively parseable in the Workers runtime; PDF + TXT + MD on launch, DOCX deferred.
- **Rate limiting**: simple per-user cooldown in DB, not Redis.
- I will say "Lovable AI" / "AI-powered" in user-facing copy, not "GPT-4o".

### Phase 1 acceptance
You can: visit `/`, sign up, land on `/dashboard` with a working sidebar shell. Empty states everywhere — no AI yet.

Reply **go** and I'll start Phase 1. If you want any deviation (e.g., keep OpenAI key, add DOCX, different palette), say so first.
# நலம் (Nalam) — Pension Workflow Tool

A workflow tool for Tamil Nadu Social Security Pension officers — built in Tamil, for the two roles who actually process these applications on the ground.

- **Live demo:** https://nalam-pension-workflow.vercel.app
- **GitHub repo:** https://github.com/codecrypt112/nalam-pension-workflow
- **Login credentials:** see [Demo credentials](#demo-credentials)

## The problem, and who it affects

Tamil Nadu's Social Security Pension Schemes (old-age pension, destitute widow pension) are processed through a paper file at the Taluk office:

1. A citizen — usually elderly, often low-literacy, rarely digitally connected — submits a paper application.
2. A **Village Administrative Officer (VAO)** visits the applicant's home to verify eligibility.
3. A **Revenue official (Tahsildar/RDO)** reviews the file and sanctions or rejects the pension.

Every handoff happens via a physical file moving between desks. Officers have no shared view of what's pending, no record of *why* something was sent back, and no help drafting the formal verification/decision language the role requires. The people this actually hurts are the applicants: elderly and widowed citizens who wait weeks with no visibility into where their file sits.

This tool is built **for the officers**, not the applicants — it digitizes the file, keeps it visible, and removes the repetitive drafting burden, while leaving every decision in the officer's hands.

## What the application does

Two staff roles, each with their own login:

- **கள சரிபார்ப்பாளர் (Field Verifier)** — VAO-equivalent. Owns stages 1–2.
- **அனுமதி அதிகாரி (Approving Officer)** — Tahsildar-equivalent. Owns stage 3.

**Language:** Tamil is the default and the home language of this tool — every label, badge, and message is written for it, not translated as an afterthought. A தமிழ் / English toggle in the header switches the whole UI (and, critically, what language the AI drafts in — matching whichever language the officer is currently reading), defaulting to whichever the device's browser language prefers. This was added after reviewer feedback that the tool needed to be testable by people who don't read Tamil; the deterministic eligibility/urgency logic (`lib/workflow.ts`) was refactored to return structured reason codes rather than hardcoded strings so the same business logic drives both languages with zero duplication.

### The workflow (3 stages)

```
[1] ஆவண சரிபார்ப்பு          [2] கள ஆய்வு                [3] இறுதி அனுமதி
Document Verification   →   Field Visit Verification  →   Final Approval
(Field Verifier)             (Field Verifier)               (Approving Officer)
```

Every application carries a `category` — **Old Age** (age ≥ 60) or **Widow** (husband deceased, not remarried) — with a category-specific eligibility checklist shown at every stage.

At each stage, the handling officer can:
- **Forward** to the next stage
- **Return** to an earlier stage (with a required remarks explaining why)
- **Reject** (stage 1/2) or **Approve** (stage 3, final sanction)

Every action requires a written remarks field — nothing happens silently — and is appended to an immutable history log. A worker logging in sees:

- **A prioritized queue** of applications in their own stage(s) — sorted by a deterministic, explainable urgency score (returned items first, then days-pending, then applicant age ≥ 80), not an AI black box. A government worker needs to be able to explain to a supervisor *why* a case jumped the queue.
- **A stats strip** — count per stage, average days-to-decision, % of applications returned at least once.
- **A full audit list** of every application regardless of stage (`/applications`), for transparency across the whole pipeline.
- **A per-application history timeline** showing every action, who took it, and whether it was AI-assisted.

## Where AI helps, and why

AI assists three specific moments where officers currently do manual, repetitive text work. It never sorts queues and never decides an outcome — every output is a pre-filled draft the officer must read and can edit before anything is submitted.

| Stage | AI assist | Why it genuinely helps |
|---|---|---|
| 1. Document Verification | Flags inconsistencies across entered fields (declared age vs. date of birth, declared income vs. the scheme's income ceiling, missing widow-category fields) | Catches clerical mismatches a human skims past under volume |
| 2. Field Visit | Expands the verifier's short field notes into a formal Tamil verification report | Removes the tedious formal-drafting step; the verifier edits before submitting |
| 3. Final Approval | Summarizes the full case (application + stage history) into a short brief, and drafts approve/reject/return remarks | The officer reads one paragraph instead of re-reading two stages of notes, and still writes the final word |

**Provider:** [NVIDIA NIM](https://build.nvidia.com)'s free-tier models, via their OpenAI-compatible `/chat/completions` endpoint. The model is configurable via `NIM_MODEL`; the deployed default is `nvidia/nemotron-3.5-bolt-e4b`, chosen empirically — most catalog models returned 404 for this key's account, several "reasoning" Nemotron variants spent hundreds of tokens on hidden chain-of-thought before answering (or never answered within a reasonable token budget), but `bolt-e4b` answers directly and produced correct, formal-register Tamil in testing.

**Fallback:** every AI function (`src/lib/ai.ts`) degrades to a deterministic, template-based Tamil response if the API key is missing, the request fails, or it times out (free-tier rate limits are a real operational concern). The UI always labels which mode produced the text — "AI உதவி" for a live model response, "AI உதவி — ஆஃப்லைன் பயன்முறை" for the offline fallback — so the officer always knows what they're reading. The app is fully usable end-to-end with zero API key configured.

AI is deliberately **not** used for the eligibility checklist or the queue-priority ordering — those stay as plain, auditable, deterministic logic (`src/lib/workflow.ts`) that any officer or supervisor can verify by reading the rule, not by trusting a model.

## Measuring impact

These are tracked live on the dashboard, not just claimed here:

- **Average days-to-decision** — does digitizing the handoff actually shrink the cycle time versus the paper-file baseline? (A real pilot would compare this against the Taluk's historical register times.)
- **% of applications returned at least once** — a proxy for upstream document/data quality. A rising trend flags a training gap at intake, not a tool problem.
- **AI-draft edit rate** — every time an officer submits remarks that originated from an AI draft, the app records whether they changed the text first (`ApplicationEvent.aiAssisted` / `.aiEdited`). A high "submitted unedited" rate on *bad* drafts would be a red flag, not a win — this number only means something read together with spot-checking draft quality, not in isolation.
- **Backlog size per stage** — the basic "is the queue draining or growing" signal, visible as the stage-count cards on the dashboard.

Why this should work: none of it asks an officer to change *how* they decide — it only removes paperwork and formal-drafting overhead from a process that already exists, and makes the backlog visible for the first time. The riskiest assumption is officer trust in the AI drafts; the edit-rate metric is specifically there to surface whether that trust is well-placed over time.

## Main technical decisions

- **Next.js 16 (App Router, TypeScript), single deployable app.** Server Actions double as the API layer — no separate backend service to build or deploy in sync.
- **Postgres everywhere (Prisma + `@prisma/adapter-pg`), not SQLite.** Several schema enums (`Role`, `Category`, `Stage`, `Status`, `EventAction`) needed real validation; Postgres via Neon also persists correctly on serverless, where SQLite's local file would not. Local dev runs an identical Postgres via Docker Compose, so dev and prod never drift.
- **Prisma 7's driver-adapter model.** Prisma 7 removed `datasource.url` from the schema file entirely — connection strings now go through a driver adapter passed to `PrismaClient` (`src/lib/db.ts`) and a separate `prisma.config.ts` for the CLI/migrations.
- **Lightweight custom auth**, not NextAuth/OAuth: a signed-cookie session (`jose`, HS256) with bcrypt-hashed passwords. There are 4 fixed staff accounts total — a full auth provider would be unneeded weight for an internal tool with no public signup.
- **Deterministic business logic kept separate from AI.** `src/lib/workflow.ts` is pure, dependency-free functions (eligibility, urgency scoring, legal stage-transitions) with no AI or I/O — this is what's unit-tested, and it's what stays auditable regardless of which model is wired into `lib/ai.ts`.
- **No file/image upload pipeline.** A production system would add document scanning/OCR and blob storage. This demo captures structured data entry instead, as a counter clerk would transcribe from a paper form — enough to demonstrate the workflow and the AI assistance without taking on infrastructure that doesn't change what's being evaluated.
- **Next.js 16 naming/API changes encountered during the build**, for anyone comparing against older Next.js docs: `middleware.ts` → `proxy.ts` (route protection lives in `src/proxy.ts`), and the new "Cache Components" caching model (on by default in the scaffold) was turned off in `next.config.ts` since this app is entirely dynamic/session-gated with no public static pages to benefit from it.
- **i18n via a plain dictionary, not a routing-based library (next-intl etc.).** With 2 locales and no public/SEO-indexed pages, a locale cookie (`src/lib/i18n/`) plus a `Record<Locale, Dictionary>` object is simpler and more transparent than adding locale-prefixed routes. The one place this required real design work: `checkEligibility`/`computeUrgency` in `lib/workflow.ts` return structured reason *codes* (e.g. `{ code: "below_min_age", age, minAge }`), not pre-formatted strings — a `format*Reason(code, locale)` function renders them at the view layer, so the tested business logic has no language baked into it at all.

## Testing

```bash
npm test
```

32 Vitest cases cover the pure business logic in `src/lib/workflow.ts`: category-specific eligibility rules, the urgency-scoring formula, the legal stage-transition table (which role can act on which stage, and that closed applications reject every action), and that every reason code renders to non-empty, distinct text in both locales. The AI module and the UI were verified end-to-end in a real browser against the live deployment (login → act through all three stages → approve, plus the reject/return branches, in both languages) rather than mocked, since the thing actually worth verifying is the full Server Action + database + AI round trip.

## Running it locally

**Prerequisites:** Node.js 20+, Docker (for local Postgres).

```bash
# 1. Install dependencies
npm install

# 2. Start a local Postgres
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Fill in NIM_API_KEY if you have one (https://build.nvidia.com) — optional,
# the app works without it in offline-draft mode.

# 4. Set up the database
npx prisma migrate dev
npx prisma db seed

# 5. Run tests
npm test

# 6. Start the app
npm run dev
```

Open http://localhost:3000 and sign in with one of the accounts below.

## Demo credentials

| Role | Username | Password |
|---|---|---|
| கள சரிபார்ப்பாளர் (Field Verifier) | `fv1` | `Field@123` |
| கள சரிபார்ப்பாளர் (Field Verifier) | `fv2` | `Field@123` |
| அனுமதி அதிகாரி (Approving Officer) | `ao1` | `Approve@123` |
| அனுமதி அதிகாரி (Approving Officer) | `ao2` | `Approve@123` |

The seed script (`prisma/seed.ts`) creates these 4 accounts plus 13 sample applications spread across all three stages — including already-returned, already-approved, and already-rejected cases — so the dashboard and history views are populated from a fresh install.

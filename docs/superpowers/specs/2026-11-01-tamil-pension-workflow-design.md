# நலம் — Tamil Nadu Social Security Pension Workflow Tool

**Status:** Approved for implementation
**Date:** 2026-11-01

## 1. Problem & who it affects

Tamil Nadu's Social Security Pension Schemes (old-age pension and destitute widow pension) are processed through a paper-and-register workflow at the Taluk level:

1. A citizen (often elderly, often low-literacy, rarely digitally connected) submits a paper application at the Taluk office.
2. A Village Administrative Officer (VAO) — the **field verifier** — visits the applicant's home to confirm eligibility.
3. A Revenue official (Tahsildar/RDO) — the **approving officer** — reviews the file and sanctions or rejects the pension.

Each handoff happens via physical files. Officers have no shared view of what's pending, no record of why something was returned, and no help drafting the formal verification/decision language the role requires. The people this actually hurts are the applicants — elderly and widowed citizens who wait weeks for a decision with no visibility into where their file sits. This tool is for the **officers**, not the applicants: it digitizes the file, keeps it visible, and removes the drafting burden, while leaving every decision in the officer's hands.

## 2. What the application does

A single Next.js app with two staff roles. Accounts are seeded (no public signup) and each officer logs in individually:

- **கள சரிபார்ப்பாளர் (Field Verifier)** — VAO-equivalent. Owns stages 1 and 2.
- **அனுமதி அதிகாரி (Approving Officer)** — Tahsildar-equivalent. Owns stage 3.

**UI language.** All officer-facing text — labels, buttons, form fields, validation messages, status chips, the history timeline, and every AI-generated output — is in Tamil (தமிழ்). English appears only in the code, the database schema, and the README. This is a primary evaluation axis ("quality of the design in the local language"), not a cosmetic layer of translated labels.

### Workflow (3 stages, at least 3 as required)

```
[1] ஆவண சரிபார்ப்பு            [2] கள ஆய்வு                    [3] இறுதி அனுமதி
Document Verification    →    Field Visit Verification   →    Final Approval
(Field Verifier)               (Field Verifier)                 (Approving Officer)

Actions available at each stage:
  Stage 1: Forward to field visit | Return to applicant (missing docs) | Reject (ineligible on paper)
  Stage 2: Forward to approval    | Return to stage 1 (need more docs)  | Reject (ineligible after visit)
  Stage 3: Approve (sanction)     | Return to stage 2 (needs reverification) | Reject (final)
```

Every application has a `category`: **Old Age** (age ≥ 60) or **Widow** (husband deceased, not remarried) — same 3-stage pipeline, category-specific eligibility checklist shown at each stage.

Every action requires a remarks field (approve/reject/return are all terminal-or-redirect state changes, never silent) and is appended to an immutable history log: actor, role, stage, action, remarks, timestamp, whether the remarks were AI-drafted or hand-written, and — for AI-drafted remarks — whether the officer edited the draft before submitting.

### Dashboards ("what needs attention first")

Each role sees only applications relevant to their stage(s). Sorting is by a **deterministic, explainable urgency score** — not AI — because a government worker needs to be able to explain to their supervisor why a case was prioritized:

- Returned/needs-rework applications surface first (they've already been delayed once).
- Then by days pending (older first).
- Applicant age ≥ 80 bumps priority (vulnerability).
- Missing-document flag shown as a badge.

A small stats strip sits above the queue: count per stage, average days-to-decision, % of applications returned at least once. These numbers are the same ones a real pilot would track to know if the tool is helping (see §6).

## 3. Where AI helps, and why

AI assists three specific moments where officers currently do manual, repetitive text work — it never sorts queues, never decides outcomes, and every output is a pre-filled draft the officer must review and can edit before submitting.

| Stage | AI assist | Why it genuinely helps |
|---|---|---|
| 1. Document Verification | Flags inconsistencies across entered fields (e.g. declared age vs. date of birth, declared monthly income against the scheme's income ceiling, or a Widow-category record whose husband-deceased / remarried status is unset) | Catches clerical mismatches a human skims past under volume |
| 2. Field Visit | Expands the verifier's short field notes into a formal Tamil verification report matching register language | Removes the tedious formal-drafting step; verifier edits before submitting |
| 3. Final Approval | Summarizes the full case (application + stage history) into a short Tamil brief, and drafts approve/reject/return remarks in Tamil | Officer reads one paragraph instead of re-reading two stages of notes, still writes the final word |

**Provider:** NVIDIA NIM free-tier models via their OpenAI-compatible endpoint (`https://integrate.api.nvidia.com/v1/chat/completions`), model `nvidia/nemotron-3.5-bolt-e4b` (configurable via env var — chosen after probing the catalog live against the provided key: most catalog models 404 for this account, several "reasoning" Nemotron variants burn hundreds of tokens on hidden chain-of-thought before answering, but `bolt-e4b` answers directly with no reasoning overhead and produced correct, formal-register Tamil in testing). A single server-side module, `lib/ai.ts`, exposes `checkDocumentConsistency()`, `draftFieldReport()`, `summarizeCase()`, and `draftDecisionRemarks()`.

**Fallback:** if the NIM call fails or no key is configured (rate limits are a real concern on a free tier), each function falls back to deterministic Tamil template generation, clearly labeled "ஆஃப்லைன் பயன்முறை" (offline mode) in the UI, so the app is always fully usable end-to-end.

## 4. Data model (Prisma)

```
User             id, name, username, password_hash, role (field_verifier | approving_officer)
Application      id, applicant_name, age, dob, gender, address, category (old_age | widow),
                  monthly_income, spouse_deceased (bool, Widow only), remarried (bool, Widow only),
                  aadhaar_no, bank_account,
                  stage (1 | 2 | 3), status (in_progress | returned | approved | rejected),
                  created_at, updated_at
ApplicationEvent id, application_id, actor_user_id, stage, action, remarks,
                  ai_assisted (bool), ai_edited (bool, null unless ai_assisted), created_at
```

`ApplicationEvent` is append-only and is both the audit trail and the source for the history timeline UI. No separate `Applicant` table — one application per applicant is the real-world cardinality here, so splitting it out would be premature.

Derived, not duplicated: the actor's **role** on the timeline is read from `actor_user_id → User.role` (seed accounts have fixed roles, so no point-in-time role column is needed). `age` is the figure declared on the paper form while `dob` is transcribed from age proof — the stage-1 AI consistency check flags any mismatch, and dob-derived age is authoritative for the age ≥ 60 eligibility rule. The dashboard's "returned" and "missing-document" signals are derived from `status` together with the most recent event's `action` (e.g. a stage-1 "return for missing docs"), not stored as separate flags. `spouse_deceased` / `remarried` are only populated for the Widow category and drive its eligibility checklist.

**Explicit scope cut — no file/image uploads.** A production system would integrate document scanning/OCR and blob storage. This demo captures structured data entry instead (as a counter clerk would transcribe from a paper form), which is enough to demonstrate the workflow and the AI assistance without taking on cloud storage infrastructure that doesn't change what's being evaluated here. Called out plainly in the README.

## 5. Tech stack & architecture

- **Next.js 15 (App Router, TypeScript)** — single deployable app, server actions/route handlers double as the API, no separate backend service to deploy/sync.
- **Prisma** — SQLite for local dev, **Postgres (Neon free tier)** in production (Vercel's filesystem is ephemeral, so SQLite can't persist there).
- **Tailwind CSS** for UI.
- **Auth:** lightweight custom signed-cookie session with bcrypt-hashed passwords. Not NextAuth/OAuth — there are a handful of fixed staff accounts total (2 field verifiers, 2 approving officers, seeded), not public signup, so a full auth provider is unneeded weight.
- **AI:** `lib/ai.ts` as described in §3, called from server actions only (API key never reaches the client).
- **Deploy:** Vercel, using the provided deploy token non-interactively. Env vars (`DATABASE_URL`, `NIM_API_KEY`, session secret) set via Vercel project settings, never committed.

## 6. Measuring impact

Tracked live on the Approving Officer's dashboard, not just claimed in the README:

- **Average days-to-decision** per stage — does digitizing the handoff actually shrink cycle time vs. the paper baseline (which the README will state as a researched/estimated figure)?
- **% returned at least once** — a proxy for upstream document/data quality; a rising trend flags a training gap, not just a tool gap.
- **AI-draft edit rate** — when an officer submits remarks that were AI-drafted (`ai_assisted = true`), a diff-check at submit time records whether they changed the text first, stored on `ApplicationEvent.ai_edited`. A high "submitted unedited" rate on bad drafts would be a red flag, not a win — the README discusses this nuance.
- **Backlog size over time** (count per stage) — the basic "is this draining or growing" signal.

## 7. Testing

- **Vitest unit tests** on pure business logic: eligibility checks per category, urgency scoring, and legal stage-transition rules (e.g. approving officer cannot act on a stage-1 application).
- **Integration test** exercising the full 3-stage happy path (seed → forward → forward → approve) against a test database, asserting the history log is correct at each step.
- **Manual browser verification** of the golden path and the return/reject branches before calling the work done — no Playwright e2e given the scope.

## 8. Explicit non-goals

- No citizen-facing portal — this is strictly an officer tool.
- No OCR/document image pipeline (see §4).
- No multi-district/multi-tenant support — single Taluk office, fixed seed accounts.
- No notification/SMS system.

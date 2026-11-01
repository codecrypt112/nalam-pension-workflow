import "server-only";
import { Category, EventAction } from "@prisma/client";
import { checkEligibility, EligibilityInput } from "@/lib/workflow";
import { CATEGORY_LABELS } from "@/lib/labels";

export type AiSource = "nim" | "offline";
export type AiResult = { text: string; source: AiSource };

const NIM_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT =
  "நீங்கள் தமிழ்நாடு வருவாய்த் துறையில் பணிபுரியும் அதிகாரிக்கு உதவும் உதவியாளர். பதில்களை தமிழில் மட்டும், அரசு பதிவேட்டு நடையில், சுருக்கமாக எழுதவும். ஆங்கிலம் கலக்க வேண்டாம், உங்கள் சிந்தனையை விளக்க வேண்டாம் — இறுதி பதிலை மட்டும் தரவும். இது ஒரு வரைவு மட்டுமே; அலுவலர் படித்து திருத்தி இறுதி செய்வார்.";

/**
 * Calls the configured NIM model. Returns null (never throws) on any
 * failure — missing key, network error, timeout, non-2xx, or an empty
 * completion (the lightweight reasoning models in NVIDIA's free catalog
 * can exhaust max_tokens on hidden chain-of-thought and return no content).
 * Callers always have a deterministic offline fallback for the null case.
 */
async function callNim(
  messages: Array<{ role: "system" | "user"; content: string }>,
  maxTokens: number
): Promise<string | null> {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
  const model = process.env.NIM_MODEL ?? "nvidia/nemotron-3.5-bolt-e4b";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NIM_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) return null;
    return content.trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Stage 1 — flags inconsistencies in the entered data (age vs. DOB, income
 * vs. ceiling, missing widow fields). The structured findings come from the
 * same deterministic `checkEligibility` the officer's checklist uses, so
 * offline mode is never "fake" — it's the same facts in a plainer format.
 * When NIM is available, we ask it to phrase those exact facts naturally.
 */
export async function checkDocumentConsistency(input: EligibilityInput): Promise<AiResult> {
  const { reasons } = checkEligibility(input);
  const categoryLabel = CATEGORY_LABELS[input.category];

  if (reasons.length === 0) {
    const offlineText = `ஆவணங்களில் முரண்பாடு எதுவும் கண்டறியப்படவில்லை. வயது, வருமானம் (ரூ.${input.monthlyIncome}) மற்றும் ${categoryLabel} தகுதி விவரங்கள் பொருந்துகின்றன.`;
    const polished = await callNim(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${categoryLabel} விண்ணப்பத்தில் ஆவண முரண்பாடு இல்லை என உறுதியாகிவிட்டது. இதை ஒரு வரி உறுதிமொழியாக எழுதுக.`,
        },
      ],
      150
    );
    return polished ? { text: polished, source: "nim" } : { text: offlineText, source: "offline" };
  }

  const bulletText = reasons.map((r) => `• ${r}`).join("\n");
  const polished = await callNim(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `பின்வரும் முரண்பாடுகள் கண்டறியப்பட்டுள்ளன. இவற்றை அலுவலருக்கு எச்சரிக்கை குறிப்பாக 2-3 வரிகளில் தெளிவாக எழுதுக:\n${bulletText}`,
      },
    ],
    400
  );
  return polished ? { text: polished, source: "nim" } : { text: bulletText, source: "offline" };
}

export type FieldReportApplicant = {
  applicantName: string;
  age: number;
  category: Category;
  address: string;
};

/** Stage 2 — expands the verifier's short field notes into a formal report. */
export async function draftFieldReport(
  applicant: FieldReportApplicant,
  notes: string
): Promise<AiResult> {
  const categoryLabel = CATEGORY_LABELS[applicant.category];
  const offlineText = `களச் சரிபார்ப்பு அறிக்கை: விண்ணப்பதாரர் ${applicant.applicantName} (வயது ${applicant.age}, ${applicant.address}) அவரது இல்லத்தில் நேரில் சந்திக்கப்பட்டார். கள அலுவலர் குறிப்புகள்: ${notes.trim()}`;

  if (!notes.trim()) {
    return { text: offlineText, source: "offline" };
  }

  const polished = await callNim(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `கள சரிபார்ப்பாளரின் குறிப்புகள்: '${notes.trim()}'. விண்ணப்பதாரர்: ${applicant.applicantName}, வயது ${applicant.age}, ${categoryLabel} விண்ணப்பம். இதை முறையான சரிபார்ப்பு அறிக்கையாக 3-4 வரிகளில் எழுதுக.`,
      },
    ],
    500
  );
  return polished ? { text: polished, source: "nim" } : { text: offlineText, source: "offline" };
}

export type CaseEvent = {
  stageLabel: string;
  actionLabel: string;
  remarks: string;
  actorName: string;
};

export type CaseApplicant = {
  applicantName: string;
  age: number;
  category: Category;
  stageLabel: string;
};

/** Stage 3 — summarizes the full case history into a short brief for the approving officer. */
export async function summarizeCase(applicant: CaseApplicant, events: CaseEvent[]): Promise<AiResult> {
  const categoryLabel = CATEGORY_LABELS[applicant.category];
  const historyLines = events
    .map((e) => `${e.stageLabel} (${e.actorName}): ${e.actionLabel} — ${e.remarks}`)
    .join("\n");

  const offlineText =
    `${applicant.applicantName} (வயது ${applicant.age}) — ${categoryLabel} விண்ணப்பம், தற்போது "${applicant.stageLabel}" நிலையில் உள்ளது.\n` +
    (events.length > 0 ? `முந்தைய நடவடிக்கைகள்:\n${historyLines}` : "இதுவரை எந்த நடவடிக்கையும் பதிவாகவில்லை.");

  if (events.length === 0) {
    return { text: offlineText, source: "offline" };
  }

  const polished = await callNim(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `விண்ணப்பதாரர் ${applicant.applicantName} (வயது ${applicant.age}, ${categoryLabel}) கோரிக்கையின் கட்ட வரலாறு:\n${historyLines}\n\nஇதை இறுதி அனுமதி அதிகாரிக்கு 3-4 வரிகளில் சுருக்கமாக தமிழில் எழுதுக.`,
      },
    ],
    500
  );
  return polished ? { text: polished, source: "nim" } : { text: offlineText, source: "offline" };
}

const DECISION_LABEL: Record<"approve" | "reject" | "return_app", string> = {
  approve: "அனுமதி",
  reject: "நிராகரிப்பு",
  return_app: "திருப்பி அனுப்புதல்",
};

/** Drafts remarks for approve/reject/return — always editable, never auto-submitted. */
export async function draftDecisionRemarks(
  applicant: CaseApplicant,
  eligibility: ReturnType<typeof checkEligibility>,
  decision: "approve" | "reject" | "return_app"
): Promise<AiResult> {
  const categoryLabel = CATEGORY_LABELS[applicant.category];
  const decisionLabel = DECISION_LABEL[decision];

  let offlineText: string;
  if (decision === "approve") {
    offlineText = `அனைத்து ஆவணங்களும் சரிபார்க்கப்பட்டு, தகுதி உறுதி செய்யப்பட்டது. ${categoryLabel} அனுமதிக்கப்படுகிறது.`;
  } else if (decision === "reject") {
    offlineText =
      eligibility.reasons.length > 0
        ? `தகுதியற்றவர்: ${eligibility.reasons.join(" ")}`
        : `ஆவணங்கள் மற்றும் கள ஆய்வு அடிப்படையில் தகுதியற்றவர் எனக் கண்டறியப்பட்டது.`;
  } else {
    offlineText =
      eligibility.reasons.length > 0
        ? `கூடுதல் விவரம்/ஆவணம் தேவை: ${eligibility.reasons.join(" ")}`
        : `மீள் சரிபார்ப்பு தேவை. விவரம் கள அலுவலரால் தெளிவுபடுத்தப்பட வேண்டும்.`;
  }

  const polished = await callNim(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `விண்ணப்பதாரர் ${applicant.applicantName} (வயது ${applicant.age}, ${categoryLabel}). அலுவலர் "${decisionLabel}" முடிவை எடுக்க உள்ளார். ${
          eligibility.reasons.length > 0
            ? `கண்டறியப்பட்ட பிரச்சினைகள்: ${eligibility.reasons.join(" ")}`
            : "தகுதி தடைகள் இல்லை."
        } இந்த முடிவுக்கான பதிவேட்டு குறிப்பை 2-3 வரிகளில் எழுதுக.`,
      },
    ],
    400
  );
  return polished ? { text: polished, source: "nim" } : { text: offlineText, source: "offline" };
}

export const AI_DECISION_FOR_ACTION: Record<EventAction, "approve" | "reject" | "return_app" | null> = {
  [EventAction.approve]: "approve",
  [EventAction.reject]: "reject",
  [EventAction.return_app]: "return_app",
  [EventAction.forward]: null,
};

import { Category, EventAction, Role, Stage, Status } from "@prisma/client";
import type { Locale } from "@/lib/i18n/types";

/** Monthly household income ceiling (INR) for both pension categories. */
export const INCOME_CEILING = 1000;

/** Minimum age for the old-age pension category. */
export const OLD_AGE_MIN_AGE = 60;

export type EligibilityInput = {
  category: Category;
  age: number;
  dob: Date;
  monthlyIncome: number;
  spouseDeceased: boolean | null;
  remarried: boolean | null;
};

export type EligibilityReason =
  | { code: "age_mismatch"; declaredAge: number; derivedAge: number }
  | { code: "income_exceeds_ceiling"; income: number; ceiling: number }
  | { code: "below_min_age"; age: number; minAge: number }
  | { code: "spouse_not_confirmed_deceased" }
  | { code: "remarried" };

export type EligibilityResult = {
  eligible: boolean;
  reasons: EligibilityReason[];
};

export function ageFromDob(dob: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Category-specific eligibility checklist. Pure and deterministic — this is
 * what the officer sees as a checklist, and what the AI consistency check
 * in lib/ai.ts cross-references against (it flags mismatches, it doesn't
 * decide eligibility itself). Reasons are structured codes, not localized
 * text — see `formatEligibilityReason` for display strings.
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const reasons: EligibilityReason[] = [];
  const derivedAge = ageFromDob(input.dob);

  if (Math.abs(derivedAge - input.age) > 1) {
    reasons.push({ code: "age_mismatch", declaredAge: input.age, derivedAge });
  }

  if (input.monthlyIncome > INCOME_CEILING) {
    reasons.push({ code: "income_exceeds_ceiling", income: input.monthlyIncome, ceiling: INCOME_CEILING });
  }

  if (input.category === Category.old_age) {
    if (derivedAge < OLD_AGE_MIN_AGE) {
      reasons.push({ code: "below_min_age", age: derivedAge, minAge: OLD_AGE_MIN_AGE });
    }
  } else {
    if (input.spouseDeceased !== true) {
      reasons.push({ code: "spouse_not_confirmed_deceased" });
    }
    if (input.remarried === true) {
      reasons.push({ code: "remarried" });
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

const ELIGIBILITY_REASON_TEMPLATES: Record<Locale, (r: EligibilityReason) => string> = {
  ta: (r) => {
    switch (r.code) {
      case "age_mismatch":
        return `விண்ணப்பத்தில் உள்ள வயது (${r.declaredAge}) பிறந்த தேதியிலிருந்து கணக்கிடப்பட்ட வயதுடன் (${r.derivedAge}) பொருந்தவில்லை.`;
      case "income_exceeds_ceiling":
        return `மாத வருமானம் ரூ.${r.income} வரம்பான ரூ.${r.ceiling} ஐ விட அதிகம்.`;
      case "below_min_age":
        return `வயது ${r.age}, முதுமை ஓய்வூதியத்திற்கான குறைந்தபட்ச வயது ${r.minAge} ஐ விட குறைவு.`;
      case "spouse_not_confirmed_deceased":
        return "கணவர் இறப்பு உறுதிப்படுத்தப்படவில்லை.";
      case "remarried":
        return "மீண்டும் திருமணம் செய்துள்ளார் — விதவை உதவித்தொகைக்கு தகுதியற்றவர்.";
    }
  },
  en: (r) => {
    switch (r.code) {
      case "age_mismatch":
        return `The declared age (${r.declaredAge}) does not match the age derived from the date of birth (${r.derivedAge}).`;
      case "income_exceeds_ceiling":
        return `Monthly income of ₹${r.income} exceeds the ₹${r.ceiling} ceiling.`;
      case "below_min_age":
        return `Age ${r.age} is below the minimum age of ${r.minAge} for old-age pension.`;
      case "spouse_not_confirmed_deceased":
        return "Spouse's death has not been confirmed.";
      case "remarried":
        return "Applicant has remarried — not eligible for widow pension.";
    }
  },
};

export function formatEligibilityReason(reason: EligibilityReason, locale: Locale): string {
  return ELIGIBILITY_REASON_TEMPLATES[locale](reason);
}

export type UrgencyInput = {
  status: Status;
  age: number;
  createdAt: Date;
  lastEventAt: Date | null;
};

export type UrgencyReason =
  | { code: "returned_for_rework" }
  | { code: "vulnerable_age"; age: number }
  | { code: "days_pending"; days: number };

export type UrgencyResult = {
  score: number;
  level: "urgent" | "attention" | "normal";
  reasons: UrgencyReason[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic, explainable triage score — intentionally not AI-driven.
 * An officer must be able to justify to a supervisor why a case jumped
 * the queue, so the inputs and weights here are fixed and visible.
 */
export function computeUrgency(input: UrgencyInput, now: Date = new Date()): UrgencyResult {
  const sinceDate = input.lastEventAt ?? input.createdAt;
  const daysPending = Math.floor((now.getTime() - sinceDate.getTime()) / DAY_MS);
  const reasons: UrgencyReason[] = [];
  let score = daysPending * 10;

  if (input.status === Status.returned) {
    score += 1000;
    reasons.push({ code: "returned_for_rework" });
  }

  if (input.age >= 80) {
    score += 500;
    reasons.push({ code: "vulnerable_age", age: input.age });
  }

  if (daysPending > 14) {
    score += 200;
    reasons.push({ code: "days_pending", days: daysPending });
  } else if (daysPending > 7) {
    reasons.push({ code: "days_pending", days: daysPending });
  }

  let level: UrgencyResult["level"] = "normal";
  if (score >= 700) level = "urgent";
  else if (score >= 100) level = "attention";

  return { score, level, reasons };
}

const URGENCY_REASON_TEMPLATES: Record<Locale, (r: UrgencyReason) => string> = {
  ta: (r) => {
    switch (r.code) {
      case "returned_for_rework":
        return "மீண்டும் பணிபுரிய திருப்பி அனுப்பப்பட்டது";
      case "vulnerable_age":
        return `வயது ${r.age} — முன்னுரிமை தேவை`;
      case "days_pending":
        return `${r.days} நாட்களாக நிலுவையில்`;
    }
  },
  en: (r) => {
    switch (r.code) {
      case "returned_for_rework":
        return "Returned for rework";
      case "vulnerable_age":
        return `Age ${r.age} — needs priority`;
      case "days_pending":
        return `Pending for ${r.days} days`;
    }
  },
};

export function formatUrgencyReason(reason: UrgencyReason, locale: Locale): string {
  return URGENCY_REASON_TEMPLATES[locale](reason);
}

export const FIELD_VERIFIER_STAGES: Stage[] = [Stage.stage1, Stage.stage2];
export const APPROVING_OFFICER_STAGES: Stage[] = [Stage.stage3];

export function stagesForRole(role: Role): Stage[] {
  return role === Role.field_verifier ? FIELD_VERIFIER_STAGES : APPROVING_OFFICER_STAGES;
}

export type StageActionConfig = {
  action: EventAction;
  label: Record<Locale, string>;
  nextStage: Stage;
  nextStatus: Status;
  requiresRemarks: true;
};

const STAGE_ACTIONS: Record<Stage, StageActionConfig[]> = {
  [Stage.stage1]: [
    {
      action: EventAction.forward,
      label: { ta: "கள ஆய்வுக்கு அனுப்பு", en: "Forward to field visit" },
      nextStage: Stage.stage2,
      nextStatus: Status.in_progress,
      requiresRemarks: true,
    },
    {
      action: EventAction.return_app,
      label: { ta: "விண்ணப்பதாரருக்கு திருப்பி அனுப்பு (ஆவணம் குறை)", en: "Return to applicant (missing documents)" },
      nextStage: Stage.stage1,
      nextStatus: Status.returned,
      requiresRemarks: true,
    },
    {
      action: EventAction.reject,
      label: { ta: "நிராகரி (ஆவணப்படி தகுதியற்றவர்)", en: "Reject (ineligible on paper)" },
      nextStage: Stage.stage1,
      nextStatus: Status.rejected,
      requiresRemarks: true,
    },
  ],
  [Stage.stage2]: [
    {
      action: EventAction.forward,
      label: { ta: "இறுதி அனுமதிக்கு அனுப்பு", en: "Forward to final approval" },
      nextStage: Stage.stage3,
      nextStatus: Status.in_progress,
      requiresRemarks: true,
    },
    {
      action: EventAction.return_app,
      label: { ta: "ஆவண சரிபார்ப்புக்கு திருப்பி அனுப்பு", en: "Return to document verification" },
      nextStage: Stage.stage1,
      nextStatus: Status.returned,
      requiresRemarks: true,
    },
    {
      action: EventAction.reject,
      label: { ta: "நிராகரி (கள ஆய்வில் தகுதியற்றவர்)", en: "Reject (ineligible after field visit)" },
      nextStage: Stage.stage2,
      nextStatus: Status.rejected,
      requiresRemarks: true,
    },
  ],
  [Stage.stage3]: [
    {
      action: EventAction.approve,
      label: { ta: "அனுமதி (ஓய்வூதியம் வழங்கு)", en: "Approve (sanction pension)" },
      nextStage: Stage.stage3,
      nextStatus: Status.approved,
      requiresRemarks: true,
    },
    {
      action: EventAction.return_app,
      label: { ta: "கள ஆய்வுக்கு திருப்பி அனுப்பு (மீள் சரிபார்ப்பு தேவை)", en: "Return to field visit (needs reverification)" },
      nextStage: Stage.stage2,
      nextStatus: Status.returned,
      requiresRemarks: true,
    },
    {
      action: EventAction.reject,
      label: { ta: "இறுதி நிராகரிப்பு", en: "Final rejection" },
      nextStage: Stage.stage3,
      nextStatus: Status.rejected,
      requiresRemarks: true,
    },
  ],
};

const CLOSED_STATUSES: Status[] = [Status.approved, Status.rejected];

export function isClosed(status: Status): boolean {
  return CLOSED_STATUSES.includes(status);
}

/** Can this role act on an application currently at this stage/status at all? */
export function canUserActOnApplication(role: Role, stage: Stage, status: Status): boolean {
  if (isClosed(status)) return false;
  return stagesForRole(role).includes(stage);
}

/** The set of actions available to a role for an application's current stage/status. */
export function availableActions(role: Role, stage: Stage, status: Status): StageActionConfig[] {
  if (!canUserActOnApplication(role, stage, status)) return [];
  return STAGE_ACTIONS[stage];
}

export type ApplyActionResult =
  | { ok: true; nextStage: Stage; nextStatus: Status }
  | { ok: false; errorKey: "action_not_allowed" };

/**
 * Validates and resolves a requested action against the current application
 * state and the acting role. This is the single source of truth for legal
 * transitions — callers (server actions, tests) must go through this rather
 * than mutating stage/status directly.
 */
export function applyAction(
  role: Role,
  stage: Stage,
  status: Status,
  action: EventAction
): ApplyActionResult {
  const allowed = availableActions(role, stage, status);
  const config = allowed.find((a) => a.action === action);
  if (!config) {
    return { ok: false, errorKey: "action_not_allowed" };
  }
  return { ok: true, nextStage: config.nextStage, nextStatus: config.nextStatus };
}

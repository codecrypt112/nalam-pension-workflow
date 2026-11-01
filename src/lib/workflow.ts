import { Category, EventAction, Role, Stage, Status } from "@prisma/client";

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

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
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
 * decide eligibility itself).
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const reasons: string[] = [];
  const derivedAge = ageFromDob(input.dob);

  if (Math.abs(derivedAge - input.age) > 1) {
    reasons.push(
      `விண்ணப்பத்தில் உள்ள வயது (${input.age}) பிறந்த தேதியிலிருந்து கணக்கிடப்பட்ட வயதுடன் (${derivedAge}) பொருந்தவில்லை.`
    );
  }

  if (input.monthlyIncome > INCOME_CEILING) {
    reasons.push(
      `மாத வருமானம் ரூ.${input.monthlyIncome} வரம்பான ரூ.${INCOME_CEILING} ஐ விட அதிகம்.`
    );
  }

  if (input.category === Category.old_age) {
    if (derivedAge < OLD_AGE_MIN_AGE) {
      reasons.push(`வயது ${derivedAge}, முதுமை ஓய்வூதியத்திற்கான குறைந்தபட்ச வயது ${OLD_AGE_MIN_AGE} ஐ விட குறைவு.`);
    }
  } else {
    if (input.spouseDeceased !== true) {
      reasons.push("கணவர் இறப்பு உறுதிப்படுத்தப்படவில்லை.");
    }
    if (input.remarried === true) {
      reasons.push("மீண்டும் திருமணம் செய்துள்ளார் — விதவை உதவித்தொகைக்கு தகுதியற்றவர்.");
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

export type UrgencyInput = {
  status: Status;
  age: number;
  createdAt: Date;
  lastEventAt: Date | null;
};

export type UrgencyResult = {
  score: number;
  level: "urgent" | "attention" | "normal";
  reasons: string[];
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
  const reasons: string[] = [];
  let score = daysPending * 10;

  if (input.status === Status.returned) {
    score += 1000;
    reasons.push("மீண்டும் பணிபுரிய திருப்பி அனுப்பப்பட்டது");
  }

  if (input.age >= 80) {
    score += 500;
    reasons.push(`வயது ${input.age} — முன்னுரிமை தேவை`);
  }

  if (daysPending > 14) {
    score += 200;
    reasons.push(`${daysPending} நாட்களாக நிலுவையில்`);
  } else if (daysPending > 7) {
    reasons.push(`${daysPending} நாட்களாக நிலுவையில்`);
  }

  let level: UrgencyResult["level"] = "normal";
  if (score >= 700) level = "urgent";
  else if (score >= 100) level = "attention";

  return { score, level, reasons };
}

export const FIELD_VERIFIER_STAGES: Stage[] = [Stage.stage1, Stage.stage2];
export const APPROVING_OFFICER_STAGES: Stage[] = [Stage.stage3];

export function stagesForRole(role: Role): Stage[] {
  return role === Role.field_verifier ? FIELD_VERIFIER_STAGES : APPROVING_OFFICER_STAGES;
}

export type StageActionConfig = {
  action: EventAction;
  label: string;
  nextStage: Stage;
  nextStatus: Status;
  requiresRemarks: true;
};

const STAGE_ACTIONS: Record<Stage, StageActionConfig[]> = {
  [Stage.stage1]: [
    {
      action: EventAction.forward,
      label: "கள ஆய்வுக்கு அனுப்பு",
      nextStage: Stage.stage2,
      nextStatus: Status.in_progress,
      requiresRemarks: true,
    },
    {
      action: EventAction.return_app,
      label: "விண்ணப்பதாரருக்கு திருப்பி அனுப்பு (ஆவணம் குறை)",
      nextStage: Stage.stage1,
      nextStatus: Status.returned,
      requiresRemarks: true,
    },
    {
      action: EventAction.reject,
      label: "நிராகரி (ஆவணப்படி தகுதியற்றவர்)",
      nextStage: Stage.stage1,
      nextStatus: Status.rejected,
      requiresRemarks: true,
    },
  ],
  [Stage.stage2]: [
    {
      action: EventAction.forward,
      label: "இறுதி அனுமதிக்கு அனுப்பு",
      nextStage: Stage.stage3,
      nextStatus: Status.in_progress,
      requiresRemarks: true,
    },
    {
      action: EventAction.return_app,
      label: "ஆவண சரிபார்ப்புக்கு திருப்பி அனுப்பு",
      nextStage: Stage.stage1,
      nextStatus: Status.returned,
      requiresRemarks: true,
    },
    {
      action: EventAction.reject,
      label: "நிராகரி (கள ஆய்வில் தகுதியற்றவர்)",
      nextStage: Stage.stage2,
      nextStatus: Status.rejected,
      requiresRemarks: true,
    },
  ],
  [Stage.stage3]: [
    {
      action: EventAction.approve,
      label: "அனுமதி (ஓய்வூதியம் வழங்கு)",
      nextStage: Stage.stage3,
      nextStatus: Status.approved,
      requiresRemarks: true,
    },
    {
      action: EventAction.return_app,
      label: "கள ஆய்வுக்கு திருப்பி அனுப்பு (மீள் சரிபார்ப்பு தேவை)",
      nextStage: Stage.stage2,
      nextStatus: Status.returned,
      requiresRemarks: true,
    },
    {
      action: EventAction.reject,
      label: "இறுதி நிராகரிப்பு",
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
  | { ok: false; error: string };

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
    return {
      ok: false,
      error: "இந்த நிலையில் இந்த செயலை இந்த பயனர் செய்ய அனுமதியில்லை.",
    };
  }
  return { ok: true, nextStage: config.nextStage, nextStatus: config.nextStatus };
}

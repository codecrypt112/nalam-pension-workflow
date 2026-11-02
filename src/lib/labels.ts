import { Category, EventAction, Role, Stage, Status } from "@prisma/client";
import type { Locale } from "@/lib/i18n/types";

const CATEGORY_LABELS: Record<Locale, Record<Category, string>> = {
  ta: {
    [Category.old_age]: "முதுமை ஓய்வூதியம்",
    [Category.widow]: "விதவை உதவித்தொகை",
  },
  en: {
    [Category.old_age]: "Old Age Pension",
    [Category.widow]: "Widow Pension",
  },
};

const STAGE_LABELS: Record<Locale, Record<Stage, string>> = {
  ta: {
    [Stage.stage1]: "ஆவண சரிபார்ப்பு",
    [Stage.stage2]: "கள ஆய்வு",
    [Stage.stage3]: "இறுதி அனுமதி",
  },
  en: {
    [Stage.stage1]: "Document Verification",
    [Stage.stage2]: "Field Visit",
    [Stage.stage3]: "Final Approval",
  },
};

const STATUS_LABELS: Record<Locale, Record<Status, string>> = {
  ta: {
    [Status.in_progress]: "செயலில்",
    [Status.returned]: "திருப்பி அனுப்பப்பட்டது",
    [Status.approved]: "அனுமதிக்கப்பட்டது",
    [Status.rejected]: "நிராகரிக்கப்பட்டது",
  },
  en: {
    [Status.in_progress]: "In Progress",
    [Status.returned]: "Returned",
    [Status.approved]: "Approved",
    [Status.rejected]: "Rejected",
  },
};

const ACTION_LABELS: Record<Locale, Record<EventAction, string>> = {
  ta: {
    [EventAction.forward]: "அனுப்பப்பட்டது",
    [EventAction.return_app]: "திருப்பி அனுப்பப்பட்டது",
    [EventAction.reject]: "நிராகரிக்கப்பட்டது",
    [EventAction.approve]: "அனுமதிக்கப்பட்டது",
  },
  en: {
    [EventAction.forward]: "Forwarded",
    [EventAction.return_app]: "Returned",
    [EventAction.reject]: "Rejected",
    [EventAction.approve]: "Approved",
  },
};

const ROLE_LABELS: Record<Locale, Record<Role, string>> = {
  ta: {
    [Role.field_verifier]: "கள சரிபார்ப்பாளர்",
    [Role.approving_officer]: "அனுமதி அதிகாரி",
  },
  en: {
    [Role.field_verifier]: "Field Verifier",
    [Role.approving_officer]: "Approving Officer",
  },
};

export function categoryLabel(category: Category, locale: Locale): string {
  return CATEGORY_LABELS[locale][category];
}

export function stageLabel(stage: Stage, locale: Locale): string {
  return STAGE_LABELS[locale][stage];
}

export function statusLabel(status: Status, locale: Locale): string {
  return STATUS_LABELS[locale][status];
}

export function actionLabel(action: EventAction, locale: Locale): string {
  return ACTION_LABELS[locale][action];
}

export function roleLabel(role: Role, locale: Locale): string {
  return ROLE_LABELS[locale][role];
}

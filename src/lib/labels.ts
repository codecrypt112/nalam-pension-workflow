import { Category, EventAction, Role, Stage, Status } from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.old_age]: "முதுமை ஓய்வூதியம்",
  [Category.widow]: "விதவை உதவித்தொகை",
};

export const STAGE_LABELS: Record<Stage, string> = {
  [Stage.stage1]: "ஆவண சரிபார்ப்பு",
  [Stage.stage2]: "கள ஆய்வு",
  [Stage.stage3]: "இறுதி அனுமதி",
};

export const STATUS_LABELS: Record<Status, string> = {
  [Status.in_progress]: "செயலில்",
  [Status.returned]: "திருப்பி அனுப்பப்பட்டது",
  [Status.approved]: "அனுமதிக்கப்பட்டது",
  [Status.rejected]: "நிராகரிக்கப்பட்டது",
};

export const ACTION_LABELS: Record<EventAction, string> = {
  [EventAction.forward]: "அனுப்பப்பட்டது",
  [EventAction.return_app]: "திருப்பி அனுப்பப்பட்டது",
  [EventAction.reject]: "நிராகரிக்கப்பட்டது",
  [EventAction.approve]: "அனுமதிக்கப்பட்டது",
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.field_verifier]: "கள சரிபார்ப்பாளர்",
  [Role.approving_officer]: "அனுமதி அதிகாரி",
};

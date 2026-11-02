"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EventAction } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { applyAction, checkEligibility } from "@/lib/workflow";
import {
  AiResult,
  checkDocumentConsistency,
  draftDecisionRemarks,
  draftFieldReport,
  summarizeCase,
} from "@/lib/ai";
import { actionLabel, stageLabel } from "@/lib/labels";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/types";

async function loadApplication(id: string, locale: Locale) {
  const app = await db.application.findUnique({ where: { id } });
  if (!app) throw new Error(getDictionary(locale).applicationDetail.applicationNotFoundError);
  return app;
}

export async function runDocumentCheckAction(applicationId: string): Promise<AiResult> {
  await requireSession();
  const locale = await getLocale();
  const app = await loadApplication(applicationId, locale);
  return checkDocumentConsistency(app, locale);
}

export async function runFieldReportAction(applicationId: string, notes: string): Promise<AiResult> {
  await requireSession();
  const locale = await getLocale();
  const app = await loadApplication(applicationId, locale);
  return draftFieldReport(
    { applicantName: app.applicantName, age: app.age, category: app.category, address: app.address },
    notes,
    locale
  );
}

export async function runCaseSummaryAction(applicationId: string): Promise<AiResult> {
  await requireSession();
  const locale = await getLocale();
  const app = await loadApplication(applicationId, locale);
  const events = await db.applicationEvent.findMany({
    where: { applicationId },
    orderBy: { createdAt: "asc" },
    include: { actor: true },
  });
  return summarizeCase(
    {
      applicantName: app.applicantName,
      age: app.age,
      category: app.category,
      stageLabel: stageLabel(app.stage, locale),
    },
    events.map((e) => ({
      stageLabel: stageLabel(e.stage, locale),
      actionLabel: actionLabel(e.action, locale),
      remarks: e.remarks,
      actorName: e.actor.name,
    })),
    locale
  );
}

export async function runDecisionDraftAction(
  applicationId: string,
  decision: "approve" | "reject" | "return_app"
): Promise<AiResult> {
  await requireSession();
  const locale = await getLocale();
  const app = await loadApplication(applicationId, locale);
  const eligibility = checkEligibility(app);
  return draftDecisionRemarks(
    {
      applicantName: app.applicantName,
      age: app.age,
      category: app.category,
      stageLabel: stageLabel(app.stage, locale),
    },
    eligibility,
    decision,
    locale
  );
}

export type SubmitActionState = { error: string | null };

export async function submitApplicationAction(
  _prevState: SubmitActionState,
  formData: FormData
): Promise<SubmitActionState> {
  const session = await requireSession();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const applicationId = String(formData.get("applicationId") ?? "");
  const action = String(formData.get("action") ?? "") as EventAction;
  const remarks = String(formData.get("remarks") ?? "").trim();
  const aiAssisted = formData.get("aiAssisted") === "true";
  const aiEdited = aiAssisted ? formData.get("aiEdited") === "true" : null;

  if (!remarks) {
    return { error: t.applicationDetail.remarksRequiredError };
  }

  const app = await loadApplication(applicationId, locale);
  const result = applyAction(session.role, app.stage, app.status, action);
  if (!result.ok) {
    return { error: t.applicationDetail.actionNotAllowedError };
  }

  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { stage: result.nextStage, status: result.nextStatus },
    }),
    db.applicationEvent.create({
      data: {
        applicationId,
        actorId: session.sub,
        stage: app.stage,
        action,
        remarks,
        aiAssisted,
        aiEdited,
      },
    }),
  ]);

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
  redirect(`/applications/${applicationId}`);
}

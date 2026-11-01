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
import { ACTION_LABELS, STAGE_LABELS } from "@/lib/labels";

async function loadApplication(id: string) {
  const app = await db.application.findUnique({ where: { id } });
  if (!app) throw new Error("விண்ணப்பம் கிடைக்கவில்லை.");
  return app;
}

export async function runDocumentCheckAction(applicationId: string): Promise<AiResult> {
  await requireSession();
  const app = await loadApplication(applicationId);
  return checkDocumentConsistency(app);
}

export async function runFieldReportAction(applicationId: string, notes: string): Promise<AiResult> {
  await requireSession();
  const app = await loadApplication(applicationId);
  return draftFieldReport(
    { applicantName: app.applicantName, age: app.age, category: app.category, address: app.address },
    notes
  );
}

export async function runCaseSummaryAction(applicationId: string): Promise<AiResult> {
  await requireSession();
  const app = await loadApplication(applicationId);
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
      stageLabel: STAGE_LABELS[app.stage],
    },
    events.map((e) => ({
      stageLabel: STAGE_LABELS[e.stage],
      actionLabel: ACTION_LABELS[e.action],
      remarks: e.remarks,
      actorName: e.actor.name,
    }))
  );
}

export async function runDecisionDraftAction(
  applicationId: string,
  decision: "approve" | "reject" | "return_app"
): Promise<AiResult> {
  await requireSession();
  const app = await loadApplication(applicationId);
  const eligibility = checkEligibility(app);
  return draftDecisionRemarks(
    {
      applicantName: app.applicantName,
      age: app.age,
      category: app.category,
      stageLabel: STAGE_LABELS[app.stage],
    },
    eligibility,
    decision
  );
}

export type SubmitActionState = { error: string | null };

export async function submitApplicationAction(
  _prevState: SubmitActionState,
  formData: FormData
): Promise<SubmitActionState> {
  const session = await requireSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const action = String(formData.get("action") ?? "") as EventAction;
  const remarks = String(formData.get("remarks") ?? "").trim();
  const aiAssisted = formData.get("aiAssisted") === "true";
  const aiEdited = aiAssisted ? formData.get("aiEdited") === "true" : null;

  if (!remarks) {
    return { error: "குறிப்பு இல்லாமல் செயலைச் செய்ய முடியாது." };
  }

  const app = await loadApplication(applicationId);
  const result = applyAction(session.role, app.stage, app.status, action);
  if (!result.ok) {
    return { error: result.error };
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

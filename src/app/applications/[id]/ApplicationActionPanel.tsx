"use client";

import { useActionState, useState, useTransition } from "react";
import { AiSourceBadge } from "@/components/AiSourceBadge";
import {
  runCaseSummaryAction,
  runDecisionDraftAction,
  runDocumentCheckAction,
  runFieldReportAction,
  submitApplicationAction,
  SubmitActionState,
} from "./actions";

type AiResult = { text: string; source: "nim" | "offline" };
type StageValue = "stage1" | "stage2" | "stage3";
type ActionOption = { action: string; label: string };

const initialSubmitState: SubmitActionState = { error: null };

export function ApplicationActionPanel({
  applicationId,
  stage,
  availableActions,
}: {
  applicationId: string;
  stage: StageValue;
  availableActions: ActionOption[];
}) {
  const [remarks, setRemarks] = useState("");
  const [draftSnapshot, setDraftSnapshot] = useState<string | null>(null);
  const [aiAssisted, setAiAssisted] = useState(false);

  const [notes, setNotes] = useState("");
  const [toolResult, setToolResult] = useState<AiResult | null>(null);
  const [toolPending, startToolTransition] = useTransition();

  const [submitState, formAction, submitPending] = useActionState(
    submitApplicationAction,
    initialSubmitState
  );

  const aiEdited = aiAssisted ? remarks !== draftSnapshot : null;

  function useAsRemarks(text: string) {
    setRemarks(text);
    setDraftSnapshot(text);
    setAiAssisted(true);
  }

  function runTool(fn: () => Promise<AiResult>) {
    startToolTransition(async () => {
      const result = await fn();
      setToolResult(result);
    });
  }

  function decisionFor(action: string): "approve" | "reject" | "return_app" {
    if (action === "approve") return "approve";
    if (action === "reject") return "reject";
    return "return_app";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">AI உதவி</h3>
        <p className="mt-1 text-xs text-slate-500">
          இது ஒரு வரைவு மட்டுமே. நீங்கள் படித்து, திருத்தி, இறுதி முடிவை நீங்களே எடுக்க வேண்டும்.
        </p>

        {stage === "stage1" && (
          <div className="mt-3">
            <button
              type="button"
              disabled={toolPending}
              onClick={() => runTool(() => runDocumentCheckAction(applicationId))}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {toolPending ? "சரிபார்க்கிறது..." : "ஆவண முரண்பாடு சரிபார்ப்பு"}
            </button>
          </div>
        )}

        {stage === "stage2" && (
          <div className="mt-3 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              கள குறிப்புகள் (சுருக்கமாக)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="எ.கா: வீட்டுக்குச் சென்றேன், தாத்தா தனியாக வசிக்கிறார்..."
            />
            <button
              type="button"
              disabled={toolPending || !notes.trim()}
              onClick={() => runTool(() => runFieldReportAction(applicationId, notes))}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {toolPending ? "உருவாக்குகிறது..." : "அறிக்கை வரைவு உருவாக்கு"}
            </button>
          </div>
        )}

        {stage === "stage3" && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={toolPending}
              onClick={() => runTool(() => runCaseSummaryAction(applicationId))}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              வழக்கு சுருக்கம்
            </button>
            {availableActions.map((opt) => (
              <button
                key={opt.action}
                type="button"
                disabled={toolPending}
                onClick={() =>
                  runTool(() => runDecisionDraftAction(applicationId, decisionFor(opt.action)))
                }
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {opt.label} — வரைவு
              </button>
            ))}
          </div>
        )}

        {toolResult && (
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <AiSourceBadge source={toolResult.source} />
              <button
                type="button"
                onClick={() => useAsRemarks(toolResult.text)}
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                குறிப்பில் நகலெடு →
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{toolResult.text}</p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">நடவடிக்கை</h3>
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="aiAssisted" value={aiAssisted ? "true" : "false"} />
          <input type="hidden" name="aiEdited" value={aiEdited ? "true" : "false"} />
          <div>
            <label className="block text-sm font-medium text-slate-700">குறிப்பு (கட்டாயம்)</label>
            <textarea
              name="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {submitState.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {submitState.error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {availableActions.map((opt) => (
              <button
                key={opt.action}
                type="submit"
                name="action"
                value={opt.action}
                disabled={submitPending}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}

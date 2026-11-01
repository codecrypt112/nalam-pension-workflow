import { describe, expect, it } from "vitest";
import { Category, EventAction, Role, Stage, Status } from "@prisma/client";
import {
  ageFromDob,
  applyAction,
  availableActions,
  canUserActOnApplication,
  checkEligibility,
  computeUrgency,
  INCOME_CEILING,
  OLD_AGE_MIN_AGE,
} from "@/lib/workflow";

function yearsAgo(n: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe("ageFromDob", () => {
  it("computes age from a date of birth", () => {
    expect(ageFromDob(yearsAgo(72))).toBe(72);
  });

  it("is not thrown off by a birthday later this month", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 60);
    dob.setDate(dob.getDate() + 1); // birthday is tomorrow
    expect(ageFromDob(dob)).toBe(59);
  });
});

describe("checkEligibility — old age category", () => {
  it("is eligible when age >= 60 and income within ceiling", () => {
    const result = checkEligibility({
      category: Category.old_age,
      age: 68,
      dob: yearsAgo(68),
      monthlyIncome: 0,
      spouseDeceased: null,
      remarried: null,
    });
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("is ineligible when below the minimum age", () => {
    const result = checkEligibility({
      category: Category.old_age,
      age: 45,
      dob: yearsAgo(45),
      monthlyIncome: 0,
      spouseDeceased: null,
      remarried: null,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toContain(String(OLD_AGE_MIN_AGE));
  });

  it("is ineligible when income exceeds the ceiling", () => {
    const result = checkEligibility({
      category: Category.old_age,
      age: 70,
      dob: yearsAgo(70),
      monthlyIncome: INCOME_CEILING + 5000,
      spouseDeceased: null,
      remarried: null,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("வருமானம்"))).toBe(true);
  });

  it("flags a mismatch between declared age and date of birth", () => {
    const result = checkEligibility({
      category: Category.old_age,
      age: 70,
      dob: yearsAgo(62), // actual age per DOB is 62, not 70
      monthlyIncome: 0,
      spouseDeceased: null,
      remarried: null,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("வயது"))).toBe(true);
  });
});

describe("checkEligibility — widow category", () => {
  it("is eligible when spouse is deceased and not remarried", () => {
    const result = checkEligibility({
      category: Category.widow,
      age: 40,
      dob: yearsAgo(40),
      monthlyIncome: 0,
      spouseDeceased: true,
      remarried: false,
    });
    expect(result.eligible).toBe(true);
  });

  it("is ineligible when spouse-deceased is not confirmed", () => {
    const result = checkEligibility({
      category: Category.widow,
      age: 40,
      dob: yearsAgo(40),
      monthlyIncome: 0,
      spouseDeceased: null,
      remarried: false,
    });
    expect(result.eligible).toBe(false);
  });

  it("is ineligible when remarried", () => {
    const result = checkEligibility({
      category: Category.widow,
      age: 40,
      dob: yearsAgo(40),
      monthlyIncome: 0,
      spouseDeceased: true,
      remarried: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("மீண்டும் திருமணம்"))).toBe(true);
  });

  it("has no minimum age requirement", () => {
    const result = checkEligibility({
      category: Category.widow,
      age: 28,
      dob: yearsAgo(28),
      monthlyIncome: 0,
      spouseDeceased: true,
      remarried: false,
    });
    expect(result.eligible).toBe(true);
  });
});

describe("computeUrgency", () => {
  it("is normal for a fresh, young, in-progress application", () => {
    const result = computeUrgency({
      status: Status.in_progress,
      age: 45,
      createdAt: daysAgo(1),
      lastEventAt: null,
    });
    expect(result.level).toBe("normal");
  });

  it("is urgent for a returned application", () => {
    const result = computeUrgency({
      status: Status.returned,
      age: 45,
      createdAt: daysAgo(2),
      lastEventAt: daysAgo(1),
    });
    expect(result.level).toBe("urgent");
    expect(result.reasons.some((r) => r.includes("திருப்பி"))).toBe(true);
  });

  it("bumps priority for applicants aged 80+", () => {
    const young = computeUrgency({
      status: Status.in_progress,
      age: 45,
      createdAt: daysAgo(1),
      lastEventAt: null,
    });
    const old = computeUrgency({
      status: Status.in_progress,
      age: 85,
      createdAt: daysAgo(1),
      lastEventAt: null,
    });
    expect(old.score).toBeGreaterThan(young.score);
  });

  it("increases score the longer an application has been pending", () => {
    const recent = computeUrgency({
      status: Status.in_progress,
      age: 45,
      createdAt: daysAgo(1),
      lastEventAt: null,
    });
    const stale = computeUrgency({
      status: Status.in_progress,
      age: 45,
      createdAt: daysAgo(20),
      lastEventAt: null,
    });
    expect(stale.score).toBeGreaterThan(recent.score);
    expect(stale.level).not.toBe("normal");
  });
});

describe("legal stage-transition rules", () => {
  it("lets a field verifier act on stage 1", () => {
    expect(canUserActOnApplication(Role.field_verifier, Stage.stage1, Status.in_progress)).toBe(true);
  });

  it("lets a field verifier act on stage 2", () => {
    expect(canUserActOnApplication(Role.field_verifier, Stage.stage2, Status.in_progress)).toBe(true);
  });

  it("does not let a field verifier act on stage 3", () => {
    expect(canUserActOnApplication(Role.field_verifier, Stage.stage3, Status.in_progress)).toBe(false);
  });

  it("does not let an approving officer act on stage 1 or 2", () => {
    expect(canUserActOnApplication(Role.approving_officer, Stage.stage1, Status.in_progress)).toBe(false);
    expect(canUserActOnApplication(Role.approving_officer, Stage.stage2, Status.in_progress)).toBe(false);
  });

  it("lets an approving officer act on stage 3", () => {
    expect(canUserActOnApplication(Role.approving_officer, Stage.stage3, Status.in_progress)).toBe(true);
  });

  it("does not let anyone act on an approved or rejected application", () => {
    expect(canUserActOnApplication(Role.approving_officer, Stage.stage3, Status.approved)).toBe(false);
    expect(canUserActOnApplication(Role.field_verifier, Stage.stage1, Status.rejected)).toBe(false);
  });

  it("offers forward/return/reject at stage 1", () => {
    const actions = availableActions(Role.field_verifier, Stage.stage1, Status.in_progress).map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining([EventAction.forward, EventAction.return_app, EventAction.reject])
    );
  });

  it("offers approve/return/reject at stage 3", () => {
    const actions = availableActions(Role.approving_officer, Stage.stage3, Status.in_progress).map(
      (a) => a.action
    );
    expect(actions).toEqual(
      expect.arrayContaining([EventAction.approve, EventAction.return_app, EventAction.reject])
    );
  });

  it("returns no actions for a role that doesn't own the stage", () => {
    expect(availableActions(Role.field_verifier, Stage.stage3, Status.in_progress)).toHaveLength(0);
  });
});

describe("applyAction", () => {
  it("forwards a stage-1 application to stage 2", () => {
    const result = applyAction(Role.field_verifier, Stage.stage1, Status.in_progress, EventAction.forward);
    expect(result).toEqual({ ok: true, nextStage: Stage.stage2, nextStatus: Status.in_progress });
  });

  it("approves a stage-3 application", () => {
    const result = applyAction(
      Role.approving_officer,
      Stage.stage3,
      Status.in_progress,
      EventAction.approve
    );
    expect(result).toEqual({ ok: true, nextStage: Stage.stage3, nextStatus: Status.approved });
  });

  it("rejects an approving officer trying to approve a stage-1 application", () => {
    const result = applyAction(Role.approving_officer, Stage.stage1, Status.in_progress, EventAction.approve);
    expect(result.ok).toBe(false);
  });

  it("rejects a field verifier trying to act on a stage-3 application", () => {
    const result = applyAction(Role.field_verifier, Stage.stage3, Status.in_progress, EventAction.forward);
    expect(result.ok).toBe(false);
  });

  it("rejects any action on an already-approved application", () => {
    const result = applyAction(
      Role.approving_officer,
      Stage.stage3,
      Status.approved,
      EventAction.reject
    );
    expect(result.ok).toBe(false);
  });

  it("returns a stage-3 application back to stage 2", () => {
    const result = applyAction(
      Role.approving_officer,
      Stage.stage3,
      Status.in_progress,
      EventAction.return_app
    );
    expect(result).toEqual({ ok: true, nextStage: Stage.stage2, nextStatus: Status.returned });
  });
});

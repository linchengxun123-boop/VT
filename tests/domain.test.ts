import test from "node:test";
import assert from "node:assert/strict";
import { recommendPlan } from "../src/lib/recommendation";
import { scheduleTasks } from "../src/lib/plans";
import { assessmentSchema, MINUTES, type Assessment, type PlanId } from "../src/lib/domain";
import { trainingDate, shiftDate, trainingStats } from "../src/lib/streak";
const base: Assessment = {
  rank: "Gold",
  role: "Duelist",
  daily_training_minutes: 20,
  weaknesses: [],
};
test("acceptance scenario recommends C; C > B > A", () => {
  assert.equal(recommendPlan({ ...base, weaknesses: ["拉枪容易拉过"] }), "C");
  assert.equal(
    recommendPlan({ ...base, rank: "Iron", weaknesses: ["爆头率低", "拉枪容易拉过"] }),
    "C",
  );
  assert.equal(recommendPlan({ ...base, weaknesses: ["第一枪不准"] }), "B");
  assert.equal(recommendPlan({ ...base, rank: "Silver" }), "A");
  assert.equal(recommendPlan({ ...base, weaknesses: ["远距离对枪差"] }), "C");
});
test("all daily budgets preserve exact total and give every task time", () => {
  for (const id of ["A", "B", "C"] as PlanId[])
    for (const minutes of MINUTES) {
      const tasks = scheduleTasks(id, minutes);
      assert.equal(
        tasks.reduce((s, t) => s + t.duration_minutes, 0),
        minutes,
      );
      assert.ok(tasks.every((t) => t.duration_minutes >= 1));
    }
});
test("streak respects yesterday, missed days, duplicate dates and future dates", () => {
  const dates = ["2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"];
  assert.equal(trainingStats(dates, "2026-09-18").current, 4);
  assert.equal(trainingStats(dates, "2026-09-19").current, 4);
  assert.equal(trainingStats(dates, "2026-09-20").current, 0);
  assert.equal(trainingStats([...dates, "2026-09-20"], "2026-09-20").current, 1);
  assert.equal(trainingStats([...dates, "2026-09-18", "2026-10-01"], "2026-09-18").total, 4);
  assert.equal(trainingStats([...dates, "2026-09-20"], "2026-09-20").longest, 4);
  assert.deepEqual(trainingStats([], "2026-09-18"), {
    current: 0,
    longest: 0,
    total: 0,
    week: 0,
    monday: "2026-09-14",
  });
});
test("calendar arithmetic handles year, leap day, timezones, and Monday week boundary", () => {
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
  assert.equal(trainingDate(new Date("2026-09-18T15:59:00Z")), "2026-09-18");
  assert.equal(trainingDate(new Date("2026-09-18T16:01:00Z")), "2026-09-19");
  assert.equal(trainingStats(["2026-09-20", "2026-09-21"], "2026-09-21").week, 1);
  assert.equal(trainingStats(["2025-12-31", "2026-01-01"], "2026-01-01").current, 2);
});
test("assessment rejects tampered inputs and deduplicates weaknesses", () => {
  assert.equal(assessmentSchema.safeParse({ ...base, rank: "hacked" }).success, false);
  assert.equal(assessmentSchema.safeParse({ ...base, daily_training_minutes: 999 }).success, false);
  assert.equal(
    assessmentSchema.parse({ ...base, weaknesses: ["第一枪不准", "第一枪不准"] }).weaknesses.length,
    1,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { LocalStore } from "../src/lib/server/local-store";
import { PLANS } from "../src/lib/plans";
import { trainingStats } from "../src/lib/streak";
import type { Assessment } from "../src/lib/domain";
const input: Assessment = {
  rank: "Gold",
  role: "Duelist",
  daily_training_minutes: 20,
  weaknesses: ["拉枪容易拉过"],
};
test("database persists a full two-day flow, prevents invalid/duplicate checkins, and isolates users", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "vt-test-"));
  const file = path.join(dir, "vt.sqlite");
  let store = new LocalStore(file);
  try {
    store.saveProfile("player-one", "2026-09-18", input);
    assert.equal(store.snapshot("player-one", "2026-09-18").profile?.selected_plan, "C");
    assert.throws(() => store.checkin("player-one", "2026-09-18"), /所有训练/);
    assert.throws(() => store.completeTask("player-one", "2026-09-18", "a-range", true), /不属于/);
    store.completeTask("player-one", "2026-09-18", "c-small", true);
    assert.throws(() => store.saveProfile("player-one", "2026-09-18", input), /明天/);
    store.close();
    const legacy = new DatabaseSync(file);
    legacy.exec(
      "UPDATE training_plans SET name='legacy' WHERE id='C'; UPDATE training_tasks SET name='legacy' WHERE id='b-guardian';",
    );
    const before = legacy
      .prepare("SELECT id,plan_id,duration_minutes,sort_order FROM training_tasks ORDER BY id")
      .all();
    legacy.close();
    store = new LocalStore(file);
    assert.deepEqual(store.snapshot("player-one", "2026-09-18").completed, ["c-small"]);
    const updated = new DatabaseSync(file, { readOnly: true });
    try {
      assert.equal(
        updated.prepare("SELECT name FROM training_plans WHERE id='C'").get()?.name,
        "微调与精准控枪训练",
      );
      assert.equal(
        updated.prepare("SELECT name FROM training_tasks WHERE id='b-guardian'").get()?.name,
        "戍卫乱斗",
      );
      assert.deepEqual(
        updated
          .prepare("SELECT id,plan_id,duration_minutes,sort_order FROM training_tasks ORDER BY id")
          .all(),
        before,
      );
    } finally {
      updated.close();
    }
    store.completeTask("player-one", "2026-09-18", "c-small", false);
    assert.equal(store.snapshot("player-one", "2026-09-18").completed.length, 0);
    for (const date of ["2026-09-18", "2026-09-19"]) {
      for (const task of PLANS.C.tasks) store.completeTask("player-one", date, task.id, true);
      store.checkin("player-one", date);
      store.checkin("player-one", date);
    }
    const snapshot = store.snapshot("player-one", "2026-09-19");
    assert.equal(snapshot.checkins.length, 2);
    assert.equal(snapshot.checkins[0].total_minutes, 20);
    assert.equal(
      trainingStats(
        snapshot.checkins.map((c) => c.date),
        "2026-09-19",
      ).current,
      2,
    );
    assert.throws(() => store.completeTask("player-one", "2026-09-19", "c-small", false), /锁定/);
    assert.equal(store.snapshot("player-two", "2026-09-19").checkins.length, 0);
    assert.equal(store.snapshot("player-one", "2026-09-20").completed.length, 0);
    store.saveProfile("player-one", "2026-09-20", { ...input, weaknesses: [] });
    assert.equal(store.snapshot("player-one", "2026-09-20").checkins[0].plan_id, "C");
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

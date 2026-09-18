import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Assessment, Profile, Checkin, Snapshot } from "../domain";
import { PLANS } from "../plans";
import { recommendPlan } from "../recommendation";

export class LocalStore {
  private db: DatabaseSync;
  constructor(filename = process.env.VT_DB_PATH || path.join(process.cwd(), "data", "vt.sqlite")) {
    if (filename !== ":memory:") mkdirSync(path.dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, rank TEXT NOT NULL, role TEXT NOT NULL, daily_training_minutes INTEGER NOT NULL, weaknesses TEXT NOT NULL, selected_plan TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS training_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS training_tasks (id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES training_plans(id), name TEXT NOT NULL, description TEXT NOT NULL, duration_minutes INTEGER NOT NULL, sort_order INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS daily_progress (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), date TEXT NOT NULL, task_id TEXT NOT NULL REFERENCES training_tasks(id), completed INTEGER NOT NULL, completed_at TEXT, UNIQUE(user_id,date,task_id));
      CREATE TABLE IF NOT EXISTS checkins (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), date TEXT NOT NULL, plan_id TEXT NOT NULL REFERENCES training_plans(id), completed_tasks INTEGER NOT NULL, total_tasks INTEGER NOT NULL, total_minutes INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id,date));`);
    for (const plan of Object.values(PLANS)) {
      this.db
        .prepare(
          "INSERT INTO training_plans VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description",
        )
        .run(plan.id, plan.name, plan.description, plan.target, new Date().toISOString());
      plan.tasks.forEach((t, i) =>
        this.db
          .prepare(
            "INSERT INTO training_tasks VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description",
          )
          .run(t.id, plan.id, t.name, t.description, t.duration_minutes, i),
      );
    }
  }
  close() {
    this.db.close();
  }
  snapshot(userId: string, today: string): Snapshot {
    const row = this.db.prepare("SELECT * FROM profiles WHERE id=?").get(userId) as
      (Omit<Profile, "weaknesses"> & { weaknesses: string }) | undefined;
    const profile = row
      ? { ...row, weaknesses: JSON.parse(row.weaknesses) as Assessment["weaknesses"] }
      : null;
    const completed = this.db
      .prepare("SELECT task_id FROM daily_progress WHERE user_id=? AND date=? AND completed=1")
      .all(userId, today) as { task_id: string }[];
    const checkins = this.db
      .prepare("SELECT * FROM checkins WHERE user_id=? ORDER BY date DESC")
      .all(userId) as Checkin[];
    return { profile, completed: completed.map((t) => t.task_id), checkins, today, mode: "local" };
  }
  private transaction(work: () => void) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      work();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  saveProfile(userId: string, today: string, input: Assessment) {
    this.transaction(() => {
      const state = this.snapshot(userId, today);
      if (state.completed.length || state.checkins.some((c) => c.date === today))
        throw new Error("今天已开始训练，请明天再调整测评。");
      this.db
        .prepare(
          `INSERT INTO profiles VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET rank=excluded.rank, role=excluded.role, daily_training_minutes=excluded.daily_training_minutes, weaknesses=excluded.weaknesses, selected_plan=excluded.selected_plan`,
        )
        .run(
          userId,
          input.rank,
          input.role,
          input.daily_training_minutes,
          JSON.stringify(input.weaknesses),
          recommendPlan(input),
          new Date().toISOString(),
        );
    });
  }
  completeTask(userId: string, today: string, taskId: string, completed: boolean) {
    this.transaction(() => {
      const state = this.snapshot(userId, today);
      if (!state.profile) throw new Error("请先完成测评。");
      if (state.checkins.some((c) => c.date === today))
        throw new Error("今天已打卡，训练记录已锁定。");
      if (!PLANS[state.profile.selected_plan].tasks.some((t) => t.id === taskId))
        throw new Error("该任务不属于当前计划。");
      this.db
        .prepare(
          `INSERT INTO daily_progress VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,date,task_id) DO UPDATE SET completed=excluded.completed, completed_at=excluded.completed_at`,
        )
        .run(
          randomUUID(),
          userId,
          today,
          taskId,
          completed ? 1 : 0,
          completed ? new Date().toISOString() : null,
        );
    });
  }
  checkin(userId: string, today: string) {
    this.transaction(() => {
      const state = this.snapshot(userId, today);
      if (state.checkins.some((c) => c.date === today)) return;
      if (!state.profile) throw new Error("请先完成测评。");
      const plan = PLANS[state.profile.selected_plan];
      if (!plan.tasks.every((t) => state.completed.includes(t.id)))
        throw new Error("完成所有训练任务后才能打卡。");
      this.db
        .prepare("INSERT INTO checkins VALUES (?,?,?,?,?,?,?,?)")
        .run(
          randomUUID(),
          userId,
          today,
          plan.id,
          plan.tasks.length,
          plan.tasks.length,
          state.profile.daily_training_minutes,
          new Date().toISOString(),
        );
    });
  }
}

const globalStore = globalThis as typeof globalThis & { vtStore?: LocalStore };
export function localStore() {
  return (globalStore.vtStore ??= new LocalStore());
}

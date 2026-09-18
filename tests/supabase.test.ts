import { PGlite } from "@electric-sql/pglite";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Supabase SQL executes; RPC enforces completion, deduplication, RLS and write protection", async () => {
  const db = new PGlite();
  const user = "11111111-1111-4111-8111-111111111111",
    other = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('${user}'),('${other}');`);
    await db.exec(
      readFileSync(new URL("../supabase/migrations/001_initial.sql", import.meta.url), "utf8"),
    );
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}';`);
    const rpc = (action: string, payload: object = {}) =>
      db.query("select public.vt_action($1,$2::jsonb)", [action, JSON.stringify(payload)]);
    await rpc("profile", {
      rank: "Gold",
      role: "Duelist",
      daily_training_minutes: 20,
      weaknesses: ["拉枪容易拉过"],
      selected_plan: "A",
    });
    assert.equal(
      (await db.query<{ selected_plan: string }>("select selected_plan from public.profiles"))
        .rows[0].selected_plan,
      "C",
    );
    await assert.rejects(() => rpc("checkin"), /所有训练/);
    await assert.rejects(() => rpc("task", { task_id: "a-range", completed: true }), /不属于/);
    for (const task_id of ["c-small", "c-micro", "c-vandal", "c-dm"])
      await rpc("task", { task_id, completed: true });
    await rpc("checkin");
    await rpc("checkin");
    const records = await db.query<{ total_minutes: number; completed_tasks: number }>(
      "select * from public.checkins",
    );
    assert.equal(records.rows.length, 1);
    assert.equal(records.rows[0].total_minutes, 20);
    assert.equal(records.rows[0].completed_tasks, 4);
    // Simulate an existing installation with saved progress, then reapply the copy migration.
    await db.exec(
      "reset role; update public.training_plans set name='legacy' where id='C'; update public.training_tasks set name='legacy' where id in ('c-micro','b-guardian');",
    );
    const before = (
      await db.query(
        "select id, plan_id, duration_minutes, sort_order from public.training_tasks order by id",
      )
    ).rows;
    const savedProgress = (await db.query("select * from public.daily_progress order by id")).rows;
    const savedCheckins = (await db.query("select * from public.checkins order by id")).rows;
    const migration = readFileSync(
      new URL("../supabase/migrations/002_training_copy.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    assert.deepEqual(
      (
        await db.query(
          "select id, plan_id, duration_minutes, sort_order from public.training_tasks order by id",
        )
      ).rows,
      before,
    );
    assert.deepEqual(
      (await db.query("select * from public.daily_progress order by id")).rows,
      savedProgress,
    );
    assert.deepEqual(
      (await db.query("select * from public.checkins order by id")).rows,
      savedCheckins,
    );
    assert.equal(
      (await db.query<{ name: string }>("select name from public.training_plans where id='C'"))
        .rows[0].name,
      "微调与精准控枪训练",
    );
    assert.equal(
      (
        await db.query<{ name: string }>(
          "select name from public.training_tasks where id='b-guardian'",
        )
      ).rows[0].name,
      "戍卫乱斗",
    );
    await db.exec("set role authenticated;");
    await assert.rejects(() => rpc("task", { task_id: "c-small", completed: false }), /锁定/);
    await assert.rejects(
      () =>
        rpc("profile", {
          rank: "Gold",
          role: "Duelist",
          daily_training_minutes: 20,
          weaknesses: [],
        }),
      /明天/,
    );
    await assert.rejects(() => db.exec("delete from public.checkins"), /permission denied/);
    await assert.rejects(
      () => db.exec("update public.profiles set selected_plan='A'"),
      /permission denied/,
    );
    await db.exec(`set request.jwt.claim.sub='${other}';`);
    assert.equal((await db.query("select * from public.checkins")).rows.length, 0);
    assert.equal((await db.query("select * from public.profiles")).rows.length, 0);
    assert.equal((await db.query("select * from public.daily_progress")).rows.length, 0);
    await db.exec("set role anon; set request.jwt.claim.sub='';");
    await assert.rejects(() => rpc("checkin"), /permission denied/);
  } finally {
    await db.close();
  }
});

import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
test("migration safety: RLS, ACL, identity, constraints, seed and rollback", async () => {
  const first = readFileSync("supabase/migrations/001_initial.sql", "utf8");
  const second = readFileSync("supabase/migrations/002_training_copy.sql", "utf8");
  const A = "11111111-1111-4111-8111-111111111111";
  const B = "22222222-2222-4222-8222-222222222222";
  const tables = ["training_plans", "training_tasks", "profiles", "daily_progress", "checkins"];
  const report = {
    scope: "local in-memory PostgreSQL only; no environment files loaded or remote calls",
    checks: [],
    findings: [],
  };
  async function setup() {
    const db = new PGlite();
    await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 insert into auth.users values('${A}'),('${B}');`);
    return db;
  }
  function pass(name) {
    report.checks.push({ name, status: "pass" });
  }
  const db = await setup();
  const rpc = (action, payload = {}) =>
    db.query("select public.vt_action($1,$2::jsonb)", [action, JSON.stringify(payload)]);
  const identity = (id) => db.exec(`set role authenticated; set request.jwt.claim.sub='${id}';`);
  const owner = () => db.exec("reset role");
  const assessment = {
    rank: "Gold",
    role: "Duelist",
    daily_training_minutes: 20,
    weaknesses: ["拉枪容易拉过"],
  };
  const taskIds = ["c-small", "c-micro", "c-vandal", "c-dm"];
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (table) => [
          table,
          (await db.query(`select * from public.${table} order by id`)).rows,
        ]),
      ),
    );
  try {
    await db.exec(first);
    const rls = (
      await db.query(
        "select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' order by relname",
      )
    ).rows;
    assert.equal(rls.length, 5);
    assert.ok(rls.every((row) => row.relrowsecurity));
    const policies = (
      await db.query(
        "select tablename,policyname,cmd,roles,qual from pg_policies where schemaname='public' order by tablename",
      )
    ).rows;
    assert.equal(policies.length, 5);
    assert.ok(policies.every((row) => row.cmd === "SELECT"));
    const fn = (
      await db.query(
        "select prosecdef,proconfig from pg_proc where oid='public.vt_action(text,jsonb)'::regprocedure",
      )
    ).rows[0];
    assert.equal(fn.prosecdef, true);
    assert.ok(fn.proconfig.includes('search_path=""'));
    report.catalog = { rls, policies, function: fn };
    pass("all five tables have RLS; exactly five SELECT policies; definer search_path is fixed");
    for (const role of ["anon", "authenticated"]) {
      for (const table of tables) {
        for (const privilege of [
          "SELECT",
          "INSERT",
          "UPDATE",
          "DELETE",
          "TRUNCATE",
          "REFERENCES",
          "TRIGGER",
        ]) {
          const allowed = (
            await db.query("select has_table_privilege($1,$2,$3) as allowed", [
              role,
              `public.${table}`,
              privilege,
            ])
          ).rows[0].allowed;
          assert.equal(allowed, role === "authenticated" && privilege === "SELECT");
        }
      }
      await db.exec(`set role ${role}`);
      for (const table of tables) {
        for (const sql of [
          `insert into public.${table} default values`,
          `update public.${table} set id=id`,
          `delete from public.${table}`,
        ])
          await assert.rejects(() => db.exec(sql), { code: "42501" });
      }
      await owner();
    }
    pass("effective ACL matrix checked; 30 direct INSERT/UPDATE/DELETE attempts rejected");
    await db.exec("set role anon; set request.jwt.claim.sub=''");
    await assert.rejects(() => rpc("profile", assessment), { code: "42501" });
    await identity("");
    await assert.rejects(() => rpc("profile", assessment), /请先登录/);
    pass("anon cannot execute RPC; authenticated without auth.uid is rejected");
    await identity(B);
    await rpc("profile", assessment);
    for (const task_id of taskIds) await rpc("task", { task_id, completed: true });
    await rpc("checkin");
    await owner();
    const bBefore = await snapshot();
    await identity(A);
    await rpc("profile", { ...assessment, user_id: B, id: B, selected_plan: "A" });
    for (const table of ["profiles", "daily_progress", "checkins"]) {
      const column = table === "profiles" ? "id" : "user_id";
      assert.equal(
        (await db.query(`select * from public.${table} where ${column}=$1`, [B])).rows.length,
        0,
      );
    }
    assert.equal((await db.query("select id,selected_plan from public.profiles")).rows[0].id, A);
    assert.equal(
      (await db.query("select selected_plan from public.profiles")).rows[0].selected_plan,
      "C",
    );
    await assert.rejects(
      () => rpc("checkin", { user_id: B, completed_tasks: 4, total_tasks: 4, date: "2000-01-01" }),
      /所有训练/,
    );
    await rpc("task", { task_id: "c-small", completed: true, user_id: B, date: "2000-01-01" });
    await assert.rejects(() => rpc("checkin", { completed_tasks: 4 }), /所有训练/);
    const progress = (await db.query("select user_id,date from public.daily_progress")).rows;
    assert.equal(progress.length, 1);
    assert.equal(progress[0].user_id, A);
    assert.notEqual(progress[0].date, "2000-01-01");
    for (const task_id of taskIds) await rpc("task", { task_id, completed: true });
    await rpc("checkin");
    await rpc("checkin");
    assert.equal((await db.query("select * from public.checkins")).rows.length, 1);
    await assert.rejects(() => rpc("task", { task_id: "c-small", completed: false }), /锁定/);
    await owner();
    const both = await snapshot();
    for (const table of ["profiles", "daily_progress", "checkins"]) {
      const key = table === "profiles" ? "id" : "user_id";
      assert.deepEqual(
        both[table].filter((row) => row[key] === B),
        bBefore[table].filter((row) => row[key] === B),
      );
    }
    pass("A cannot read B; forged user IDs and dates ignored; B data unchanged");
    pass(
      "database rejects incomplete checkins, recalculates totals, deduplicates RPC, locks completed day",
    );
    await assert.rejects(
      () =>
        db.exec(
          "insert into public.daily_progress(user_id,date,task_id,completed) select user_id,date,task_id,completed from public.daily_progress limit 1",
        ),
      { code: "23505" },
    );
    await assert.rejects(
      () =>
        db.exec(
          "insert into public.checkins(user_id,date,plan_id,completed_tasks,total_tasks,total_minutes) select user_id,date,plan_id,completed_tasks,total_tasks,total_minutes from public.checkins limit 1",
        ),
      { code: "23505" },
    );
    pass("both compound UNIQUE constraints reject duplicate rows even for owner");
    const beforeCopy = await snapshot();
    await db.exec(second);
    const afterCopy = await snapshot();
    await db.exec(second);
    assert.deepEqual(await snapshot(), afterCopy);
    for (const table of ["profiles", "daily_progress", "checkins"])
      assert.deepEqual(afterCopy[table], beforeCopy[table]);
    assert.equal(afterCopy.training_plans.length, 3);
    assert.equal(afterCopy.training_tasks.length, 10);
    await assert.rejects(() => db.exec(first), { code: "42P07" });
    await db.exec("rollback");
    assert.deepEqual(await snapshot(), afterCopy);
    pass(
      "002 is idempotent and preserves user data; repeat 001 fails safely without seed duplicates",
    );
    await db.exec("update public.training_tasks set name='rollback-marker' where id='b-guardian'");
    const beforeFailure = await snapshot();
    await assert.rejects(() => db.exec(second.replace(/commit;\s*$/i, "select 1/0; commit;")), {
      code: "22012",
    });
    await db.exec("rollback");
    assert.deepEqual(await snapshot(), beforeFailure);
    pass("002 forced failure rolls back all updates");
  } finally {
    await db.close();
  }
  const rollbackDb = await setup();
  try {
    await assert.rejects(
      () => rollbackDb.exec(first.replace(/commit;\s*$/i, "select 1/0; commit;")),
      { code: "22012" },
    );
    await rollbackDb.exec("rollback");
    assert.equal(
      (
        await rollbackDb.query(
          "select count(*)::int as n from pg_class where relnamespace='public'::regnamespace and relkind='r'",
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (await rollbackDb.query("select count(*)::int as n from pg_proc where proname='vt_action'"))
        .rows[0].n,
      0,
    );
    pass("001 forced failure rolls back tables, seed and RPC");
  } finally {
    await rollbackDb.close();
  }
  mkdirSync("artifacts/qa", { recursive: true });
  writeFileSync("artifacts/qa/migration-safety-audit-fixed.json", JSON.stringify(report, null, 2));
  assert.equal(report.findings.length, 0);
});

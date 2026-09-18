import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { trainingDate, trainingStats } from "../src/lib/streak";

// This file uses synthetic configuration only. Every HTTP request is intercepted locally.
process.env.NEXT_PUBLIC_DATA_MODE = "supabase";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://vt-test.invalid";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public";
const { GET, POST } = await import("../src/app/api/training/route");
const user = "11111111-1111-4111-8111-111111111111";
const tasks = ["c-small", "c-micro", "c-vandal", "c-dm"];
const input = {
  rank: "Gold",
  role: "Duelist",
  daily_training_minutes: 20,
  weaknesses: ["拉枪容易拉过"],
};

async function fixture(t: TestContext) {
  const db = new PGlite();
  t.after(() => db.close());
  // Test-only clock override in an isolated database. The migration itself is unchanged.
  await db.exec(`
    set vt_test.now = '2026-09-20T15:59:00Z';
    create or replace function pg_catalog.now() returns timestamptz language sql stable
      as $$select current_setting('vt_test.now')::timestamptz$$;
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${user}');
  `);
  await db.exec(
    readFileSync(new URL("../supabase/migrations/001_initial.sql", import.meta.url), "utf8"),
  );
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${user}';`);
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-20T15:59:00Z") });
  t.mock.method(globalThis, "fetch", async (resource: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(resource, init);
    const url = new URL(request.url);
    assert.equal(
      url.origin,
      "https://vt-test.invalid",
      "Network access outside fixture is forbidden",
    );
    if (url.pathname === "/auth/v1/user") return Response.json({ id: user });
    if (url.pathname === "/rest/v1/rpc/vt_action") {
      const args = await request.json();
      assert.deepEqual(Object.keys(args).sort(), ["p_action", "p_payload"]);
      await db.query("select public.vt_action($1,$2::jsonb)", [
        args.p_action,
        JSON.stringify(args.p_payload),
      ]);
      return new Response(null, { status: 204 });
    }
    const table = url.pathname.replace("/rest/v1/", "");
    let rows;
    if (table === "profiles") {
      rows = (await db.query("select * from public.profiles")).rows;
    } else if (table === "daily_progress") {
      const dateFilter = url.searchParams.get("date");
      assert.equal(dateFilter, `eq.${trainingDate(new Date())}`);
      rows = (
        await db.query("select task_id from public.daily_progress where date=$1 and completed", [
          dateFilter!.slice(3),
        ])
      ).rows;
    } else {
      assert.equal(table, "checkins");
      rows = (
        await db.query(
          "select *,date::text as date from public.checkins order by public.checkins.date desc",
        )
      ).rows;
    }
    return Response.json(rows);
  });
  const api = async (payload?: object, timezone = "Asia/Shanghai") => {
    const request = new Request("http://localhost/api/training?date=2000-01-01", {
      method: payload ? "POST" : "GET",
      headers: {
        authorization: "Bearer test-session",
        "content-type": "application/json",
        "x-timezone": timezone,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const response = await (payload ? POST(request) : GET(request));
    assert.equal(response.status, 200);
    return response.json();
  };
  const clock = async (instant: string) => {
    t.mock.timers.setTime(new Date(instant).getTime());
    await db.query("select set_config('vt_test.now',$1,false)", [instant]);
  };
  const complete = async () => {
    for (const taskId of tasks) await api({ action: "task", taskId, completed: true });
    return api({ action: "checkin" });
  };
  return { db, api, clock, complete };
}

test("cloud API and RPC ignore forged headers, dates and timezone payloads", async (t) => {
  const { db, api } = await fixture(t);
  await api({ action: "profile", input, date: "2000-01-01" });
  for (const timezone of [
    "Asia/Shanghai",
    "UTC",
    "America/Los_Angeles",
    "Etc/GMT+12",
    "Etc/GMT-14",
    "invalid/timezone",
  ]) {
    for (const taskId of tasks) {
      await api(
        { action: "task", taskId, completed: true, date: "2000-01-01", timezone },
        timezone,
      );
    }
  }
  for (const timezone of [
    "Asia/Shanghai",
    "UTC",
    "America/Los_Angeles",
    "Etc/GMT+12",
    "Etc/GMT-14",
    "invalid/timezone",
  ]) {
    const state = await api(
      { action: "checkin", date: "2000-01-01", checkin_date: "2099-01-01", p_timezone: timezone },
      timezone,
    );
    assert.equal(state.today, "2026-09-20");
    assert.equal(state.checkins.length, 1);
    assert.equal(state.checkins[0].date, "2026-09-20");
    assert.equal(state.completed.length, 4);
    assert.equal((await api(undefined, timezone)).today, "2026-09-20");
  }
  for (const timezone of ["UTC", "America/Los_Angeles", "Etc/GMT+12", "Etc/GMT-14"]) {
    await assert.rejects(
      () => db.query("select public.vt_action($1,$2::jsonb,$3)", ["checkin", "{}", timezone]),
      { code: "42883" },
    );
    await assert.rejects(
      () =>
        db.query("select public.vt_action(p_action=>$1,p_payload=>$2::jsonb,p_timezone=>$3)", [
          "checkin",
          "{}",
          timezone,
        ]),
      { code: "42883" },
    );
    await db.query("select set_config('TimeZone',$1,false)", [timezone]);
    await db.query("select public.vt_action($1,$2::jsonb)", [
      "checkin",
      JSON.stringify({ timezone, p_timezone: timezone, date: "2000-01-01" }),
    ]);
  }
  const signatures = (
    await db.query(
      "select pronargs from pg_proc where proname='vt_action' and pronamespace='public'::regnamespace",
    )
  ).rows;
  assert.deepEqual(signatures, [{ pronargs: 2 }]);
  assert.equal(
    (await db.query<{ n: number }>("select count(*)::int as n from public.checkins")).rows[0].n,
    1,
  );
  assert.deepEqual(
    (await db.query("select distinct date::text as date from public.daily_progress")).rows,
    [{ date: "2026-09-20" }],
  );
  assert.deepEqual((await db.query("select date::text as date from public.checkins")).rows, [
    { date: "2026-09-20" },
  ]);
});

test("China 23:59 to 00:01 keeps API, progress, checkins, week and streak aligned", async (t) => {
  const { db, api, clock, complete } = await fixture(t);
  await api({ action: "profile", input });
  let state = await complete();
  assert.equal(state.today, "2026-09-20");
  assert.equal(
    trainingStats(
      state.checkins.map((c: { date: string }) => c.date),
      state.today,
    ).current,
    1,
  );
  assert.equal(
    trainingStats(
      state.checkins.map((c: { date: string }) => c.date),
      state.today,
    ).week,
    1,
  );
  assert.equal((await api({ action: "checkin" })).checkins.length, 1);

  await clock("2026-09-20T16:01:00Z"); // Monday 00:01 in China; still Sunday in UTC/LA.
  state = await api(undefined, "America/Los_Angeles");
  assert.equal(state.today, "2026-09-21");
  assert.deepEqual(state.completed, []);
  assert.equal(
    state.checkins.some((c: { date: string }) => c.date === state.today),
    false,
  );
  assert.equal(
    trainingStats(
      state.checkins.map((c: { date: string }) => c.date),
      state.today,
    ).week,
    0,
  );
  state = await complete();
  assert.equal(state.checkins.length, 2);
  let stats = trainingStats(
    state.checkins.map((c: { date: string }) => c.date),
    state.today,
  );
  assert.equal(stats.current, 2);
  assert.equal(stats.week, 1);

  await clock("2026-09-22T16:01:00Z"); // Wednesday: Tuesday was missed.
  state = await api();
  assert.equal(state.today, "2026-09-23");
  assert.equal(
    trainingStats(
      state.checkins.map((c: { date: string }) => c.date),
      state.today,
    ).current,
    0,
  );
  state = await complete();
  stats = trainingStats(
    state.checkins.map((c: { date: string }) => c.date),
    state.today,
  );
  assert.equal(stats.current, 1);
  assert.equal(stats.longest, 2);
  assert.equal(stats.week, 2);
  assert.equal(state.checkins.length, 3);
  const progressDates = (
    await db.query("select distinct date::text as date from public.daily_progress order by date")
  ).rows;
  const checkinDates = (
    await db.query<{ date: string }>("select date::text as date from public.checkins order by date")
  ).rows;
  assert.deepEqual(progressDates, checkinDates);
  assert.deepEqual(
    checkinDates.map((row) => row.date),
    ["2026-09-20", "2026-09-21", "2026-09-23"],
  );
});

import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { dataMode, supabaseConfig } from "../config";
import type { Assessment, Checkin, Profile, Snapshot } from "../domain";
import { trainingDate } from "../streak";
import { recommendPlan } from "../recommendation";

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function repository(request: Request) {
  if (dataMode === "local") {
    const today = trainingDate(new Date());
    const { localStore } = await import("./local-store");
    const jar = await cookies();
    let userId = jar.get("vt_session")?.value;
    if (!userId || !/^[a-f0-9]{64}$/.test(userId)) {
      userId = randomBytes(32).toString("hex");
      jar.set("vt_session", userId, {
        httpOnly: true,
        sameSite: "lax",
        secure: new URL(request.url).protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    const id = userId;
    const store = localStore();
    return {
      snapshot: async () => store.snapshot(id, today),
      saveProfile: async (input: Assessment) => store.saveProfile(id, today, input),
      completeTask: async (task: string, completed: boolean) =>
        store.completeTask(id, today, task, completed),
      checkin: async () => store.checkin(id, today),
    };
  }
  const { url, key } = supabaseConfig();
  if (!url || !key) throw new HttpError("Supabase 尚未配置，请查看 .env.example。", 503);
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new HttpError("请先登录。", 401);
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new HttpError("登录已过期，请重新登录。", 401);
  const id = data.user.id;
  return {
    snapshot: () => cloudSnapshot(client, id, trainingDate(new Date())),
    saveProfile: (input: Assessment) =>
      mutate(client, "profile", { ...input, selected_plan: recommendPlan(input) }),
    completeTask: (task: string, completed: boolean) =>
      mutate(client, "task", { task_id: task, completed }),
    checkin: () => mutate(client, "checkin", {}),
  };
}
async function mutate(client: SupabaseClient, action: string, payload: object) {
  const { error } = await client.rpc("vt_action", {
    p_action: action,
    p_payload: payload,
  });
  if (error) throw new HttpError(error.message);
}
async function cloudSnapshot(client: SupabaseClient, id: string, today: string): Promise<Snapshot> {
  const [profile, progress, checkins] = await Promise.all([
    client.from("profiles").select("*").eq("id", id).maybeSingle(),
    client
      .from("daily_progress")
      .select("task_id")
      .eq("user_id", id)
      .eq("date", today)
      .eq("completed", true),
    client.from("checkins").select("*").eq("user_id", id).order("date", { ascending: false }),
  ]);
  const error = profile.error || progress.error || checkins.error;
  if (error) throw new HttpError("读取云端数据失败，请确认数据库 SQL 已执行。", 503);
  return {
    profile: profile.data as Profile | null,
    completed: (progress.data || []).map((t) => t.task_id as string),
    checkins: (checkins.data || []) as Checkin[],
    today,
    mode: "supabase",
  };
}

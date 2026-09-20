import { NextResponse } from "next/server";
import { z } from "zod";
import { trainingErrorMessage } from "@/lib/errors";
import { assessmentSchema } from "@/lib/domain";
import { repository, HttpError } from "@/lib/server/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("profile"), input: assessmentSchema }),
  z.object({
    action: z.literal("task"),
    taskId: z.string().min(1).max(50),
    completed: z.boolean(),
  }),
  z.object({ action: z.literal("checkin") }),
]);
function failure(error: unknown) {
  const message =
    error instanceof SyntaxError
      ? "请求内容无法识别，请刷新页面后重试。"
      : trainingErrorMessage(error, error instanceof HttpError ? error.status : undefined);
  return NextResponse.json(
    { error: error instanceof z.ZodError ? "请检查测评选项是否填写完整。" : message },
    {
      status: error instanceof HttpError ? error.status : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function GET(request: Request) {
  try {
    return NextResponse.json(await (await repository(request)).snapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    // Next may normalize request.url to localhost while the browser uses 127.0.0.1.
    // Compare the browser origin with the incoming Host instead of that internal URL.
    if (origin && new URL(origin).host !== request.headers.get("host"))
      throw new HttpError("请求来源不匹配。", 403);
    const action = actionSchema.parse(await request.json());
    const repo = await repository(request);
    if (action.action === "profile") await repo.saveProfile(action.input);
    if (action.action === "task") await repo.completeTask(action.taskId, action.completed);
    if (action.action === "checkin") await repo.checkin();
    return NextResponse.json(await repo.snapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}

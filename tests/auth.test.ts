import test from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage, normalizeAuthEmail, SIGNUP_CONFIRMATION_MESSAGE } from "../src/lib/auth";
import { trainingErrorMessage } from "../src/lib/errors";

test("auth input is normalized without changing passwords", () => {
  assert.equal(normalizeAuthEmail("  Player@Example.COM "), "player@example.com");
});

test("known failure causes remain distinct and raw upstream details never reach the UI", () => {
  const cases = [
    [{ code: "42501" }, undefined, /权限/],
    [{ code: "23514" }, undefined, /数据不符合/],
    [{ code: "42P01" }, undefined, /尚未就绪/],
    [new TypeError("Failed to fetch"), undefined, /网络/],
    [new SyntaxError("Unexpected token <"), undefined, /无法识别/],
    [{ message: "Gateway timeout" }, 504, /超时/],
    [{ message: "Too many requests" }, 429, /频繁/],
    [{ message: "Bad gateway" }, 502, /不可用/],
    [{ message: "该任务不属于当前计划。" }, 400, /该任务不属于/],
    [{ message: "完成所有训练任务后才能打卡。" }, 400, /完成所有/],
  ] as const;
  for (const [error, status, expected] of cases) {
    const result = trainingErrorMessage(error, status);
    assert.match(result, expected);
    assert.equal(trainingErrorMessage(new Error(result)), result);
    assert.doesNotMatch(result, /[a-z]/i);
  }
  for (const [code, expected] of [
    ["weak_password", /密码/],
    ["email_address_invalid", /邮箱格式/],
    ["signup_disabled", /暂未开放/],
    ["user_banned", /停用/],
    ["session_expired", /过期/],
    ["request_timeout", /超时/],
  ] as const)
    assert.match(authErrorMessage({ code }, "signup"), expected);
  assert.doesNotMatch(trainingErrorMessage(new Error("private database details")), /private/);
  assert.doesNotMatch(authErrorMessage(new Error("private auth details"), "login"), /private/);
});

test("auth failures are specific and safe for the UI", () => {
  assert.match(authErrorMessage({ code: "invalid_credentials" }, "login"), /邮箱或密码/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }, "login"), /尚未确认/);
  assert.match(authErrorMessage(new Error("network unavailable"), "login"), /检查网络/);
  assert.match(authErrorMessage(new Error("network unavailable"), "signout"), /退出未完成/);
  assert.match(SIGNUP_CONFIRMATION_MESSAGE, /注册不会修改原密码/);
});

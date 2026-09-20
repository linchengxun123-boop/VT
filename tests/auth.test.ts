import test from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage, normalizeAuthEmail, SIGNUP_CONFIRMATION_MESSAGE } from "../src/lib/auth";

test("auth input is normalized without changing passwords", () => {
  assert.equal(normalizeAuthEmail("  Player@Example.COM "), "player@example.com");
});

test("auth failures are specific and safe for the UI", () => {
  assert.match(authErrorMessage({ code: "invalid_credentials" }, "login"), /邮箱或密码/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }, "login"), /尚未确认/);
  assert.match(authErrorMessage(new Error("network unavailable"), "login"), /检查网络/);
  assert.match(authErrorMessage(new Error("network unavailable"), "signout"), /退出未完成/);
  assert.match(SIGNUP_CONFIRMATION_MESSAGE, /注册不会修改原密码/);
});

import { test, expect } from "@playwright/test";

test("Chinese login, signup, validation and distinct upstream failures", async ({ page }) => {
  let code = "invalid_credentials";
  await page.route("https://vt-test.invalid/**", async (route) => {
    if (route.request().url().includes("/signup")) {
      await route.fulfill({
        json: { user: { id: "test-user", email: "player@example.com" }, session: null },
      });
    } else if (code) {
      await route.fulfill({
        status: 400,
        json: { error_code: code, message: "Raw English upstream detail" },
      });
    } else {
      await route.fulfill({
        json: {
          access_token: "test-token",
          refresh_token: "test-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user: { id: "test-user", email: "player@example.com" },
        },
      });
    }
  });
  await page.route("**/api/training", (route) =>
    route.fulfill({
      json: {
        profile: null,
        completed: [],
        checkins: [],
        today: "2026-09-20",
        mode: "supabase",
      },
    }),
  );
  await page.goto("/login");
  const login = page.getByRole("button", { name: "登录", exact: true });
  await expect(login).toBeEnabled();
  await login.click();
  expect(
    await page
      .getByLabel("邮箱", { exact: true })
      .evaluate((el: HTMLInputElement) => el.validationMessage),
  ).toBe("请输入邮箱。");
  await page.getByLabel("邮箱", { exact: true }).fill("player@example.com");
  await page.getByLabel("密码", { exact: true }).fill("test-password");
  for (const [failure, expected] of [
    ["invalid_credentials", "邮箱或密码不正确"],
    ["email_not_confirmed", "邮箱尚未确认"],
    ["weak_password", "密码不符合安全要求"],
    ["over_request_rate_limit", "尝试次数过多"],
    ["user_banned", "账号已被停用"],
    ["request_timeout", "响应超时"],
  ]) {
    code = failure;
    await login.click();
    await expect(page.locator(".error[role=alert]")).toContainText(expected);
    await expect(page.locator(".error[role=alert]")).not.toContainText("Raw English");
  }
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/qa/login-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "没有账号？注册" }).click();
  await page.getByRole("button", { name: "注册账号", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已发送确认邮件");
  await page.getByRole("button", { name: "已有账号？登录" }).click();
  code = "";
  await login.click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
});

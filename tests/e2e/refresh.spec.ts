import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
  const result = await context.request.post("/api/training", {
    data: {
      action: "profile",
      input: {
        rank: "Gold",
        role: "Duelist",
        daily_training_minutes: 20,
        weaknesses: ["拉枪容易拉过"],
      },
    },
  });
  expect(result.ok()).toBeTruthy();
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "完成 小目标热身", exact: true })).toBeEnabled();
});

test("a delayed background refresh cannot swallow a save or restore stale task state", async ({
  page,
}) => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let readStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    readStarted = resolve;
  });
  let writes = 0;
  await page.route("**/api/training", async (route) => {
    if (route.request().method() === "POST") {
      writes++;
      await route.continue();
      return;
    }
    const stale = await route.fetch();
    readStarted();
    await blocked;
    await route.fulfill({ response: stale });
  });
  try {
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await started;
    await page.getByRole("button", { name: "完成 小目标热身", exact: true }).click();
    await expect(page.getByRole("button", { name: "撤销 小目标热身" })).toBeVisible();
    expect(writes).toBe(1);
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  await expect(page.getByRole("button", { name: "撤销 小目标热身" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "撤销 小目标热身" })).toBeVisible();
});

test("failed save shows an error and permits retry without falsely completing a task", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/training", async (route) => {
    if (fail && route.request().method() === "POST") {
      fail = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error: private upstream detail" }),
      });
    } else await route.continue();
  });
  const complete = page.getByRole("button", { name: "完成 小目标热身", exact: true });
  await complete.click();
  await expect(page.locator('.error[role="alert"]')).toHaveText(
    "训练服务发生异常，暂时无法完成操作，请稍后重试。",
  );
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(page.getByRole("button", { name: "撤销 小目标热身" })).toBeVisible();
  await expect(page.locator('.error[role="alert"]')).toHaveCount(0);
});

test("three navigation items highlight the current route across clicks, history and reloads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const nav = page.getByRole("navigation", { name: "底部导航" });
  await expect(nav.getByRole("link")).toHaveCount(3);
  for (const [label, path] of [
    ["记录", "history"],
    ["我的", "profile"],
    ["训练", "dashboard"],
  ]) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`/${path}$`));
    await expect(nav.locator('[aria-current="page"]')).toHaveText(label);
    await expect(nav.locator(".active")).toHaveCount(1);
  }
  await page.goBack();
  await expect(nav.locator('[aria-current="page"]')).toHaveText("我的");
  await page.goForward();
  await expect(nav.locator('[aria-current="page"]')).toHaveText("训练");
  await page.goto("/dashboard#training");
  await page.reload();
  await expect(nav.locator('[aria-current="page"]')).toHaveText("训练");
});

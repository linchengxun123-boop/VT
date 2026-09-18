import { test, expect } from "@playwright/test";
test("first visit → assessment → Plan C → persisted tasks → checkin → history", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /每一天，\s*更准一点。/ })).toBeVisible();
  await page.getByRole("link", { name: "开始测评" }).click();
  await page.getByRole("button", { name: "Gold", exact: false }).click();
  await page.getByRole("button", { name: "Duelist", exact: true }).click();
  await page.getByRole("button", { name: "20 分钟", exact: true }).click();
  await page.getByRole("button", { name: "拉枪容易拉过", exact: true }).click();
  await page.getByRole("button", { name: "生成我的训练计划" }).click();
  await expect(page.getByRole("heading", { name: "微调与精准控枪训练" })).toBeVisible();
  await page.getByRole("link", { name: "进入今日训练" }).click();
  const checkin = page.getByRole("button", { name: "完成今日训练", exact: true });
  await expect(checkin).toBeDisabled();
  await page.getByRole("button", { name: "完成 Small Target Warmup", exact: true }).click();
  await expect(page.getByRole("button", { name: "撤销 Small Target Warmup" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "撤销 Small Target Warmup" })).toBeVisible();
  for (const name of ["微调训练", "Vandal One Tap Practice", "乱斗"]) {
    await page.getByRole("button", { name: `完成 ${name}`, exact: true }).click();
    await expect(page.getByRole("button", { name: `撤销 ${name}`, exact: true })).toBeVisible();
  }
  await expect(checkin).toBeEnabled();
  await checkin.click();
  await expect(page.getByRole("heading", { name: "今日打卡已保存" })).toBeVisible();
  await expect(page.locator(".streak-number")).toHaveText("1天");
  await expect(page.locator(".streak-card")).toHaveClass(/streak-active/);
  const retry = await context.request.post("/api/training", {
    data: { action: "checkin" },
  });
  expect(retry.ok()).toBeTruthy();
  expect((await retry.json()).checkins).toHaveLength(1);
  await page.goto("/history");
  await expect(page.locator(".history-row.recorded")).toHaveCount(1);
  await expect(page.locator(".history-row.recorded")).toContainText("20 分钟");
  await page.reload();
  await expect(page.locator(".history-row.recorded")).toHaveCount(1);
  for (const width of [375, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  }
  await page.goto("/");
  await expect(page).toHaveURL(/dashboard/);
});
test("new browser has no access to another player's records and API rejects forged writes", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
  const incomplete = await context.request.post("/api/training", { data: { action: "checkin" } });
  expect(incomplete.status()).toBe(400);
  const invalid = await context.request.post("/api/training", {
    data: {
      action: "profile",
      input: { rank: "Gold", role: "Duelist", daily_training_minutes: 999, weaknesses: [] },
    },
  });
  expect(invalid.status()).toBe(400);
  const crossOrigin = await context.request.post("/api/training", {
    data: { action: "checkin" },
    headers: { origin: "https://example.com" },
  });
  expect(crossOrigin.status()).toBe(403);
});

import { test, expect, type Page } from "@playwright/test";

async function checkChineseLayout(page: Page) {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const text = await page.locator("body").innerText();
    expect(
      text.replaceAll("VALORANT", "").replaceAll("VT", "").replaceAll("Aimlabs", ""),
    ).not.toMatch(/[a-z]/i);
    const clipped = await page
      .locator("button, h1, h2, h3, .option, .preview-tasks li")
      .evaluateAll((elements) =>
        elements
          .filter(
            (el) =>
              el.clientWidth &&
              (el.scrollWidth > el.clientWidth + 1 ||
                (getComputedStyle(el).overflowY !== "visible" &&
                  el.scrollHeight > el.clientHeight + 1)),
          )
          .map((el) => ({
            text: el.textContent,
            width: el.clientWidth,
            scrollWidth: el.scrollWidth,
            height: el.clientHeight,
            scrollHeight: el.scrollHeight,
          })),
      );
    expect(clipped).toEqual([]);
  }
}

for (const scenario of [
  { weakness: null, plan: "基础枪法训练", id: "A" },
  { weakness: "预瞄不稳", plan: "爆头与预瞄训练", id: "B" },
  { weakness: "拉枪容易拉过", plan: "微调与精准控枪训练", id: "C" },
])
  test(`Chinese flow preserves data and layout for ${scenario.id}`, async ({ page, context }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
    await checkChineseLayout(page);
    await page.goto("/login");
    await expect(page.getByText("当前使用访客模式，无需登录即可开始训练。")).toBeVisible();
    await checkChineseLayout(page);
    await page.goto("/assessment");
    await expect(page.getByRole("button", { name: "生成我的训练计划" })).toBeVisible();
    await checkChineseLayout(page);
    await page.getByRole("button", { name: "无畏战魂" }).click();
    await page.getByRole("button", { name: "哨卫", exact: true }).click();
    if (scenario.weakness)
      await page.getByRole("button", { name: scenario.weakness, exact: true }).click();
    await page.getByRole("button", { name: "生成我的训练计划" }).click();
    await expect(page.getByRole("heading", { name: scenario.plan, exact: true })).toBeVisible();
    await checkChineseLayout(page);
    const snapshot = await (await context.request.get("/api/training")).json();
    expect(snapshot.profile.rank).toBe("Radiant");
    expect(snapshot.profile.role).toBe("Sentinel");
    expect(snapshot.profile.selected_plan).toBe(scenario.id);
    if (scenario.id === "B")
      expect(snapshot.profile.weaknesses).toEqual(["Crosshair Placement 差"]);
    await page.getByRole("link", { name: "进入今日训练" }).click();
    await expect(page.locator(".task-card").first()).toBeVisible();
    for (const button of await page.getByRole("button", { name: "训练方法" }).all())
      await button.click();
    await checkChineseLayout(page);
    for (const button of await page.locator(".task-button").all()) {
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
    await page.getByRole("button", { name: "完成今日训练", exact: true }).click();
    await expect(page.getByText("今日打卡已保存")).toBeVisible();
    for (const route of ["history", "profile"]) {
      await page.goto(`/${route}`);
      await expect(page.locator(".page-heading")).toBeVisible();
      await checkChineseLayout(page);
    }
  });

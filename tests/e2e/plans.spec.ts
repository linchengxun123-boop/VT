import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test.beforeEach(async ({ context }) => {
  await context.request.post("/api/training", {
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
});

test("library filters six references and opens a guarded detail page", async ({ page }) => {
  await page.goto("/plans?environment=all");
  await expect(page.getByRole("heading", { name: "职业选手方案", exact: true })).toBeVisible();
  await expect(page.locator(".library-card")).toHaveCount(6);
  await expect(page.getByRole("navigation", { name: "训练区域" }).getByRole("link")).toHaveCount(2);
  expect((await page.locator(".library-card").allTextContents()).join(" ")).not.toContain(
    "参考来源",
  );

  await page.getByRole("link", { name: "游戏内", exact: true }).click();
  await expect(page).toHaveURL(/environment=game/);
  await expect(page.locator(".library-card")).toHaveCount(3);
  await expect(page.locator(".library-card")).toContainText(["zmjjkk", "nAts", "CHICHOO"]);

  await page.getByRole("link", { name: "查看 zmjjkk 方案" }).click();
  await expect(page.getByRole("heading", { name: "zmjjkk", exact: true })).toBeVisible();
  await expect(page.getByText("内容整理中", { exact: true })).toBeVisible();
  const sources = page.locator(".library-sources");
  await expect(sources.locator("summary")).toContainText("参考来源");
  await expect(page.locator(".library-sources")).not.toHaveAttribute("open", "");
  await expect(page.getByRole("link", { name: /训练参考视频/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /采用方案/ })).toHaveCount(0);
  await sources.locator("summary").click();
  await expect(page.getByRole("link", { name: /训练参考视频/ })).toHaveCount(2);
  await page.getByRole("link", { name: "返回计划库" }).click();
  await expect(page).toHaveURL(/environment=game/);
  await expect(page.locator(".library-card")).toHaveCount(3);
});

test("library keeps three readable columns without horizontal overflow on mobile", async ({
  page,
}) => {
  mkdirSync("artifacts/qa", { recursive: true });
  await page.goto("/plans?environment=all");
  await expect(page.getByRole("heading", { name: "职业选手方案", exact: true })).toBeVisible();
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    const cards = await page.locator(".library-card").evaluateAll((elements) =>
      elements.slice(0, 3).map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    expect(new Set(cards.map((card) => card.y)).size).toBe(1);
    expect(cards.every((card) => card.width >= 80)).toBe(true);
    expect(cards.every((card) => card.height <= 235)).toBe(true);
    const names = await page.locator(".library-card h2").evaluateAll((elements) =>
      elements.map((element) => ({
        text: element.textContent,
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
        lines: Math.round(
          element.getBoundingClientRect().height /
            Number.parseFloat(getComputedStyle(element).lineHeight),
        ),
        textAlign: getComputedStyle(element).textAlign,
      })),
    );
    expect(names.every((name) => name.lines === 1)).toBe(true);
    expect(names.every((name) => name.scrollWidth <= name.width + 1)).toBe(true);
    expect(names.every((name) => name.textAlign === "center")).toBe(true);
    expect(
      await page
        .locator(".library-card-link")
        .evaluateAll((links) =>
          links.every((link) => Number.parseFloat(getComputedStyle(link).minHeight) >= 44),
        ),
    ).toBe(true);
    if (width === 320 || width === 390)
      await page.screenshot({
        path: `artifacts/qa/plan-library-mobile-${width}.png`,
        fullPage: true,
      });
  }
});

test("desktop library uses compact auto-fit columns", async ({ page }) => {
  mkdirSync("artifacts/qa", { recursive: true });
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/plans?environment=all");
    await expect(page.getByRole("heading", { name: "职业选手方案", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const cards = await page.locator(".library-card").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y), width: rect.width };
      }),
    );
    expect(new Set(cards.map((card) => card.x)).size).toBeGreaterThanOrEqual(4);
    expect(Math.max(...cards.map((card) => card.width))).toBeLessThanOrEqual(212);
    if (width === 1440)
      await page.screenshot({ path: "artifacts/qa/plan-library-desktop-1440.png", fullPage: true });
  }
});

import { test, expect } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const { APCAcontrast, sRGBtoY } = createRequire(import.meta.url)("apca-w3") as {
  APCAcontrast: (text: number, background: number) => number;
  sRGBtoY: (rgb: number[]) => number;
};

test("dark theme maintains readable text, action labels and focus contrast", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    return Object.fromEntries(
      [
        "background",
        "surface",
        "surface-elevated",
        "text-primary",
        "text-secondary",
        "primary",
        "primary-on",
        "primary-subtle",
        "primary-emphasis",
        "border-strong",
      ].map((name) => {
        ctx.fillStyle = style.getPropertyValue(`--${name}`).trim();
        ctx.fillRect(0, 0, 1, 1);
        return [name, Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3)];
      }),
    );
  });
  const luminance = (rgb: number[]) =>
    rgb
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const pairs = [
    ["text-primary", "background", 4.5, 75],
    ["text-secondary", "surface-elevated", 4.5, 75],
    ["primary-on", "primary", 4.5, 75],
    ["primary-emphasis", "primary-subtle", 4.5, 60],
    ["border-strong", "surface", 3, 0],
    ["primary", "surface-elevated", 3, 0],
  ] as const;
  const report = pairs.map(([fg, bg, minRatio, minLc]) => {
    const a = luminance(tokens[fg]),
      b = luminance(tokens[bg]);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const lc = Math.abs(APCAcontrast(sRGBtoY(tokens[fg]), sRGBtoY(tokens[bg])));
    expect(ratio, `${fg} on ${bg}: WCAG`).toBeGreaterThanOrEqual(minRatio);
    expect(lc, `${fg} on ${bg}: APCA`).toBeGreaterThanOrEqual(minLc);
    return { foreground: fg, background: bg, contrast: ratio, APCA_Lc: lc };
  });
  mkdirSync("artifacts/qa", { recursive: true });
  writeFileSync("artifacts/qa/contrast.json", JSON.stringify(report, null, 2));
});

test("mobile and desktop pages fit their viewport and render without runtime errors", async ({
  page,
  context,
}) => {
  mkdirSync("artifacts/qa", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
  for (const width of [375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 1440 || width === 390)
      await page.screenshot({ path: `artifacts/qa/home-${width}.png`, fullPage: true });
  }
  await page.goto("/assessment");
  await expect(page.getByRole("button", { name: "生成我的训练计划" })).toBeVisible();
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: "artifacts/qa/assessment-430.png", fullPage: true });
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
  for (const route of ["dashboard", "history", "profile"]) {
    await page.goto(`/${route}`);
    await expect(page.locator(".page-heading")).toBeVisible();
    for (const width of [375, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (route === "dashboard") {
        const height = ({ 375: 812, 390: 844, 430: 932 } as Record<number, number>)[width] || 1000;
        await page.setViewportSize({ width, height });
        await expect(page.locator(".streak-card")).toHaveClass(/streak-zero/);
        expect(
          await page
            .locator(".streak-card .aside-label svg")
            .evaluate((el) => getComputedStyle(el).color),
        ).toBe(
          await page
            .locator(".streak-card .aside-label")
            .evaluate((el) => getComputedStyle(el).color),
        );
        const cards = page.locator(".compact-task");
        await expect(cards).toHaveCount(4);
        const measurements = await cards.evaluateAll((elements) =>
          elements.map((card) => {
            const method = card.querySelector(".task-instructions")!.getBoundingClientRect();
            const complete = card.querySelector(".task-button")!.getBoundingClientRect();
            return {
              height: card.getBoundingClientRect().height,
              methodHeight: method.height,
              completeHeight: complete.height,
              methodY: method.y,
              completeY: complete.y,
            };
          }),
        );
        for (const measurement of measurements) {
          expect(measurement.methodHeight).toBeGreaterThanOrEqual(44);
          expect(measurement.completeHeight).toBeGreaterThanOrEqual(44);
          expect(measurement.methodY).toBe(measurement.completeY);
        }
        if (width < 760) {
          const baselineFile = "artifacts/qa/card-baseline.json";
          const baseline = existsSync(baselineFile)
            ? (
                JSON.parse(readFileSync(baselineFile, "utf8")) as {
                  width: number;
                  heights: number[];
                }[]
              ).find((v) => v.width === width)
            : undefined;
          const comparison = measurements.map((measurement, index) => ({
            ...measurement,
            before: baseline?.heights[index],
            reduction: baseline ? 1 - measurement.height / baseline.heights[index] : null,
          }));
          writeFileSync(
            `artifacts/qa/card-comparison-${width}.json`,
            JSON.stringify(comparison, null, 2),
          );
          for (const measurement of measurements) {
            expect(measurement.height).toBeGreaterThanOrEqual(140);
            expect(measurement.height).toBeLessThanOrEqual(167);
          }
          await expect(
            page.getByRole("navigation", { name: "底部导航" }).getByRole("link"),
          ).toHaveCount(3);
          await page.screenshot({
            path: `artifacts/qa/v0.1-dashboard-${width}.png`,
            fullPage: true,
          });
          await page.screenshot({ path: `artifacts/qa/v0.1-dashboard-${width}-viewport.png` });
          await page.locator("#training").scrollIntoViewIfNeeded();
          await page.screenshot({ path: `artifacts/qa/v0.1-dashboard-${width}-tasks.png` });
          await cards.first().getByRole("button", { name: "训练方法" }).click();
          await expect(cards.first().locator(".task-description")).toBeVisible();
          await cards.first().getByRole("button", { name: "训练方法" }).click();
          await expect(cards.first().locator(".task-description")).toBeHidden();
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        } else {
          await page.screenshot({ path: `artifacts/qa/dashboard-${width}.png`, fullPage: true });
        }
      }
    }
  }
  expect(errors).toEqual([]);
});

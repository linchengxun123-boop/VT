import { test, expect } from "@playwright/test";
import { trainingDate } from "../../src/lib/streak";

for (const timezoneId of ["Asia/Shanghai", "UTC", "America/Los_Angeles"]) {
  test(`browser ${timezoneId} uses the same China date, ignoring its clock and forged headers`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ timezoneId });
    try {
      const page = await context.newPage();
      // The app must use the server's date, even if the client's clock is wrong.
      await page.clock.setFixedTime(new Date("2000-01-01T00:00:00Z"));
      const requests: Record<string, string>[] = [];
      page.on("request", (request) => {
        if (request.url().includes("/api/training")) requests.push(request.headers());
      });
      await page.goto("http://127.0.0.1:3100/");
      await expect(page.getByRole("link", { name: "开始测评" })).toBeVisible();
      const assessment = await context.request.post("http://127.0.0.1:3100/api/training", {
        headers: { "x-timezone": "Etc/GMT+12" },
        data: {
          action: "profile",
          date: "2000-01-01",
          input: {
            rank: "Gold",
            role: "Duelist",
            daily_training_minutes: 20,
            weaknesses: ["拉枪容易拉过"],
          },
        },
      });
      expect(assessment.ok()).toBeTruthy();
      const today = trainingDate(new Date());
      expect((await assessment.json()).today).toBe(today);
      await page.goto("http://127.0.0.1:3100/dashboard");
      for (const name of ["Small Target Warmup", "微调训练", "Vandal One Tap Practice", "乱斗"]) {
        await page.getByRole("button", { name: `完成 ${name}`, exact: true }).click();
        await expect(page.getByRole("button", { name: `撤销 ${name}`, exact: true })).toBeVisible();
      }
      await page.getByRole("button", { name: "完成今日训练", exact: true }).click();
      await expect(page.getByRole("heading", { name: "今日打卡已保存" })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: "今日打卡已保存" })).toBeVisible();
      await expect(page.locator(".streak-number")).toHaveText("1天");
      expect(requests.length).toBeGreaterThan(0);
      expect(requests.every((headers) => !("x-timezone" in headers))).toBe(true);
      for (const forgedZone of ["UTC", "America/Los_Angeles", "Etc/GMT-14", "invalid/timezone"]) {
        const response = await context.request.post(
          "http://127.0.0.1:3100/api/training?date=2000-01-01",
          {
            headers: { "x-timezone": forgedZone },
            data: { action: "checkin", date: "2000-01-01", timezone: forgedZone },
          },
        );
        expect(response.ok()).toBeTruthy();
        const state = await response.json();
        expect(state.today).toBe(today);
        expect(state.completed).toHaveLength(4);
        expect(state.checkins).toHaveLength(1);
        expect(state.checkins[0].date).toBe(today);
      }
    } finally {
      await context.close();
    }
  });
}

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    timezoneId: "Asia/Shanghai",
    headless: true,
    channel:
      process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined),
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_DATA_MODE: "local",
      NEXT_PUBLIC_SUPABASE_URL: "https://vt-test.invalid",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-public",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      VT_DB_PATH: "./data/vt-e2e.sqlite",
    },
  },
  reporter: "list",
});

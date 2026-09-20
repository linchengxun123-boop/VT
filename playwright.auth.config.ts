import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Isolated fake account service; never sends requests to real user accounts.
export default defineConfig({
  ...base,
  testDir: "./tests/auth-e2e",
  webServer: {
    ...base.webServer,
    command: "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_DATA_MODE: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://vt-test.invalid",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-public",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});

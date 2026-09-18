import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Each process gets synthetic configuration and a fetch stub: no .env files or cloud access.
const script = `
  import assert from 'node:assert/strict';
  import { dataMode } from './src/lib/config.ts';
  import { supabaseBrowser } from './src/lib/supabase-browser.ts';
  import { repository } from './src/lib/server/repository.ts';
  const expected = process.env.VT_TEST_EXPECTED_KEY;
  assert.equal(dataMode, 'supabase');
  let browserRead = false;
  let serverAuth = false;
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    assert.equal(request.headers.get('apikey'), expected);
    assert.equal(request.method, 'GET');
    const url = new URL(request.url);
    assert.equal(url.origin, 'https://vt-test.invalid');
    if (url.pathname === '/auth/v1/user') {
      serverAuth = true;
      assert.equal(request.headers.get('authorization'), 'Bearer test-session');
      return Response.json({ id: '11111111-1111-4111-8111-111111111111' });
    }
    assert.equal(url.pathname, '/rest/v1/profiles');
    browserRead = true;
    return Response.json([]);
  };
  if (!expected) {
    assert.throws(() => supabaseBrowser(), /公开密钥/);
    await assert.rejects(() => repository(new Request('http://localhost/api/training')), {status: 503});
    assert.equal(browserRead || serverAuth, false);
  } else {
    const result = await supabaseBrowser().from('profiles').select('id');
    assert.equal(result.error, null);
    await assert.rejects(() => repository(new Request('http://localhost/api/training')), {status: 401});
    await repository(new Request('http://localhost/api/training', {headers: {authorization: 'Bearer test-session'}}));
    assert.equal(browserRead && serverAuth, true);
  }
`;

for (const scenario of [
  {
    name: "Publishable-only configuration works in browser and server clients",
    publishable: "test-public",
    legacy: undefined,
    expected: "test-public",
  },
  {
    name: "Publishable Key takes precedence when both variables exist",
    publishable: "test-public",
    legacy: "test-legacy",
    expected: "test-public",
  },
  {
    name: "legacy-only configuration remains compatible",
    publishable: undefined,
    legacy: "test-legacy",
    expected: "test-legacy",
  },
  {
    name: "empty Publishable Key falls back to the legacy variable",
    publishable: "",
    legacy: "test-legacy",
    expected: "test-legacy",
  },
  {
    name: "missing keys fail before any network request",
    publishable: undefined,
    legacy: undefined,
    expected: "",
  },
]) {
  test(scenario.name, () => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NEXT_PUBLIC_DATA_MODE: "supabase",
      NEXT_PUBLIC_SUPABASE_URL: "https://vt-test.invalid",
      VT_TEST_EXPECTED_KEY: scenario.expected,
    };
    delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (scenario.publishable !== undefined)
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = scenario.publishable;
    if (scenario.legacy !== undefined) env.NEXT_PUBLIC_SUPABASE_ANON_KEY = scenario.legacy;
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", script],
      {
        env,
        encoding: "utf8",
        timeout: 15000,
      },
    );
    // Do not include child output in failures; environment values must stay private.
    assert.equal(result.status, 0, scenario.name);
  });
}

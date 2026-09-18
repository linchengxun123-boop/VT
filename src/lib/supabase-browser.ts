import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";
let client: SupabaseClient | undefined;
export function supabaseBrowser() {
  const { url, key } = supabaseConfig();
  if (!url || !key) throw new Error("请先在 .env.local 中配置 Supabase URL 和公开密钥。");
  return (client ??= createClient(url, key));
}

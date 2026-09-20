import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";
let client: SupabaseClient | undefined;
export function supabaseBrowser() {
  const { url, key } = supabaseConfig();
  if (!url || !key) throw new Error("账号服务尚未配置，请联系管理员。");
  return (client ??= createClient(url, key));
}

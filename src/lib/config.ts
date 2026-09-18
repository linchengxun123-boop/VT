export const dataMode = process.env.NEXT_PUBLIC_DATA_MODE === "supabase" ? "supabase" : "local";

export function supabaseConfig() {
  // Direct references are required for Next.js to inline public browser configuration.
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

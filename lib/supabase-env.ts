/** Env-only module (no Supabase client) — avoids circular init with auth. */

export const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
export const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey);

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client (singleton).
 * ค่าเชื่อมต่ออ่านจาก Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('http') &&
      !SUPABASE_URL.includes('your-project-id')
  );
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน Environment Variables'
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'pcm-auth',
      },
    });
  }
  return client;
}

export function getSupabaseClient(): SupabaseClient | null {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

export function getSupabaseConfig() {
  return {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY ? '●●●●●●●●●●●●' : '',
  };
}

export function saveSupabaseConfig(_url: string, _key: string) {
  return true;
}

export function clearSupabaseConfig() {
  return true;
}

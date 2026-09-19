import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || import.meta.env.VITE_SUPABASE_URL;
  const key = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project-id') || key.includes('your-anon-public-key')) {
    return null;
  }

  if (customUrl && customKey) {
    return createClient(customUrl, customKey);
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
}

export async function testConnection(url: string, key: string): Promise<{ ok: boolean; message: string; count?: number }> {
  try {
    const client = createClient(url, key);
    const { count, error } = await client.from('categories').select('*', { count: 'exact', head: true });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'เชื่อมต่อ Supabase สำเร็จ!', count: count || 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: message || 'ไม่สามารถเชื่อมต่อได้ ตรวจสอบ URL และ Key' };
  }
}

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are available
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder');
};

// Anonymous ID management
const ANON_ID_KEY = 'kansai_map_anon_id';

export function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

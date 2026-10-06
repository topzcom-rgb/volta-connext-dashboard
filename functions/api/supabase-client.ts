import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xgsawqojacjtrpdacyzw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nP9Kv5N7VENcJ_upmt-8qQ_45GlKceG';

export function getSupabaseClient(env?: any) {
  const url = env?.SUPABASE_URL || SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SECRET_KEY || env?.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

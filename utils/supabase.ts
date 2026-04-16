import { createClient } from '@supabase/supabase-js';
import { getConfig } from './config';

export function getSupabaseClient() {
  const config = getConfig();
  if (!config || !config.NEXT_PUBLIC_SUPABASE_URL || !config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured yet');
  }

  return createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}


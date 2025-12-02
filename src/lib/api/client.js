import { pb } from '../pocketbase';
import { getSupabaseClient } from '../providers/supabaseClient';

const provider = (import.meta.env.VITE_DATA_PROVIDER || 'pocketbase').toLowerCase();

/**
 * Returns the active data client.
 * PocketBase by default; can be switched to Supabase via VITE_DATA_PROVIDER=supabase.
 */
export function getDataClient() {
  if (provider === 'supabase') {
    return getSupabaseClient();
  }
  return pb;
}

export { pb };

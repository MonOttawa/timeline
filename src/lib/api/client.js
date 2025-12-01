import { pb } from '../pocketbase';

/**
 * Returns the active data client.
 * Today this is PocketBase; swapping providers (e.g., Supabase)
 * should only require changes in this module and the API helpers.
 */
export function getDataClient() {
  return pb;
}

export { pb };

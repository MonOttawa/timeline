import PocketBase from 'pocketbase'

// In dev, let the Vite proxy handle /api -> PocketBase; in prod use explicit URL.
// PocketBase SDK appends "/api/..." to this base, so the dev base must be empty to avoid /api/api.
const pocketbaseUrl = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

export const pb = new PocketBase(pocketbaseUrl)

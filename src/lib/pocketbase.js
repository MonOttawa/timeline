import PocketBase from 'pocketbase'

// In dev, let the Vite proxy handle /api -> PocketBase; in prod use explicit URL.
// PocketBase SDK appends "/api/..." to this base, so the dev base must be empty to avoid /api/api.
const getDefaultProdPocketBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  return isLocalHost ? 'http://127.0.0.1:8090' : ''
}

const pocketbaseUrl = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_POCKETBASE_URL || getDefaultProdPocketBaseUrl())

if (import.meta.env.PROD && !import.meta.env.VITE_POCKETBASE_URL && pocketbaseUrl === '') {
  // Avoid silently calling localhost when deployed; prefer same-origin `/api` via reverse proxy or a configured URL.
  console.warn('VITE_POCKETBASE_URL is not set; expecting PocketBase to be reachable at the same origin under `/api`.')
}

export const pb = new PocketBase(pocketbaseUrl)

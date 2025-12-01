import { getDataClient } from './client';

/**
 * Subscribe to auth changes.
 * @param {(token: string, model: any) => void} callback
 * @returns {() => void}
 */
export function onAuthChange(callback) {
  const client = getDataClient();
  return client.authStore.onChange(callback);
}

export function getCurrentUser() {
  return getDataClient().authStore.model;
}

export function clearSession() {
  const client = getDataClient();
  client.authStore.clear();
}

export async function signInWithPassword(email, password) {
  const client = getDataClient();
  const result = await client.collection('users').authWithPassword(email, password);
  return result.record;
}

export async function signUpWithPassword(email, password, passwordConfirm) {
  const client = getDataClient();
  return client.collection('users').create({
    email,
    password,
    passwordConfirm,
    emailVisibility: true,
  });
}

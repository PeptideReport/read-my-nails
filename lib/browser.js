'use client';
import { createClient } from '@supabase/supabase-js';

// Browser client: anon key only. Used for email login links and to carry the session token to /api/me.
let client;
export function browserSb() {
  if (!client) client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return client;
}

export async function authedFetch(path, opt = {}) {
  const { data } = await browserSb().auth.getSession();
  const token = data?.session?.access_token;
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opt.headers || {}, token ? { Authorization: 'Bearer ' + token } : {});
  return fetch(path, Object.assign({}, opt, { headers }));
}

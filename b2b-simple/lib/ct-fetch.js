import { getCTToken } from "./ctAuth.js";

/**
 * Minimal helper used by API routes: ctFetch('/path', { method, body })
 * Builds CT URL from env, injects Bearer token, returns JSON (throws on !ok).
 */
export async function ctFetch(path, init = {}) {
  const token = await getCTToken();
  const method  = (init.method || 'GET').toUpperCase();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {})
  };
  const body = init.body && typeof init.body !== 'string' ? JSON.stringify(init.body) : init.body;

  const base = `${process.env.CT_API_URL}/${process.env.CT_PROJECT_KEY}`;
  const url  = path.startsWith('http') ? path : `${base}${path}`;

  const res = await fetch(url, { ...init, method, headers, body });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`CT ${method} ${url} ${res.status} – ${text}`);
  }
  return res.json();
}

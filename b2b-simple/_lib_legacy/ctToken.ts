// lib/ctToken.ts - App token via Client Credentials with in-memory cache
import { authUrl, scope } from './ctConfig';

let cache: { token: string | null; exp: number } = { token: null, exp: 0 };

export async function getAppToken(): Promise<{ access_token: string; expires_in: number; token_type: string }>{
  if (cache.token && Date.now() < cache.exp - 60_000) {
    return {
      access_token: cache.token,
      token_type: 'Bearer',
      expires_in: Math.floor((cache.exp - Date.now()) / 1000),
    };
  }

  const clientId = process.env.CT_CLIENT_ID || '';
  const clientSecret = process.env.CT_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) throw new Error('CT client credentials missing');

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`getAppToken failed: ${res.status} ${JSON.stringify(json)}`);
  }
  const expSec = json.expires_in || 600;
  cache.token = json.access_token;
  cache.exp = Date.now() + expSec * 1000;
  return { access_token: json.access_token, token_type: json.token_type || 'Bearer', expires_in: expSec };
}

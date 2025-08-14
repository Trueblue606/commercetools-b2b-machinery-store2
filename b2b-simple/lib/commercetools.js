import { createClient } from '@commercetools/sdk-client';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import fetch from 'node-fetch';

const projectKey = process.env.CTP_PROJECT_KEY;
const clientId = process.env.CTP_CLIENT_ID;
const clientSecret = process.env.CTP_CLIENT_SECRET;
const authUrl = process.env.CTP_AUTH_URL || 'https://auth.europe-west1.gcp.commercetools.com';
const apiUrl = process.env.CTP_API_URL || 'https://api.europe-west1.gcp.commercetools.com';
const scopes = process.env.CTP_SCOPES || 'manage_project:' + projectKey;

// For testing, let's add some logging
console.log('Commercetools Config:', {
  projectKey: projectKey ? 'Set' : 'Missing',
  clientId: clientId ? 'Set' : 'Missing',
  clientSecret: clientSecret ? 'Set' : 'Missing',
});

if (!projectKey || !clientId || !clientSecret) {
  console.error('Missing Commercetools credentials!');
  throw new Error('Missing required Commercetools environment variables');
}

const authMiddleware = createAuthMiddlewareForClientCredentialsFlow({
  host: authUrl,
  projectKey,
  credentials: {
    clientId,
    clientSecret,
  },
  scopes: scopes.split(','),
  fetch,
});

const httpMiddleware = createHttpMiddleware({
  host: apiUrl,
  fetch,
});

const ctpClient = createClient({
  middlewares: [authMiddleware, httpMiddleware],
});

export function createApiClient() {
  return createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey });
}

export const HOST = process.env.CT_HOST; // europe-west1.gcp.commercetools.com
export const API = (p = "") => `https://api.${HOST}/${process.env.CT_PROJECT_KEY}${p}`;

export async function ctGet(path, token) {
  const r = await fetch(API(path), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error("CT GET failed"), { status: r.status, body: j });
  return j;
}

export async function ctPost(path, body, token) {
  const r = await fetch(API(path), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error("CT POST failed"), { status: r.status, body: j });
  return j;
}


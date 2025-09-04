// lib/ctAuth.js
let cache = { token: null, exp: 0 };

// Named export: use with `import { getCTToken } from '../../../lib/ctAuth.js'`
export async function getCTToken() {
  if (cache.token && Date.now() < cache.exp - 60_000) {
    return {
      access_token: cache.token,
      token_type: "Bearer",
      expires_in: Math.floor((cache.exp - Date.now()) / 1000),
    };
  }

  const HOST = process.env.CT_HOST;
  const PROJECT_KEY = process.env.CT_PROJECT_KEY;
  const CLIENT_ID = process.env.CT_CLIENT_ID;
  const CLIENT_SECRET = process.env.CT_CLIENT_SECRET;
  if (!HOST || !PROJECT_KEY || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("CT auth env missing: CT_HOST, CT_PROJECT_KEY, CT_CLIENT_ID, CT_CLIENT_SECRET");
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const resp = await fetch(`https://auth.${HOST}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: `manage_project:${PROJECT_KEY}`,
    }),
    cache: "no-store",
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || !json.access_token) {
    throw new Error(`CT OAuth failed: ${resp.status} ${JSON.stringify(json)}`);
  }

  cache.token = json.access_token;
  cache.exp = Date.now() + (json.expires_in || 600) * 1000;
  return {
    access_token: json.access_token,
    token_type: json.token_type || "Bearer",
    expires_in: json.expires_in || 600,
  };
}

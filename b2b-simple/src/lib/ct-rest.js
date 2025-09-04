// src/lib/ct-rest.js
// Lightweight commercetools REST client with token caching

const HOST = process.env.CT_HOST; // e.g. eu-central-1.aws.commercetools.com
const API_URL = process.env.CT_API_URL || (HOST ? `https://api.${HOST}` : undefined);
const AUTH_URL = process.env.CT_AUTH_URL || (HOST ? `https://auth.${HOST}` : undefined);
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const CLIENT_ID = process.env.CT_CLIENT_ID;
const CLIENT_SECRET = process.env.CT_CLIENT_SECRET;
const SCOPE = process.env.CT_SCOPE || (PROJECT_KEY ? `manage_project:${PROJECT_KEY}` : "");

let tokenCache = { access_token: null, expires_at: 0 };

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.access_token && now < tokenCache.expires_at - 60_000) {
    return tokenCache.access_token;
  }

  if (!AUTH_URL || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("CT auth is not configured (CT_AUTH_URL/CT_HOST, CT_CLIENT_ID, CT_CLIENT_SECRET)");
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: SCOPE }),
  });
  if (!res.ok) throw new Error(`CT auth failed: ${res.status}`);
  const data = await res.json();
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };
  return tokenCache.access_token;
}

export async function ctFetch(path, init = {}) {
  if (!API_URL || !PROJECT_KEY) throw new Error("CT API not configured (CT_API_URL/CT_HOST, CT_PROJECT_KEY)");
  const token = await getAccessToken();
  const url = `${API_URL}/${PROJECT_KEY}${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`CT ${init.method || "GET"} ${path} failed: ${res.status}`);
    err.status = res.status;
    try { err.body = JSON.parse(txt); } catch { err.body = txt; }
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// Get the latest Active cart for a customer or anonymousId. Create if missing.
export async function getOrCreateCart({ customerId, anonymousId, currency = "GBP", country = "GB" } = {}) {
  const where = customerId
    ? `customerId=\"${customerId}\" AND cartState=\"Active\"`
    : `anonymousId=\"${anonymousId}\" AND cartState=\"Active\"`;
  const q = new URLSearchParams({ limit: "1", sort: "lastModifiedAt desc", where });
  const list = await ctFetch(`/carts?${q.toString()}`);
  if (list?.results?.length) return list.results[0];

  const body = customerId
    ? { currency, country, customerId, deleteDaysAfterLastModification: 30 }
    : { currency, country, anonymousId, deleteDaysAfterLastModification: 30 };

  return ctFetch(`/carts`, { method: "POST", body: JSON.stringify(body) });
}

// Small helpers mirroring previous API wrapper usage
export const API = (p = "") => {
  if (!API_URL || !PROJECT_KEY) throw new Error("CT API not configured");
  return `${API_URL}/${PROJECT_KEY}${p}`;
};

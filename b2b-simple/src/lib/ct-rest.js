// src/lib/ct-rest.js
/**
 * commercetools REST helpers (server-only).
 * Supports legacy patterns (API('/path'), ctFetch) and modern helpers (ctGet/ctPost).
 * Token is optional for ctGet/ctPost; will auto-fetch via getCTToken() if omitted.
 */

import { getCTToken } from "./ctAuth"; // extensionless to support .js or .ts

const API_URL = (process.env.CT_API_URL || "").replace(/\/+$/g, "");
const PROJECT_KEY = process.env.CT_PROJECT_KEY || "";
const PK = encodeURIComponent(PROJECT_KEY);

/** Build full CT URL (legacy-compatible). */
export function API(path = "") {
  if (!API_URL || !PROJECT_KEY) throw new Error("Missing CT_API_URL or CT_PROJECT_KEY");
  const normalized = String(path || "");
  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${API_URL}/${PK}${prefixed}`;
}

/** GET — token optional; falls back to auto-auth. */
export async function ctGet(path, token) {
  return ctReq("GET", path, undefined, token);
}

/** POST — token optional; falls back to auto-auth. */
export async function ctPost(path, body, token) {
  return ctReq("POST", path, body, token);
}

/** Legacy helper that auto-fetches bearer and calls CT (GET/POST/...). */
export async function ctFetch(path, init = {}) {
  const bearer = await getCTToken();
  const token = typeof bearer === "string" ? bearer : (bearer?.access_token || bearer?.token);
  if (!token) throw new Error("Missing CT bearer token");

  const method = (init.method || "GET").toUpperCase();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
  const body =
    init.body !== undefined && typeof init.body !== "string"
      ? JSON.stringify(init.body)
      : init.body;

  const url = /^https?:\/\//i.test(path) ? path : API(path);
  const res = await fetch(url, { ...init, method, headers, body, cache: "no-store" });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const err = new Error(data?.message || `CT ${method} ${url} → ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/** Internal request helper shared by ctGet/ctPost. */
async function ctReq(method, path, body, token) {
  if (!API_URL) throw new Error("Missing CT_API_URL");
  if (!PROJECT_KEY) throw new Error("Missing CT_PROJECT_KEY");

  // Auto-fetch token if none provided
  let bearer = token;
  if (!bearer) {
    const t = await getCTToken();
    bearer = typeof t === "string" ? t : (t?.access_token || t?.token);
  }
  if (!bearer) throw new Error("Missing CT bearer token");

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}/${PK}${normalized}`;

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
    cache: "no-store",
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const err = new Error(data?.message || `CT ${method} ${normalized} → ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/** Default export = callable API function (legacy-friendly). */
export default API;

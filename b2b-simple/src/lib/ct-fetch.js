// b2b-simple/lib/ct-fetch.js
/**
 * Minimal commercetools fetch helper (legacy compatible).
 * Usage: await ctFetch('/products?limit=1')
 * - Auto gets a bearer token
 * - Accepts object body; stringifies automatically
 * - Throws with { status, body } on non-2xx
 */
import { getCTToken } from "../../_lib_legacy/ctAuth.js";

export async function ctFetch(path, init = {}) {
  const API_URL = (process.env.CT_API_URL || "").replace(/\/+$/g, "");
  const PROJECT_KEY = process.env.CT_PROJECT_KEY || "";
  if (!API_URL || !PROJECT_KEY) throw new Error("Missing CT_API_URL/CT_PROJECT_KEY");

  // Accept either a string token or an object with access_token/token
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

  const url = path.startsWith("http")
    ? path
    : `${API_URL}/${PROJECT_KEY}${path.startsWith("/") ? path : `/${path}`}`;

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

export default { ctFetch };


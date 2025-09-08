import { getCTToken } from "./ctAuth";

/** Compose a CT API URL for this project. */
export function API(path = "") {
  const base = process.env.CT_API_URL?.replace(/\/$/, "");
  const projectKey = process.env.CT_PROJECT_KEY || process.env.NEXT_PUBLIC_CT_PROJECT_KEY;
  if (!base || !projectKey) throw new Error("CT_API_URL or CT_PROJECT_KEY missing");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/${projectKey}${p}`;
}

/** Low-level fetch with bearer token and optional JSON body/query. Returns JSON or text. */
export async function request(path, { method = "GET", headers = {}, body, searchParams } = {}) {
  const url = new URL(API(path));
  if (searchParams && typeof searchParams === "object") {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const { access_token } = await getCTToken();

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`CT ${method} ${url.pathname} ${res.status}: ${t}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

/** Modern helpers */
export const get  = (path, opts = {})              => request(path, { ...opts, method: "GET"  });
export const post = (path, body, opts = {})        => request(path, { ...opts, method: "POST", body });
export const getProduct      = (id,  opts = {})    => get(`/products/${id}`, opts);
export const getProductByKey = (key, opts = {})    => get(`/products/key=${encodeURIComponent(key)}`, opts);

/** Legacy aliases (some API routes import these names) */
export const ctFetch = request;
export const ctGet   = get;
export const ctPost  = post;

/** Default export for wrappers that `import impl from '../src/lib/ct-rest'` */
const impl = { API, request, get, post, getProduct, getProductByKey, ctFetch, ctGet, ctPost };
export default impl;

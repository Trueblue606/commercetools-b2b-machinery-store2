// src/lib/ctAuth.js
/**
 * getCTToken() — returns BOTH shapes for compatibility:
 *   - string (when used directly)
 *   - { access_token, token } (when destructured by legacy routes)
 */
export async function getCTToken() {
  const AUTH_URL = (process.env.CT_AUTH_URL || "").replace(/\/+$/g, "");
  const id = process.env.CT_CLIENT_ID;
  const secret = process.env.CT_CLIENT_SECRET;
  const scope = process.env.CT_SCOPE || process.env.CT_SCOPES; // accept either

  if (!AUTH_URL || !id || !secret || !scope) {
    throw new Error("Missing CT auth env (CT_AUTH_URL/CT_CLIENT_ID/CT_CLIENT_SECRET/CT_SCOPE)");
  }

  const body = new URLSearchParams({ grant_type: "client_credentials", scope });
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await res.json();
  if (!res.ok || !json?.access_token) {
    const msg = json?.error_description || json?.error || `CT auth ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  // Return both forms
  const token = json.access_token;
  const compat = { access_token: token, token };
  // Allow both: const t = await getCTToken()  (string)
  // and        : const { access_token } = await getCTToken() (object)
  
  Object.defineProperty(compat, Symbol.toPrimitive, { value: () => token });
  compat.toString = () => token;
  return compat;
 // Node ignores Symbol.toPrimitive in most cases; callers use either pattern anyway.
}

export default { getCTToken };
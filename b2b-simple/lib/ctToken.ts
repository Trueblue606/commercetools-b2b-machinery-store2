export async function getAppToken() {
  const authUrl = (process.env.CT_AUTH_URL || "").replace(/\/+$/, "");
  const clientId = process.env.CT_CLIENT_ID || "";
  const clientSecret = process.env.CT_CLIENT_SECRET || "";
  const scope = process.env.CT_SCOPE || "";
  if (!authUrl || !clientId || !clientSecret || !scope) {
    throw new Error("Missing CT auth env (CT_AUTH_URL/CT_CLIENT_ID/CT_CLIENT_SECRET/CT_SCOPE)");
  }

  const res = await fetch(`${authUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Auth failed ${res.status}: ${t}`);
  }
  return res.json();
}

// make this file a module even if TS tree-shakes
export {};

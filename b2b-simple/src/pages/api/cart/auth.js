// pages/api/cart/auth.js
export default async function handler(req, res) {
  const REGION = process.env.CT_REGION || "eu-central-1";
  const PROJECT_KEY = process.env.CT_PROJECT_KEY;
  const CLIENT_ID = process.env.CT_CLIENT_ID;
  const CLIENT_SECRET = process.env.CT_CLIENT_SECRET;

  if (!PROJECT_KEY || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Missing CT env vars (CT_PROJECT_KEY, CT_CLIENT_ID, CT_CLIENT_SECRET)" });
  }

  try {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const resp = await fetch(`https://auth.${REGION}.aws.commercetools.com/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: `manage_project:${PROJECT_KEY}`,
      }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      console.error("CT OAuth error", resp.status, json);
      return res.status(resp.status).json(json);
    }

    // Should look like a long JWT and expires_in ~ 300–3600
    return res.status(200).json(json);
  } catch (e) {
    console.error("Auth route exception", e);
    return res.status(500).json({ error: "Auth error", details: String(e) });
  }
}

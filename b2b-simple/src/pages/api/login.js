/* eslint-disable no-console */

// ---- Required env (fail fast, no hardcoding) ----
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const CT_CLIENT_ID = process.env.CT_CLIENT_ID;
const CT_CLIENT_SECRET = process.env.CT_CLIENT_SECRET;
const CT_AUTH_URL = process.env.CT_AUTH_URL; // e.g. https://auth.eu-central-1.aws.commercetools.com
const CT_API_URL = process.env.CT_API_URL;   // e.g. https://api.eu-central-1.aws.commercetools.com

// Optional: restrict to specific group IDs. If empty, accept any.
const allowedGroupIds = (process.env.CT_ALLOWED_GROUP_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function assertEnv() {
  const missing = [];
  if (!PROJECT_KEY) missing.push("CT_PROJECT_KEY");
  if (!CT_CLIENT_ID) missing.push("CT_CLIENT_ID");
  if (!CT_CLIENT_SECRET) missing.push("CT_CLIENT_SECRET");
  if (!CT_AUTH_URL) missing.push("CT_AUTH_URL");
  if (!CT_API_URL) missing.push("CT_API_URL");
  if (missing.length) throw new Error(`Missing required env: ${missing.join(", ")}`);
}

function projectBase() {
  // No store scope — project-scoped API
  return `${CT_API_URL.replace(/\/$/, "")}/${PROJECT_KEY}`;
}

// ---- utils ----
async function readCTError(resp) {
  const correlationId =
    resp.headers.get("X-Correlation-ID") ||
    resp.headers.get("x-correlation-id") ||
    null;

  let rawText = "";
  try { rawText = await resp.text(); } catch {}

  let json = null;
  try { json = rawText ? JSON.parse(rawText) : null; } catch {}

  let message = `${resp.status} ${resp.statusText}`;
  if (json?.message) message += `: ${json.message}`;
  if (json?.errors?.length) {
    const details = json.errors
      .map((e) => `${e.code}${e.field ? ` (${e.field})` : ""}${e.message ? `: ${e.message}` : ""}`)
      .join("; ");
    if (details) message += ` | ${details}`;
  }
  return { status: resp.status, correlationId, message, json, rawText };
}

// ---- main handler ----
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(422).json({ error: "Email and password required" });

  try {
    assertEnv();

    // 1) Project-scoped PASSWORD grant (no store)
    const authUrl = `${CT_AUTH_URL.replace(/\/$/, "")}/oauth/${PROJECT_KEY}/customers/token`;
    const basic = Buffer.from(`${CT_CLIENT_ID}:${CT_CLIENT_SECRET}`).toString("base64");

    const tokenResp = await fetch(authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: email,
        password,
      }),
    });

    if (!tokenResp.ok) {
      const err = await readCTError(tokenResp);
      const isCreds = err.status === 400;
      return res.status(isCreds ? 401 : err.status || 500).json({
        error: isCreds ? "Invalid email or password" : "Login failed",
        details: err.json || err.rawText || null,
        correlationId: err.correlationId,
      });
    }

    const tokenJson = await tokenResp.json();
    const customerBearer = `${tokenJson.token_type || "Bearer"} ${tokenJson.access_token}`;

    // 2) /me (project-scoped)
    const meResp = await fetch(`${projectBase()}/me`, {
      headers: { Authorization: customerBearer },
    });
    if (!meResp.ok) {
      const err = await readCTError(meResp);
      return res.status(err.status || 500).json({
        error: "Failed to fetch customer profile",
        details: err.json || err.rawText || null,
        correlationId: err.correlationId,
      });
    }
    const me = await meResp.json();

    // 3) Derive effective group (non-blocking, no auto-assign)
    const primaryGroupId = me?.customerGroup?.id || null;
    const assignments = Array.isArray(me?.customerGroupAssignments)
      ? me.customerGroupAssignments
      : [];
    const assignmentIds = assignments
      .map((a) => a?.customerGroup?.id || a?.id || null)
      .filter(Boolean);

    const pool = [
      ...(primaryGroupId ? [primaryGroupId] : []),
      ...assignmentIds,
    ];

    const filtered =
      allowedGroupIds.length > 0
        ? pool.filter((id) => allowedGroupIds.includes(id))
        : pool;

    const effectiveGroupId = filtered[0] || primaryGroupId || null;

    // 4) Pricing selection hint (for your resolvers)
    const priceSelection = {
      currency: "GBP",
      country: "GB",
      customerGroupId: effectiveGroupId || undefined,
    };

    // Optional: domain-based redirect (safe to remove)
    const domain = (me.email || "").split("@")[1]?.toLowerCase() || "";
    let redirect = "/";
    if (domain === "chemlab.com") redirect = "/chemlab/index";

    return res.status(200).json({
      success: true,
      redirect,
      token: tokenJson,
      customer: {
        id: me.id,
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
        companyName: me.companyName,
        custom: me.custom || null,
        customerGroup: me.customerGroup || null,
        customerGroupAssignments: me.customerGroupAssignments || [],
        effectiveGroupId,
        priceSelection,
      },
    });
  } catch (err) {
    console.error("🔥 Login error", err);
    return res.status(500).json({ error: "Internal error", details: err?.message || String(err) });
  }
}

/* eslint-disable no-console */

// ---- Env & constants ----
const REGION = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY || "chempilot";
const STORE_KEY = process.env.CT_STORE_KEY || "default-store";

const STORE_BASE = `https://api.${REGION}.aws.commercetools.com/${PROJECT_KEY}/in-store/key=${STORE_KEY}`;

// Allowed customer groups (IDs)
const CATALOGUE_ID = process.env.CT_GROUP_ID_CATALOGUE || "5db880e5-3e15-4cc0-9cd1-2b214dd53f23";
const CONTRACT_ID  = process.env.CT_GROUP_ID_CONTRACT  || "b2b1bafe-e36b-4d95-93c5-82ea07d7e159";

const allowedGroupIds = (process.env.CT_ALLOWED_GROUP_IDS || `${CATALOGUE_ID},${CONTRACT_ID}`)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ---- utils ----
async function readCTError(resp) {
  const correlationId = resp.headers.get("X-Correlation-ID") || resp.headers.get("x-correlation-id") || null;
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

async function getAppToken() {
  const id = process.env.CT_CLIENT_ID;
  const secret = process.env.CT_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Server missing CT_CLIENT_ID / CT_CLIENT_SECRET");
  const tokenResp = await fetch(`https://auth.${REGION}.aws.commercetools.com/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: `manage_project:${PROJECT_KEY}`,
    }),
  });
  if (!tokenResp.ok) {
    const err = await readCTError(tokenResp);
    throw new Error(`App token failed: ${err.message}`);
  }
  const j = await tokenResp.json();
  return `${j.token_type || "Bearer"} ${j.access_token}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(422).json({ error: "Email and password required" });

  try {
    // --- 1) In-store PASSWORD grant (customer login) ---
    const CLIENT_ID = process.env.CT_CLIENT_ID;
    const CLIENT_SECRET = process.env.CT_CLIENT_SECRET;
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: "Server is missing CT_CLIENT_ID / CT_CLIENT_SECRET" });
    }

    const authUrl = `https://auth.${REGION}.aws.commercetools.com/oauth/${PROJECT_KEY}/in-store/key=${STORE_KEY}/customers/token`;
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

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

    // --- 2) /me profile ---
    const meResp = await fetch(`${STORE_BASE}/me`, {
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

    // --- 2a) Approval gate ---
    const fields = me?.custom?.fields || {};
    const approval = String(fields.approvalStatus || "").toLowerCase();
    const legacyApproved = fields.approved === true;
    const isApproved = approval === "approved" || legacyApproved;

    if (!isApproved) {
      return res.status(403).json({
        error: "Account not approved yet",
        approvalStatus: approval || null,
        message: "Your account is pending approval. Please wait until an admin approves your registration.",
      });
    }

    // --- 2b) Collect current groups ---
    const singleGroupId = me?.customerGroup?.id || null;
    const assignments = Array.isArray(me?.customerGroupAssignments) ? me.customerGroupAssignments : [];
    const assignmentIds = assignments.map((a) => a?.customerGroup?.id || a?.id || null).filter(Boolean);
    let pool = [
      ...(singleGroupId ? [singleGroupId] : []),
      ...assignmentIds,
    ];
    let poolAllowed = pool.filter((id) => allowedGroupIds.includes(id));

    // --- 2c) AUTO-ASSIGN if no valid group ---
    if (poolAllowed.length === 0) {
      const requested = String(fields.requestedGroup || "").toLowerCase();
      const desiredGroupId = requested === "contract" ? CONTRACT_ID : CATALOGUE_ID;

      try {
        const appBearer = await getAppToken();

        let upd = await fetch(`${STORE_BASE}/customers/${me.id}`, {
          method: "POST",
          headers: { Authorization: appBearer, "Content-Type": "application/json" },
          body: JSON.stringify({
            version: me.version,
            actions: [
              {
                action: "addCustomerGroupAssignment",
                customerGroupAssignment: {
                  customerGroup: { typeId: "customer-group", id: desiredGroupId },
                },
              },
            ],
          }),
        });

        if (upd.status === 409) {
          const freshResp = await fetch(`${STORE_BASE}/customers/${me.id}`, {
            headers: { Authorization: appBearer },
          });
          if (freshResp.ok) {
            const fresh = await freshResp.json();
            upd = await fetch(`${STORE_BASE}/customers/${me.id}`, {
              method: "POST",
              headers: { Authorization: appBearer, "Content-Type": "application/json" },
              body: JSON.stringify({
                version: fresh.version,
                actions: [
                  {
                    action: "addCustomerGroupAssignment",
                    customerGroupAssignment: {
                      customerGroup: { typeId: "customer-group", id: desiredGroupId },
                    },
                  },
                ],
              }),
            });
          }
        }

        if (!upd.ok) {
          const err1 = await readCTError(upd);
          console.warn("addCustomerGroupAssignment failed, falling back to setCustomerGroup", err1.message);

          const fallback = await fetch(`${STORE_BASE}/customers/${me.id}`, {
            method: "POST",
            headers: { Authorization: appBearer, "Content-Type": "application/json" },
            body: JSON.stringify({
              version: me.version,
              actions: [
                {
                  action: "setCustomerGroup",
                  customerGroup: { typeId: "customer-group", id: desiredGroupId },
                },
              ],
            }),
          });

          if (!fallback.ok) {
            const err2 = await readCTError(fallback);
            console.error("Failed to setCustomerGroup on login", err2);
            return res.status(403).json({
              error: "Your account is not assigned to a valid customer group yet.",
              details: { desiredGroupId, reason: err2.message },
            });
          }
        }

        pool = [desiredGroupId];
        poolAllowed = [desiredGroupId];
      } catch (e) {
        console.error("🔥 Auto-assign group error", e);
        return res.status(403).json({
          error: "Your account is not assigned to a valid customer group yet.",
          details: { reason: e.message },
        });
      }
    }

    // --- 3) Pick effective group for pricing ---
    let effectiveGroupId = null;
    let effectiveGroupKey = null;

    if (poolAllowed.includes(CONTRACT_ID)) {
      effectiveGroupId = CONTRACT_ID;
      effectiveGroupKey = "contract";
    } else if (poolAllowed.includes(CATALOGUE_ID)) {
      effectiveGroupId = CATALOGUE_ID;
      effectiveGroupKey = "catalogue";
    } else {
      effectiveGroupId = poolAllowed[0];
      effectiveGroupKey = null;
    }

    const priceSelection = {
      currency: "GBP",
      country: "GB",
      customerGroupId: effectiveGroupId,
    };

    // --- 4) Email-domain portal routing ---
    const domain = (me.email || "").split("@")[1]?.toLowerCase() || "";
    let redirect = "/"; // default
    if (domain === "chemlab.com") {
      redirect = "/chemlab/index";
    }

    // --- 5) Success ---
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
        custom: me.custom,
        customerGroup: me.customerGroup || null,
        customerGroupAssignments: me.customerGroupAssignments || [],
        effectiveGroupId,
        effectiveGroupKey,
        priceSelection,
      },
      storeKey: STORE_KEY,
    });

  } catch (err) {
    console.error("🔥 Login error", err);
    return res.status(500).json({ error: "Internal error", details: err?.message || String(err) });
  }
}

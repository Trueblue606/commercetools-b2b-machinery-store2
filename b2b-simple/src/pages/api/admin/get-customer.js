// pages/api/admin/set-customer-group.js
/* eslint-disable no-console */
import { getCTToken } from "../../../../lib/ctAuth";

const REGION = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY || "chempilot";
const API_BASE = `https://api.${REGION}.aws.commercetools.com/${PROJECT_KEY}`;

const GROUP_IDS = {
  catalogue: "5db880e5-3e15-4cc0-9cd1-2b214dd53f23",
  contract:  "b2b1bafe-e36b-4d95-93c5-82ea07d7e159",
};

function esc(str = "") { return String(str).replace(/"/g, '\\"'); }

async function findCustomerByEmail(AUTH, email) {
  const q = encodeURIComponent(`email="${esc(email)}"`);
  const r = await fetch(`${API_BASE}/customers?where=${q}`, {
    headers: { Authorization: AUTH },
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  if (!j?.results?.length) throw new Error("Customer not found");
  return j.results[0];
}

export default async function handler(req, res) {
  // Allow GET for quick browser testing; POST for normal use
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Read params from body (POST) or query (GET)
  const src = req.method === "POST" ? req.body || {} : req.query || {};
  const { email, customerId, version, groupId, groupKey, clear } = src;

  if (!email && !customerId) {
    return res.status(400).json({ error: "Provide email or customerId" });
  }

  try {
    const AUTH = await getCTToken(req);

    // Resolve customer + latest version if not provided
    let id = customerId;
    let v = version;
    if (!id || v == null) {
      const c = email ? await findCustomerByEmail(AUTH, email) : null;
      id = id || c?.id;
      v  = v  || c?.version;
      if (!id || v == null) throw new Error("Unable to resolve customer id/version");
    }

    // Resolve target group reference (or clear)
    let targetRef = null;
    if (!String(clear).toLowerCase() === "true" && !clear) {
      const gid = groupId || (groupKey ? GROUP_IDS[groupKey] : null);
      if (!gid) {
        return res.status(400).json({
          error: "Provide groupId or groupKey (catalogue|contract), or set clear=true",
        });
      }
      targetRef = { typeId: "customer-group", id: gid };
    }

    // Update action
    const upd = await fetch(`${API_BASE}/customers/${id}`, {
      method: "POST",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: v,
        actions: [{ action: "setCustomerGroup", customerGroup: targetRef }],
      }),
    });

    if (!upd.ok) {
      const txt = await upd.text();
      console.error("setCustomerGroup failed", txt);
      return res.status(upd.status).json({ error: txt });
    }

    const updated = await upd.json();
    return res.status(200).json({
      id: updated.id,
      version: updated.version,
      email: updated.email,
      customerGroup: updated.customerGroup, // now populated (or null if cleared)
      customerGroupAssignments: updated.customerGroupAssignments || [],
    });
  } catch (e) {
    console.error("set-customer-group error", e);
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}

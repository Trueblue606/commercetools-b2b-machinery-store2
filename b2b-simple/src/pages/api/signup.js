/* eslint-disable no-console */
import { getCTToken } from "../../../lib/ctAuth";

const REGION      = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const API_URL     = `https://api.${REGION}.aws.commercetools.com`;

const CATALOGUE_ID = process.env.CT_GROUP_ID_CATALOGUE || "uuid-cat";
const CONTRACT_ID  = process.env.CT_GROUP_ID_CONTRACT  || "uuid-con";

function pickGroupId(requestedGroup) {
  const want = String(requestedGroup || "").trim().toLowerCase();
  if (want === "contract") return CONTRACT_ID;
  if (want.startsWith("catalog")) return CATALOGUE_ID;
  return CATALOGUE_ID;
}

// Ensure header is exactly "Bearer <token>"
function asBearer(v) {
  if (!v || typeof v !== "string") return "";
  return v.startsWith("Bearer ") ? v : `Bearer ${v}`;
}

async function readCTError(resp) {
  let rawText = "";
  try { rawText = await resp.text(); } catch {}
  let json = null;
  try { json = rawText ? JSON.parse(rawText) : null; } catch {}
  return { status: resp.status, json, rawText };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email, password, firstName, lastName, companyName,
    requestedGroup, certificateFileUrl
  } = req.body || {};

  if (!PROJECT_KEY) {
    return res.status(500).json({ error: "Missing CT_PROJECT_KEY env" });
  }

  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(422).json({ error: "Validation failed" });
  }

  try {
    // Get access token (should be a raw token string)
    const rawToken = await getCTToken(); // no need to pass req
    const AUTH = asBearer(rawToken);

    if (!AUTH) {
      return res.status(500).json({ error: "Auth token unavailable" });
    }

    // 1) Create customer
    const draft = {
      email: String(email).trim(),
      password,
      firstName: String(firstName).trim(),
      lastName:  String(lastName).trim(),
      ...(companyName ? { companyName: String(companyName).trim() } : {}),
      custom: {
        type: { key: "customer-approval", typeId: "type" }, // make sure this Type exists
        fields: {
          approvalStatus: "pending",
          requestedGroup: requestedGroup || "",
          certificateFileUrl: certificateFileUrl || ""
        }
      }
    };

    const createRes = await fetch(`${API_URL}/${PROJECT_KEY}/customers`, {
      method: "POST",
      headers: {
        Authorization: AUTH,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    if (!createRes.ok) {
      const err = await readCTError(createRes);
      return res.status(err.status).json({ error: "Failed to create customer", details: err });
    }

    const created = await createRes.json();
    const customer = created?.customer || created;

    // 2) Set customer group (non-fatal if it fails)
    const desiredGroupId = pickGroupId(requestedGroup);
    let version = customer.version;

    const updRes = await fetch(`${API_URL}/${PROJECT_KEY}/customers/${customer.id}`, {
      method: "POST",
      headers: {
        Authorization: AUTH,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version,
        actions: [{
          action: "setCustomerGroup",
          customerGroup: { typeId: "customer-group", id: desiredGroupId }
        }]
      })
    });

    if (!updRes.ok) {
      const err = await readCTError(updRes);
      // Not fatal for signup — return info anyway
      return res.status(200).json({
        success: true,
        customer,
        groupSet: false,
        groupError: err,
      });
    }

    const updated = await updRes.json();

    return res.status(200).json({
      success: true,
      customer: updated,
      groupSet: true,
    });
  } catch (err) {
    console.error("Signup error", err);
    return res.status(500).json({ error: "Internal error", details: String(err?.message || err) });
  }
}
